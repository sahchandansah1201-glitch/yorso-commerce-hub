import { afterEach, describe, expect, it, vi } from "vitest";
import { auditHash, buildAuditEvent, MemoryAuditSink, PostgresAuditSink, type AuditQueryClient } from "./audit.js";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("persists sanitized audit envelopes to PostgreSQL", async () => {
    const queries: Array<{ sql: string; params: readonly unknown[] | undefined }> = [];
    const client: AuditQueryClient = {
      async query(sql, params) {
        queries.push({ sql, params });
        return { rows: [] };
      },
    };
    const sink = new PostgresAuditSink(
      {
        auditMaxInFlight: 10,
        databaseUrl: "postgres://yorso_app:test@localhost:5432/yorso",
      },
      { client },
    );
    const event = buildAuditEvent(
      {
        correlationId: "corr-3",
        requestId: "req-3",
        startedAt: Date.now(),
      },
      {
        action: "account.company.update",
        actorUserId: "00000000-0000-4000-8000-000000000001",
        httpMethod: "PATCH",
        outcome: "success",
        resourceId: "company_private_456",
        resourceType: "company_profile",
        route: "/v1/account/company",
        sessionId: "sess_secret_123",
        statusCode: 200,
      },
    );

    await sink.emit(event);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain("insert into yorso_api_audit_events");
    expect(queries[0].sql).toContain("on conflict (audit_id) do nothing");
    expect(queries[0].params?.[0]).toBe(event.auditId);
    expect(queries[0].params?.[9]).toBe(auditHash("00000000-0000-4000-8000-000000000001"));
    expect(queries[0].params?.[10]).toBe(auditHash("sess_secret_123"));
    expect(queries[0].params?.[12]).toBe(auditHash("company_private_456"));
    expect(JSON.parse(String(queries[0].params?.[14]))).toMatchObject({
      type: "api_audit_event",
      action: "account.company.update",
      actorUserHash: auditHash("00000000-0000-4000-8000-000000000001"),
    });
    const serialized = JSON.stringify(queries);
    expect(serialized).not.toContain("00000000-0000-4000-8000-000000000001");
    expect(serialized).not.toContain("sess_secret_123");
    expect(serialized).not.toContain("company_private_456");
  });

  it("drops audit writes under in-flight backpressure without leaking raw identifiers", async () => {
    let releasePendingQuery = () => {};
    const client: AuditQueryClient = {
      async query() {
        return await new Promise((resolve) => {
          releasePendingQuery = () => resolve({ rows: [] });
        });
      },
    };
    const sink = new PostgresAuditSink(
      {
        auditMaxInFlight: 1,
        databaseUrl: "postgres://yorso_app:test@localhost:5432/yorso",
      },
      { client },
    );
    const event = buildAuditEvent(
      {
        correlationId: "corr-4",
        requestId: "req-4",
        startedAt: Date.now(),
      },
      {
        action: "supplier_access.request",
        actorUserId: "00000000-0000-4000-8000-000000000001",
        outcome: "success",
        resourceId: "sup-no-001",
        resourceType: "supplier",
        sessionId: "sess_secret_123",
      },
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const firstWrite = sink.emit(event);
    await sink.emit({
      ...event,
      auditId: `${event.auditId}_dropped`,
      correlationId: "corr-5",
      requestId: "req-5",
    });
    releasePendingQuery();
    await firstWrite;

    const output = errorSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("api_audit_dropped");
    expect(output).toContain("audit_backpressure");
    expect(output).not.toContain("00000000-0000-4000-8000-000000000001");
    expect(output).not.toContain("sess_secret_123");
    expect(output).not.toContain("sup-no-001");
  });
});
