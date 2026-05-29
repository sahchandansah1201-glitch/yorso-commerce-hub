import { describe, expect, it } from "vitest";
import { MemoryAuthRepository } from "./repository.js";
import { hashPasswordRecoveryToken } from "./password-recovery.js";
import { PasswordRecoveryCleanupWorker } from "./password-recovery-cleanup.js";

const user = {
  id: "00000000-0000-4000-8000-000000000211",
  email: "cleanup@yorso.test",
  displayName: "Cleanup Buyer",
  passwordSecret: "plain:Password1",
};

const createRecovery = async (
  repository: MemoryAuthRepository,
  options: { expiresAt?: Date; token?: string } = {},
) => {
  const token = options.token ?? "phase2h_cleanup_token_000000000000000001";
  return repository.createPasswordRecovery({
    delivery: {
      destinationHash: "sha256:cleanup-email",
      destinationPreview: "c***@yorso.test",
      recoveryToken: token,
      requestId: "00000000-0000-4000-8000-000000000411",
      templateKey: "password_recovery_email",
    },
    email: user.email,
    expiresAt: options.expiresAt ?? new Date(Date.now() + 30 * 60_000),
    tokenLookupHash: hashPasswordRecoveryToken(token),
    tokenSecret: "sha256:salt:secret",
    userId: user.id,
  });
};

describe("password recovery cleanup policy", () => {
  it("removes expired recovery tokens and their delivery rows in bounded batches", async () => {
    const repository = new MemoryAuthRepository([user]);
    await createRecovery(repository, {
      expiresAt: new Date(Date.now() - 60_000),
      token: "phase2h_expired_token_000000000000000001",
    });
    await createRecovery(repository, {
      expiresAt: new Date(Date.now() + 30 * 60_000),
      token: "phase2h_active_token_0000000000000000001",
    });

    await expect(repository.cleanupPasswordRecovery({
      deliveryUpdatedBefore: new Date(Date.now() - 24 * 60 * 60_000),
      expiredBefore: new Date(),
      limit: 50,
    })).resolves.toEqual({
      deliveriesDeleted: 1,
      recoveriesDeleted: 1,
    });

    await expect(repository.findPasswordRecoveryByTokenHash(
      hashPasswordRecoveryToken("phase2h_expired_token_000000000000000001"),
    )).resolves.toBeNull();
    await expect(repository.findPasswordRecoveryByTokenHash(
      hashPasswordRecoveryToken("phase2h_active_token_0000000000000000001"),
    )).resolves.toMatchObject({ email: user.email });
  });

  it("removes old terminal delivery rows without deleting active recovery tokens", async () => {
    const repository = new MemoryAuthRepository([user]);
    await createRecovery(repository, {
      token: "phase2h_sent_delivery_token_0000000000001",
    });
    const [job] = await repository.leasePasswordRecoveryDeliveryJobs({
      leaseMs: 30_000,
      limit: 1,
      workerId: "cleanup-policy-test",
    });
    await expect(repository.markPasswordRecoveryDeliverySent(job.id)).resolves.toMatchObject({ status: "sent" });

    await expect(repository.cleanupPasswordRecovery({
      deliveryUpdatedBefore: new Date(Date.now() + 60_000),
      expiredBefore: new Date(Date.now() - 60_000),
      limit: 50,
    })).resolves.toEqual({
      deliveriesDeleted: 1,
      recoveriesDeleted: 0,
    });

    await expect(repository.findPasswordRecoveryByTokenHash(
      hashPasswordRecoveryToken("phase2h_sent_delivery_token_0000000000001"),
    )).resolves.toMatchObject({ email: user.email });
  });

  it("computes retention cutoffs through a bounded cleanup worker", async () => {
    const repository = new MemoryAuthRepository([user]);
    await createRecovery(repository, {
      expiresAt: new Date("2026-05-29T11:00:00.000Z"),
      token: "phase2h_worker_expired_token_00000000001",
    });
    const worker = new PasswordRecoveryCleanupWorker(repository, {
      deliveryRetentionMs: 0,
      expiredTokenRetentionMs: 60 * 60_000,
      limit: 25,
      now: () => new Date("2026-05-29T12:30:00.000Z"),
    });

    await expect(worker.runOnce()).resolves.toEqual({
      deliveriesDeleted: 1,
      recoveriesDeleted: 1,
      deliveryUpdatedBefore: "2026-05-29T12:30:00.000Z",
      expiredBefore: "2026-05-29T11:30:00.000Z",
      limit: 25,
    });
  });
});
