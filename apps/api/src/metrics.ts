import type { ApiConfig } from "./config.js";
import type { ErrorTelemetryEvent } from "./error-observability.js";
import type { AuthTelemetryEvent } from "./modules/auth/observability.js";
import type { RequestTelemetryEvent } from "./request-observability.js";
import type { ApiLifecycle } from "./lifecycle.js";

export type MetricsDriver = "disabled" | "prometheus";

export interface MetricsRegistry {
  enabled: boolean;
  observeAdminAudit(event: AdminAuditMetricsEvent): void;
  observeRequest(event: RequestTelemetryEvent): void;
  observeError(event: ErrorTelemetryEvent): void;
  observeAuth(event: AuthTelemetryEvent): void;
  renderPrometheusText(options?: { lifecycle?: ApiLifecycle }): string;
}

export interface AdminAuditMetricsEvent {
  operation: "list" | "export" | "retention";
  outcome: "success" | "failure" | "blocked";
  reason?: string | null;
  resultCount?: number;
  limit?: number;
}

const durationBuckets = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const maxLabelLength = 96;

export function createMetricsRegistry(config: ApiConfig): MetricsRegistry {
  if (config.metricsDriver === "prometheus") return new InMemoryPrometheusMetricsRegistry();
  return new NoopMetricsRegistry();
}

export class NoopMetricsRegistry implements MetricsRegistry {
  readonly enabled = false;

  observeAdminAudit(): void {
    // Metrics stay disabled in local prototype mode unless explicitly enabled.
  }

  observeRequest(): void {
    // Metrics stay disabled in local prototype mode unless explicitly enabled.
  }

  observeError(): void {
    // Metrics stay disabled in local prototype mode unless explicitly enabled.
  }

  observeAuth(): void {
    // Metrics stay disabled in local prototype mode unless explicitly enabled.
  }

  renderPrometheusText(): string {
    return [
      "# HELP yorso_api_metrics_enabled Whether the self-hosted API metrics registry is enabled.",
      "# TYPE yorso_api_metrics_enabled gauge",
      "yorso_api_metrics_enabled 0",
      "",
    ].join("\n");
  }
}

export class InMemoryPrometheusMetricsRegistry implements MetricsRegistry {
  readonly enabled = true;
  private readonly counters = new Map<string, number>();
  private readonly duration = new Map<string, { count: number; sum: number; buckets: number[] }>();

  observeAdminAudit(event: AdminAuditMetricsEvent): void {
    this.increment("yorso_api_admin_audit_requests_total", {
      operation: label(event.operation),
      outcome: label(event.outcome),
      reason: label(event.reason ?? "none"),
      limit_bucket: adminAuditLimitBucket(event.limit),
    });

    if (event.resultCount !== undefined) {
      this.increment("yorso_api_admin_audit_rows_total", {
        operation: label(event.operation),
      }, Math.max(0, event.resultCount));
    }
  }

  observeRequest(event: RequestTelemetryEvent): void {
    const method = label(event.method ?? "UNKNOWN");
    const route = metricRoute(event.route);
    const statusClass = statusClassLabel(event.statusCode);
    const outcome = label(event.outcome);

    this.increment("yorso_api_requests_total", { method, route, status_class: statusClass, outcome });
    this.observeDuration({ method, route, outcome }, event.durationMs / 1000);

    if (event.guardrailCode || event.guardrailKind) {
      this.increment("yorso_api_guardrails_total", {
        kind: label(event.guardrailKind ?? "unknown"),
        code: label(event.guardrailCode ?? event.reason ?? "unknown"),
        route,
      });
    }

    if (route === "/health/ready" || route === "/v1/health/ready") {
      this.increment("yorso_api_readiness_checks_total", {
        status: event.statusCode < 500 ? "ready" : "not_ready",
        route,
      });
    }
  }

  observeError(event: ErrorTelemetryEvent): void {
    this.increment("yorso_api_errors_total", {
      category: label(event.category),
      error_code: label(event.errorCode),
      status_class: statusClassLabel(event.statusCode),
      retryable: event.retryable ? "true" : "false",
    });
  }

  observeAuth(event: AuthTelemetryEvent): void {
    this.increment("yorso_api_auth_events_total", {
      event: label(event.event),
      outcome: label(event.outcome ?? "unknown"),
      reason: label(event.reason ?? "none"),
    });

    if (event.cacheStatus || event.cacheSource) {
      this.increment("yorso_api_auth_session_cache_events_total", {
        source: label(event.cacheSource ?? "unknown"),
        status: label(event.cacheStatus ?? "unknown"),
      });
    }

    if (event.rateLimitSource || event.retryAfterSeconds !== undefined) {
      this.increment("yorso_api_auth_rate_limit_events_total", {
        source: label(event.rateLimitSource ?? "unknown"),
        outcome: label(event.outcome ?? "unknown"),
        reason: label(event.reason ?? "none"),
      });
    }
  }

