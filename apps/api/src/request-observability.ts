import { randomUUID } from "node:crypto";
import type { ApiConfig } from "./config.js";
import type { ApiRequestContext } from "./http.js";

export type RequestTelemetryDriver = "disabled" | "console";

export interface RequestTelemetryEvent {
  event: "request.completed" | "request.guardrail_triggered" | "request.client_parse_error";
  requestId: string;
  method?: string;
  route: string;
  statusCode: number;
  durationMs: number;
  latencyBucket: string;
  outcome: "success" | "failure" | "blocked" | "aborted";
  reason?: string;
  guardrailCode?: string;
  guardrailKind?: string;
  contentLengthPresent?: boolean;
  requestTimeoutMs?: number;
  requestBodyIdleTimeoutMs?: number;
  maxHeaderBytes?: number;
  jsonBodyMaxBytes?: number;
}

export interface RequestTelemetrySink {
  emit(event: RequestTelemetryEvent): Promise<void>;
}

export function createRequestTelemetrySink(config: ApiConfig): RequestTelemetrySink {
  if (config.requestObservabilityDriver === "console") return new ConsoleRequestTelemetrySink();
  return new NoopRequestTelemetrySink();
}

export class NoopRequestTelemetrySink implements RequestTelemetrySink {
  async emit(): Promise<void> {
    // Local prototype mode keeps request telemetry disabled unless explicitly enabled.
  }
}

export class ConsoleRequestTelemetrySink implements RequestTelemetrySink {
  async emit(event: RequestTelemetryEvent): Promise<void> {
    console.log(JSON.stringify(sanitizeRequestTelemetryEvent(event)));
  }
}

export class MemoryRequestTelemetrySink implements RequestTelemetrySink {
  readonly events: Record<string, unknown>[] = [];

  async emit(event: RequestTelemetryEvent): Promise<void> {
    this.events.push(sanitizeRequestTelemetryEvent(event));
  }
}

export function buildRequestTelemetryEvent(input: {
  config: ApiConfig;
  context: ApiRequestContext;
  durationMs: number;
  method?: string;
  path: string;
  statusCode: number;
  contentLengthPresent?: boolean;
  aborted?: boolean;
}): RequestTelemetryEvent {
  const guardrail = input.context.guardrail;
  const outcome = input.aborted
    ? "aborted"
    : guardrail
      ? "blocked"
      : input.statusCode >= 500
        ? "failure"
        : "success";

  return {
    event: guardrail ? "request.guardrail_triggered" : "request.completed",
    requestId: input.context.requestId,
    method: input.method,
    route: normalizeRoute(input.path),
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    latencyBucket: latencyBucket(input.durationMs),
    outcome,
    reason: guardrail?.code,
    guardrailCode: guardrail?.code,
    guardrailKind: guardrail?.kind,
    contentLengthPresent: input.contentLengthPresent,
    requestTimeoutMs: guardrail?.kind === "request_timeout" ? input.config.requestTimeoutMs : undefined,
    requestBodyIdleTimeoutMs: guardrail?.kind === "body_idle_timeout"
      ? input.config.requestBodyIdleTimeoutMs
      : undefined,
    jsonBodyMaxBytes: guardrail?.kind === "body_size" ? input.config.jsonBodyMaxBytes : undefined,
  };
}

export function buildClientParseTelemetryEvent(input: {
  config: ApiConfig;
  code: string;
  statusCode: number;
}): RequestTelemetryEvent {
  const headerOverflow = input.code === "HPE_HEADER_OVERFLOW";
  return {
    event: headerOverflow ? "request.guardrail_triggered" : "request.client_parse_error",
    requestId: `client-error-${randomUUID()}`,
    route: "(parser)",
    statusCode: input.statusCode,
    durationMs: 0,
    latencyBucket: "0ms",
    outcome: "blocked",
    reason: headerOverflow ? "request_header_too_large" : "client_parse_error",
    guardrailCode: headerOverflow ? "request_header_too_large" : undefined,
    guardrailKind: headerOverflow ? "header_size" : undefined,
    maxHeaderBytes: headerOverflow ? input.config.maxHeaderBytes : undefined,
  };
}

export function sanitizeRequestTelemetryEvent(event: RequestTelemetryEvent): Record<string, unknown> {
  return dropUndefined({
    type: "api_request_event",
    schemaVersion: 1,
    service: "yorso-api",
    component: "http",
    occurredAt: new Date().toISOString(),
    event: event.event,
    requestId: event.requestId,
    method: event.method,
    route: event.route,
    statusCode: event.statusCode,
    durationMs: event.durationMs,
    latencyBucket: event.latencyBucket,
    outcome: event.outcome,
    reason: event.reason,
    guardrailCode: event.guardrailCode,
    guardrailKind: event.guardrailKind,
    contentLengthPresent: event.contentLengthPresent,
    requestTimeoutMs: event.requestTimeoutMs,
    requestBodyIdleTimeoutMs: event.requestBodyIdleTimeoutMs,
    maxHeaderBytes: event.maxHeaderBytes,
    jsonBodyMaxBytes: event.jsonBodyMaxBytes,
  });
}

export function normalizeRoute(path: string) {
  const safePath = path.split("?")[0] || "/";
  return safePath
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ":uuid")
    .replace(/\/[0-9]+(?=\/|$)/g, "/:id")
    .replace(/\/sup-[a-z]{2}-[0-9]+(?=\/|$)/gi, "/:supplierId")
    .replace(/\/[A-Za-z0-9_-]{16,}(?=\/|$)/g, "/:token");
}

function latencyBucket(durationMs: number) {
  if (durationMs <= 0) return "0ms";
  if (durationMs < 50) return "<50ms";
  if (durationMs < 100) return "<100ms";
  if (durationMs < 250) return "<250ms";
  if (durationMs < 500) return "<500ms";
  if (durationMs < 1_000) return "<1000ms";
  if (durationMs < 2_500) return "<2500ms";
  return ">=2500ms";
}

function dropUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
