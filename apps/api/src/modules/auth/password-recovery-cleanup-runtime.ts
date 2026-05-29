import type { ApiConfig } from "../../config.js";
import type { MetricsRegistry } from "../../metrics.js";
import type { AuthRepository } from "./repository.js";
import { PasswordRecoveryCleanupWorker } from "./password-recovery-cleanup.js";
import { PasswordRecoveryCleanupScheduler } from "./password-recovery-cleanup-scheduler.js";

export function createPasswordRecoveryCleanupRuntime(
  config: ApiConfig,
  repository: AuthRepository,
  metricsRegistry: MetricsRegistry,
) {
  if (!config.passwordRecoveryCleanupWorkerEnabled) return null;
  const worker = new PasswordRecoveryCleanupWorker(repository, {
    deliveryRetentionMs: config.passwordRecoveryCleanupDeliveryRetentionMs,
    expiredTokenRetentionMs: config.passwordRecoveryCleanupTokenRetentionMs,
    limit: config.passwordRecoveryCleanupWorkerBatchSize,
  });
  return new PasswordRecoveryCleanupScheduler(worker, {
    intervalMs: config.passwordRecoveryCleanupWorkerIntervalMs,
    observe: (event) => metricsRegistry.observePasswordRecoveryCleanupWorker(event),
    workerId: config.passwordRecoveryCleanupWorkerId,
  });
}
