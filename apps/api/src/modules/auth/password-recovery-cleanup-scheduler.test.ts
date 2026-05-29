import { describe, expect, it } from "vitest";
import {
  PasswordRecoveryCleanupScheduler,
  type PasswordRecoveryCleanupWorkerRunner,
} from "./password-recovery-cleanup-scheduler.js";

describe("password recovery cleanup scheduler", () => {
  it("runs cleanup once and emits sanitized counts", async () => {
    const events: unknown[] = [];
    const worker: PasswordRecoveryCleanupWorkerRunner = {
      async runOnce() {
        return {
          deliveriesDeleted: 3,
          deliveryUpdatedBefore: "2026-05-22T00:00:00.000Z",
          expiredBefore: "2026-05-28T00:00:00.000Z",
          limit: 50,
          recoveriesDeleted: 2,
        };
      },
    };

    const scheduler = new PasswordRecoveryCleanupScheduler(worker, {
      intervalMs: 5_000,
      observe: (event) => events.push(event),
      workerId: "cleanup-scheduler-test",
    });

    await expect(scheduler.runOnce()).resolves.toMatchObject({
      deliveriesDeleted: 3,
      limit: 50,
      outcome: "success",
      reason: null,
      recoveriesDeleted: 2,
      workerId: "cleanup-scheduler-test",
    });
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("buyer@example.com");
    expect(JSON.stringify(events)).not.toContain("phase2i");
  });

  it("skips overlapping cleanup runs", async () => {
    let release!: () => void;
    const worker: PasswordRecoveryCleanupWorkerRunner = {
      async runOnce() {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return {
          deliveriesDeleted: 0,
          deliveryUpdatedBefore: "2026-05-22T00:00:00.000Z",
          expiredBefore: "2026-05-28T00:00:00.000Z",
          limit: 25,
          recoveriesDeleted: 0,
        };
      },
    };
    const scheduler = new PasswordRecoveryCleanupScheduler(worker, {
      intervalMs: 5_000,
      workerId: "cleanup-scheduler-test",
    });

    const running = scheduler.runOnce();
    await expect(scheduler.runOnce()).resolves.toMatchObject({
      deliveriesDeleted: 0,
      outcome: "skipped",
      reason: "already_running",
      recoveriesDeleted: 0,
    });
    release();
    await expect(running).resolves.toMatchObject({ outcome: "success" });
  });

  it("turns worker failures into scheduler events", async () => {
    const worker: PasswordRecoveryCleanupWorkerRunner = {
      async runOnce() {
        throw new Error("database unavailable for buyer@example.com");
      },
    };
    const scheduler = new PasswordRecoveryCleanupScheduler(worker, {
      intervalMs: 5_000,
      workerId: "cleanup-scheduler-test",
    });

    await expect(scheduler.runOnce()).resolves.toMatchObject({
      deliveriesDeleted: 0,
      outcome: "failure",
      reason: "worker_error",
      recoveriesDeleted: 0,
      workerId: "cleanup-scheduler-test",
    });
  });
});
