import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext } from "../../http.js";
import { getRequestUrl, methodNotAllowed, sendError, sendJson, sendValidationError } from "../../http.js";
import { resolveAuthenticatedAccountSession, sendAccountSessionError, type AccountSessionError } from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import type { AdminAuditService } from "./service.js";

export async function handleAdminAuditRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AdminAuditService,
  authService: AuthService,
  url: URL,
  auditSink: AuditSink,
) {
  if (url.pathname !== "/v1/admin/audit-events" && url.pathname !== "/v1/admin/audit-events/export") {
    return false;
  }

  if (request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditAdminRead(auditSink, context, request, url.pathname, session, "blocked", "admin_role_required", 403);
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    if (url.pathname === "/v1/admin/audit-events/export") {
      const query = service.parseExportQuery(queryPayload(url));
      const page = await service.exportAuditEvents(query);
      auditAdminRead(auditSink, context, request, url.pathname, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": "attachment; filename=\"yorso-audit-events.jsonl\"",
        "content-type": "application/x-ndjson; charset=utf-8",
        "x-next-cursor": page.nextCursor ?? "",
      });
      response.end(page.events.map((event) => JSON.stringify(event)).join("\n") + (page.events.length ? "\n" : ""));
      return true;
    }

    const result = await service.listAuditEvents(queryPayload(url), context.requestId);
    auditAdminRead(auditSink, context, request, url.pathname, session, "success", null, 200);
    sendJson(response, 200, result);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditAdminRead(auditSink, context, request, url.pathname, session, "failure", error.code, 401);
      sendAccountSessionError(response, context, error);
      return true;
    }
    if (error instanceof ZodError) {
      auditAdminRead(auditSink, context, request, url.pathname, session, "failure", "validation_error", 400);
      sendValidationError(response, context, error);
      return true;
    }
    if (error instanceof Error && error.message === "invalid_audit_cursor") {
      auditAdminRead(auditSink, context, request, url.pathname, session, "failure", "invalid_audit_cursor", 400);
      sendError(response, 400, "invalid_audit_cursor", "Audit cursor is invalid.", context);
      return true;
    }
    throw error;
  }
}

function queryPayload(url: URL) {
  return Object.fromEntries(url.searchParams.entries());
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}

function auditAdminRead(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  route: string,
  session: { userId: string; sessionId: string } | undefined,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: route.endsWith("/export") ? "admin.audit_events.export" : "admin.audit_events.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceType: "api_audit_events",
    route,
    sessionId: session?.sessionId,
    statusCode,
  });
}
