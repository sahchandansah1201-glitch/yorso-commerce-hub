import type {
  PasswordRecoveryDeliveryWorkerOptions,
  PasswordRecoveryDeliveryWorkerResult,
} from "./password-recovery-delivery-worker.js";

export interface PasswordRecoveryDeliveryWorkerRunner {
  processBatch(options?: PasswordRecoveryDeliveryWorkerOptions): Promise<PasswordRecoveryDeliveryWorkerResult>;
}

export interface PasswordRecoveryDeliverySchedulerEvent extends PasswordRecoveryDeliveryWorkerResult {
  durationMs: number;
  outcome: "failure" | "skipped" | "success";
  reason: "already_running" | "worker_error" | null;
  workerId: string;
}

export interface PasswordRecoveryDeliverySchedulerOptions extends PasswordRecoveryDeliveryWorkerOptions {
  intervalMs: number;
  observe?: (event: PasswordRecoveryDeliverySchedulerEvent) => void;
}

export class PasswordRecoveryDeliveryScheduler {
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly worker: PasswordRecoveryDeliveryWorkerRunner,
    private readonly options: PasswordRecoveryDeliverySchedulerOptions,
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

  async runOnce(): Promise<PasswordRecoveryDeliverySchedulerEvent> {
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
      workerId: this.options.workerId ?? "password-recovery-delivery-worker",
    };
  }

  private event(
    result: PasswordRecoveryDeliveryWorkerResult,
    durationMs: number,
    outcome: PasswordRecoveryDeliverySchedulerEvent["outcome"],
    reason: PasswordRecoveryDeliverySchedulerEvent["reason"],
  ): PasswordRecoveryDeliverySchedulerEvent {
    return {
      ...result,
      durationMs,
      outcome,
      reason,
      workerId: this.options.workerId ?? "password-recovery-delivery-worker",
    };
  }
}
