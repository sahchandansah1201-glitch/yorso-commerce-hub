import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ApiConfig } from "./config.js";
import { createRequestContext, getRequestUrl, methodNotAllowed, sendError } from "./http.js";
import { handleAccountCompanyContract } from "./routes/account.js";
import { handleLive, handleReady } from "./routes/health.js";

export function createApiServer(config: ApiConfig) {
  return createServer((request, response) => {
    const context = createRequestContext();
    routeRequest(request, response, context, config);
  });
}

function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  context: ReturnType<typeof createRequestContext>,
  config: ApiConfig,
) {
  response.setHeader("x-request-id", context.requestId);
  response.setHeader("x-yorso-backend", "self-hosted");

  const url = getRequestUrl(request);

  if (request.method !== "GET") {
    methodNotAllowed(response, context);
    return;
  }

  if (url.pathname === "/health/live") {
    handleLive(response, context);
    return;
  }

  if (url.pathname === "/health/ready") {
    handleReady(response, context, config);
    return;
  }

  if (url.pathname === "/v1/account/company/schema") {
    handleAccountCompanyContract(response, context);
    return;
  }

  sendError(response, 404, "not_found", "Endpoint not found.", context);
}
