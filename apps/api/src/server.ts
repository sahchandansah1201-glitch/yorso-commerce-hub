import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ApiConfig } from "./config.js";
import { createRequestContext, getRequestUrl, methodNotAllowed, sendError } from "./http.js";
import { createAccountRepository } from "./modules/account/factory.js";
import type { AccountRepository } from "./modules/account/repository.js";
import { handleAccountRoute } from "./modules/account/routes.js";
import { AccountService } from "./modules/account/service.js";
import { accountSessionIdHeaderName, accountUserIdHeaderName } from "./modules/auth/session.js";
import { createFileService } from "./modules/storage/factory.js";
import { handleStorageRoute } from "./modules/storage/routes.js";
import type { FileService } from "./modules/storage/service.js";
import { handleAccountCompanyContract } from "./routes/account.js";
import { handleLive, handleReady } from "./routes/health.js";

export interface ApiServerOptions {
  accountRepository?: AccountRepository;
  fileService?: FileService;
}

export function createApiServer(config: ApiConfig, options: ApiServerOptions = {}) {
  const accountService = new AccountService(options.accountRepository ?? createAccountRepository(config));
  const fileService = options.fileService ?? createFileService(config);

  return createServer((request, response) => {
    const context = createRequestContext();
    routeRequest(request, response, context, config, accountService, fileService).catch((error) => {
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
  fileService: FileService,
) {
  applyCorsHeaders(request, response, config);
  response.setHeader("x-request-id", context.requestId);
  response.setHeader("x-yorso-backend", "self-hosted");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

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
  if (await handleStorageRoute(request, response, context, accountService, fileService, url.pathname)) return;

  sendError(response, 404, "not_found", "Endpoint not found.", context);
}

function applyCorsHeaders(request: IncomingMessage, response: ServerResponse, config: ApiConfig) {
  const origin = request.headers.origin;
  const allowedOrigins = new Set([
    config.publicAppUrl,
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ]);

  if (
    origin &&
    (allowedOrigins.has(origin) ||
      (config.nodeEnv !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)))
  ) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "Origin");
  }

  response.setHeader("access-control-allow-methods", "GET, PATCH, POST, OPTIONS");
  response.setHeader(
    "access-control-allow-headers",
    `content-type, ${accountUserIdHeaderName}, ${accountSessionIdHeaderName}`,
  );
  response.setHeader("access-control-max-age", "600");
}
