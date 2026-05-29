import type { RegistrationDeliveryWorkerOptions, RegistrationDeliveryWorkerResult } from "./delivery-worker.js";

export interface RegistrationDeliveryWorkerRunner {
  processBatch(options?: RegistrationDeliveryWorkerOptions): Promise<RegistrationDeliveryWorkerResult>;
}

export interface RegistrationDeliverySchedulerEvent extends RegistrationDeliveryWorkerResult {
  durationMs: number;
  outcome: "failure" | "skipped" | "success";
  reason: "already_running" | "worker_error" | null;
  workerId: string;
}

export interface RegistrationDeliverySchedulerOptions extends RegistrationDeliveryWorkerOptions {
  intervalMs: number;
  observe?: (event: RegistrationDeliverySchedulerEvent) => void;
}

export class RegistrationDeliveryScheduler {
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly worker: RegistrationDeliveryWorkerRunner,
    private readonly options: RegistrationDeliverySchedulerOptions,
  ) {}

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.options.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async runOnce(): Promise<RegistrationDeliverySchedulerEvent> {
    if (this.running) {
      const skipped = this.event({
        failed: 0,
        leased: 0,
        requeued: 0,
        sent: 0,
      }, 0, "skipped", "already_running");
      this.options.observe?.(skipped);
      return skipped;
    }

    const startedAt = Date.now();
    this.running = true;
    try {
      const result = await this.worker.processBatch({
        leaseMs: this.options.leaseMs,
        limit: this.options.limit,
        retryAfterMs: this.options.retryAfterMs,
        workerId: this.options.workerId,
      });
      const event = this.event(result, Date.now() - startedAt, "success", null);
      this.options.observe?.(event);
      return event;
    } catch {
      const event = this.event({
        failed: 0,
        leased: 0,
        requeued: 0,
        sent: 0,
      }, Date.now() - startedAt, "failure", "worker_error");
      this.options.observe?.(event);
      return event;
    } finally {
      this.running = false;
    }
  }

  snapshot() {
    return {
      intervalMs: this.options.intervalMs,
      running: this.running,
      started: Boolean(this.timer),
      workerId: this.options.workerId ?? "registration-delivery-worker",
    };
  }

  private event(
    result: RegistrationDeliveryWorkerResult,
    durationMs: number,
    outcome: RegistrationDeliverySchedulerEvent["outcome"],
    reason: RegistrationDeliverySchedulerEvent["reason"],
  ): RegistrationDeliverySchedulerEvent {
    return {
      ...result,
      durationMs,
      outcome,
      reason,
      workerId: this.options.workerId ?? "registration-delivery-worker",
    };
  }
}
