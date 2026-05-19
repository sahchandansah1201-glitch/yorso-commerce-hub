import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { methodNotAllowed, sendError, sendJson, sendValidationError, type ApiRequestContext } from "../../http.js";
import {
  AccountSessionError,
  type AccountSessionAuthority,
  resolveOptionalAuthenticatedAccountSession,
  sendAccountSessionError,
} from "../auth/session.js";
import type { SupplierDirectoryService } from "./service.js";

const queryParams = (url: URL) => Object.fromEntries(url.searchParams.entries());

export async function handleSupplierDirectoryRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: SupplierDirectoryService,
  sessionAuthority: AccountSessionAuthority,
  url: URL,
) {
  try {
    if (url.pathname === "/v1/suppliers") {
      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      const session = await resolveOptionalAuthenticatedAccountSession(request, sessionAuthority, context);
      sendJson(response, 200, await service.listSuppliers(queryParams(url), context.requestId, session
        ? { buyerUserId: session.userId }
        : null));
      return true;
    }

    if (url.pathname.startsWith("/v1/suppliers/")) {
      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      const id = decodeURIComponent(url.pathname.slice("/v1/suppliers/".length));
      if (!id || id.includes("/")) return false;
      const session = await resolveOptionalAuthenticatedAccountSession(request, sessionAuthority, context);
      sendJson(response, 200, await service.getSupplierById(id, queryParams(url), context.requestId, session
        ? { buyerUserId: session.userId }
        : null));
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

    if (error instanceof Error && error.message === "supplier_not_found") {
      sendError(response, 404, error.message, "Supplier was not found.", context);
      return true;
    }

    throw error;
  }

  return false;
}
