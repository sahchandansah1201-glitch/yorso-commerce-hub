import {
  adminRuntimeStatusSchema,
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
        supabaseProductionBackend: false,
        hostedBaasProductionBackend: false,
        prototypeSupabaseConfigured: Boolean(this.config.supabaseUrl || this.config.supabasePublishableKey),
        secretsIncluded: false,
      },
    });
  }
}