  renderPrometheusText(options: { lifecycle?: ApiLifecycle } = {}): string {
    const lines: string[] = [];
    lines.push("# HELP yorso_api_metrics_enabled Whether the self-hosted API metrics registry is enabled.");
    lines.push("# TYPE yorso_api_metrics_enabled gauge");
    lines.push("yorso_api_metrics_enabled 1");
    lines.push("# HELP yorso_api_production_baseline_concurrent_users Required design baseline for production concurrency.");
    lines.push("# TYPE yorso_api_production_baseline_concurrent_users gauge");
    lines.push("yorso_api_production_baseline_concurrent_users 10000");

    const snapshot = options.lifecycle?.snapshot();
    lines.push("# HELP yorso_api_lifecycle_active_requests Active work requests currently tracked by graceful shutdown lifecycle.");
    lines.push("# TYPE yorso_api_lifecycle_active_requests gauge");
    lines.push(`yorso_api_lifecycle_active_requests ${snapshot?.activeRequests ?? 0}`);
    lines.push("# HELP yorso_api_lifecycle_draining Whether the API process is draining during graceful shutdown.");
    lines.push("# TYPE yorso_api_lifecycle_draining gauge");
    lines.push(`yorso_api_lifecycle_draining ${snapshot?.draining ? 1 : 0}`);

    renderCounters(lines, this.counters);
    renderDurationHistograms(lines, this.duration);
    lines.push("");
    return lines.join("\n");
  }

  private increment(metric: string, labels: Record<string, string>, amount = 1) {
    const key = metricKey(metric, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + amount);
  }

  private observeDuration(labels: Record<string, string>, seconds: number) {
    const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
    const key = metricKey("yorso_api_request_duration_seconds", labels);
    const entry = this.duration.get(key) ?? { count: 0, sum: 0, buckets: durationBuckets.map(() => 0) };
    entry.count += 1;
    entry.sum += safeSeconds;
    durationBuckets.forEach((bucket, index) => {
      if (safeSeconds <= bucket) entry.buckets[index] += 1;
    });
    this.duration.set(key, entry);
  }
}

export function renderMetricsResponse(registry: MetricsRegistry, options: { lifecycle?: ApiLifecycle } = {}) {
  return registry.renderPrometheusText(options);
}

function renderCounters(lines: string[], counters: Map<string, number>) {
  const seen = new Set<string>();
  for (const [key, value] of [...counters.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const { metric, labels } = parseMetricKey(key);
    if (!seen.has(metric)) {
      lines.push(`# TYPE ${metric} counter`);
      seen.add(metric);
    }
    lines.push(`${metric}${formatLabels(labels)} ${value}`);
  }
}

function renderDurationHistograms(lines: string[], histograms: Map<string, { count: number; sum: number; buckets: number[] }>) {
  if (histograms.size === 0) return;
  lines.push("# HELP yorso_api_request_duration_seconds Request duration histogram in seconds.");
  lines.push("# TYPE yorso_api_request_duration_seconds histogram");

  for (const [key, entry] of [...histograms.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const { labels } = parseMetricKey(key);
    durationBuckets.forEach((bucket, index) => {
      lines.push(`yorso_api_request_duration_seconds_bucket${formatLabels({ ...labels, le: String(bucket) })} ${entry.buckets[index]}`);
    });
    lines.push(`yorso_api_request_duration_seconds_bucket${formatLabels({ ...labels, le: "+Inf" })} ${entry.count}`);
    lines.push(`yorso_api_request_duration_seconds_sum${formatLabels(labels)} ${roundMetric(entry.sum)}`);
    lines.push(`yorso_api_request_duration_seconds_count${formatLabels(labels)} ${entry.count}`);
  }
}

function metricKey(metric: string, labels: Record<string, string>) {
  const normalized = Object.entries(labels)
    .map(([key, value]) => [key, label(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify({ metric, labels: normalized });
}

function parseMetricKey(key: string): { metric: string; labels: Record<string, string> } {
  const parsed = JSON.parse(key) as { metric: string; labels: [string, string][] };
  return { metric: parsed.metric, labels: Object.fromEntries(parsed.labels) };
}

function formatLabels(labels: Record<string, string>) {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return "";
  return `{${entries.map(([key, value]) => `${key}="${escapeLabelValue(value)}"`).join(",")}}`;
}

function escapeLabelValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function statusClassLabel(statusCode: number) {
  if (!Number.isFinite(statusCode)) return "unknown";
  return `${Math.floor(statusCode / 100)}xx`;
}

function metricRoute(route: string) {
  return label(route.split("?")[0] || "/");
}

function label(value: string) {
  return value
    .replace(/[^\w:./-]/g, "_")
    .slice(0, maxLabelLength) || "unknown";
}

function roundMetric(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function adminAuditLimitBucket(limit: number | undefined) {
  if (limit === undefined) return "unknown";
  if (limit <= 50) return "lte_50";
  if (limit <= 500) return "lte_500";
  if (limit <= 1_000) return "lte_1000";
  return "gt_1000";
}
