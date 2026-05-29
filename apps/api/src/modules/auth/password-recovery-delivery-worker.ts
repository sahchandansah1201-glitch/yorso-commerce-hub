import type {
  AuthRepository,
  PasswordRecoveryDeliveryFailureInput,
  PasswordRecoveryDeliveryJob,
  PasswordRecoveryDeliveryOutboxEntry,
} from "./repository.js";

export interface PasswordRecoveryDeliveryMessage {
  deliveryId: string;
  destination: string;
  destinationPreview: string;
  recoveryId: string;
  recoveryToken: string;
  templateKey: string;
}

export interface PasswordRecoveryDeliverySender {
  send(message: PasswordRecoveryDeliveryMessage): Promise<void>;
}

export interface PasswordRecoveryDeliveryWorkerOptions {
  leaseMs?: number;
  limit?: number;
  retryAfterMs?: number;
  workerId?: string;
}

export interface PasswordRecoveryDeliveryWorkerResult {
  failed: number;
  leased: number;
  requeued: number;
  sent: number;
}

const defaultLeaseMs = 60_000;
const defaultLimit = 25;
const defaultRetryAfterMs = 60_000;
const defaultWorkerId = "password-recovery-delivery-worker";

export class PasswordRecoveryDeliveryWorker {
  constructor(
    private readonly repository: AuthRepository,
    private readonly sender: PasswordRecoveryDeliverySender,
  ) {}

  async processBatch(options: PasswordRecoveryDeliveryWorkerOptions = {}): Promise<PasswordRecoveryDeliveryWorkerResult> {
    const jobs = await this.repository.leasePasswordRecoveryDeliveryJobs({
      leaseMs: options.leaseMs ?? defaultLeaseMs,
      limit: options.limit ?? defaultLimit,
      workerId: options.workerId ?? defaultWorkerId,
    });

    const result: PasswordRecoveryDeliveryWorkerResult = {
      failed: 0,
      leased: jobs.length,
      requeued: 0,
      sent: 0,
    };

    for (const job of jobs) {
      try {
        await this.sender.send(toDeliveryMessage(job));
        const sent = await this.repository.markPasswordRecoveryDeliverySent(job.id);
        if (sent?.status === "sent") result.sent += 1;
      } catch (error) {
        const failed = await this.repository.markPasswordRecoveryDeliveryFailed(job.id, {
          error: sanitizePasswordRecoveryDeliveryError(error),
          retryAfterMs: options.retryAfterMs ?? defaultRetryAfterMs,
        });
        countFailedDelivery(result, failed);
      }
    }

    return result;
  }
}

function toDeliveryMessage(job: PasswordRecoveryDeliveryJob): PasswordRecoveryDeliveryMessage {
  return {
    deliveryId: job.id,
    destination: job.destination,
    destinationPreview: job.destinationPreview,
    recoveryId: job.recoveryId,
    recoveryToken: job.recoveryToken,
    templateKey: job.templateKey,
  };
}

function countFailedDelivery(
  result: PasswordRecoveryDeliveryWorkerResult,
  delivery: PasswordRecoveryDeliveryOutboxEntry | null,
) {
  if (delivery?.status === "queued") {
    result.requeued += 1;
    return;
  }
  result.failed += 1;
}

function sanitizePasswordRecoveryDeliveryError(error: unknown): PasswordRecoveryDeliveryFailureInput["error"] {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[phone]")
    .replace(/\b[A-Za-z0-9._~:-]{32,512}\b/g, "[password-recovery-token]")
    .slice(0, 500);
}
