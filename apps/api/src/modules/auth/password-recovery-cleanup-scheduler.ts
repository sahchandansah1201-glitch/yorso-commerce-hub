import type { PasswordRecoveryCleanupRunResult } from "./password-recovery-cleanup.js";

export interface PasswordRecoveryCleanupWorkerRunner {
  runOnce(): Promise<PasswordRecoveryCleanupRunResult>;
}

export interface PasswordRecoveryCleanupSchedulerEvent extends PasswordRecoveryCleanupRunResult {
  durationMs: number;
  outcome: "failure" | "skipped" | "success";
  reason: "already_running" | "worker_error" | null;
  workerId: string;
}

export interface PasswordRecoveryCleanupSchedulerOptions {
  intervalMs: number;
  observe?: (event: PasswordRecoveryCleanupSchedulerEvent) => void;
  workerId?: string;
}

const defaultWorkerId = "password-recovery-cleanup-worker";
const emptyCleanupRun = {
  deliveriesDeleted: 0,
  deliveryUpdatedBefore: "",
  expiredBefore: "",
  limit: 0,
  recoveriesDeleted: 0,
};

export class PasswordRecoveryCleanupScheduler {
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly worker: PasswordRecoveryCleanupWorkerRunner,
    private readonly options: PasswordRecoveryCleanupSchedulerOptions,
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

  async runOnce(): Promise<PasswordRecoveryCleanupSchedulerEvent> {
    if (this.running) {
      const skipped = this.event(emptyCleanupRun, 0, "skipped", "already_running");
      this.options.observe?.(skipped);
      return skipped;
    }

    const startedAt = Date.now();
    this.running = true;
    try {
      const result = await this.worker.runOnce();
      const event = this.event(result, Date.now() - startedAt, "success", null);
      this.options.observe?.(event);
      return event;
    } catch {
      const event = this.event(emptyCleanupRun, Date.now() - startedAt, "failure", "worker_error");
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
      workerId: this.options.workerId ?? defaultWorkerId,
    };
  }

  private event(
    result: PasswordRecoveryCleanupRunResult,
    durationMs: number,
    outcome: PasswordRecoveryCleanupSchedulerEvent["outcome"],
    reason: PasswordRecoveryCleanupSchedulerEvent["reason"],
  ): PasswordRecoveryCleanupSchedulerEvent {
    return {
      ...result,
      durationMs,
      outcome,
      reason,
      workerId: this.options.workerId ?? defaultWorkerId,
    };
  }
}
