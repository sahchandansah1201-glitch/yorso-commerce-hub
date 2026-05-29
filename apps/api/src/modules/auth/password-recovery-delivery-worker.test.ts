import { describe, expect, it } from "vitest";
import {
  PasswordRecoveryDeliveryWorker,
  type PasswordRecoveryDeliveryMessage,
} from "./password-recovery-delivery-worker.js";
import type { AuthRepository, PasswordRecoveryDeliveryFailureInput } from "./repository.js";
import { MemoryAuthRepository } from "./repository.js";
import { hashPasswordRecoveryToken } from "./password-recovery.js";

const user = {
  id: "00000000-0000-4000-8000-000000000201",
  email: "recovery@yorso.test",
  displayName: "Recovery Buyer",
  passwordSecret: "plain:Password1",
};

const createRecovery = async (
  repository: MemoryAuthRepository,
  options: { expiresAt?: Date; token?: string } = {},
) => {
  const token = options.token ?? "abcdefghijklmnopqrstuvwxyzABCDEF123456";
  return repository.createPasswordRecovery({
    delivery: {
      destinationHash: "sha256:recovery-email",
      destinationPreview: "r***@yorso.test",
      recoveryToken: token,
      requestId: "00000000-0000-4000-8000-000000000401",
      templateKey: "password_recovery_email",
    },
    email: user.email,
    expiresAt: options.expiresAt ?? new Date(Date.now() + 30 * 60_000),
    tokenLookupHash: hashPasswordRecoveryToken(token),
    tokenSecret: "sha256:salt:secret",
    userId: user.id,
  });
};

describe("password recovery delivery worker", () => {
  it("leases queued recovery jobs and marks successful sends as sent", async () => {
    const repository = new MemoryAuthRepository([user]);
    await createRecovery(repository);
    const messages: PasswordRecoveryDeliveryMessage[] = [];
    const worker = new PasswordRecoveryDeliveryWorker(repository, {
      async send(message) {
        messages.push(message);
      },
    });

    const result = await worker.processBatch({
      leaseMs: 30_000,
      limit: 5,
      workerId: "password-recovery-worker-test",
    });

    expect(result).toEqual({
      failed: 0,
      leased: 1,
      requeued: 0,
      sent: 1,
    });
    expect(messages).toEqual([
      expect.objectContaining({
        destination: "recovery@yorso.test",
        destinationPreview: "r***@yorso.test",
        recoveryToken: "abcdefghijklmnopqrstuvwxyzABCDEF123456",
        templateKey: "password_recovery_email",
      }),
    ]);
    await expect(worker.processBatch({ limit: 5 })).resolves.toMatchObject({ leased: 0 });
  });

  it("requeues failed delivery until the retry budget is exhausted", async () => {
    const repository = new MemoryAuthRepository([user]);
    await createRecovery(repository);
    const worker = new PasswordRecoveryDeliveryWorker(repository, {
      async send() {
        throw new Error("SMTP failed for recovery@yorso.test with token abcdefghijklmnopqrstuvwxyzABCDEF123456");
      },
    });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(worker.processBatch({ retryAfterMs: 0 })).resolves.toMatchObject({
        failed: 0,
        leased: 1,
        requeued: 1,
        sent: 0,
      });
    }
    await expect(worker.processBatch({ retryAfterMs: 0 })).resolves.toMatchObject({
      failed: 1,
      leased: 1,
      requeued: 0,
      sent: 0,
    });
    await expect(worker.processBatch({ retryAfterMs: 0 })).resolves.toMatchObject({ leased: 0 });
  });

  it("redacts reset tokens and destinations from persisted delivery errors", async () => {
    const capturedFailures: PasswordRecoveryDeliveryFailureInput[] = [];
    const repository = {
      async leasePasswordRecoveryDeliveryJobs() {
        return [{
          attemptCount: 0,
          availableAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          destination: "recovery@yorso.test",
          destinationPreview: "r***@yorso.test",
          id: "00000000-0000-4000-8000-000000000499",
          lockedAt: new Date().toISOString(),
          lockedBy: "password-recovery-redaction-test",
          maxAttempts: 5,
          recoveryId: "00000000-0000-4000-8000-000000000498",
          recoveryToken: "abcdefghijklmnopqrstuvwxyzABCDEF123456",
          status: "leased",
          templateKey: "password_recovery_email",
          updatedAt: new Date().toISOString(),
        }];
      },
      async markPasswordRecoveryDeliveryFailed(_deliveryId: string, input: PasswordRecoveryDeliveryFailureInput) {
        capturedFailures.push(input);
        return {
          attemptCount: 1,
          availableAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          destinationPreview: "r***@yorso.test",
          id: "00000000-0000-4000-8000-000000000499",
          lockedAt: null,
          lockedBy: null,
          maxAttempts: 5,
          recoveryId: "00000000-0000-4000-8000-000000000498",
          status: "queued",
          templateKey: "password_recovery_email",
          updatedAt: new Date().toISOString(),
        };
      },
    } as Pick<AuthRepository, "leasePasswordRecoveryDeliveryJobs" | "markPasswordRecoveryDeliveryFailed"> as AuthRepository;
    const worker = new PasswordRecoveryDeliveryWorker(repository, {
      async send() {
        throw new Error("SMTP failed for recovery@yorso.test token abcdefghijklmnopqrstuvwxyzABCDEF123456 phone +34600000000");
      },
    });

    await expect(worker.processBatch({ retryAfterMs: 0 })).resolves.toMatchObject({ requeued: 1 });

    expect(capturedFailures[0].error).toContain("[email]");
    expect(capturedFailures[0].error).toContain("[phone]");
    expect(capturedFailures[0].error).toContain("[password-recovery-token]");
    expect(capturedFailures[0].error).not.toContain("recovery@yorso.test");
    expect(capturedFailures[0].error).not.toContain("+34600000000");
    expect(capturedFailures[0].error).not.toContain("abcdefghijklmnopqrstuvwxyzABCDEF123456");
  });

  it("does not lease expired or already used recovery tokens", async () => {
    const repository = new MemoryAuthRepository([user]);
    await createRecovery(repository, { expiresAt: new Date(Date.now() - 60_000) });
    const messages: PasswordRecoveryDeliveryMessage[] = [];
    const worker = new PasswordRecoveryDeliveryWorker(repository, {
      async send(message) {
        messages.push(message);
      },
    });

    await expect(worker.processBatch({ limit: 5 })).resolves.toEqual({
      failed: 0,
      leased: 0,
      requeued: 0,
      sent: 0,
    });
    expect(messages).toEqual([]);
  });
});
