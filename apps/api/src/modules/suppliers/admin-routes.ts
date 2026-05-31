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
import type { SupplierDirectoryService } from "./service.js";

const downloadEventsRoute = "/v1/admin/supplier-documents/download-events";
const downloadGrantsRoute = "/v1/admin/supplier-documents/download-grants";

const queryParams = (url: URL) => Object.fromEntries(url.searchParams.entries());

export async function handleSupplierDocumentAdminRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: SupplierDirectoryService,
  authService: AuthService,
  url: URL,
  auditSink: AuditSink,
  jsonBodyOptions?: JsonBodyReadOptions,
) {
  const routeConfig = resolveSupplierDocumentAdminRoute(url.pathname);
  if (!routeConfig) return false;

  const expectedMethod = routeConfig.kind === "decision" ? "POST" : "GET";
  if (request.method !== expectedMethod) {
    methodNotAllowed(response, context, expectedMethod);
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "blocked", "admin_role_required", 403);
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    if (routeConfig.kind === "decision") {
      if (!jsonBodyOptions) {
        auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", "supplier_document_management_unavailable", 503);
        sendError(response, 503, "supplier_document_management_unavailable", "Supplier document management is unavailable.", context);
        return true;
      }
      const payload = await service.decideSupplierDocumentAsAdmin(
        routeConfig.supplierId,
        routeConfig.documentId,
        await readJsonBody(request, jsonBodyOptions),
        context.requestId,
        { userId: session.userId },
      );
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }

    const payload = routeConfig.kind === "download_events"
      ? await service.listAdminDocumentDownloadEvents(queryParams(url), context.requestId)
      : await service.listAdminDocumentDownloadGrants(queryParams(url), context.requestId);
    auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "success", null, 200);
    sendJson(response, 200, payload);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", error.code, 401);
      sendAccountSessionError(response, context, error);
      return true;
    }

    if (error instanceof ZodError) {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", "validation_error", 400);
      sendValidationError(response, context, error);
      return true;
    }

    if (error instanceof Error && error.message === "supplier_not_found") {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", error.message, 404);
      sendError(response, 404, error.message, "Supplier was not found.", context);
      return true;
    }

    if (error instanceof Error && error.message === "supplier_document_not_found") {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", error.message, 404);
      sendError(response, 404, error.message, "Supplier document was not found.", context);
      return true;
    }

    if (error instanceof Error && (
      error.message === "invalid_status_transition" ||
      error.message === "current_status_required" ||
      error.message === "approved_document_immutable"
    )) {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "blocked", error.message, 409);
      sendError(response, 409, error.message, "Supplier document status transition is not allowed.", context);
      return true;
    }

    if (error instanceof Error && error.message === "invalid_json") {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", "invalid_json", 400);
      sendError(response, 400, "invalid_json", "Request body must be valid JSON.", context);
      return true;
    }

    if (error instanceof Error && error.message === "request_body_too_large") {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", "request_body_too_large", 413);
      sendError(response, 413, "request_body_too_large", "Request body is too large.", context);
      return true;
    }

    if (error instanceof Error && error.message === "request_body_timeout") {
      auditSupplierDocumentAdminRead(auditSink, context, request, session, routeConfig, "failure", "request_body_timeout", 408);
      sendError(response, 408, "request_body_timeout", "Request body read timed out.", context);
      return true;
    }

    throw error;
  }
}

type SupplierDocumentAdminReadRouteConfig = {
  action: string;
  kind: "download_events" | "download_grants";
  resourceType: string;
  route: string;
};

type SupplierDocumentAdminDecisionRouteConfig = {
  action: string;
  documentId: string;
  kind: "decision";
  resourceType: string;
  route: string;
  supplierId: string;
};

type SupplierDocumentAdminRouteConfig =
  | SupplierDocumentAdminReadRouteConfig
  | SupplierDocumentAdminDecisionRouteConfig;

function resolveSupplierDocumentAdminRoute(pathname: string): SupplierDocumentAdminRouteConfig | null {
  const decisionMatch = pathname.match(/^\/v1\/admin\/supplier-documents\/([^/]+)\/documents\/([^/]+)\/decision$/);
  if (decisionMatch) {
    return {
      action: "admin.supplier_document_management.decide",
      documentId: decodeURIComponent(decisionMatch[2]),
      kind: "decision",
      resourceType: "supplier_document",
      route: "/v1/admin/supplier-documents/:supplierId/documents/:documentId/decision",
      supplierId: decodeURIComponent(decisionMatch[1]),
    };
  }

  if (pathname === downloadEventsRoute) {
    return {
      action: "admin.supplier_document_download_events.read",
      kind: "download_events",
      resourceType: "supplier_document_download_event",
      route: downloadEventsRoute,
    };
  }

  if (pathname === downloadGrantsRoute) {
    return {
      action: "admin.supplier_document_download_grants.read",
      kind: "download_grants",
      resourceType: "supplier_document_download_grant",
      route: downloadGrantsRoute,
    };
  }

  return null;
}

function auditSupplierDocumentAdminRead(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  session: { userId: string; sessionId: string } | undefined,
  routeConfig: SupplierDocumentAdminRouteConfig,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: routeConfig.action,
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceType: routeConfig.resourceType,
    route: routeConfig.route,
    sessionId: session?.sessionId,
    statusCode,
  });
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}
