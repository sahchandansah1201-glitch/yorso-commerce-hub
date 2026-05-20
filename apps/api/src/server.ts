import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createAuditSink, type AuditSink } from "./audit.js";
import type { ApiConfig } from "./config.js";
import {
  buildClientParseErrorTelemetryEvent,
  buildErrorTelemetryEvent,
  createErrorTelemetrySink,
  type ErrorTelemetrySink,
} from "./error-observability.js";
import { createRequestContext, getRequestUrl, methodNotAllowed, sendError, type JsonBodyReadOptions } from "./http.js";
import { ApiLifecycle } from "./lifecycle.js";
import { createMetricsRegistry, renderMetricsResponse, type MetricsRegistry } from "./metrics.js";
import { createAccountRepository } from "./modules/account/factory.js";
import type { AccountRepository } from "./modules/account/repository.js";
import { handleAccountRoute } from "./modules/account/routes.js";
import { AccountService } from "./modules/account/service.js";
import { createAdminAuditRepository } from "./modules/admin-audit/factory.js";
import type { AdminAuditRepository } from "./modules/admin-audit/repository.js";
import { handleAdminAuditRoute } from "./modules/admin-audit/routes.js";
import { AdminAuditService } from "./modules/admin-audit/service.js";
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
import {
  buildClientParseTelemetryEvent,
  buildRequestTelemetryEvent,
  createRequestTelemetrySink,
  type RequestTelemetrySink,
} from "./request-observability.js";
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
  adminAuditRepository?: AdminAuditRepository;
  auditSink?: AuditSink;
  authRepository?: AuthRepository;
  fileService?: FileService;
  lifecycle?: ApiLifecycle;
  metricsRegistry?: MetricsRegistry;
  offerCatalogRepository?: OfferCatalogRepository;
  errorTelemetrySink?: ErrorTelemetrySink;
  readinessProbe?: ReadinessProbe;
  requestTelemetrySink?: RequestTelemetrySink;
  supplierAccessRepository?: SupplierAccessRepository;
  supplierRepository?: SupplierRepository;
}

