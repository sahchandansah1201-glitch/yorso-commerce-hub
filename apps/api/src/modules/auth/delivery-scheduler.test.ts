import { describe, expect, it } from "vitest";
import {
  RegistrationDeliveryScheduler,
  type RegistrationDeliverySchedulerEvent,
  type RegistrationDeliveryWorkerRunner,
} from "./delivery-scheduler.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, reject, resolve };
}

describe("registration delivery scheduler", () => {
  it("runs bounded worker batches and emits scheduler metrics", async () => {
    const events: RegistrationDeliverySchedulerEvent[] = [];
    const worker: RegistrationDeliveryWorkerRunner = {
      async processBatch(options) {
        expect(options).toMatchObject({
          leaseMs: 45_000,
          limit: 10,
          retryAfterMs: 120_000,
          workerId: "worker-phase-2d",
        });
        return {
          failed: 0,
          leased: 3,
          requeued: 1,
          sent: 2,
        };
      },
    };
    const scheduler = new RegistrationDeliveryScheduler(worker, {
      intervalMs: 5_000,
      leaseMs: 45_000,
      limit: 10,
      observe: (event) => events.push(event),
      retryAfterMs: 120_000,
      workerId: "worker-phase-2d",
    });

    await expect(scheduler.runOnce()).resolves.toMatchObject({
      outcome: "success",
      failed: 0,
      leased: 3,
      requeued: 1,
      sent: 2,
    });
    expect(events).toEqual([
      expect.objectContaining({
        failed: 0,
        leased: 3,
        outcome: "success",
        requeued: 1,
        sent: 2,
        workerId: "worker-phase-2d",
      }),
    ]);
  });

  it("does not overlap worker batches when a previous run is still active", async () => {
    const firstRun = deferred<Awaited<ReturnType<RegistrationDeliveryWorkerRunner["processBatch"]>>>();
    let calls = 0;
    const worker: RegistrationDeliveryWorkerRunner = {
      async processBatch() {
        calls += 1;
        return firstRun.promise;
      },
    };
    const scheduler = new RegistrationDeliveryScheduler(worker, {
      intervalMs: 5_000,
      workerId: "worker-no-overlap",
    });

    const first = scheduler.runOnce();
    await expect(scheduler.runOnce()).resolves.toMatchObject({
      outcome: "skipped",
      reason: "already_running",
    });
    firstRun.resolve({
      failed: 0,
      leased: 0,
      requeued: 0,
      sent: 0,
    });
    await expect(first).resolves.toMatchObject({ outcome: "success" });
    expect(calls).toBe(1);
  });

  it("captures worker failures without crashing the scheduler", async () => {
    const events: RegistrationDeliverySchedulerEvent[] = [];
    const worker: RegistrationDeliveryWorkerRunner = {
      async processBatch() {
        throw new Error("file spool unavailable for buyer@yorso.test");
      },
    };
    const scheduler = new RegistrationDeliveryScheduler(worker, {
      intervalMs: 5_000,
      observe: (event) => events.push(event),
      workerId: "worker-failure",
    });

    await expect(scheduler.runOnce()).resolves.toMatchObject({
      outcome: "failure",
      reason: "worker_error",
    });
    expect(events).toEqual([
      expect.objectContaining({
        failed: 0,
        leased: 0,
        outcome: "failure",
        reason: "worker_error",
        sent: 0,
      }),
    ]);
    expect(JSON.stringify(events)).not.toContain("buyer@yorso.test");
  });
});
