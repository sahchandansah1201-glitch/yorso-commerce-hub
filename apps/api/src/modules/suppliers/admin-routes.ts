import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext } from "../../http.js";
import { methodNotAllowed, sendError, sendJson, sendValidationError } from "../../http.js";
import {
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
  type AccountSessionError,
} from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import type { SupplierDirectoryService } from "./service.js";

const downloadEventsRoute = "/v1/admin/supplier-documents/download-events";

const queryParams = (url: URL) => Object.fromEntries(url.searchParams.entries());

export async function handleSupplierDocumentAdminRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: SupplierDirectoryService,
  authService: AuthService,
  url: URL,
  auditSink: AuditSink,
) {
  if (url.pathname !== downloadEventsRoute) return false;

  if (request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditDocumentDownloadEventsRead(auditSink, context, request, session, "blocked", "admin_role_required", 403);
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    const payload = await service.listAdminDocumentDownloadEvents(queryParams(url), context.requestId);
    auditDocumentDownloadEventsRead(auditSink, context, request, session, "success", null, 200);
    sendJson(response, 200, payload);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditDocumentDownloadEventsRead(auditSink, context, request, session, "failure", error.code, 401);
      sendAccountSessionError(response, context, error);
      return true;
    }

    if (error instanceof ZodError) {
      auditDocumentDownloadEventsRead(auditSink, context, request, session, "failure", "validation_error", 400);
      sendValidationError(response, context, error);
      return true;
    }

    throw error;
  }
}

function auditDocumentDownloadEventsRead(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  session: { userId: string; sessionId: string } | undefined,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: "admin.supplier_document_download_events.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceType: "supplier_document_download_event",
    route: downloadEventsRoute,
    sessionId: session?.sessionId,
    statusCode,
  });
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}
