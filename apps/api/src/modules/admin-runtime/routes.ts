import type { IncomingMessage, ServerResponse } from "node:http";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext } from "../../http.js";
import { methodNotAllowed, sendError, sendJson } from "../../http.js";
import type { MetricsRegistry } from "../../metrics.js";
import { resolveAuthenticatedAccountSession, sendAccountSessionError, type AccountSessionError } from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import type { AdminRuntimeService } from "./service.js";

const statusRoute = "/v1/admin/runtime/status";
const diagnosticsRoute = "/v1/admin/runtime/diagnostics";

export async function handleAdminRuntimeRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AdminRuntimeService,
  authService: AuthService,
  pathname: string,
  auditSink: AuditSink,
  metricsRegistry: MetricsRegistry,
) {
  if (pathname !== statusRoute && pathname !== diagnosticsRoute) return false;

  if (request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditRuntimeStatus(auditSink, context, request, pathname, session, "blocked", "admin_role_required", 403);
      metricsRegistry.observeAdminRuntime({
        operation: runtimeOperation(pathname),
        outcome: "blocked",
        reason: "admin_role_required",
      });
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    const payload = pathname === diagnosticsRoute
      ? service.getDiagnostics(context.requestId)
      : service.getStatus(context.requestId);
    auditRuntimeStatus(auditSink, context, request, pathname, session, "success", null, 200);
    metricsRegistry.observeAdminRuntime({
      operation: runtimeOperation(pathname),
      outcome: "success",
      reason: null,
    });
    sendJson(response, 200, payload);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditRuntimeStatus(auditSink, context, request, pathname, session, "failure", error.code, 401);
      metricsRegistry.observeAdminRuntime({
        operation: runtimeOperation(pathname),
        outcome: "failure",
        reason: error.code,
      });
      sendAccountSessionError(response, context, error);
      return true;
    }
    throw error;
  }
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}

function auditRuntimeStatus(
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
    action: route === diagnosticsRoute ? "admin.runtime.diagnostics.read" : "admin.runtime.status.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceType: "api_runtime_status",
    route,
    sessionId: session?.sessionId,
    statusCode,
  });
}

function runtimeOperation(pathname: string): "status" | "diagnostics" {
  return pathname === diagnosticsRoute ? "diagnostics" : "status";
}
