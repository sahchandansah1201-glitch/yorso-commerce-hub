import { describe, expect, it } from "vitest";
import { auditHash, buildAuditEvent, MemoryAuditSink } from "./audit.js";

describe("API audit trail", () => {
  it("hashes actor, session and resource identifiers", async () => {
    const sink = new MemoryAuditSink();
    const event = buildAuditEvent(
      {
        correlationId: "corr-1",
        requestId: "req-1",
        startedAt: Date.now(),
      },
      {
        action: "account.company.update",
        actorUserId: "00000000-0000-4000-8000-000000000001",
        sessionId: "sess_secret_123",
        resourceType: "company_profile",
        resourceId: "company_private_456",
        outcome: "success",
        route: "/v1/account/company",
        httpMethod: "PATCH",
      },
    );

    await sink.emit(event);
    const serialized = JSON.stringify(sink.events);

    expect(sink.events).toHaveLength(1);
    expect(sink.events[0]).toMatchObject({
      type: "api_audit_event",
      schemaVersion: 1,
      service: "yorso-api",
      component: "audit",
      action: "account.company.update",
      outcome: "success",
      actorUserHash: auditHash("00000000-0000-4000-8000-000000000001"),
      sessionHash: auditHash("sess_secret_123"),
      resourceHash: auditHash("company_private_456"),
    });
    expect(serialized).not.toContain("00000000-0000-4000-8000-000000000001");
    expect(serialized).not.toContain("sess_secret_123");
    expect(serialized).not.toContain("company_private_456");
  });

  it("sanitizes reason values before writing structured audit events", () => {
    const event = buildAuditEvent(
      {
        correlationId: "corr-2",
        requestId: "req-2",
        startedAt: Date.now(),
      },
      {
        action: "auth.sign_in",
        outcome: "blocked",
        reason: "auth rate limited because of bad@example.com",
      },
    );

    expect(event.reason).toBe("auth_rate_limited_because_of_bad_example.com");
    expect(JSON.stringify(event)).not.toContain("bad@example.com");
  });
});
