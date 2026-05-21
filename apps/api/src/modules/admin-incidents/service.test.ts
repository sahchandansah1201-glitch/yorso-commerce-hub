import { describe, expect, it } from "vitest";
import type { AdminAuditEvent } from "../../../../../packages/contracts/dist/index.js";
import { loadApiConfig } from "../../config.js";
import { ApiLifecycle } from "../../lifecycle.js";
import { MemoryAdminAuditRepository } from "../admin-audit/repository.js";
import { AdminAuditService } from "../admin-audit/service.js";
import { AdminRuntimeService } from "../admin-runtime/service.js";
import { MemoryAdminIncidentRepository } from "./repository.js";
import { AdminIncidentService } from "./service.js";

const requestId = "00000000-0000-4000-8000-000000000601";

const auditEvent = (overrides: Partial<AdminAuditEvent>): AdminAuditEvent => ({
  action: "admin.audit_events.read",
  actorUserHash: "sha256:111111111111111111111111",
  auditId: "aud_incident_1",
  correlationId: "corr-incident-1",
  httpMethod: "GET",
  occurredAt: "2026-05-20T10:00:00.000Z",
  outcome: "blocked",
  reason: "admin_role_required",
  requestId: "req-incident-1",
  resourceHash: null,
  resourceType: "api_audit_events",
  route: "/v1/admin/audit-events",
  sessionHash: "sha256:222222222222222222222222",
  statusCode: 403,
  ...overrides,
});

const config = loadApiConfig({
  ACCOUNT_REPOSITORY: "memory",
  AUTH_RATE_LIMIT_DRIVER: "memory",
  AUTH_RATE_LIMIT_FAIL_MODE: "closed",
  AUTH_SESSION_CACHE_DRIVER: "memory",
  AUTH_SESSION_CACHE_FAIL_MODE: "closed",
  NODE_ENV: "test",
  YORSO_AUDIT_DRIVER: "console",
  YORSO_METRICS_DRIVER: "prometheus",
  YORSO_REQUEST_OBSERVABILITY_DRIVER: "console",
  YORSO_ERROR_OBSERVABILITY_DRIVER: "console",
  AUTH_OBSERVABILITY_DRIVER: "console",
}, { allowLocalDefaults: true });

const createService = (events: AdminAuditEvent[] = []) => {
  const runtime = new AdminRuntimeService(config, new ApiLifecycle());
  const audit = new AdminAuditService(new MemoryAdminAuditRepository(events), config);
  const repository = new MemoryAdminIncidentRepository();
  return new AdminIncidentService(repository, runtime, audit);
};

describe("admin incident service", () => {
  it("derives runtime and audit incidents with bounded summary", async () => {
    const service = createService([
      auditEvent({ auditId: "aud_incident_1" }),
      auditEvent({ auditId: "aud_incident_2", occurredAt: "2026-05-20T10:01:00.000Z" }),
      auditEvent({
        auditId: "aud_incident_3",
        occurredAt: "2026-05-20T10:02:00.000Z",
        outcome: "failure",
        reason: "validation_error",
        statusCode: 500,
      }),
    ]);

    const response = await service.listIncidents({ limit: 25, status: "open" }, requestId);

    expect(response.ok).toBe(true);
    expect(response.summary.total).toBeGreaterThanOrEqual(2);
    expect(response.summary.open).toBeGreaterThanOrEqual(2);
    expect(response.incidents.some((incident) => incident.id.startsWith("audit:admin-blocked"))).toBe(true);
    expect(response.incidents.some((incident) => incident.id.startsWith("audit:5xx"))).toBe(true);
    expect(JSON.stringify(response)).not.toContain("admin@example.com");
  });

  it("acknowledges and resolves incidents without exposing raw user ids", async () => {
    const service = createService([auditEvent({ auditId: "aud_incident_ack" })]);
    const list = await service.listIncidents({ limit: 25, status: "open" }, requestId);
    const incidentId = list.incidents[0].id;

    const acknowledged = await service.acknowledgeIncident(
      incidentId,
      { note: "Checking incident.", status: "acknowledged" },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );

    expect(acknowledged.incident.status).toBe("acknowledged");
    expect(acknowledged.incident.acknowledgedByUserHash).toMatch(/^sha256:[a-f0-9]{24}$/);
    expect(JSON.stringify(acknowledged)).not.toContain("00000000-0000-4000-8000-000000000090");

    const resolved = await service.acknowledgeIncident(
      incidentId,
      { note: "Resolved.", status: "resolved" },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(resolved.incident.status).toBe("resolved");

    const resolvedList = await service.listIncidents({ limit: 25, status: "resolved" }, requestId);
    expect(resolvedList.incidents.map((incident) => incident.id)).toContain(incidentId);
  });

  it("returns not-found errors for unknown acknowledgement ids", async () => {
    const service = createService();

    await expect(
      service.acknowledgeIncident(
        "audit:missing",
        { status: "acknowledged" },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      ),
    ).rejects.toMatchObject({ code: "admin_incident_not_found" });
  });
});
