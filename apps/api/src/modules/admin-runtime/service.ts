import {
  adminRuntimeDiagnosticsSchema,
  adminRuntimeStatusSchema,
  type AdminRuntimeDiagnosticCheck,
  type AdminRuntimeDiagnostics,
  type AdminRuntimeStatus,
} from "../../../../../packages/contracts/dist/index.js";
import type { ApiConfig } from "../../config.js";
import type { ApiLifecycle } from "../../lifecycle.js";

export class AdminRuntimeService {
  constructor(
    private readonly config: ApiConfig,
    private readonly lifecycle: ApiLifecycle,
  ) {}

  getStatus(requestId: string): AdminRuntimeStatus {
    const lifecycle = this.lifecycle.snapshot();

    return adminRuntimeStatusSchema.parse({
      ok: true,
      requestId,
      selfHostedBackend: true,
      productionScaleBaseline: {
        targetConcurrentUsers: 10_000,
        status: "policy_required",
      },
      runtime: {
        nodeEnv: this.config.nodeEnv,
        accountRepository: this.config.accountRepository,
        storageDriver: this.config.storageDriver,
        metricsDriver: this.config.metricsDriver,
        requestObservabilityDriver: this.config.requestObservabilityDriver,
        errorObservabilityDriver: this.config.errorObservabilityDriver,
        authObservabilityDriver: this.config.authObservabilityDriver,
        auditDriver: this.config.auditDriver,
      },
      auth: {
        rateLimitDriver: this.config.authRateLimitDriver,
        rateLimitFailMode: this.config.authRateLimitFailMode,
        signInFailureWindowMs: this.config.authSignInFailureWindowMs,
        signInMaxFailedAttempts: this.config.authSignInMaxFailedAttempts,
        sessionCacheDriver: this.config.authSessionCacheDriver,
        sessionCacheFailMode: this.config.authSessionCacheFailMode,
        sessionCacheTtlMs: this.config.authSessionCacheTtlMs,
      },
      requestGuardrails: {
        requestTimeoutMs: this.config.requestTimeoutMs,
        requestBodyIdleTimeoutMs: this.config.requestBodyIdleTimeoutMs,
        headersTimeoutMs: this.config.headersTimeoutMs,
        keepAliveTimeoutMs: this.config.keepAliveTimeoutMs,
        maxHeaderBytes: this.config.maxHeaderBytes,
        jsonBodyMaxBytes: this.config.jsonBodyMaxBytes,
        maxUploadBytes: this.config.maxUploadBytes,
      },
      adminAudit: {
        exportMaxWindowDays: this.config.adminAuditExportMaxWindowDays,
        retentionDays: this.config.adminAuditRetentionDays,
        auditMaxInFlight: this.config.auditMaxInFlight,
      },
      lifecycle: {
        draining: lifecycle.draining,
        activeRequests: lifecycle.activeRequests,
        drainSignalPresent: Boolean(lifecycle.drainSignal),
        drainStarted: Boolean(lifecycle.drainStartedAt),
        shutdownDrainDelayMs: this.config.shutdownDrainDelayMs,
        shutdownGraceTimeoutMs: this.config.shutdownGraceTimeoutMs,
      },
      productionPolicy: {
        hostedBaasProductionBackend: false,
        secretsIncluded: false,
      },
    });
  }

  getDiagnostics(requestId: string): AdminRuntimeDiagnostics {
    const status = this.getStatus(requestId);
    const checks = buildDiagnosticChecks(status);
    const passCount = checks.filter((check) => check.status === "pass").length;
    const warnCount = checks.filter((check) => check.status === "warn").length;
    const failCount = checks.filter((check) => check.status === "fail").length;
    const overallStatus = failCount > 0 ? "fail" : warnCount > 0 ? "warn" : "pass";

    return adminRuntimeDiagnosticsSchema.parse({
      ok: true,
      requestId,
      generatedAt: new Date().toISOString(),
      selfHostedBackend: true,
      productionScaleBaseline: status.productionScaleBaseline,
      diagnostics: {
        checks,
        failCount,
        overallStatus,
        passCount,
        productionReady: overallStatus === "pass",
        warnCount,
      },
      capacityPlan: {
        readProfile: "Low-frequency admin reads at the 10,000 concurrent users baseline. Keep runtime diagnostics uncached in browser and cheap on the API worker.",
        writeProfile: "No writes. Diagnostics must not mutate runtime state.",
        cacheStrategy: "Use explicit refresh only. Do not poll by default, to avoid background load from open admin tabs.",
        backpressureStrategy: "Reuse request timeout, header limit, body idle timeout, audit max-in-flight, and auth fail-closed controls.",
        databaseStrategy: "Diagnostics is config-derived and does not scan business tables. Audit and catalog scale are validated by their own indexed paths.",
        failureMode: "If diagnostics fails, keep status unavailable and avoid fallback data fabrication.",
        observabilityPlan: "Emit admin runtime diagnostics metrics and audit events without raw identifiers or secrets.",
        loadTestPlan: "Include the endpoint in operator smoke tests and keep it outside high-frequency buyer/supplier paths.",
      },
      productionPolicy: status.productionPolicy,
    });
  }
}

