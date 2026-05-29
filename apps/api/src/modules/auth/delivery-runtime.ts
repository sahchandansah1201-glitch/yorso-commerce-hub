import type { ApiConfig } from "../../config.js";
import type { MetricsRegistry } from "../../metrics.js";
import { RegistrationDeliveryScheduler } from "./delivery-scheduler.js";
import { FileSpoolRegistrationVerificationSender } from "./delivery-sender.js";
import { RegistrationDeliveryWorker, type RegistrationVerificationDeliverySender } from "./delivery-worker.js";
import type { AuthRepository } from "./repository.js";

export interface RegistrationDeliveryRuntimeOptions {
  sender?: RegistrationVerificationDeliverySender;
}

export function createRegistrationDeliveryRuntime(
  config: ApiConfig,
  repository: AuthRepository,
  metricsRegistry: MetricsRegistry,
  options: RegistrationDeliveryRuntimeOptions = {},
) {
  if (!config.registrationDeliveryWorkerEnabled) return null;
  const sender = options.sender ?? createRegistrationVerificationDeliverySender(config);
  const worker = new RegistrationDeliveryWorker(repository, sender);
  return new RegistrationDeliveryScheduler(worker, {
    intervalMs: config.registrationDeliveryWorkerIntervalMs,
    leaseMs: config.registrationDeliveryWorkerLeaseMs,
    limit: config.registrationDeliveryWorkerBatchSize,
    observe: (event) => metricsRegistry.observeRegistrationDeliveryWorker(event),
    retryAfterMs: config.registrationDeliveryWorkerRetryAfterMs,
    workerId: config.registrationDeliveryWorkerId,
  });
}

export function createRegistrationVerificationDeliverySender(config: ApiConfig): RegistrationVerificationDeliverySender {
  if (config.registrationDeliverySender === "file_spool") {
    return new FileSpoolRegistrationVerificationSender({
      spoolDir: config.registrationDeliverySpoolDir,
    });
  }

  throw new Error("Registration delivery sender is disabled.");
}
