import type { ApiConfig } from "../../config.js";
import type { MetricsRegistry } from "../../metrics.js";
import type { AuthRepository } from "./repository.js";
import { PasswordRecoveryDeliveryScheduler } from "./password-recovery-delivery-scheduler.js";
import { FileSpoolPasswordRecoverySender } from "./password-recovery-delivery-sender.js";
import {
  PasswordRecoveryDeliveryWorker,
  type PasswordRecoveryDeliverySender,
} from "./password-recovery-delivery-worker.js";

export interface PasswordRecoveryDeliveryRuntimeOptions {
  sender?: PasswordRecoveryDeliverySender;
}

export function createPasswordRecoveryDeliveryRuntime(
  config: ApiConfig,
  repository: AuthRepository,
  metricsRegistry: MetricsRegistry,
  options: PasswordRecoveryDeliveryRuntimeOptions = {},
) {
  if (!config.passwordRecoveryDeliveryWorkerEnabled) return null;
  const sender = options.sender ?? createPasswordRecoveryDeliverySender(config);
  const worker = new PasswordRecoveryDeliveryWorker(repository, sender);
  return new PasswordRecoveryDeliveryScheduler(worker, {
    intervalMs: config.passwordRecoveryDeliveryWorkerIntervalMs,
    leaseMs: config.passwordRecoveryDeliveryWorkerLeaseMs,
    limit: config.passwordRecoveryDeliveryWorkerBatchSize,
    observe: (event) => metricsRegistry.observePasswordRecoveryDeliveryWorker(event),
    retryAfterMs: config.passwordRecoveryDeliveryWorkerRetryAfterMs,
    workerId: config.passwordRecoveryDeliveryWorkerId,
  });
}

export function createPasswordRecoveryDeliverySender(config: ApiConfig): PasswordRecoveryDeliverySender {
  if (config.passwordRecoveryDeliverySender === "file_spool") {
    return new FileSpoolPasswordRecoverySender({
      publicAppUrl: config.publicAppUrl,
      spoolDir: config.passwordRecoveryDeliverySpoolDir,
    });
  }

  throw new Error("Password recovery delivery sender is disabled.");
}