function buildDiagnosticChecks(status: AdminRuntimeStatus): AdminRuntimeDiagnosticCheck[] {
  return [
    {
      action: "Keep hosted BaaS disabled for production runtime.",
      id: "production_policy",
      label: "Self-hosted production policy",
      severity: "critical",
      status: (
        status.productionPolicy.hostedBaasProductionBackend === false &&
        status.productionPolicy.secretsIncluded === false
      ) ? "pass" : "fail",
      summary: "Production backend policy is evaluated from sanitized runtime flags.",
    },
    {
      action: "Maintain the 10,000 concurrent users design baseline for production-facing changes.",
      id: "capacity_baseline",
      label: "10,000 concurrent users baseline",
      severity: "critical",
      status: status.productionScaleBaseline.targetConcurrentUsers === 10_000 ? "pass" : "fail",
      summary: "The runtime contract must keep the production capacity target explicit.",
    },
    {
      action: "Use Redis with fail-closed behavior before production traffic.",
      id: "auth_rate_limit",
      label: "Auth rate limit runtime",
      severity: "critical",
      status: status.auth.rateLimitDriver === "redis" && status.auth.rateLimitFailMode === "closed"
        ? "pass"
        : status.auth.rateLimitFailMode === "closed" ? "warn" : "fail",
      summary: "Rate limiting must protect sign-in under credential attacks and load spikes.",
    },
    {
      action: "Use Redis session cache with fail-closed behavior in production.",
      id: "session_cache",
      label: "Session cache runtime",
      severity: "critical",
      status: status.auth.sessionCacheDriver === "redis" && status.auth.sessionCacheFailMode === "closed"
        ? "pass"
        : status.auth.sessionCacheFailMode === "closed" ? "warn" : "fail",
      summary: "Session validation must stay fast and must not silently fail open in production.",
    },
    {
      action: "Keep Prometheus metrics and console JSONL telemetry enabled in production.",
      id: "observability",
      label: "Observability runtime",
      severity: "warning",
      status: (
        status.runtime.metricsDriver === "prometheus" &&
        status.runtime.requestObservabilityDriver === "console" &&
        status.runtime.errorObservabilityDriver === "console" &&
        status.runtime.authObservabilityDriver === "console"
      ) ? "pass" : "warn",
      summary: "Operators need metrics plus request, error and auth telemetry during incidents.",
    },
    {
      action: "Use durable Postgres audit storage with bounded in-flight writes.",
      id: "audit_durability",
      label: "Admin audit durability",
      severity: "warning",
      status: status.runtime.auditDriver === "postgres" && status.adminAudit.auditMaxInFlight >= 1_000 ? "pass" : "warn",
      summary: "Audit events should remain durable without unbounded memory pressure.",
    },
    {
      action: "Keep request limits finite and aligned with API worker protection.",
      id: "request_guardrails",
      label: "Request guardrails",
      severity: "critical",
      status: (
        status.requestGuardrails.requestTimeoutMs <= 30_000 &&
        status.requestGuardrails.requestBodyIdleTimeoutMs <= 10_000 &&
        status.requestGuardrails.maxHeaderBytes <= 32 * 1024 &&
        status.requestGuardrails.jsonBodyMaxBytes <= 256 * 1024
      ) ? "pass" : "warn",
      summary: "Workers must reject slow or oversized requests before they consume capacity.",
    },
    {
      action: "If draining is active, remove the instance from load balancing before new work reaches it.",
      id: "lifecycle_drain",
      label: "Lifecycle drain",
      severity: "info",
      status: status.lifecycle.draining ? "warn" : "pass",
      summary: "Graceful shutdown state is visible for safe rolling deployments.",
    },
  ];
}
