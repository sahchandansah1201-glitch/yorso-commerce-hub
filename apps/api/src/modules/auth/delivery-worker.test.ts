import { describe, expect, it } from "vitest";
import { RegistrationDeliveryWorker, type RegistrationVerificationDeliveryMessage } from "./delivery-worker.js";
import type { AuthRepository, RegistrationDeliveryFailureInput } from "./repository.js";
import { MemoryAuthRepository } from "./repository.js";

const startRegistration = async (repository: MemoryAuthRepository) => {
  return repository.startRegistrationDraft({
    delivery: {
      channel: "email",
      destinationHash: "sha256:email",
      destinationPreview: "b***@yorso.test",
      purpose: "email_verification",
      requestId: "00000000-0000-4000-8000-000000000301",
      templateKey: "registration_email_verification",
      verificationCode: "418293",
    },
    email: "buyer@yorso.test",
    emailCodeExpiresAt: new Date(Date.now() + 300_000),
    emailCodeSecret: "plain:418293",
    expiresAt: new Date(Date.now() + 60_000),
    role: "buyer",
  });
};

const startExpiredRegistration = async (repository: MemoryAuthRepository) => {
  return repository.startRegistrationDraft({
    delivery: {
      channel: "email",
      destinationHash: "sha256:expired-email",
      destinationPreview: "e***@yorso.test",
      purpose: "email_verification",
      requestId: "00000000-0000-4000-8000-000000000303",
      templateKey: "registration_email_verification",
      verificationCode: "629104",
    },
    email: "expired@yorso.test",
    emailCodeExpiresAt: new Date(Date.now() + 300_000),
    emailCodeSecret: "plain:629104",
    expiresAt: new Date(Date.now() - 60_000),
    role: "buyer",
  });
};

describe("registration delivery worker", () => {
  it("leases queued delivery jobs and marks successful sends as sent", async () => {
    const repository = new MemoryAuthRepository();
    await startRegistration(repository);
    const messages: RegistrationVerificationDeliveryMessage[] = [];
    const worker = new RegistrationDeliveryWorker(repository, {
      async send(message) {
        messages.push(message);
      },
    });

    const result = await worker.processBatch({
      leaseMs: 30_000,
      limit: 5,
      workerId: "worker-test",
    });

    expect(result).toEqual({
      failed: 0,
      leased: 1,
      requeued: 0,
      sent: 1,
    });
    expect(messages).toEqual([
      expect.objectContaining({
        channel: "email",
        destination: "buyer@yorso.test",
        destinationPreview: "b***@yorso.test",
        purpose: "email_verification",
        templateKey: "registration_email_verification",
        verificationCode: "418293",
      }),
    ]);
    await expect(worker.processBatch({ limit: 5 })).resolves.toMatchObject({ leased: 0 });
  });

  it("requeues failed delivery until the retry budget is exhausted", async () => {
    const repository = new MemoryAuthRepository();
    await startRegistration(repository);
    const worker = new RegistrationDeliveryWorker(repository, {
      async send() {
        throw new Error("SMTP failed for buyer@yorso.test and +34600000000");
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

  it("redacts verification codes from persisted delivery errors", async () => {
    const capturedFailures: RegistrationDeliveryFailureInput[] = [];
    const repository = {
      async leaseRegistrationDeliveryJobs() {
        return [{
          attemptCount: 0,
          availableAt: new Date().toISOString(),
          channel: "email",
          createdAt: new Date().toISOString(),
          destination: "buyer@yorso.test",
          destinationPreview: "b***@yorso.test",
          draftId: "draft-registration-redaction",
          id: "00000000-0000-4000-8000-000000000799",
          lockedAt: null,
          lockedBy: null,
          maxAttempts: 5,
          purpose: "email_verification",
          status: "leased",
          templateKey: "registration_email_verification",
          updatedAt: new Date().toISOString(),
          verificationCode: "418293",
        }];
      },
      async markRegistrationDeliveryFailed(_deliveryId: string, input: RegistrationDeliveryFailureInput) {
        capturedFailures.push(input);
        return {
          attemptCount: 1,
          availableAt: new Date().toISOString(),
          channel: "email",
          createdAt: new Date().toISOString(),
          destinationPreview: "b***@yorso.test",
          draftId: "draft-registration-redaction",
          id: "00000000-0000-4000-8000-000000000799",
          lockedAt: null,
          lockedBy: null,
          maxAttempts: 5,
          purpose: "email_verification",
          status: "queued",
          templateKey: "registration_email_verification",
          updatedAt: new Date().toISOString(),
        };
      },
    } as Pick<AuthRepository, "leaseRegistrationDeliveryJobs" | "markRegistrationDeliveryFailed"> as AuthRepository;
    const worker = new RegistrationDeliveryWorker(repository, {
      async send() {
        throw new Error("SMTP failed for buyer@yorso.test with code 418293 and phone +34600000000");
      },
    });

    await expect(worker.processBatch({ retryAfterMs: 0 })).resolves.toMatchObject({ requeued: 1 });

    expect(capturedFailures[0].error).toContain("[email]");
    expect(capturedFailures[0].error).toContain("[phone]");
    expect(capturedFailures[0].error).toContain("[verification-code]");
    expect(capturedFailures[0].error).not.toContain("buyer@yorso.test");
    expect(capturedFailures[0].error).not.toContain("+34600000000");
    expect(capturedFailures[0].error).not.toContain("418293");
  });

  it("does not lease delivery jobs for expired registration drafts", async () => {
    const repository = new MemoryAuthRepository();
    await startExpiredRegistration(repository);
    const messages: RegistrationVerificationDeliveryMessage[] = [];
    const worker = new RegistrationDeliveryWorker(repository, {
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

  it("leases phone verification jobs with the selected channel and masked destination", async () => {
    const repository = new MemoryAuthRepository();
    const start = await startRegistration(repository);
    await repository.recordRegistrationPhoneRequest(start.draft.id, {
      delivery: {
        channel: "whatsapp",
        destinationHash: "sha256:phone",
        destinationPreview: "***00",
        purpose: "phone_verification",
        requestId: "00000000-0000-4000-8000-000000000302",
        templateKey: "registration_whatsapp_verification",
        verificationCode: "539012",
      },
      method: "whatsapp",
      phone: "+34600000000",
      phoneCodeExpiresAt: new Date(Date.now() + 300_000),
      phoneCodeSecret: "plain:539012",
      sessionId: start.draft.id,
    });
    const messages: RegistrationVerificationDeliveryMessage[] = [];
    const worker = new RegistrationDeliveryWorker(repository, {
      async send(message) {
        messages.push(message);
      },
    });

    await expect(worker.processBatch({ limit: 5 })).resolves.toMatchObject({
      leased: 2,
      sent: 2,
    });
    expect(messages).toContainEqual(expect.objectContaining({
      channel: "whatsapp",
      destination: "+34600000000",
      destinationPreview: "***00",
      purpose: "phone_verification",
      templateKey: "registration_whatsapp_verification",
      verificationCode: "539012",
    }));
  });
});
