import type { IncomingMessage, ServerResponse } from "node:http";
import { crmFullUiResponseSchema } from "../../../../../packages/contracts/dist/index.js";
import type { ApiConfig } from "../../config.js";
import type { ApiRequestContext } from "../../http.js";
import { methodNotAllowed, sendError, sendJson } from "../../http.js";
import type { CrmAvailabilityChecker } from "./availability.js";
import {
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
  type AccountSessionError,
} from "../auth/session.js";
import type { AuthService } from "../auth/service.js";

const crmFullUiRoute = "/v1/crm/full-ui";

export async function handleCrmRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  authService: AuthService,
  pathname: string,
  config: ApiConfig,
  crmAvailabilityChecker: CrmAvailabilityChecker,
) {
  if (pathname !== crmFullUiRoute) return false;

  if (request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }

  try {
    const session = await resolveAuthenticatedAccountSession(request, authService, context);
    const hasCrmRole = await authService.hasAnyRole(session.userId, ["admin", "company_admin"]);
    if (!hasCrmRole) {
      sendError(response, 403, "crm_access_denied", "CRM access requires a company administrator role.", context);
      return true;
    }

    if (!config.crmEnabled || !config.crmTenantIsolationEnabled || !config.twentyPublicCrmUrl) {
      sendError(response, 503, "crm_unavailable", "CRM is not available in this environment.", context);
      return true;
    }

    if (!(await crmAvailabilityChecker(config.twentyPublicCrmUrl, {
      forceRefresh: requestsFreshCrmStatus(request),
    }))) {
      sendError(response, 503, "crm_unavailable", "CRM is temporarily unavailable.", context);
      return true;
    }

    sendJson(response, 200, crmFullUiResponseSchema.parse({
      ok: true,
      crmUrl: config.twentyPublicCrmUrl,
      requestId: context.requestId,
    }));
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      sendAccountSessionError(response, context, error);
      return true;
    }
    throw error;
  }
}

function requestsFreshCrmStatus(request: IncomingMessage) {
  const value = request.headers["cache-control"];
  const cacheControl = Array.isArray(value) ? value.join(",") : value;
  return cacheControl
    ?.split(",")
    .some((directive) => directive.trim().toLowerCase() === "no-cache") ?? false;
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}
