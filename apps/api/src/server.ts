import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ApiConfig } from "./config.js";
import { createRequestContext, getRequestUrl, methodNotAllowed, sendError } from "./http.js";
import { ApiLifecycle } from "./lifecycle.js";
import { createAccountRepository } from "./modules/account/factory.js";
import type { AccountRepository } from "./modules/account/repository.js";
import { handleAccountRoute } from "./modules/account/routes.js";
import { AccountService } from "./modules/account/service.js";
import { createSupplierAccessRepository } from "./modules/access/factory.js";
import type { SupplierAccessRepository } from "./modules/access/repository.js";
import { handleSupplierAccessRoute } from "./modules/access/routes.js";
import { SupplierAccessService } from "./modules/access/service.js";
import { createAuthRepository } from "./modules/auth/factory.js";
import { createAuthTelemetrySink } from "./modules/auth/observability.js";
import { createAuthRateLimiter } from "./modules/auth/rate-limit.js";
import type { AuthRepository } from "./modules/auth/repository.js";
import { handleAuthRoute } from "./modules/auth/routes.js";
import { accountSessionIdHeaderName, accountUserIdHeaderName } from "./modules/auth/session.js";
import { createAuthSessionCache } from "./modules/auth/session-cache.js";
import { AuthService } from "./modules/auth/service.js";
import { createFileService } from "./modules/storage/factory.js";
import { handleStorageRoute } from "./modules/storage/routes.js";
import type { FileService } from "./modules/storage/service.js";
import { createOfferCatalogRepository } from "./modules/offers/factory.js";
import type { OfferCatalogRepository } from "./modules/offers/repository.js";
import { handleOfferCatalogRoute } from "./modules/offers/routes.js";
import { OfferCatalogService } from "./modules/offers/service.js";
import { createSupplierRepository } from "./modules/suppliers/factory.js";
import type { SupplierRepository } from "./modules/suppliers/repository.js";
import { handleSupplierDirectoryRoute } from "./modules/suppliers/routes.js";
import { SupplierDirectoryService } from "./modules/suppliers/service.js";
import { handleAccountCompanyContract } from "./routes/account.js";
import { createReadinessProbe, handleLive, handleReady, type ReadinessProbe } from "./routes/health.js";

export interface ApiServerOptions {
  accountRepository?: AccountRepository;
  authRepository?: AuthRepository;
  fileService?: FileService;
  lifecycle?: ApiLifecycle;
  offerCatalogRepository?: OfferCatalogRepository;
  readinessProbe?: ReadinessProbe;
  supplierAccessRepository?: SupplierAccessRepository;
  supplierRepository?: SupplierRepository;
}

export function createApiServer(config: ApiConfig, options: ApiServerOptions = {}) {
  const authRepository = options.authRepository ?? createAuthRepository(config);
  const authService = new AuthService(
    authRepository,
    createAuthRateLimiter(config, authRepository),
    createAuthSessionCache(config),
    createAuthTelemetrySink(config),
  );
  const accountService = new AccountService(options.accountRepository ?? createAccountRepository(config));
  const fileService = options.fileService ?? createFileService(config);
  const supplierAccessRepository = options.supplierAccessRepository ?? createSupplierAccessRepository(config);
  const offerCatalogService = new OfferCatalogService(
    options.offerCatalogRepository ?? createOfferCatalogRepository(config),
    supplierAccessRepository,
  );
  const supplierAccessService = new SupplierAccessService(supplierAccessRepository);
  const supplierService = new SupplierDirectoryService(
    options.supplierRepository ?? createSupplierRepository(config),
    supplierAccessRepository,
  );
  const lifecycle = options.lifecycle ?? new ApiLifecycle();
  const readinessProbe = options.readinessProbe ?? createReadinessProbe(config, {
    timeoutMs: config.healthReadinessTimeoutMs,
    lifecycle,
  });

  return createServer((request, response) => {
    const context = createRequestContext();
    routeRequest(
      request,
      response,
      context,
      config,
      authService,
      accountService,
      fileService,
      offerCatalogService,
      supplierAccessService,
      supplierService,
      readinessProbe,
      lifecycle,
    ).catch((error) => {
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
  authService: AuthService,
  accountService: AccountService,
  fileService: FileService,
  offerCatalogService: OfferCatalogService,
  supplierAccessService: SupplierAccessService,
  supplierService: SupplierDirectoryService,
  readinessProbe: ReadinessProbe,
  lifecycle: ApiLifecycle,
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

  if (url.pathname === "/health/live" || url.pathname === "/v1/health/live") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    handleLive(response, context);
    return;
  }

  if (url.pathname === "/health/ready" || url.pathname === "/v1/health/ready") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    await handleReady(response, context, readinessProbe);
    return;
  }

  if (lifecycle.isDraining()) {
    sendError(response, 503, "server_draining", "Server is draining and not accepting new work.", context);
    return;
  }

  lifecycle.beginRequest();
  try {
    await routeWorkRequest(
      request,
      response,
      context,
      authService,
      accountService,
      fileService,
      offerCatalogService,
      supplierAccessService,
      supplierService,
      url,
    );
  } finally {
    lifecycle.endRequest();
  }
}

async function routeWorkRequest(
  request: IncomingMessage,
  response: ServerResponse,
  context: ReturnType<typeof createRequestContext>,
  authService: AuthService,
  accountService: AccountService,
  fileService: FileService,
  offerCatalogService: OfferCatalogService,
  supplierAccessService: SupplierAccessService,
  supplierService: SupplierDirectoryService,
  url: URL,
) {
  if (url.pathname === "/v1/account/company/schema") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    handleAccountCompanyContract(response, context);
    return;
  }

  if (await handleAuthRoute(request, response, context, authService, url.pathname)) return;
  if (await handleAccountRoute(request, response, context, accountService, authService, url.pathname)) return;
  if (await handleStorageRoute(request, response, context, accountService, fileService, authService, url.pathname)) return;
  if (await handleOfferCatalogRoute(request, response, context, offerCatalogService, authService, url)) return;
  if (await handleSupplierAccessRoute(request, response, context, supplierAccessService, authService, url)) return;
  if (await handleSupplierDirectoryRoute(request, response, context, supplierService, authService, url)) return;

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

  response.setHeader("access-control-allow-methods", "GET, PATCH, POST, DELETE, OPTIONS");
  response.setHeader(
    "access-control-allow-headers",
    `content-type, ${accountUserIdHeaderName}, ${accountSessionIdHeaderName}`,
  );
  response.setHeader("access-control-max-age", "600");
}