export function createApiServer(config: ApiConfig, options: ApiServerOptions = {}) {
  const metricsRegistry = options.metricsRegistry ?? createMetricsRegistry(config);
  const auditSink = options.auditSink ?? createAuditSink(config);
  const authTelemetrySink = createAuthTelemetrySink(config);
  const authRepository = options.authRepository ?? createAuthRepository(config);
  const authService = new AuthService(
    authRepository,
    createAuthRateLimiter(config, authRepository),
    createAuthSessionCache(config),
    {
      async emit(event) {
        await authTelemetrySink.emit(event);
        metricsRegistry.observeAuth(event);
      },
    },
  );
  const accountService = new AccountService(options.accountRepository ?? createAccountRepository(config));
  const adminAuditService = new AdminAuditService(options.adminAuditRepository ?? createAdminAuditRepository(config), config);
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
  const errorTelemetrySink = options.errorTelemetrySink ?? createErrorTelemetrySink(config);
  const requestTelemetrySink = options.requestTelemetrySink ?? createRequestTelemetrySink(config);
  const readinessProbe = options.readinessProbe ?? createReadinessProbe(config, {
    timeoutMs: config.healthReadinessTimeoutMs,
    lifecycle,
  });
  const jsonBodyOptions = {
    maxBytes: config.jsonBodyMaxBytes,
    idleTimeoutMs: config.requestBodyIdleTimeoutMs,
  } satisfies JsonBodyReadOptions;

  const server = createServer({ maxHeaderSize: config.maxHeaderBytes }, (request, response) => {
    const context = createRequestContext();
    const requestPath = getRequestUrl(request).pathname;
    const requestTimer = setTimeout(() => {
      if (response.writableEnded) return;
      sendError(response, 408, "request_timeout", "Request exceeded the configured time limit.", context);
      setTimeout(() => request.destroy(new Error("request_timeout")), 25);
    }, config.requestTimeoutMs);
    const clearRequestTimer = () => clearTimeout(requestTimer);
    response.once("finish", clearRequestTimer);
    response.once("close", clearRequestTimer);
    let telemetryEmitted = false;
    const emitRequestTelemetry = (aborted = false) => {
      if (telemetryEmitted) return;
      telemetryEmitted = true;
      const durationMs = Date.now() - context.startedAt;
      const requestEvent = buildRequestTelemetryEvent({
        config,
        context,
        durationMs,
        method: request.method,
        path: requestPath,
        statusCode: aborted ? 499 : response.statusCode,
        contentLengthPresent: request.headers["content-length"] !== undefined,
        aborted,
      });
      emitTelemetry(requestTelemetrySink, requestEvent, "request_telemetry_emit_failed");
      metricsRegistry.observeRequest(requestEvent);
      const errorEvent = buildErrorTelemetryEvent({
        context,
        durationMs,
        method: request.method,
        path: requestPath,
        contentLengthPresent: request.headers["content-length"] !== undefined,
      });
      if (errorEvent) {
        emitTelemetry(errorTelemetrySink, errorEvent, "error_telemetry_emit_failed");
        metricsRegistry.observeError(errorEvent);
      }
    };
    response.once("finish", () => emitRequestTelemetry(false));
    response.once("close", () => {
      if (!response.writableEnded) emitRequestTelemetry(true);
    });

    routeRequest(
      request,
      response,
      context,
      config,
      authService,
      accountService,
      adminAuditService,
      fileService,
      offerCatalogService,
      supplierAccessService,
      supplierService,
      readinessProbe,
      lifecycle,
      metricsRegistry,
      auditSink,
      jsonBodyOptions,
    ).catch((error) => {
      if (response.writableEnded) return;
      sendError(response, 500, "internal_error", "Internal server error.", context);
      console.error(JSON.stringify({
        type: "api_internal_error",
        schemaVersion: 1,
        service: "yorso-api",
        component: "http",
        occurredAt: new Date().toISOString(),
        requestId: context.requestId,
        correlationId: context.correlationId,
        errorId: context.error?.errorId,
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
    });
  });
  server.requestTimeout = config.requestTimeoutMs;
  server.headersTimeout = config.headersTimeoutMs;
  server.keepAliveTimeout = config.keepAliveTimeoutMs;
  server.on("clientError", (error: NodeJS.ErrnoException, socket) => {
    const headerOverflow = error.code === "HPE_HEADER_OVERFLOW";
    const statusCode = headerOverflow ? 431 : 400;
    const statusText = headerOverflow ? "Request Header Fields Too Large" : "Bad Request";
    const errorEvent = buildClientParseErrorTelemetryEvent({
      code: error.code ?? "client_parse_error",
      statusCode,
    });
    const requestEvent = buildClientParseTelemetryEvent({
      config,
      code: error.code ?? "client_parse_error",
      statusCode,
    });
    emitTelemetry(requestTelemetrySink, requestEvent, "request_telemetry_emit_failed");
    emitTelemetry(errorTelemetrySink, errorEvent, "error_telemetry_emit_failed");
    metricsRegistry.observeRequest(requestEvent);
    metricsRegistry.observeError(errorEvent);
    if (socket.writable) {
      socket.end([
        `HTTP/1.1 ${statusCode} ${statusText}`,
        "Connection: close",
        `x-request-id: ${errorEvent.requestId}`,
        `x-correlation-id: ${errorEvent.correlationId}`,
        `x-error-id: ${errorEvent.errorId}`,
        "",
        "",
      ].join("\r\n"));
    }
  });
  return server;
}

function emitTelemetry<T>(sink: { emit(event: T): Promise<void> }, event: T, failureMarker: string) {
  void sink.emit(event).catch((error) => {
    console.error(failureMarker, error);
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  context: ReturnType<typeof createRequestContext>,
  config: ApiConfig,
  authService: AuthService,
  accountService: AccountService,
  adminAuditService: AdminAuditService,
  fileService: FileService,
  offerCatalogService: OfferCatalogService,
  supplierAccessService: SupplierAccessService,
  supplierService: SupplierDirectoryService,
  readinessProbe: ReadinessProbe,
  lifecycle: ApiLifecycle,
  metricsRegistry: MetricsRegistry,
  auditSink: AuditSink,
  jsonBodyOptions: JsonBodyReadOptions,
) {
  applyCorsHeaders(request, response, config);
  response.setHeader("x-request-id", context.requestId);
  response.setHeader("x-correlation-id", context.correlationId);
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

  if (url.pathname === "/metrics" || url.pathname === "/v1/metrics") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    response.writeHead(200, {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
    });
    response.end(renderMetricsResponse(metricsRegistry, { lifecycle }));
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
      adminAuditService,
      fileService,
      offerCatalogService,
      supplierAccessService,
      supplierService,
      url,
      auditSink,
      metricsRegistry,
      jsonBodyOptions,
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
  adminAuditService: AdminAuditService,
  fileService: FileService,
  offerCatalogService: OfferCatalogService,
  supplierAccessService: SupplierAccessService,
  supplierService: SupplierDirectoryService,
  url: URL,
  auditSink: AuditSink,
  metricsRegistry: MetricsRegistry,
  jsonBodyOptions: JsonBodyReadOptions,
) {
  if (url.pathname === "/v1/account/company/schema") {
    if (request.method !== "GET") {
      methodNotAllowed(response, context);
      return;
    }
    handleAccountCompanyContract(response, context);
    return;
  }

  if (await handleAuthRoute(request, response, context, authService, url.pathname, jsonBodyOptions, auditSink)) return;
  if (await handleAdminAuditRoute(
    request,
    response,
    context,
    adminAuditService,
    authService,
    url,
    auditSink,
    metricsRegistry,
    jsonBodyOptions,
  )) return;
  if (await handleAccountRoute(request, response, context, accountService, authService, url.pathname, jsonBodyOptions, auditSink)) return;
  if (await handleStorageRoute(request, response, context, accountService, fileService, authService, url.pathname, jsonBodyOptions, auditSink)) return;
  if (await handleOfferCatalogRoute(request, response, context, offerCatalogService, authService, url)) return;
  if (await handleSupplierAccessRoute(request, response, context, supplierAccessService, authService, url, jsonBodyOptions, auditSink)) return;
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
