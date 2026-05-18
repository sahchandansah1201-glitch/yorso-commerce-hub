import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import {
  type ApiRequestContext,
  methodNotAllowed,
  readJsonBody,
  sendError,
  sendJson,
  sendValidationError,
} from "../../http.js";
import { accountSessionIdHeaderName } from "./session.js";
import { AuthServiceError, type AuthService } from "./service.js";

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const sessionIdFromHeader = (request: IncomingMessage) =>
  firstHeader(request.headers[accountSessionIdHeaderName])?.trim();

export async function handleAuthRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AuthService,
  pathname: string,
) {
  try {
    if (pathname === "/v1/auth/sign-in") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request);
      sendJson(response, 200, await service.signIn(payload, context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/session") {
      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      sendJson(response, 200, await service.getSession(sessionIdFromHeader(request), context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/sign-out") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      sendJson(response, 200, await service.signOut(sessionIdFromHeader(request), context.requestId));
      return true;
    }
  } catch (error) {
    if (error instanceof AuthServiceError) {
      sendError(response, 401, error.code, error.message, context);
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

    throw error;
  }

  return false;
}
