import { describe, expect, it } from "vitest";
import {
  adminIncidentCorrelationResponseSchema,
  adminIncidentWorkloadForecastResponseSchema,
  adminIncidentWorkloadResponseSchema,
} from "../../packages/contracts/src/admin-incidents";

const incident = {
  acknowledgedAt: null,
  acknowledgedByUserHash: null,
  assignedAt: null,
  assignedToUserHash: null,
  count: 2,
  description: "Blocked admin route access.",
  dueAt: "2026-05-20T11:00:00.000Z",
  escalatedAt: null,
  escalationLevel: "none",
  evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
  firstSeenAt: "2026-05-20T10:00:00.000Z",
  id: "audit:admin-blocked:v1-admin-audit-events",
  lastSeenAt: "2026-05-20T10:01:00.000Z",
  note: null,
  recommendedActions: ["Confirm admin role."],
  relatedAuditIds: ["aud_1"],
  route: "/v1/admin/audit-events",
  runbook: [{ description: "Confirm admin role.", label: "Confirm scope", ownerRole: "operator", targetMinutes: 15 }],
  severity: "high",
  slaStatus: "breached",
  source: "audit",
  status: "open",
  timelinePreview: [{
    actorUserHash: null,
    assignedToUserHash: null,
    escalationLevel: null,
    eventId: "audit:admin-blocked:v1-admin-audit-events:created",
    note: null,
    occurredAt: "2026-05-20T10:00:00.000Z",
    status: "open",
    type: "created",
  }],
  title: "Blocked admin route access",
} as const;

const ownerRows = [
  { assigned: 0, blocked: 1, breachedIncidents: 1, done: 0, immediate: 1, inProgress: 0, loadScore: 24, oldestTargetMinutes: 15, open: 1, overdue: 1, ownerRole: "operator", skipped: 0, total: 1, unassigned: 1 },
  { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "engineering", skipped: 0, total: 0, unassigned: 0 },
  { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "security", skipped: 0, total: 0, unassigned: 0 },
  { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "founder", skipped: 0, total: 0, unassigned: 0 },
] as const;

describe("Batch #106 admin incident workload contracts", () => {
  it("accepts bounded workload response shape and rejects stale fixture fields", () => {
    const response = adminIncidentWorkloadResponseSchema.parse({
      generatedAt: "2026-05-20T10:16:00.000Z",
      hotIncidents: [{
        blockedItems: 1,
        dueAt: "2026-05-20T11:00:00.000Z",
        immediateItems: 1,
        incidentId: incident.id,
        loadScore: 24,
        nextTargetDueAt: "2026-05-20T10:15:00.000Z",
        openItems: 1,
        overdueItems: 1,
        severity: "high",
        slaStatus: "breached",
        source: "audit",
        status: "open",
        title: "Blocked admin route access",
        topOwnerRole: "operator",
        unassignedItems: 1,
      }],
      limit: 20,
      offset: 0,
      ok: true,
      owners: ownerRows,
      requestId: "00000000-0000-4000-8000-000000000901",
      sourceMix: [{ blocked: 1, done: 0, inProgress: 0, key: "audit", open: 1, overdue: 1, total: 1 }],
      statusMix: [{ blocked: 1, done: 0, inProgress: 0, key: "open", open: 1, overdue: 1, total: 1 }],
      summary: { assigned: 0, blocked: 1, done: 0, hotIncidentCount: 1, inProgress: 0, loadScore: 24, open: 1, overdue: 1, total: 1, unassigned: 1 },
    });

    expect(response.hotIncidents[0].incidentId).toBe(incident.id);
    expect(() =>
      adminIncidentWorkloadResponseSchema.parse({
        ...response,
        hotIncidents: [{ ...response.hotIncidents[0], dueAt: undefined, lastUpdatedAt: "2026-05-20T10:16:00.000Z" }],
      }),
    ).toThrow();
  });

  it("accepts bounded capacity forecast shape", () => {
    const forecast = adminIncidentWorkloadForecastResponseSchema.parse({
      assumptions: [
        "Forecast window: 24 hour(s).",
        "Projection uses current bounded execution items only.",
      ],
      generatedAt: "2026-05-20T10:18:00.000Z",
      horizonHours: 24,
      ok: true,
      owners: [
        { capacityRisk: "moderate", currentOpen: 1, currentOverdue: 1, currentScore: 24, ownerRole: "operator", projectedOpen: 2, projectedOverdue: 2, recommendedAction: "Keep operator queue under review." },
        { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "engineering", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra engineering action required." },
        { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "security", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra security action required." },
        { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "founder", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra founder action required." },
      ],
      requestId: "00000000-0000-4000-8000-000000000902",
      summary: {
        capacityRisk: "moderate",
        highestRiskOwnerRole: "operator",
        projectedOpen: 2,
        projectedOverdue: 2,
        recommendedAction: "Moderate capacity risk: monitor operator workload and assign unowned work.",
      },
    });

    expect(forecast.summary.highestRiskOwnerRole).toBe("operator");
  });

  it("accepts correlation response with top-level execution items, not inferred summary counts", () => {
    const response = adminIncidentCorrelationResponseSchema.parse({
      auditEvents: [{
        action: "admin.audit_events.read",
        actorUserHash: "sha256:111111111111111111111111",
        auditId: "aud_contract_workload_1",
        correlationId: "corr_contract_workload_1",
        httpMethod: "GET",
        occurredAt: "2026-05-20T10:16:00.000Z",
        outcome: "blocked",
        reason: "admin_role_required",
        requestId: "req_contract_workload_1",
        resourceHash: null,
        resourceType: "admin_audit_events",
        route: "/v1/admin/audit-events",
        sessionHash: "sha256:222222222222222222222222",
        statusCode: 403,
      }],
      executionItems: [{
        assignedToUserHash: null,
        blockedReason: "Admin role missing.",
        completedAt: null,
        description: "Confirm admin scope.",
        evidenceNote: null,
        evidenceRequired: "Role decision recorded",
        itemId: "remediation:01:confirm-scope",
        note: null,
        ownerRole: "operator",
        priority: "immediate",
        source: "remediation_step",
        status: "blocked",
        targetMinutes: 15,
        title: "Confirm scope",
        updatedAt: null,
        updatedByUserHash: null,
      }],
      generatedAt: "2026-05-20T10:19:00.000Z",
      incident,
      ok: true,
      recommendedNextSteps: ["Compare audit and execution state.", "Record sanitized operator note."],
      requestId: "00000000-0000-4000-8000-000000000903",
      signals: [{
        actorUserHash: null,
        evidence: [{ label: "itemId", value: "remediation:01:confirm-scope" }],
        label: "Confirm scope",
        occurredAt: null,
        priority: "immediate",
        route: null,
        source: "execution_item",
        status: "blocked",
      }],
      summary: { auditEvents: 1, blockedItems: 1, doneItems: 0, openItems: 0, timelineEvents: 1 },
      timeline: incident.timelinePreview,
    });

    expect(response.executionItems).toHaveLength(1);
    expect(response.summary).not.toHaveProperty("executionItems");
  });
});
