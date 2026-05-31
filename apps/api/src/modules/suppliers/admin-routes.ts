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
) {
  const routeConfig = resolveSupplierDocumentAdminRoute(url.pathname);
  if (!routeConfig) return false;

  if (request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
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

    throw error;
  }
}

type SupplierDocumentAdminRouteConfig = {
  action: string;
  kind: "download_events" | "download_grants";
  resourceType: string;
  route: string;
};

function resolveSupplierDocumentAdminRoute(pathname: string): SupplierDocumentAdminRouteConfig | null {
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
