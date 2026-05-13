import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ApiConfig } from "./config.js";
import { createRequestContext, getRequestUrl, methodNotAllowed, sendError } from "./http.js";
import { createAccountRepository } from "./modules/account/factory.js";
import type { AccountRepository } from "./modules/account/repository.js";
import { handleAccountRoute } from "./modules/account/routes.js";
import { AccountService } from "./modules/account/service.js";
import { handleAccountCompanyContract } from "./routes/account.js";
import { handleLive, handleReady } from "./routes/health.js";

export interface ApiServerOptions {
  accountRepository?: AccountRepository;
}

export function createApiServer(config: ApiConfig, options: ApiServerOptions = {}) {
  const accountService = new AccountService(options.accountRepository ?? createAccountRepository(config));

  return createServer((request, response) => {
    const context = createRequestContext();
    routeRequest(request, response, context, config, accountService).catch((error) => {
      console.error(error);
      sendError(response, 500, "internal_error", "Internal server error.", context);
    });
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  context: ReturnType<typeof createRequestContext>,
  config: ApiConfig,
  accountService: AccountService,
) {
  response.setHeader("x-request-id", context.requestId);
  response.setHeader("x-yorso-backend", "self-hosted");

  const url = getRequestUrl(request);

  if (url.pathname === "/health/live") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    handleLive(response, context);
    return;
  }

  if (url.pathname === "/health/ready") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    handleReady(response, context, config);
    return;
  }

  if (url.pathname === "/v1/account/company/schema") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    handleAccountCompanyContract(response, context);
    return;
  }

  if (await handleAccountRoute(request, response, context, accountService, url.pathname)) return;

  sendError(response, 404, "not_found", "Endpoint not found.", context);
}
