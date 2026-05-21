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
    expect(response.incidents.every((incident) => incident.runbook.length > 0)).toBe(true);
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

  it("assigns, escalates and comments on incident workflow timeline", async () => {
    const service = createService([auditEvent({ auditId: "aud_incident_workflow" })]);
    const list = await service.listIncidents({ limit: 25, status: "open" }, requestId);
    const incidentId = list.incidents[0].id;

    const assigned = await service.updateIncidentWorkflow(
      incidentId,
      {
        action: "assign",
        assignedToUserId: "00000000-0000-4000-8000-000000000091",
        note: "Assigning incident commander.",
      },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(assigned.incident.status).toBe("acknowledged");
    expect(assigned.incident.assignedToUserHash).toMatch(/^sha256:[a-f0-9]{24}$/);
    expect(assigned.timeline.some((event) => event.type === "assigned")).toBe(true);

    const escalated = await service.updateIncidentWorkflow(
      incidentId,
      { action: "escalate", escalationLevel: "engineering", note: "Needs engineering review." },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(escalated.incident.escalationLevel).toBe("engineering");
    expect(escalated.timeline.some((event) => event.type === "escalated")).toBe(true);

    const commented = await service.updateIncidentWorkflow(
      incidentId,
      { action: "comment", note: "No raw session ids in this note." },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(commented.timeline.some((event) => event.type === "commented")).toBe(true);
    expect(JSON.stringify(commented)).not.toContain("00000000-0000-4000-8000-000000000091");

    const filtered = await service.listIncidents({
      assigned: "assigned",
      escalationLevel: "engineering",
      limit: 25,
      slaStatus: commented.incident.slaStatus,
      status: "acknowledged",
    }, requestId);
    expect(filtered.incidents.map((incident) => incident.id)).toContain(incidentId);

    const unassigned = await service.listIncidents({ assigned: "unassigned", limit: 25 }, requestId);
    expect(unassigned.incidents.map((incident) => incident.id)).not.toContain(incidentId);
  });

  it("applies bulk workflow actions with bounded partial failures", async () => {
    const service = createService([
      auditEvent({ auditId: "aud_incident_bulk_1", route: "/v1/admin/audit-events" }),
      auditEvent({
        action: "admin.runtime.status.read",
        auditId: "aud_incident_bulk_2",
        occurredAt: "2026-05-20T10:03:00.000Z",
        route: "/v1/admin/runtime/status",
      }),
    ]);
    const list = await service.listIncidents({ limit: 25, status: "open" }, requestId);
    const incidentIds = list.incidents.slice(0, 2).map((incident) => incident.id);

    const assigned = await service.bulkUpdateIncidentWorkflow(
      {
        action: "assign",
        assignedToUserId: "00000000-0000-4000-8000-000000000091",
        incidentIds: [...incidentIds, "audit:missing"],
        note: "Bulk assignment.",
      },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );

    expect(assigned.succeeded).toBe(incidentIds.length);
    expect(assigned.failed).toEqual([{ code: "admin_incident_not_found", incidentId: "audit:missing" }]);
    expect(assigned.incidents.every((incident) => incident.assignedToUserHash?.startsWith("sha256:"))).toBe(true);

    const escalated = await service.bulkUpdateIncidentWorkflow(
      {
        action: "escalate",
        escalationLevel: "engineering",
        incidentIds,
        note: "Bulk escalation.",
      },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(escalated.incidents.every((incident) => incident.escalationLevel === "engineering")).toBe(true);

    const resolved = await service.bulkUpdateIncidentWorkflow(
      {
        action: "resolve",
        incidentIds,
        note: "Bulk resolution.",
      },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(resolved.incidents.every((incident) => incident.status === "resolved")).toBe(true);
    expect(JSON.stringify(resolved)).not.toContain("00000000-0000-4000-8000-000000000091");
  });

  it("computes operator workload summary from derived incidents and durable workflow state", async () => {
    const service = createService([
      auditEvent({ auditId: "aud_incident_workload_1", route: "/v1/admin/audit-events" }),
      auditEvent({
        action: "admin.runtime.status.read",
        auditId: "aud_incident_workload_2",
        occurredAt: "2026-05-20T10:04:00.000Z",
        route: "/v1/admin/runtime/status",
        statusCode: 500,
      }),
      auditEvent({
        action: "access.request.blocked",
        auditId: "aud_incident_workload_3",
        occurredAt: "2026-05-20T10:05:00.000Z",
        reason: "rate_limit",
        resourceType: "supplier_access_request",
        route: "/v1/access/suppliers/sup-no-001/request",
        statusCode: 429,
      }),
    ]);
    const list = await service.listIncidents({ limit: 25, status: "open" }, requestId);
    const [firstIncident, secondIncident] = list.incidents;
    expect(firstIncident).toBeDefined();
    expect(secondIncident).toBeDefined();

    await service.updateIncidentWorkflow(
      firstIncident.id,
      {
        action: "assign",
        assignedToUserId: "00000000-0000-4000-8000-000000000091",
        note: "Assign workload owner.",
      },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    await service.updateIncidentWorkflow(
      secondIncident.id,
      { action: "escalate", escalationLevel: "lead", note: "Lead owns this queue." },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );

    const summaryList = await service.listIncidents({ limit: 25 }, requestId);
    expect(summaryList.summary.total).toBeGreaterThanOrEqual(3);
    expect(summaryList.summary.assigned).toBeGreaterThanOrEqual(1);
    expect(summaryList.summary.unassigned).toBeGreaterThanOrEqual(1);
    expect(summaryList.summary.assignmentCoveragePct).toBeGreaterThan(0);
    expect(summaryList.summary.breachRatePct).toBeGreaterThanOrEqual(0);
    expect(summaryList.summary.oldestOpenMinutes).toBeGreaterThanOrEqual(0);
    expect(summaryList.summary.leadEscalations).toBeGreaterThanOrEqual(1);
    expect(summaryList.summary.audit).toBeGreaterThanOrEqual(1);
    expect(summaryList.summary.runtime).toBeGreaterThanOrEqual(1);
  });

  it("exports sanitized JSON and CSV incident handoff data", async () => {
    const service = createService([auditEvent({ auditId: "aud_incident_export" })]);

    const jsonExport = await service.exportIncidents({ format: "json", limit: 25, status: "open" }, requestId);
    expect(jsonExport.contentType).toContain("application/json");
    expect(jsonExport.body).toContain("\"ok\":true");
    expect(jsonExport.body).toContain("Blocked admin route access");
    expect(jsonExport.body).not.toContain("admin@example.com");

    const csvExport = await service.exportIncidents({ format: "csv", limit: 25, status: "open" }, requestId);
    expect(csvExport.contentType).toContain("text/csv");
    expect(csvExport.body).toContain("\"id\",\"status\",\"severity\"");
    expect(csvExport.body).toContain("\"open\"");
    expect(csvExport.body).not.toContain("admin@example.com");
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
