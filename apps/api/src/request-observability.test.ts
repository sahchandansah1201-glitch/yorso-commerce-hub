import { describe, expect, it } from "vitest";
import { loadApiConfig } from "./config.js";
import {
  buildClientParseTelemetryEvent,
  buildRequestTelemetryEvent,
  MemoryRequestTelemetrySink,
  normalizeRoute,
  sanitizeRequestTelemetryEvent,
} from "./request-observability.js";

const config = loadApiConfig({
  NODE_ENV: "test",
  YORSO_API_PORT: "3000",
  YORSO_REQUEST_OBSERVABILITY_DRIVER: "console",
  YORSO_REQUEST_TIMEOUT_MS: "15000",
  YORSO_REQUEST_BODY_IDLE_TIMEOUT_MS: "5000",
  YORSO_MAX_HEADER_BYTES: "16384",
  YORSO_JSON_BODY_MAX_BYTES: "65536",
}, { allowLocalDefaults: true });

describe("request observability", () => {
  it("normalizes routes without leaking ids or query strings", () => {
    expect(normalizeRoute("/v1/offers/00000000-0000-4000-8000-000000000001?email=buyer@example.com"))
      .toBe("/v1/offers/:uuid");
    expect(normalizeRoute("/v1/suppliers/sup-no-001")).toBe("/v1/suppliers/:supplierId");
    expect(normalizeRoute("/v1/account/files/secret-token-1234567890abcdef")).toBe("/v1/account/files/:token");
  });

  it("builds completed request events with latency buckets and no payload data", async () => {
    const sink = new MemoryRequestTelemetrySink();
    await sink.emit(buildRequestTelemetryEvent({
      config,
      context: { requestId: "req_1", startedAt: Date.now() - 75 },
      durationMs: 75,
      method: "POST",
      path: "/v1/auth/sign-in?email=buyer@example.com",
      statusCode: 200,
      contentLengthPresent: true,
    }));

    expect(sink.events[0]).toMatchObject({
      type: "api_request_event",
      component: "http",
      event: "request.completed",
      method: "POST",
      route: "/v1/auth/sign-in",
      statusCode: 200,
      latencyBucket: "<100ms",
      outcome: "success",
      contentLengthPresent: true,
    });
    expect(JSON.stringify(sink.events[0])).not.toContain("buyer@example.com");
  });

  it("marks request guardrails with safe codes and configured limits", () => {
    const event = sanitizeRequestTelemetryEvent(buildRequestTelemetryEvent({
      config,
      context: {
        requestId: "req_2",
        startedAt: Date.now() - 5_000,
        guardrail: { code: "request_body_timeout", kind: "body_idle_timeout" },
      },
      durationMs: 5_000,
      method: "POST",
      path: "/v1/auth/sign-in",
      statusCode: 408,
    }));

    expect(event).toMatchObject({
      event: "request.guardrail_triggered",
      outcome: "blocked",
      reason: "request_body_timeout",
      guardrailKind: "body_idle_timeout",
      requestBodyIdleTimeoutMs: 5_000,
      latencyBucket: ">=2500ms",
    });
  });

  it("marks header parser overflow as a request guardrail", () => {
    expect(sanitizeRequestTelemetryEvent(buildClientParseTelemetryEvent({
      config,
      code: "HPE_HEADER_OVERFLOW",
      statusCode: 431,
    }))).toMatchObject({
      event: "request.guardrail_triggered",
      route: "(parser)",
      statusCode: 431,
      outcome: "blocked",
      reason: "request_header_too_large",
      guardrailKind: "header_size",
      maxHeaderBytes: 16_384,
    });
  });
});
