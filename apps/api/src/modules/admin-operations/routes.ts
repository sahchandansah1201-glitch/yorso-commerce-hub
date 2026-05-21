import type { IncomingMessage, ServerResponse } from "node:http";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext } from "../../http.js";
import { methodNotAllowed, sendError, sendJson } from "../../http.js";
import {
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
  type AccountSessionError,
} from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import type { AdminOperationsService } from "./service.js";

const overviewRoute = "/v1/admin/operations/overview";

export async function handleAdminOperationsRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AdminOperationsService,
  authService: AuthService,
  pathname: string,
  auditSink: AuditSink,
) {
  if (pathname !== overviewRoute) return false;

  if (request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditOperationsRead(auditSink, context, request, session, "blocked", "admin_role_required", 403);
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    const payload = await service.getOverview(context.requestId);
    auditOperationsRead(auditSink, context, request, session, "success", null, 200);
    sendJson(response, 200, payload);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditOperationsRead(auditSink, context, request, session, "failure", error.code, 401);
      sendAccountSessionError(response, context, error);
      return true;
    }
    throw error;
  }
}

function auditOperationsRead(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  session: { userId: string; sessionId: string } | undefined,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: "admin.operations.overview.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceType: "admin_operations_overview",
    route: overviewRoute,
    sessionId: session?.sessionId,
    statusCode,
  });
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}
