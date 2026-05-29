import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import {
  type ApiRequestContext,
  type JsonBodyReadOptions,
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
  jsonBodyOptions: JsonBodyReadOptions,
  auditSink: AuditSink,
) {
  try {
    if (pathname === "/v1/auth/register/start") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      const result = await service.startRegistration(payload, context.requestId);
      auditFromRequest(auditSink, context, request, {
        action: "auth.register.start",
        outcome: "success",
        resourceId: result.sessionId,
        resourceType: "registration_draft",
        route: pathname,
        sessionId: result.sessionId,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }

    if (pathname === "/v1/auth/register/verify-email") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      sendJson(response, 200, await service.verifyRegistrationEmail(payload, context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/register/details") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      sendJson(response, 200, await service.submitRegistrationDetails(payload, context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/register/phone/send") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      sendJson(response, 200, await service.requestRegistrationPhoneVerification(payload, context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/register/phone/verify") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      sendJson(response, 200, await service.verifyRegistrationPhone(payload, context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/register/onboarding") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      sendJson(response, 200, await service.submitRegistrationOnboarding(payload, context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/register/markets") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      sendJson(response, 200, await service.submitRegistrationMarkets(payload, context.requestId));
      return true;
    }

    if (pathname === "/v1/auth/register/complete") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      const result = await service.completeRegistration(payload, context.requestId);
      auditFromRequest(auditSink, context, request, {
        action: "auth.register.complete",
        actorUserId: result.userId,
        outcome: "success",
        resourceId: result.session.id,
        resourceType: "auth_session",
        route: pathname,
        sessionId: result.session.id,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }

    if (pathname === "/v1/auth/sign-in") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      const result = await service.signIn(payload, context.requestId, requestMetadata(request));
      auditFromRequest(auditSink, context, request, {
        action: "auth.sign_in",
        actorUserId: result.session.userId,
        outcome: "success",
        resourceId: result.session.id,
        resourceType: "auth_session",
        route: pathname,
        sessionId: result.session.id,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }

    if (pathname === "/v1/auth/password-reset/request") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      const result = await service.requestPasswordReset(payload, context.requestId, requestMetadata(request));
      auditFromRequest(auditSink, context, request, {
        action: "auth.password_reset.request",
        outcome: "success",
        resourceType: "auth_password_recovery",
        route: pathname,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }

    if (pathname === "/v1/auth/password-reset/complete") {
      if (request.method !== "POST") {
        methodNotAllowed(response, context, "POST");
        return true;
      }

      const payload = await readJsonBody(request, jsonBodyOptions);
      const result = await service.completePasswordReset(payload, context.requestId, requestMetadata(request));
      auditFromRequest(auditSink, context, request, {
        action: "auth.password_reset.complete",
        outcome: "success",
        resourceType: "auth_password_recovery",
        route: pathname,
        statusCode: 200,
      });
      sendJson(response, 200, result);
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

      const sessionId = sessionIdFromHeader(request);
      const result = await service.signOut(sessionId, context.requestId, requestMetadata(request));
      auditFromRequest(auditSink, context, request, {
        action: "auth.sign_out",
        outcome: "success",
        resourceId: sessionId,
        resourceType: "auth_session",
        route: pathname,
        sessionId,
        statusCode: 200,
      });
      sendJson(response, 200, result);
      return true;
    }
  } catch (error) {
    if (error instanceof AuthServiceError) {
      if (error.code === "auth_rate_limited" && error.retryAfterSeconds) {
        response.setHeader("retry-after", String(error.retryAfterSeconds));
      }
      const status = statusForAuthError(error.code);
      auditAuthFailure(auditSink, context, request, pathname, error.code, status);
      sendError(response, status, error.code, error.message, context);
      return true;
    }

    if (error instanceof ZodError) {
      auditAuthFailure(auditSink, context, request, pathname, "validation_error", 400);
      sendValidationError(response, context, error);
      return true;
    }

    if (error instanceof Error && error.message === "invalid_json") {
      auditAuthFailure(auditSink, context, request, pathname, "invalid_json", 400);
      sendError(response, 400, "invalid_json", "Request body must be valid JSON.", context);
      return true;
    }

    if (error instanceof Error && error.message === "request_body_too_large") {
      auditAuthFailure(auditSink, context, request, pathname, "request_body_too_large", 413);
      sendError(response, 413, "request_body_too_large", "Request body is too large.", context);
      return true;
    }

    if (error instanceof Error && error.message === "request_body_timeout") {
      auditAuthFailure(auditSink, context, request, pathname, "request_body_timeout", 408);
      sendError(response, 408, "request_body_timeout", "Request body read timed out.", context);
      return true;
    }

    throw error;
  }

  return false;
}

function statusForAuthError(code: AuthServiceError["code"]) {
  if (code === "auth_rate_limited" || code === "registration_rate_limited") return 429;
  if (code === "auth_session_cache_unavailable") return 503;
  if (code === "registration_email_exists") return 409;
  if (
    code === "password_reset_token_invalid" ||
    code === "password_reset_token_expired" ||
    code === "registration_session_invalid" ||
    code === "registration_invalid_code" ||
    code === "registration_code_expired" ||
    code === "registration_email_not_verified" ||
    code === "registration_phone_not_verified" ||
    code === "registration_details_required"
  ) {
    return 400;
  }
  return 401;
}

function auditAuthFailure(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  pathname: string,
  reason: string,
  statusCode: number,
) {
  let action = "auth.sign_in";
  if (pathname === "/v1/auth/password-reset/complete") {
    action = "auth.password_reset.complete";
  } else if (pathname === "/v1/auth/password-reset/request") {
    action = "auth.password_reset.request";
  } else if (pathname === "/v1/auth/sign-out") {
    action = "auth.sign_out";
  } else if (pathname === "/v1/auth/session") {
    action = "auth.session.read";
  } else if (pathname.startsWith("/v1/auth/register/")) {
    action = "auth.register";
  }
  auditFromRequest(auditSink, context, request, {
    action,
    outcome: statusCode === 429 || statusCode === 413 || statusCode === 408 ? "blocked" : "failure",
    reason,
    resourceId: sessionIdFromHeader(request),
    resourceType: "auth_session",
    route: pathname,
    sessionId: sessionIdFromHeader(request),
    statusCode,
  });
}
