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

const requestMetadata = (request: IncomingMessage) => ({
  ip:
    firstHeader(request.headers["x-forwarded-for"])?.split(",")[0]?.trim() ||
    request.socket.remoteAddress ||
    null,
  userAgent: firstHeader(request.headers["user-agent"])?.slice(0, 240) || null,
});

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
      sendJson(response, 200, await service.signIn(payload, context.requestId, requestMetadata(request)));
      return true;
    }

    if (pathname === "/v1/auth/session") {
      if (request.method !== "GET") {
        methodNotAllowed(response, context, "GET");
        return true;
      }

      sendJson(
        response,
        200,
        await service.getSession(sessionIdFromHeader(request), context.requestId, requestMetadata(request)),
      );
      return true;
    }

    if (pathname === "/v1/auth/sign-out") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      sendJson(
        response,
        200,
        await service.signOut(sessionIdFromHeader(request), context.requestId, requestMetadata(request)),
      );
      return true;
    }
  } catch (error) {
    if (error instanceof AuthServiceError) {
      if (error.code === "auth_rate_limited" && error.retryAfterSeconds) {
        response.setHeader("retry-after", String(error.retryAfterSeconds));
      }
      const status =
        error.code === "auth_rate_limited"
          ? 429
          : error.code === "auth_session_cache_unavailable"
            ? 503
            : 401;
      sendError(response, status, error.code, error.message, context);
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
