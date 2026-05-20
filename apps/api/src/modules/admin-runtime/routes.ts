import type { IncomingMessage, ServerResponse } from "node:http";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext } from "../../http.js";
import { methodNotAllowed, sendError, sendJson } from "../../http.js";
import type { MetricsRegistry } from "../../metrics.js";
import { resolveAuthenticatedAccountSession, sendAccountSessionError, type AccountSessionError } from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import type { AdminRuntimeService } from "./service.js";

const route = "/v1/admin/runtime/status";

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
  if (pathname !== route) return false;

  if (request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditRuntimeStatus(auditSink, context, request, session, "blocked", "admin_role_required", 403);
      metricsRegistry.observeAdminRuntime({ operation: "status", outcome: "blocked", reason: "admin_role_required" });
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    const status = service.getStatus(context.requestId);
    auditRuntimeStatus(auditSink, context, request, session, "success", null, 200);
    metricsRegistry.observeAdminRuntime({ operation: "status", outcome: "success", reason: null });
    sendJson(response, 200, status);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditRuntimeStatus(auditSink, context, request, session, "failure", error.code, 401);
      metricsRegistry.observeAdminRuntime({ operation: "status", outcome: "failure", reason: error.code });
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
  session: { userId: string; sessionId: string } | undefined,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: "admin.runtime.status.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceType: "api_runtime_status",
    route,
    sessionId: session?.sessionId,
    statusCode,
  });
}
