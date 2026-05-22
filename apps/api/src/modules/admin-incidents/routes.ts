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
const executionSuffix = "/execution";
const executionExportSuffix = "/execution/export";
const handoffSuffix = "/handoff";
const postmortemSuffix = "/postmortem";
const remediationSuffix = "/remediation";
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
  if (match.kind === "handoff" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "remediation" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "postmortem" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "execution" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionExport" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionItem" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
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
    if (match.kind === "handoff") {
      const payload = await service.exportIncidentHandoff(
        match.incidentId,
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "remediation") {
      const payload = await service.getIncidentRemediationPlan(match.incidentId, context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "postmortem") {
      const payload = await service.exportIncidentPostmortem(
        match.incidentId,
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "execution") {
      const payload = await service.getIncidentExecution(match.incidentId, context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "executionExport") {
      const payload = await service.exportIncidentExecution(
        match.incidentId,
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }

    const body = await readJsonBody(request, jsonBodyOptions);
    const payload = match.kind === "bulkWorkflow"
      ? await service.bulkUpdateIncidentWorkflow(body, session.userId, context.requestId)
      : match.kind === "executionItem"
        ? await service.updateIncidentExecutionItem(match.incidentId, match.itemId, body, session.userId, context.requestId)
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
  | { incidentId: string; kind: "handoff"; route: string }
  | { incidentId: string; kind: "postmortem"; route: string }
  | { incidentId: string; kind: "remediation"; route: string }
  | { incidentId: string; kind: "execution"; route: string }
  | { incidentId: string; kind: "executionExport"; route: string }
  | { incidentId: string; itemId: string; kind: "executionItem"; route: string }
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
  if (rest.endsWith(handoffSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -handoffSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "handoff", route: `${detailPrefix}:incidentId${handoffSuffix}` };
  }
  if (rest.endsWith(remediationSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -remediationSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "remediation", route: `${detailPrefix}:incidentId${remediationSuffix}` };
  }
  if (rest.endsWith(postmortemSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -postmortemSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "postmortem", route: `${detailPrefix}:incidentId${postmortemSuffix}` };
  }
  if (rest.endsWith(executionSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -executionSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "execution", route: `${detailPrefix}:incidentId${executionSuffix}` };
  }
  if (rest.endsWith(executionExportSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -executionExportSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "executionExport", route: `${detailPrefix}:incidentId${executionExportSuffix}` };
  }
  const executionItemMarker = `${executionSuffix}/`;
  if (rest.includes(executionItemMarker)) {
    const [incidentPart, itemPart] = rest.split(executionItemMarker);
    const incidentId = decodeURIComponent(incidentPart.replace(/\/$/, ""));
    const itemId = decodeURIComponent(itemPart ?? "");
    if (!incidentId || !itemId) return null;
    return {
      incidentId,
      itemId,
      kind: "executionItem",
      route: `${detailPrefix}:incidentId${executionSuffix}/:itemId`,
    };
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
      : match.kind === "execution"
        ? "admin.incidents.execution.read"
      : match.kind === "executionExport"
        ? "admin.incidents.execution.export"
      : match.kind === "executionItem"
        ? "admin.incidents.execution.update"
      : match.kind === "handoff"
        ? "admin.incidents.handoff.export"
      : match.kind === "postmortem"
        ? "admin.incidents.postmortem.export"
      : match.kind === "remediation"
        ? "admin.incidents.remediation.read"
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
