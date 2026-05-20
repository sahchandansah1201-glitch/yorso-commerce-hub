import { describe, expect, it } from "vitest";
import type { AdminAuditEvent } from "../../../../../packages/contracts/dist/index.js";
import { PostgresAdminAuditRepository, type AdminAuditQueryClient } from "./postgres-repository.js";
import { encodeAuditCursor, MemoryAdminAuditRepository } from "./repository.js";

const event = (overrides: Partial<AdminAuditEvent>): AdminAuditEvent => ({
  action: "account.company.update",
  actorUserHash: "sha256:111111111111111111111111",
  auditId: "aud_1",
  correlationId: "corr-1",
  httpMethod: "PATCH",
  occurredAt: "2026-05-20T10:00:00.000Z",
  outcome: "success",
  reason: null,
  requestId: "req-1",
  resourceHash: "sha256:222222222222222222222222",
  resourceType: "company_profile",
  route: "/v1/account/company",
  sessionHash: "sha256:333333333333333333333333",
  statusCode: 200,
  ...overrides,
});

describe("admin audit repository", () => {
  it("filters and cursor-paginates memory audit events", async () => {
    const repository = new MemoryAdminAuditRepository([
      event({ auditId: "aud_1", occurredAt: "2026-05-20T10:00:00.000Z", outcome: "success" }),
      event({ auditId: "aud_2", occurredAt: "2026-05-20T10:01:00.000Z", outcome: "blocked" }),
      event({ auditId: "aud_3", occurredAt: "2026-05-20T10:02:00.000Z", outcome: "success", action: "auth.sign_in" }),
    ]);

    const first = await repository.listAuditEvents({ limit: 1, outcome: "success" });

    expect(first.events.map((item) => item.auditId)).toEqual(["aud_3"]);
    expect(first.nextCursor).toEqual(encodeAuditCursor(first.events[0]));

    const second = await repository.listAuditEvents({ limit: 1, outcome: "success", cursor: first.nextCursor! });

    expect(second.events.map((item) => item.auditId)).toEqual(["aud_1"]);
    expect(second.nextCursor).toBeNull();
  });

  it("builds safe parameterized PostgreSQL filters without raw interpolation", async () => {
    const queries: Array<{ sql: string; params: readonly unknown[] | undefined }> = [];
    const client: AdminAuditQueryClient = {
      async query(sql, params) {
        queries.push({ sql, params });
        return {
          rows: [
            {
              action: "account.company.update",
              actor_user_hash: "sha256:111111111111111111111111",
              audit_id: "aud_1",
              correlation_id: "corr-1",
              http_method: "PATCH",
              occurred_at: new Date("2026-05-20T10:00:00.000Z"),
              outcome: "success",
              reason: null,
              request_id: "req-1",
              resource_hash: "sha256:222222222222222222222222",
              resource_type: "company_profile",
              route: "/v1/account/company",
              session_hash: "sha256:333333333333333333333333",
              status_code: 200,
            },
          ],
        };
      },
    };
    const repository = new PostgresAdminAuditRepository(
      { databaseUrl: "postgres://yorso_app:test@localhost:5432/yorso" },
      { client },
    );

    const page = await repository.listAuditEvents({
      action: "account.company.update",
      actorUserHash: "sha256:111111111111111111111111",
      correlationId: "corr-1",
      from: "2026-05-20T00:00:00.000Z",
      limit: 50,
      outcome: "success",
      resourceHash: "sha256:222222222222222222222222",
      resourceType: "company_profile",
      to: "2026-05-21T00:00:00.000Z",
    });

    expect(page.events[0]).toMatchObject({
      auditId: "aud_1",
      action: "account.company.update",
      outcome: "success",
      occurredAt: "2026-05-20T10:00:00.000Z",
    });
    expect(queries[0].sql).toContain("from yorso_api_audit_events");
    expect(queries[0].sql).toContain("action = $1");
    expect(queries[0].sql).toContain("actor_user_hash = $2");
    expect(queries[0].sql).toContain("order by occurred_at desc, audit_id desc");
    expect(queries[0].params).toEqual([
      "account.company.update",
      "sha256:111111111111111111111111",
      "corr-1",
      "success",
      "sha256:222222222222222222222222",
      "company_profile",
      "2026-05-20T00:00:00.000Z",
      "2026-05-21T00:00:00.000Z",
      51,
    ]);
  });
});
