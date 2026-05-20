import { describe, expect, it } from "vitest";
import {
  buildClientParseErrorTelemetryEvent,
  buildErrorTelemetryEvent,
  MemoryErrorTelemetrySink,
  sanitizeErrorTelemetryEvent,
} from "./error-observability.js";

describe("error observability", () => {
  it("builds a sanitized API error event with stable correlation fields", async () => {
    const sink = new MemoryErrorTelemetrySink();
    const event = buildErrorTelemetryEvent({
      context: {
        correlationId: "corr_1",
        error: {
          category: "validation",
          code: "validation_error",
          errorId: "err_1",
          statusCode: 400,
        },
        requestId: "req_1",
        startedAt: Date.now() - 25,
      },
      durationMs: 25,
      method: "POST",
      path: "/v1/auth/sign-in?email=buyer@example.com",
      contentLengthPresent: true,
    });

    expect(event).toBeDefined();
    await sink.emit(event!);

    expect(sink.events[0]).toMatchObject({
      type: "api_error_event",
      component: "http",
      event: "error.response",
      severity: "warn",
      category: "validation",
      errorId: "err_1",
      errorCode: "validation_error",
      requestId: "req_1",
      correlationId: "corr_1",
      route: "/v1/auth/sign-in",
      statusCode: 400,
      retryable: false,
      contentLengthPresent: true,
    });
    expect(JSON.stringify(sink.events[0])).not.toContain("buyer@example.com");
  });

  it("marks guardrail errors as retryable without logging payload data", () => {
    const event = sanitizeErrorTelemetryEvent(buildErrorTelemetryEvent({
      context: {
        correlationId: "req_2",
        error: {
          category: "guardrail",
          code: "request_body_timeout",
          errorId: "err_2",
          statusCode: 408,
        },
        guardrail: { code: "request_body_timeout", kind: "body_idle_timeout" },
        requestId: "req_2",
        startedAt: Date.now() - 500,
      },
      durationMs: 500,
      method: "POST",
      path: "/v1/auth/sign-in",
      contentLengthPresent: true,
    })!);

    expect(event).toMatchObject({
      type: "api_error_event",
      category: "guardrail",
      errorCode: "request_body_timeout",
      guardrailCode: "request_body_timeout",
      guardrailKind: "body_idle_timeout",
      retryable: true,
      statusCode: 408,
    });
  });

  it("builds parser/header error events with generated ids", () => {
    const event = sanitizeErrorTelemetryEvent(buildClientParseErrorTelemetryEvent({
      code: "HPE_HEADER_OVERFLOW",
      statusCode: 431,
    }));

    expect(event).toMatchObject({
      type: "api_error_event",
      event: "error.client_parse",
      category: "parser",
      errorCode: "request_header_too_large",
      guardrailCode: "request_header_too_large",
      guardrailKind: "header_size",
      route: "(parser)",
      statusCode: 431,
      retryable: false,
    });
    expect(String(event.errorId)).toMatch(/^err_/);
    expect(String(event.requestId)).toMatch(/^client-error-/);
  });

  it("does not emit when request context has no error", () => {
    expect(buildErrorTelemetryEvent({
      context: {
        correlationId: "req_3",
        requestId: "req_3",
        startedAt: Date.now(),
      },
      durationMs: 1,
      method: "GET",
      path: "/health/live",
    })).toBeUndefined();
  });
});
