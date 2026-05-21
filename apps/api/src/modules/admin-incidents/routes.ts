import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext, JsonBodyReadOptions } from "../../http.js";
import { methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import {
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
  type AccountSessionError,
} from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import { AdminIncidentError, type AdminIncidentService } from "./service.js";

const listRoute = "/v1/admin/incidents";
const exportRoute = "/v1/admin/incidents/export";
const bulkWorkflowRoute = "/v1/admin/incidents/workflow/bulk";
const detailPrefix = "/v1/admin/incidents/";
const ackSuffix = "/acknowledge";
const workflowSuffix = "/workflow";

export async function handleAdminIncidentRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AdminIncidentService,
  authService: AuthService,
  url: URL,
  auditSink: AuditSink,
  jsonBodyOptions: JsonBodyReadOptions = {},
) {
  const match = routeMatch(url.pathname);
  if (!match) return false;

  if (match.kind === "list" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "export" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "detail" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "acknowledge" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }
  if (match.kind === "workflow" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }
  if (match.kind === "bulkWorkflow" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditIncidentRoute(auditSink, context, request, match, session, "blocked", "admin_role_required", 403);
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    if (match.kind === "list") {
      const payload = await service.listIncidents(Object.fromEntries(url.searchParams.entries()), context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "export") {
      const payload = await service.exportIncidents(Object.fromEntries(url.searchParams.entries()), context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "detail") {
      const payload = await service.getIncident(match.incidentId, context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }

    const body = await readJsonBody(request, jsonBodyOptions);
    const payload = match.kind === "bulkWorkflow"
      ? await service.bulkUpdateIncidentWorkflow(body, session.userId, context.requestId)
      : match.kind === "workflow"
        ? await service.updateIncidentWorkflow(match.incidentId, body, session.userId, context.requestId)
        : await service.acknowledgeIncident(match.incidentId, body, session.userId, context.requestId);
    auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
    sendJson(response, 200, payload);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditIncidentRoute(auditSink, context, request, match, session, "failure", error.code, 401);
      sendAccountSessionError(response, context, error);
      return true;
    }
    if (error instanceof ZodError) {
      auditIncidentRoute(auditSink, context, request, match, session, "failure", "validation_error", 400);
      sendValidationError(response, context, error);
      return true;
    }
    if (error instanceof AdminIncidentError) {
      auditIncidentRoute(auditSink, context, request, match, session, "failure", error.code, 404);
      sendError(response, 404, error.code, error.message, context);
      return true;
    }
    throw error;
  }
}

type IncidentRouteMatch =
  | { kind: "list"; route: string }
  | { kind: "export"; route: string }
  | { kind: "bulkWorkflow"; route: string }
  | { incidentId: string; kind: "detail"; route: string }
  | { incidentId: string; kind: "acknowledge"; route: string }
  | { incidentId: string; kind: "workflow"; route: string };

function routeMatch(pathname: string): IncidentRouteMatch | null {
  if (pathname === listRoute) return { kind: "list", route: listRoute };
  if (pathname === exportRoute) return { kind: "export", route: exportRoute };
  if (pathname === bulkWorkflowRoute) return { kind: "bulkWorkflow", route: bulkWorkflowRoute };
  if (!pathname.startsWith(detailPrefix)) return null;
  const rest = pathname.slice(detailPrefix.length);
  if (!rest) return null;
  if (rest.endsWith(ackSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -ackSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "acknowledge", route: `${detailPrefix}:incidentId${ackSuffix}` };
  }
  if (rest.endsWith(workflowSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -workflowSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "workflow", route: `${detailPrefix}:incidentId${workflowSuffix}` };
  }
  return { incidentId: decodeURIComponent(rest), kind: "detail", route: `${detailPrefix}:incidentId` };
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}

function auditIncidentRoute(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  match: IncidentRouteMatch,
  session: { userId: string; sessionId: string } | undefined,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: match.kind === "acknowledge"
      ? "admin.incidents.acknowledge"
      : match.kind === "bulkWorkflow"
        ? "admin.incidents.workflow.bulk"
      : match.kind === "workflow"
        ? "admin.incidents.workflow.update"
      : match.kind === "export"
        ? "admin.incidents.export"
      : match.kind === "detail"
        ? "admin.incidents.detail.read"
        : "admin.incidents.list.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceId: "incidentId" in match ? match.incidentId : null,
    resourceType: "admin_incident",
    route: match.route,
    sessionId: session?.sessionId,
    statusCode,
  });
}
