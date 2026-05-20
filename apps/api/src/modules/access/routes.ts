import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import { type ApiRequestContext, type JsonBodyReadOptions, methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import {
  AccountSessionError,
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
} from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import type { SupplierAccessService } from "./service.js";

const supplierRequestPrefix = "/v1/access/suppliers/";
const decisionPrefix = "/v1/access/supplier-requests/";
const adminReviewRoute = "/v1/admin/access-requests";
const adminDecisionPrefix = "/v1/admin/access-requests/";
const adminDecisionRoutePattern = "/v1/admin/access-requests/:requestId/decision";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const queryParams = (url: URL) => Object.fromEntries(url.searchParams.entries());

function matchSupplierRequestPath(pathname: string) {
  if (!pathname.startsWith(supplierRequestPrefix) || !pathname.endsWith("/request")) return null;
  const supplierId = decodeURIComponent(
    pathname.slice(supplierRequestPrefix.length, -"/request".length),
  );
  if (!supplierId || supplierId.includes("/")) return null;
  return supplierId;
}

function matchDecisionPath(pathname: string) {
  if (!pathname.startsWith(decisionPrefix) || !pathname.endsWith("/decision")) return null;
  const requestId = decodeURIComponent(
    pathname.slice(decisionPrefix.length, -"/decision".length),
  );
  if (!requestId || requestId.includes("/")) return null;
  return requestId;
}

function matchAdminDecisionPath(pathname: string) {
  if (!pathname.startsWith(adminDecisionPrefix) || !pathname.endsWith("/decision")) return null;
  const requestId = decodeURIComponent(
    pathname.slice(adminDecisionPrefix.length, -"/decision".length),
  );
  if (!requestId || requestId.includes("/")) return null;
  return requestId;
}

export async function handleSupplierAccessRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: SupplierAccessService,
  authService: AuthService,
  url: URL,
  jsonBodyOptions: JsonBodyReadOptions,
  auditSink: AuditSink,
) {
  try {
    if (url.pathname === adminReviewRoute) {
      const { userId, sessionId } = await resolveAuthenticatedAccountSession(request, authService, context);
      if (!(await authService.hasRole(userId, "admin"))) {
        auditFromRequest(auditSink, context, request, {
          action: "admin.access_requests.read",
          actorUserId: userId,
          outcome: "blocked",
          reason: "admin_role_required",
          resourceType: "supplier_access_request",
          route: adminReviewRoute,
          sessionId,
          statusCode: 403,
        });
        sendError(response, 403, "admin_role_required", "Admin role is required.", context);
        return true;
      }

      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      const result = await service.listReviewRequests({
        rawQuery: queryParams(url),
        requestId: context.requestId,
      });
      auditFromRequest(auditSink, context, request, {
        action: "admin.access_requests.read",
        actorUserId: userId,
        outcome: "success",
        resourceType: "supplier_access_request",
        route: adminReviewRoute,
        sessionId,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }

    const adminDecisionRequestId = matchAdminDecisionPath(url.pathname);
    if (adminDecisionRequestId) {
      const { userId, sessionId } = await resolveAuthenticatedAccountSession(request, authService, context);
      if (!(await authService.hasRole(userId, "admin"))) {
        auditFromRequest(auditSink, context, request, {
          action: "admin.access_requests.decision",
          actorUserId: userId,
          outcome: "blocked",
          reason: "admin_role_required",
          resourceId: adminDecisionRequestId,
          resourceType: "supplier_access_request",
          route: adminDecisionRoutePattern,
          sessionId,
          statusCode: 403,
        });
        sendError(response, 403, "admin_role_required", "Admin role is required.", context);
        return true;
      }

      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      if (!uuidPattern.test(adminDecisionRequestId)) {
        sendError(
          response,
          404,
          "supplier_access_request_not_found",
          "Supplier access request was not found.",
          context,
        );
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      const result = await service.decideSupplierAccessRequest({
        requestIdParam: adminDecisionRequestId,
        actorUserId: userId,
        payload,
        responseRequestId: context.requestId,
      });
      auditFromRequest(auditSink, context, request, {
        action: "admin.access_requests.decision",
        actorUserId: userId,
        outcome: "success",
        reason: result.request.status,
        resourceId: adminDecisionRequestId,
        resourceType: "supplier_access_request",
        route: adminDecisionRoutePattern,
        sessionId,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }

    const supplierId = matchSupplierRequestPath(url.pathname);
    if (supplierId) {
      const { userId, sessionId } = await resolveAuthenticatedAccountSession(request, authService, context);

      if (request.method === "GET") {
        sendJson(
          response,
          200,
          await service.getSupplierAccessRequest({
            buyerUserId: userId,
            supplierId,
            requestId: context.requestId,
          }),
        );
        return true;
      }

      if (request.method === "POST") {
        const payload = await readJsonBody(request, jsonBodyOptions);
        const result = await service.requestSupplierAccess({
          buyerUserId: userId,
          supplierId,
          payload,
          requestId: context.requestId,
        });
        auditFromRequest(auditSink, context, request, {
          action: "access.supplier.request",
          actorUserId: userId,
          outcome: "success",
          resourceId: result.request?.id ?? supplierId,
          resourceType: "supplier_access_request",
          route: supplierRequestPrefix + ":supplierId/request",
          sessionId,
          statusCode: 201,
        });
        sendJson(response, 201, result);
        return true;
      }

      methodNotAllowed(response, context, "GET, POST");
      return true;
    }

    const decisionRequestId = matchDecisionPath(url.pathname);
    if (decisionRequestId) {
      const { userId, sessionId } = await resolveAuthenticatedAccountSession(request, authService, context);

      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      if (!uuidPattern.test(decisionRequestId)) {
        sendError(
          response,
          404,
          "supplier_access_request_not_found",
          "Supplier access request was not found.",
          context,
        );
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      const result = await service.decideSupplierAccessRequest({
        requestIdParam: decisionRequestId,
        actorUserId: userId,
        payload,
        responseRequestId: context.requestId,
      });
      auditFromRequest(auditSink, context, request, {
        action: "access.supplier.decision",
        actorUserId: userId,
        outcome: "success",
        reason: result.request.status,
        resourceId: decisionRequestId,
        resourceType: "supplier_access_request",
        route: decisionPrefix + ":requestId/decision",
        sessionId,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }

    if (url.pathname === "/v1/access/notifications") {
      const { userId, sessionId } = await resolveAuthenticatedAccountSession(request, authService, context);

      if (request.method === "GET") {
        sendJson(
          response,
          200,
          await service.listNotifications({
            buyerUserId: userId,
            rawQuery: queryParams(url),
            requestId: context.requestId,
          }),
        );
        return true;
      }

      if (request.method === "PATCH") {
        const payload = await readJsonBody(request, jsonBodyOptions);
        const result = await service.acknowledgeNotifications({
          buyerUserId: userId,
          payload,
          requestId: context.requestId,
        });
        auditFromRequest(auditSink, context, request, {
          action: "access.notifications.ack",
          actorUserId: userId,
          outcome: "success",
          resourceId: userId,
          resourceType: "access_notifications",
          route: "/v1/access/notifications",
          sessionId,
          statusCode: 200,
        });
        sendJson(response, 200, result);
        return true;
      }

      methodNotAllowed(response, context, "GET, PATCH");
      return true;
    }
  } catch (error) {
    if (error instanceof AccountSessionError) {
      sendAccountSessionError(response, context, error);
      return true;
    }

    if (error instanceof ZodError) {
      sendValidationError(response, context, error);
      return true;
    }

    if (error instanceof Error && error.message === "invalid_json") {
      sendError(response, 400, "invalid_json", "Request body must be valid JSON.", context);
      return true;
    }

    if (error instanceof Error && error.message === "request_body_too_large") {
      sendError(response, 413, "request_body_too_large", "Request body is too large.", context);
      return true;
    }

    if (error instanceof Error && error.message === "request_body_timeout") {
      sendError(response, 408, "request_body_timeout", "Request body read timed out.", context);
      return true;
    }

    if (error instanceof Error && error.message === "supplier_access_request_not_found") {
      sendError(response, 404, error.message, "Supplier access request was not found.", context);
      return true;
    }

    throw error;
  }

  return false;
}
