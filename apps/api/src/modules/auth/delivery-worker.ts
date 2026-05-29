import type {
  AuthRepository,
  RegistrationDeliveryJob,
  RegistrationDeliveryOutboxEntry,
} from "./repository.js";

export interface RegistrationVerificationDeliveryMessage {
  channel: RegistrationDeliveryJob["channel"];
  deliveryId: string;
  destination: string;
  destinationPreview: string;
  draftId: string;
  purpose: RegistrationDeliveryJob["purpose"];
  templateKey: string;
  verificationCode: string;
}

export interface RegistrationVerificationDeliverySender {
  send(message: RegistrationVerificationDeliveryMessage): Promise<void>;
}

export interface RegistrationDeliveryWorkerOptions {
  leaseMs?: number;
  limit?: number;
  retryAfterMs?: number;
  workerId?: string;
}

export interface RegistrationDeliveryWorkerResult {
  failed: number;
  leased: number;
  requeued: number;
  sent: number;
}

const defaultLeaseMs = 60_000;
const defaultLimit = 25;
const defaultRetryAfterMs = 60_000;
const defaultWorkerId = "registration-delivery-worker";

export class RegistrationDeliveryWorker {
  constructor(
    private readonly repository: AuthRepository,
    private readonly sender: RegistrationVerificationDeliverySender,
  ) {}

  async processBatch(options: RegistrationDeliveryWorkerOptions = {}): Promise<RegistrationDeliveryWorkerResult> {
    const jobs = await this.repository.leaseRegistrationDeliveryJobs({
      leaseMs: options.leaseMs ?? defaultLeaseMs,
      limit: options.limit ?? defaultLimit,
      workerId: options.workerId ?? defaultWorkerId,
    });

    const result: RegistrationDeliveryWorkerResult = {
      failed: 0,
      leased: jobs.length,
      requeued: 0,
      sent: 0,
    };

    for (const job of jobs) {
      try {
        await this.sender.send(toDeliveryMessage(job));
        const sent = await this.repository.markRegistrationDeliverySent(job.id);
        if (sent?.status === "sent") result.sent += 1;
      } catch (error) {
        const failed = await this.repository.markRegistrationDeliveryFailed(job.id, {
          error: sanitizeDeliveryError(error),
          retryAfterMs: options.retryAfterMs ?? defaultRetryAfterMs,
        });
        countFailedDelivery(result, failed);
      }
    }

    return result;
  }
}

function toDeliveryMessage(job: RegistrationDeliveryJob): RegistrationVerificationDeliveryMessage {
  return {
    channel: job.channel,
    deliveryId: job.id,
    destination: job.destination,
    destinationPreview: job.destinationPreview,
    draftId: job.draftId,
    purpose: job.purpose,
    templateKey: job.templateKey,
    verificationCode: job.verificationCode,
  };
}

function countFailedDelivery(
  result: RegistrationDeliveryWorkerResult,
  delivery: RegistrationDeliveryOutboxEntry | null,
) {
  if (delivery?.status === "queued") {
    result.requeued += 1;
    return;
  }
  result.failed += 1;
}

function sanitizeDeliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[phone]")
    .replace(/\b\d{4,8}\b/g, "[verification-code]")
    .slice(0, 500);
}
