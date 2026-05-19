import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { type ApiRequestContext, methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import {
  AccountSessionError,
  type AccountSessionAuthority,
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
} from "../auth/session.js";
import type { SupplierAccessService } from "./service.js";

const supplierRequestPrefix = "/v1/access/suppliers/";
const decisionPrefix = "/v1/access/supplier-requests/";
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

export async function handleSupplierAccessRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: SupplierAccessService,
  sessionAuthority: AccountSessionAuthority,
  url: URL,
) {
  try {
    const supplierId = matchSupplierRequestPath(url.pathname);
    if (supplierId) {
      const { userId } = await resolveAuthenticatedAccountSession(request, sessionAuthority, context);

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
        const payload = await readJsonBody(request);
        sendJson(
          response,
          201,
          await service.requestSupplierAccess({
            buyerUserId: userId,
            supplierId,
            payload,
            requestId: context.requestId,
          }),
        );
        return true;
      }

      methodNotAllowed(response, context, "GET, POST");
      return true;
    }

    const decisionRequestId = matchDecisionPath(url.pathname);
    if (decisionRequestId) {
      const { userId } = await resolveAuthenticatedAccountSession(request, sessionAuthority, context);

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

      const payload = await readJsonBody(request);
      sendJson(
        response,
        200,
        await service.decideSupplierAccessRequest({
          requestIdParam: decisionRequestId,
          actorUserId: userId,
          payload,
          responseRequestId: context.requestId,
        }),
      );
      return true;
    }

    if (url.pathname === "/v1/access/notifications") {
      const { userId } = await resolveAuthenticatedAccountSession(request, sessionAuthority, context);

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
        const payload = await readJsonBody(request);
        sendJson(
          response,
          200,
          await service.acknowledgeNotifications({
            buyerUserId: userId,
            payload,
            requestId: context.requestId,
          }),
        );
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

    if (error instanceof Error && error.message === "supplier_access_request_not_found") {
      sendError(response, 404, error.message, "Supplier access request was not found.", context);
      return true;
    }

    throw error;
  }

  return false;
}
