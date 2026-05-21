import { describe, expect, it } from "vitest";
import { PostgresAdminIncidentRepository, type AdminIncidentQueryClient } from "./postgres-repository.js";
import { MemoryAdminIncidentRepository } from "./repository.js";

describe("admin incident repository", () => {
  it("stores and updates memory acknowledgements", async () => {
    const repository = new MemoryAdminIncidentRepository();

    await expect(repository.getAcknowledgement("runtime:session_cache")).resolves.toBeNull();
    const acknowledged = await repository.upsertAcknowledgement({
      acknowledgedByUserId: "00000000-0000-4000-8000-000000000090",
      incidentId: "runtime:session_cache",
      note: "Checking Redis session cache.",
      status: "acknowledged",
    });

    expect(acknowledged).toMatchObject({
      incidentId: "runtime:session_cache",
      note: "Checking Redis session cache.",
      status: "acknowledged",
    });
    await expect(repository.listAcknowledgements(["runtime:session_cache", "missing"]))
      .resolves.toEqual(new Map([["runtime:session_cache", acknowledged]]));

    const resolved = await repository.upsertAcknowledgement({
      acknowledgedByUserId: "00000000-0000-4000-8000-000000000090",
      incidentId: "runtime:session_cache",
      note: "Resolved.",
      status: "resolved",
    });

    expect(resolved.status).toBe("resolved");
    expect(resolved.acknowledgedAt).toBe(acknowledged.acknowledgedAt);
  });

  it("uses parameterized PostgreSQL acknowledgement reads and upserts", async () => {
    const queries: Array<{ sql: string; params: readonly unknown[] | undefined }> = [];
    const client: AdminIncidentQueryClient = {
      async query(sql, params) {
        queries.push({ sql, params });
        return {
          rows: [
            {
              acknowledged_at: new Date("2026-05-20T10:00:00.000Z"),
              acknowledged_by_user_id: "00000000-0000-4000-8000-000000000090",
              assigned_at: null,
              assigned_to_user_id: null,
              escalated_at: null,
              escalation_level: "none",
              incident_id: "audit:admin-blocked:v1-admin-audit-events",
              note: "Checking incident.",
              resolved_at: null,
              status: "acknowledged",
              updated_at: new Date("2026-05-20T10:01:00.000Z"),
            },
          ],
        };
      },
    };
    const repository = new PostgresAdminIncidentRepository(
      { databaseUrl: "postgres://yorso_app:test@localhost:5432/yorso" },
      { client },
    );

    await expect(repository.getAcknowledgement("audit:admin-blocked:v1-admin-audit-events"))
      .resolves.toMatchObject({ status: "acknowledged" });
    await expect(repository.listAcknowledgements(["audit:admin-blocked:v1-admin-audit-events"]))
      .resolves.toBeInstanceOf(Map);
    await expect(repository.upsertAcknowledgement({
      acknowledgedByUserId: "00000000-0000-4000-8000-000000000090",
      incidentId: "audit:admin-blocked:v1-admin-audit-events",
      note: "Checking incident.",
      status: "acknowledged",
    })).resolves.toMatchObject({ incidentId: "audit:admin-blocked:v1-admin-audit-events" });

    expect(queries[0].sql).toContain("where incident_id = $1");
    expect(queries[0].params).toEqual(["audit:admin-blocked:v1-admin-audit-events"]);
    expect(queries[1].sql).toContain("where incident_id = any($1::text[])");
    expect(queries[1].params).toEqual([["audit:admin-blocked:v1-admin-audit-events"]]);
    expect(queries[2].sql).toContain("on conflict (incident_id) do update");
    expect(queries[2].params).toEqual([
      "audit:admin-blocked:v1-admin-audit-events",
      "acknowledged",
      "Checking incident.",
      "00000000-0000-4000-8000-000000000090",
      null,
      "none",
    ]);
  });

  it("stores timeline events with parameterized PostgreSQL writes", async () => {
    const queries: Array<{ sql: string; params: readonly unknown[] | undefined }> = [];
    const client: AdminIncidentQueryClient = {
      async query(sql, params) {
        queries.push({ sql, params });
        return {
          rows: [
            {
              actor_user_id: "00000000-0000-4000-8000-000000000090",
              assigned_to_user_id: "00000000-0000-4000-8000-000000000091",
              escalation_level: null,
              event_id: "00000000-0000-4000-8000-000000000777",
              event_type: "assigned",
              incident_id: "audit:admin-blocked:v1-admin-audit-events",
              note: "Assigning incident.",
              occurred_at: new Date("2026-05-20T10:02:00.000Z"),
              status: "acknowledged",
            },
          ],
        };
      },
    };
    const repository = new PostgresAdminIncidentRepository(
      { databaseUrl: "postgres://yorso_app:test@localhost:5432/yorso" },
      { client },
    );

    await expect(repository.appendEvent({
      actorUserId: "00000000-0000-4000-8000-000000000090",
      assignedToUserId: "00000000-0000-4000-8000-000000000091",
      incidentId: "audit:admin-blocked:v1-admin-audit-events",
      note: "Assigning incident.",
      status: "acknowledged",
      type: "assigned",
    })).resolves.toMatchObject({ type: "assigned" });
    await expect(repository.listEvents(["audit:admin-blocked:v1-admin-audit-events"]))
      .resolves.toBeInstanceOf(Map);

    expect(queries[0].sql).toContain("insert into yorso_admin_incident_events");
    expect(queries[0].params).toEqual([
      "audit:admin-blocked:v1-admin-audit-events",
      "assigned",
      "00000000-0000-4000-8000-000000000090",
      "00000000-0000-4000-8000-000000000091",
      null,
      "acknowledged",
      "Assigning incident.",
    ]);
    expect(queries[1].sql).toContain("where incident_id = any($1::text[])");
  });
});
