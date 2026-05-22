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

  it("rejects workflow notes with raw emails, UUIDs or token-like secrets", async () => {
    const service = createService([auditEvent({ auditId: "aud_incident_note_hygiene" })]);
    const list = await service.listIncidents({ limit: 25, status: "open" }, requestId);
    const incidentId = list.incidents[0].id;

    await expect(
      service.updateIncidentWorkflow(
        incidentId,
        { action: "comment", note: "Ask admin@example.com to inspect this." },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      ),
    ).rejects.toMatchObject({ issues: expect.any(Array) });

    await expect(
      service.acknowledgeIncident(
        incidentId,
        { note: "session=abc123456789", status: "acknowledged" },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      ),
    ).rejects.toMatchObject({ issues: expect.any(Array) });
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

  it("exports a bounded per-incident JSON and Markdown operator handoff", async () => {
    const service = createService([auditEvent({ auditId: "aud_incident_handoff" })]);
    const list = await service.listIncidents({ limit: 25, status: "open" }, requestId);
    const incidentId = list.incidents[0].id;

    const jsonHandoff = await service.exportIncidentHandoff(incidentId, { format: "json" }, requestId);
    expect(jsonHandoff.contentType).toContain("application/json");
    expect(jsonHandoff.fileName).toContain("handoff.json");
    expect(jsonHandoff.body).toContain("\"handoffId\"");
    expect(jsonHandoff.body).toContain("\"checklist\"");
    expect(jsonHandoff.body).toContain("Incident snapshot");
    expect(jsonHandoff.body).not.toContain("admin@example.com");
    expect(jsonHandoff.body).not.toContain("Password1");

    const markdownHandoff = await service.exportIncidentHandoff(incidentId, { format: "markdown" }, requestId);
    expect(markdownHandoff.contentType).toContain("text/markdown");
    expect(markdownHandoff.fileName).toContain("handoff.md");
    expect(markdownHandoff.body).toContain("# Incident handoff");
    expect(markdownHandoff.body).toContain("## Handoff checklist");
    expect(markdownHandoff.body).toContain("## Runbook");
    expect(markdownHandoff.body).not.toContain("admin@example.com");
    expect(markdownHandoff.body).not.toContain("Password1");

    const remediation = await service.getIncidentRemediationPlan(incidentId, requestId);
    expect(remediation.ok).toBe(true);
    expect(remediation.steps.length).toBeGreaterThanOrEqual(3);
    expect(remediation.verificationChecks.join(" ")).toContain("hashed actor identifiers");
    expect(remediation.rollbackPlan.length).toBeGreaterThanOrEqual(2);
    expect(remediation.capacityNotes.join(" ")).toContain("control-plane");
    expect(JSON.stringify(remediation)).not.toContain("admin@example.com");

    const execution = await service.getIncidentExecution(incidentId, requestId);
    expect(execution.ok).toBe(true);
    expect(execution.summary.total).toBeGreaterThanOrEqual(6);
    expect(execution.items.some((item) => item.source === "remediation_step")).toBe(true);
    expect(execution.items.some((item) => item.source === "postmortem_action")).toBe(true);
    expect(JSON.stringify(execution)).not.toContain("00000000-0000-4000-8000-000000000090");

    const executionJson = await service.exportIncidentExecution(incidentId, { format: "json" }, requestId);
    expect(executionJson.contentType).toContain("application/json");
    expect(executionJson.fileName).toContain("execution.json");
    expect(executionJson.body).toContain("\"summary\"");
    expect(executionJson.body).toContain("\"items\"");
    expect(executionJson.body).not.toContain("admin@example.com");

    const executionCsv = await service.exportIncidentExecution(incidentId, { format: "csv" }, requestId);
    expect(executionCsv.contentType).toContain("text/csv");
    expect(executionCsv.fileName).toContain("execution.csv");
    expect(executionCsv.body).toContain("\"itemId\",\"status\"");
    expect(executionCsv.body).toContain("remediation");
    expect(executionCsv.body).not.toContain("admin@example.com");

    const firstItem = execution.items.find((item) => item.source === "remediation_step");
    expect(firstItem).toBeDefined();
    const inProgress = await service.updateIncidentExecutionItem(
      incidentId,
      firstItem!.itemId,
      { note: "Started execution item.", status: "in_progress" },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(inProgress.updatedItem.status).toBe("in_progress");
    expect(inProgress.summary.inProgress).toBeGreaterThanOrEqual(1);
    expect(inProgress.updatedItem.updatedByUserHash).toMatch(/^sha256:[a-f0-9]{24}$/);

    const done = await service.updateIncidentExecutionItem(
      incidentId,
      firstItem!.itemId,
      {
        evidenceNote: "Audit route verified with bounded evidence.",
        note: "Execution item complete.",
        status: "done",
      },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(done.updatedItem.status).toBe("done");
    expect(done.updatedItem.evidenceNote).toBe("Audit route verified with bounded evidence.");
    expect(done.updatedItem.completedAt).toBeTruthy();
    expect(done.summary.done).toBeGreaterThanOrEqual(1);

    await expect(
      service.updateIncidentExecutionItem(
        incidentId,
        firstItem!.itemId,
        { evidenceNote: "Email admin@example.com", status: "done" },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      ),
    ).rejects.toMatchObject({ issues: expect.any(Array) });

    await expect(
      service.updateIncidentExecutionItem(
        incidentId,
        "missing:item",
        { evidenceNote: "Verified missing item guard.", status: "done" },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      ),
    ).rejects.toMatchObject({ code: "admin_incident_execution_item_not_found" });

    const queue = await service.listIncidentExecutionQueue({
      limit: 50,
      priority: "immediate",
      status: "done",
    }, requestId);
    expect(queue.ok).toBe(true);
    expect(queue.summary.total).toBeGreaterThanOrEqual(1);
    expect(queue.summary.done).toBeGreaterThanOrEqual(1);
    expect(queue.items[0].incidentId).toBe(incidentId);
    expect(queue.items[0].targetDueAt).toBeTruthy();
    expect(JSON.stringify(queue)).not.toContain("00000000-0000-4000-8000-000000000090");

    const queueJson = await service.exportIncidentExecutionQueue({ format: "json", status: "done" }, requestId);
    expect(queueJson.contentType).toContain("application/json");
    expect(queueJson.fileName).toContain("execution-queue.json");
    expect(queueJson.body).toContain("\"items\"");
    expect(queueJson.body).not.toContain("admin@example.com");

    const queueCsv = await service.exportIncidentExecutionQueue({ format: "csv", status: "done" }, requestId);
    expect(queueCsv.contentType).toContain("text/csv");
    expect(queueCsv.fileName).toContain("execution-queue.csv");
    expect(queueCsv.body).toContain("\"incidentId\",\"itemId\"");
    expect(queueCsv.body).not.toContain("admin@example.com");

    const workload = await service.getIncidentExecutionWorkload({ limit: 20 }, requestId);
    expect(workload.ok).toBe(true);
    expect(workload.summary.total).toBeGreaterThanOrEqual(queue.summary.total);
    expect(workload.summary.loadScore).toBeGreaterThanOrEqual(1);
    expect(workload.owners.map((owner) => owner.ownerRole)).toEqual(["operator", "engineering", "security", "founder"]);
    expect(workload.hotIncidents[0].incidentId).toBeTruthy();
    expect(workload.sourceMix.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(workload)).not.toContain("00000000-0000-4000-8000-000000000090");

    const workloadJson = await service.exportIncidentExecutionWorkload({ format: "json", limit: 20 }, requestId);
    expect(workloadJson.contentType).toContain("application/json");
    expect(workloadJson.fileName).toContain("execution-workload.json");
    expect(workloadJson.body).toContain("\"hotIncidents\"");

    const workloadCsv = await service.exportIncidentExecutionWorkload({ format: "csv", limit: 20 }, requestId);
    expect(workloadCsv.contentType).toContain("text/csv");
    expect(workloadCsv.fileName).toContain("execution-workload.csv");
    expect(workloadCsv.body).toContain("\"incidentId\",\"loadScore\"");
    expect(workloadCsv.body).not.toContain("admin@example.com");

    const forecast = await service.getIncidentExecutionWorkloadForecast({ horizonHours: 24, limit: 20 }, requestId);
    expect(forecast.ok).toBe(true);
    expect(forecast.horizonHours).toBe(24);
    expect(forecast.owners.map((owner) => owner.ownerRole)).toEqual(["operator", "engineering", "security", "founder"]);
    expect(forecast.summary.projectedOpen).toBeGreaterThanOrEqual(0);
    expect(forecast.assumptions.join(" ")).toContain("bounded execution items");
    expect(JSON.stringify(forecast)).not.toContain("admin@example.com");

    const correlation = await service.getIncidentCorrelation(incidentId, { limit: 25 }, requestId);
    expect(correlation.ok).toBe(true);
    expect(correlation.incident.id).toBe(incidentId);
    expect(correlation.executionItems.length).toBeGreaterThanOrEqual(1);
    expect(correlation.signals.length).toBeGreaterThanOrEqual(1);
    expect(correlation.recommendedNextSteps.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(correlation)).not.toContain("00000000-0000-4000-8000-000000000090");

    const nextOpen = (await service.listIncidentExecutionQueue({ limit: 50, status: "open" }, requestId)).items[0];
    expect(nextOpen).toBeDefined();
    const bulk = await service.bulkUpdateIncidentExecutionQueue(
      {
        items: [
          { incidentId: nextOpen.incidentId, itemId: nextOpen.itemId },
          { incidentId: "audit:missing", itemId: "missing:item" },
        ],
        note: "Bulk execution queue start.",
        status: "in_progress",
      },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(bulk.succeeded).toBe(1);
    expect(bulk.failed).toEqual([{ code: "admin_incident_not_found", incidentId: "audit:missing", itemId: "missing:item" }]);
    expect(bulk.updatedItems[0].status).toBe("in_progress");

    await expect(
      service.bulkUpdateIncidentExecutionQueue(
        {
          evidenceNote: "Email admin@example.com",
          items: [{ incidentId: nextOpen.incidentId, itemId: nextOpen.itemId }],
          status: "done",
        },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      ),
    ).rejects.toMatchObject({ issues: expect.any(Array) });

    const postmortemJson = await service.exportIncidentPostmortem(incidentId, { format: "json" }, requestId);
    expect(postmortemJson.contentType).toContain("application/json");
    expect(postmortemJson.fileName).toContain("postmortem.json");
    expect(postmortemJson.body).toContain("\"postmortemId\"");
    expect(postmortemJson.body).toContain("\"executiveSummary\"");
    expect(postmortemJson.body).toContain("Add regression guard");
    expect(postmortemJson.body).not.toContain("admin@example.com");
    expect(postmortemJson.body).not.toContain("Password1");

    const postmortemMarkdown = await service.exportIncidentPostmortem(incidentId, { format: "markdown" }, requestId);
    expect(postmortemMarkdown.contentType).toContain("text/markdown");
    expect(postmortemMarkdown.fileName).toContain("postmortem.md");
    expect(postmortemMarkdown.body).toContain("# Incident postmortem draft");
    expect(postmortemMarkdown.body).toContain("## Root-cause hypotheses");
    expect(postmortemMarkdown.body).toContain("## Capacity review");
    expect(postmortemMarkdown.body).not.toContain("admin@example.com");
    expect(postmortemMarkdown.body).not.toContain("Password1");
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

  it("builds trend analytics, anomalies, briefing and exports without raw identities", async () => {
    const service = createService([
      auditEvent({ auditId: "aud_incident_trend_1", route: "/v1/admin/audit-events" }),
      auditEvent({
        action: "admin.runtime.status.read",
        auditId: "aud_incident_trend_2",
        occurredAt: "2026-05-20T10:03:00.000Z",
        route: "/v1/admin/runtime/status",
        statusCode: 500,
      }),
      auditEvent({
        action: "access.request.blocked",
        auditId: "aud_incident_trend_3",
        occurredAt: "2026-05-20T10:05:00.000Z",
        reason: "rate_limit",
        resourceType: "supplier_access_request",
        route: "/v1/access/suppliers/sup-no-001/request",
        statusCode: 429,
      }),
    ]);
    const list = await service.listIncidents({ limit: 25, status: "open" }, requestId);
    const incidentId = list.incidents[0].id;
    await service.updateIncidentExecutionItem(
      incidentId,
      list.incidents[0].runbook[0]?.label ? `${incidentId}:runbook:0` : "missing",
      { blockedReason: "Needs role-owner review.", note: "Blocked for trend test.", status: "blocked" },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    ).catch(() => undefined);

    const trends = await service.getIncidentTrends({
      granularity: "day",
      limit: 30,
      window: "7d",
    }, requestId);
    expect(trends.ok).toBe(true);
    expect(trends.buckets.length).toBeGreaterThanOrEqual(1);
    expect(trends.summary.total).toBeGreaterThanOrEqual(1);
    expect(trends.sourceMix.length).toBeGreaterThanOrEqual(1);
    expect(trends.routeRisks.length).toBeGreaterThanOrEqual(1);
    expect(trends.sla.breachRatePct).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(trends)).not.toContain("admin@example.com");

    const jsonExport = await service.exportIncidentTrends({ format: "json", limit: 30, window: "7d" }, requestId);
    expect(jsonExport.contentType).toContain("application/json");
    expect(jsonExport.fileName).toContain("incident-trends.json");
    expect(jsonExport.body).toContain("\"buckets\"");
    expect(jsonExport.body).not.toContain("admin@example.com");

    const csvExport = await service.exportIncidentTrends({ format: "csv", limit: 30, window: "7d" }, requestId);
    expect(csvExport.contentType).toContain("text/csv");
    expect(csvExport.fileName).toContain("incident-trends.csv");
    expect(csvExport.body).toContain("\"key\",\"startAt\"");
    expect(csvExport.body).not.toContain("admin@example.com");

    const anomalies = await service.getIncidentTrendAnomalies({ limit: 30, window: "7d" }, requestId);
    expect(anomalies.ok).toBe(true);
    expect(anomalies.summary.watch + anomalies.summary.warning + anomalies.summary.critical).toBe(anomalies.anomalies.length);
    expect(JSON.stringify(anomalies)).not.toContain("admin@example.com");

    const briefing = await service.getIncidentTrendBriefing({ limit: 30, window: "7d" }, requestId);
    expect(briefing.ok).toBe(true);
    expect(briefing.sections.length).toBeGreaterThanOrEqual(3);
    expect(briefing.operatorActions.length).toBeGreaterThanOrEqual(1);
    expect(briefing.capacityReview.join(" ")).toContain("10,000");
    expect(JSON.stringify(briefing)).not.toContain("admin@example.com");

    const actions = await service.getIncidentTrendActions({ limit: 30, window: "7d" }, requestId);
    expect(actions.ok).toBe(true);
    expect(actions.actions.length).toBeGreaterThanOrEqual(1);
    expect(actions.summary.total).toBe(actions.actions.length);
    expect(actions.actions[0].status).toBe("proposed");
    expect(actions.actions[0].relatedIncidentIds.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(actions)).not.toContain("00000000-0000-4000-8000-000000000090");

    const accepted = await service.decideIncidentTrendAction(
      actions.actions[0].actionId,
      { limit: 30, window: "7d" },
      { decision: "accept", note: "Accept bounded trend follow-up." },
      "00000000-0000-4000-8000-000000000090",
      requestId,
    );
    expect(accepted.ok).toBe(true);
    expect(accepted.action.status).toBe("accepted");
    expect(accepted.timelineEventsCreated).toBeGreaterThanOrEqual(1);
    expect(accepted.affectedIncidents.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(accepted)).not.toContain("00000000-0000-4000-8000-000000000090");

    const afterAccept = await service.getIncidentTrendActions({ limit: 30, window: "7d" }, requestId);
    expect(afterAccept.actions.find((action) => action.actionId === actions.actions[0].actionId)?.status).toBe("accepted");

    const proposed = afterAccept.actions.find((action) => action.status === "proposed");
    if (proposed) {
      const dismissed = await service.decideIncidentTrendAction(
        proposed.actionId,
        { limit: 30, window: "7d" },
        { decision: "dismiss", note: "Dismiss bounded duplicate trend follow-up." },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      );
      expect(dismissed.action.status).toBe("dismissed");
      expect(dismissed.timelineEventsCreated).toBe(0);
    }

    await expect(
      service.decideIncidentTrendAction(
        "trend:missing:7d:not-found",
        { limit: 30, window: "7d" },
        { decision: "accept", note: "Missing action." },
        "00000000-0000-4000-8000-000000000090",
        requestId,
      ),
    ).rejects.toMatchObject({ code: "admin_incident_trend_action_not_found" });
  });
});
