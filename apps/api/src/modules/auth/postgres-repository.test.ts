import { describe, expect, it } from "vitest";
import { PostgresAuthRepository, type AuthQueryClient } from "./postgres-repository.js";

const config = {
  databaseUrl: "postgres://yorso.test/yorso",
  registrationVerificationCodeSecret: "test-registration-code-secret-32-bytes",
};

class CapturingAuthQueryClient implements AuthQueryClient {
  public readonly sql: string[] = [];

  async query<Row extends Record<string, unknown> = Record<string, unknown>>(sql: string) {
    this.sql.push(sql);
    return { rows: [] as Row[] };
  }
}

describe("PostgresAuthRepository SQL", () => {
  it("keeps registration phone request insert returning columns unqualified", async () => {
    const client = new CapturingAuthQueryClient();
    const repository = new PostgresAuthRepository(config, { client });

    await expect(
      repository.recordRegistrationPhoneRequest("registration-session-id", {
        delivery: {
          channel: "sms",
          destinationHash: "sha256:phone",
          destinationPreview: "***00",
          purpose: "phone_verification",
          requestId: "00000000-0000-4000-8000-000000000301",
          templateKey: "registration_sms_verification",
          verificationCode: "539012",
        },
        method: "sms",
        phone: "+34600000000",
        phoneCodeExpiresAt: new Date("2026-08-21T12:00:00.000Z"),
        phoneCodeSecret: "plain:539012",
        sessionId: "registration-session-id",
      }),
    ).rejects.toThrow("registration_session_invalid");

    const [sql] = client.sql;
    expect(sql).toContain("insert into yorso_registration_delivery_outbox");
    expect(sql).toMatch(/returning\s+id::text as delivery_id/i);
    expect(sql).not.toMatch(/returning\s+outbox\.id::text as delivery_id/i);
  });

  it("qualifies registration delivery lease returning columns against the updated outbox row", async () => {
    const client = new CapturingAuthQueryClient();
    const repository = new PostgresAuthRepository(config, { client });

    await repository.leaseRegistrationDeliveryJobs({
      leaseMs: 30_000,
      limit: 10,
      workerId: "registration-delivery-test",
    });

    const [sql] = client.sql;
    expect(sql).toContain("update yorso_registration_delivery_outbox outbox");
    expect(sql).toContain("from candidates");
    expect(sql).toContain("outbox.id::text as delivery_id");
    expect(sql).toContain("outbox.draft_id as delivery_draft_id");
    expect(sql).not.toMatch(/returning\s+id::text as delivery_id/i);
  });

  it("qualifies password recovery delivery lease returning columns against the updated outbox row", async () => {
    const client = new CapturingAuthQueryClient();
    const repository = new PostgresAuthRepository(config, { client });

    await repository.leasePasswordRecoveryDeliveryJobs({
      leaseMs: 30_000,
      limit: 10,
      workerId: "password-recovery-delivery-test",
    });

    const [sql] = client.sql;
    expect(sql).toContain("update yorso_auth_password_recovery_outbox outbox");
    expect(sql).toContain("from candidates");
    expect(sql).toContain("outbox.id::text as delivery_id");
    expect(sql).toContain("outbox.recovery_id::text as delivery_recovery_id");
    expect(sql).not.toMatch(/returning\s+id::text as delivery_id/i);
  });
});
