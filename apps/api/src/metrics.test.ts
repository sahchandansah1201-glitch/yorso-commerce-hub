import { describe, expect, it } from "vitest";
import { InMemoryPrometheusMetricsRegistry, NoopMetricsRegistry } from "./metrics.js";

describe("self-hosted API metrics registry", () => {
  it("renders disabled metrics without collecting runtime labels", () => {
    const registry = new NoopMetricsRegistry();
    expect(registry.enabled).toBe(false);
    expect(registry.renderPrometheusText()).toContain("yorso_api_metrics_enabled 0");
  });

  it("collects request counters, histograms, readiness and guardrail totals", () => {
    const registry = new InMemoryPrometheusMetricsRegistry();

    registry.observeRequest({
      event: "request.completed",
      requestId: "req_1",
      method: "GET",
      route: "/health/ready",
      statusCode: 200,
      durationMs: 42,
      latencyBucket: "<50ms",
      outcome: "success",
    });
    registry.observeRequest({
      event: "request.guardrail_triggered",
      requestId: "req_2",
      method: "POST",
      route: "/v1/auth/sign-in",
      statusCode: 413,
      durationMs: 7,
      latencyBucket: "<50ms",
      outcome: "blocked",
      reason: "request_body_too_large",
      guardrailCode: "request_body_too_large",
      guardrailKind: "body_size",
    });

    const text = registry.renderPrometheusText();

    expect(text).toContain("yorso_api_metrics_enabled 1");
    expect(text).toContain("yorso_api_production_baseline_concurrent_users 10000");
    expect(text).toContain('yorso_api_requests_total{method="GET",outcome="success",route="/health/ready",status_class="2xx"} 1');
    expect(text).toContain('yorso_api_readiness_checks_total{route="/health/ready",status="ready"} 1');
    expect(text).toContain('yorso_api_guardrails_total{code="request_body_too_large",kind="body_size",route="/v1/auth/sign-in"} 1');
    expect(text).toContain("yorso_api_request_duration_seconds_bucket");
    expect(text).toContain("yorso_api_request_duration_seconds_sum");
  });

  it("collects sanitized error, auth, cache and rate-limit metrics", () => {
    const registry = new InMemoryPrometheusMetricsRegistry();

    registry.observeError({
      event: "error.response",
      errorId: "err_1",
      requestId: "req_1",
      correlationId: "req_1",
      method: "POST",
      route: "/v1/auth/sign-in?email=buyer@example.com",
      statusCode: 401,
      durationMs: 5,
      severity: "warn",
      category: "auth",
      errorCode: "auth_invalid_credentials",
      retryable: false,
    });
    registry.observeAuth({
      event: "auth.sign_in.failed",
      requestId: "req_1",
      outcome: "failure",
      reason: "invalid_credentials",
      cacheSource: "session_cache",
      cacheStatus: "miss",
      rateLimitSource: "redis",
      retryAfterSeconds: 60,
    });

    const text = registry.renderPrometheusText();

    expect(text).toContain('yorso_api_errors_total{category="auth",error_code="auth_invalid_credentials",retryable="false",status_class="4xx"} 1');
    expect(text).toContain('yorso_api_auth_events_total{event="auth.sign_in.failed",outcome="failure",reason="invalid_credentials"} 1');
    expect(text).toContain('yorso_api_auth_session_cache_events_total{source="session_cache",status="miss"} 1');
    expect(text).toContain('yorso_api_auth_rate_limit_events_total{outcome="failure",reason="invalid_credentials",source="redis"} 1');
    expect(text).not.toContain("buyer@example.com");
  });

  it("collects admin audit read and export counters without identifiers", () => {
    const registry = new InMemoryPrometheusMetricsRegistry();

    registry.observeAdminAudit({
      operation: "list",
      outcome: "success",
      limit: 50,
      resultCount: 12,
    });
    registry.observeAdminAudit({
      operation: "export",
      outcome: "failure",
      reason: "admin_audit_export_window_too_large",
      limit: 10_000,
      resultCount: 0,
    });
    registry.observeAdminAudit({
      operation: "retention",
      outcome: "success",
      limit: 1_000,
      resultCount: 450,
    });

    const text = registry.renderPrometheusText();

    expect(text).toContain(
      'yorso_api_admin_audit_requests_total{limit_bucket="lte_50",operation="list",outcome="success",reason="none"} 1',
    );
    expect(text).toContain(
      'yorso_api_admin_audit_requests_total{limit_bucket="gt_1000",operation="export",outcome="failure",reason="admin_audit_export_window_too_large"} 1',
    );
    expect(text).toContain(
      'yorso_api_admin_audit_requests_total{limit_bucket="lte_1000",operation="retention",outcome="success",reason="none"} 1',
    );
    expect(text).toContain('yorso_api_admin_audit_rows_total{operation="list"} 12');
    expect(text).toContain('yorso_api_admin_audit_rows_total{operation="retention"} 450');
    expect(text).not.toContain("admin@example.com");
    expect(text).not.toContain("00000000-0000-4000-8000-000000000090");
  });

  it("collects admin runtime status counters without secrets or identifiers", () => {
    const registry = new InMemoryPrometheusMetricsRegistry();

    registry.observeAdminRuntime({
      operation: "status",
      outcome: "success",
    });
    registry.observeAdminRuntime({
      operation: "status",
      outcome: "blocked",
      reason: "admin_role_required",
    });
    registry.observeAdminRuntime({
      operation: "diagnostics",
      outcome: "success",
    });

    const text = registry.renderPrometheusText();

    expect(text).toContain(
      'yorso_api_admin_runtime_status_requests_total{operation="status",outcome="success",reason="none"} 1',
    );
    expect(text).toContain(
      'yorso_api_admin_runtime_status_requests_total{operation="status",outcome="blocked",reason="admin_role_required"} 1',
    );
    expect(text).toContain(
      'yorso_api_admin_runtime_status_requests_total{operation="diagnostics",outcome="success",reason="none"} 1',
    );
    expect(text).not.toContain("admin@example.com");
    expect(text).not.toContain("postgres://");
    expect(text).not.toContain("redis://");
  });
});
