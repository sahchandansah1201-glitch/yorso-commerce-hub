import { randomUUID } from "node:crypto";
import type { ApiConfig } from "./config.js";
import type { ApiErrorCategory, ApiRequestContext } from "./http.js";
import { normalizeRoute } from "./request-observability.js";

export type ErrorTelemetryDriver = "disabled" | "console";

export interface ErrorTelemetryEvent {
  event: "error.response" | "error.client_parse";
  errorId: string;
  requestId: string;
  correlationId: string;
  method?: string;
  route: string;
  statusCode: number;
  durationMs: number;
  severity: "warn" | "error";
  category: ApiErrorCategory | "parser";
  errorCode: string;
  retryable: boolean;
  guardrailCode?: string;
  guardrailKind?: string;
  contentLengthPresent?: boolean;
}

export interface ErrorTelemetrySink {
  emit(event: ErrorTelemetryEvent): Promise<void>;
}

export function createErrorTelemetrySink(config: ApiConfig): ErrorTelemetrySink {
  if (config.errorObservabilityDriver === "console") return new ConsoleErrorTelemetrySink();
  return new NoopErrorTelemetrySink();
}

export class NoopErrorTelemetrySink implements ErrorTelemetrySink {
  async emit(): Promise<void> {
    // Local prototype mode keeps error telemetry disabled unless explicitly enabled.
  }
}

export class ConsoleErrorTelemetrySink implements ErrorTelemetrySink {
  async emit(event: ErrorTelemetryEvent): Promise<void> {
    console.error(JSON.stringify(sanitizeErrorTelemetryEvent(event)));
  }
}

export class MemoryErrorTelemetrySink implements ErrorTelemetrySink {
  readonly events: Record<string, unknown>[] = [];

  async emit(event: ErrorTelemetryEvent): Promise<void> {
    this.events.push(sanitizeErrorTelemetryEvent(event));
  }
}

export function buildErrorTelemetryEvent(input: {
  context: ApiRequestContext;
  durationMs: number;
  method?: string;
  path: string;
  contentLengthPresent?: boolean;
}): ErrorTelemetryEvent | undefined {
  if (!input.context.error) return undefined;
  const { error } = input.context;
  return {
    event: "error.response",
    errorId: error.errorId,
    requestId: input.context.requestId,
    correlationId: input.context.correlationId,
    method: input.method,
    route: normalizeRoute(input.path),
    statusCode: error.statusCode,
    durationMs: input.durationMs,
    severity: error.statusCode >= 500 ? "error" : "warn",
    category: error.category,
    errorCode: error.code,
    retryable: isRetryable(error.statusCode, error.code),
    guardrailCode: input.context.guardrail?.code,
    guardrailKind: input.context.guardrail?.kind,
    contentLengthPresent: input.contentLengthPresent,
  };
}

export function buildClientParseErrorTelemetryEvent(input: {
  code: string;
  statusCode: number;
}): ErrorTelemetryEvent {
  const headerOverflow = input.code === "HPE_HEADER_OVERFLOW";
  const errorCode = headerOverflow ? "request_header_too_large" : "client_parse_error";
  const requestId = `client-error-${randomUUID()}`;
  return {
    event: "error.client_parse",
    errorId: `err_${randomUUID()}`,
    requestId,
    correlationId: requestId,
    route: "(parser)",
    statusCode: input.statusCode,
    durationMs: 0,
    severity: "warn",
    category: "parser",
    errorCode,
    retryable: false,
    guardrailCode: headerOverflow ? errorCode : undefined,
    guardrailKind: headerOverflow ? "header_size" : undefined,
  };
}

export function sanitizeErrorTelemetryEvent(event: ErrorTelemetryEvent): Record<string, unknown> {
  return dropUndefined({
    type: "api_error_event",
    schemaVersion: 1,
    service: "yorso-api",
    component: "http",
    occurredAt: new Date().toISOString(),
    event: event.event,
    severity: event.severity,
    category: event.category,
    outcome: "failure",
    errorId: event.errorId,
    errorCode: event.errorCode,
    requestId: event.requestId,
    correlationId: event.correlationId,
    method: event.method,
    route: event.route,
    statusCode: event.statusCode,
    durationMs: event.durationMs,
    retryable: event.retryable,
    guardrailCode: event.guardrailCode,
    guardrailKind: event.guardrailKind,
    contentLengthPresent: event.contentLengthPresent,
  });
}

function isRetryable(statusCode: number, code: string) {
  if (code === "server_draining" || code === "request_timeout" || code === "request_body_timeout") return true;
  if (statusCode === 408 || statusCode === 429 || statusCode === 503) return true;
  return statusCode >= 500;
}

function dropUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
