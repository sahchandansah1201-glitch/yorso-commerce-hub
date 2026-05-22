import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  isAdminIncidentsApiConfigured,
  type AdminIncidentCorrelationResponse,
  type AdminIncidentSummary,
  type AdminIncidentListResponse,
  type AdminIncidentWorkloadForecastResponse,
  type AdminIncidentWorkloadResponse,
} from "@/lib/admin-incidents-api";

const incidentSummary = (patch: Partial<AdminIncidentSummary> = {}): AdminIncidentSummary => ({
  acknowledged: 0,
  access: 0,
  assigned: 0,
  assignmentCoveragePct: 0,
  atRisk: 0,
  audit: 1,
  breachRatePct: 100,
  breached: 1,
  critical: 0,
  engineeringEscalations: 0,
  escalated: 0,
  executiveEscalations: 0,
  high: 1,
  leadEscalations: 0,
  open: 1,
  openCritical: 0,
  oldestOpenMinutes: 1,
  policy: 0,
  resolved: 0,
  runtime: 0,
  security: 0,
  total: 1,
  unassigned: 1,
  ...patch,
});

const incidentPayload = (patch: Partial<AdminIncidentListResponse> = {}): AdminIncidentListResponse => ({
  incidents: [
    {
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
      runbook: [
        {
          description: "Confirm admin role and review recent blocked attempts.",
          label: "Confirm scope",
          ownerRole: "operator",
          targetMinutes: 15,
        },
      ],
      severity: "high",
      slaStatus: "breached",
      source: "audit",
      status: "open",
      timelinePreview: [
        {
          actorUserHash: null,
          assignedToUserHash: null,
          escalationLevel: null,
          eventId: "audit:admin-blocked:v1-admin-audit-events:created",
          note: null,
          occurredAt: "2026-05-20T10:00:00.000Z",
          status: "open",
          type: "created",
        },
      ],
      title: "Blocked admin route access",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000501",
  summary: incidentSummary(),
  ...patch,
});

const workloadPayload = (): AdminIncidentWorkloadResponse => ({
  generatedAt: "2026-05-20T10:16:00.000Z",
  hotIncidents: [
    {
      blockedItems: 0,
      dueAt: "2026-05-20T11:00:00.000Z",
      immediateItems: 1,
      incidentId: "audit:admin-blocked:v1-admin-audit-events",
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
    },
  ],
  limit: 20,
  offset: 0,
  ok: true,
  owners: [
    { assigned: 0, blocked: 0, breachedIncidents: 1, done: 0, immediate: 1, inProgress: 0, loadScore: 24, oldestTargetMinutes: 1, open: 1, overdue: 1, ownerRole: "operator", skipped: 0, total: 1, unassigned: 1 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "engineering", skipped: 0, total: 0, unassigned: 0 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "security", skipped: 0, total: 0, unassigned: 0 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "founder", skipped: 0, total: 0, unassigned: 0 },
  ],
  requestId: "00000000-0000-4000-8000-000000000524",
  sourceMix: [{ blocked: 0, done: 0, inProgress: 0, key: "audit", open: 1, overdue: 1, total: 1 }],
  statusMix: [{ blocked: 0, done: 0, inProgress: 0, key: "open", open: 1, overdue: 1, total: 1 }],
  summary: { assigned: 0, blocked: 0, done: 0, hotIncidentCount: 1, inProgress: 0, loadScore: 24, open: 1, overdue: 1, total: 1, unassigned: 1 },
});

const workloadForecastPayload = (): AdminIncidentWorkloadForecastResponse => ({
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
  requestId: "00000000-0000-4000-8000-000000000525",
  summary: {
    capacityRisk: "moderate",
    highestRiskOwnerRole: "operator",
    projectedOpen: 2,
    projectedOverdue: 2,
    recommendedAction: "Moderate capacity risk: monitor operator workload and assign unowned work.",
  },
});

const correlationPayload = (): AdminIncidentCorrelationResponse => ({
  auditEvents: [
    {
      action: "admin.audit_events.read",
      actorUserHash: "sha256:111111111111111111111111",
      auditId: "aud_1",
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
    },
  ],
  executionItems: [
    {
      assignedToUserHash: null,
      blockedReason: null,
      completedAt: null,
      description: "Confirm admin role and review attempts.",
      evidenceNote: null,
      evidenceRequired: "Audit route evidence.",
      itemId: "remediation:01:confirm-scope",
      note: null,
      ownerRole: "operator",
      priority: "immediate",
      source: "remediation_step",
      status: "open",
      targetMinutes: 15,
      title: "Confirm scope",
      updatedAt: null,
      updatedByUserHash: null,
    },
  ],
  generatedAt: "2026-05-20T10:17:00.000Z",
  incident: incidentPayload().incidents[0],
  ok: true,
  recommendedNextSteps: ["Compare audit and execution state.", "Record sanitized operator note."],
  requestId: "00000000-0000-4000-8000-000000000525",
  signals: [
    {
      actorUserHash: "sha256:111111111111111111111111",
      evidence: [{ label: "action", value: "admin.audit_events.read" }],
      label: "Audit blocked: admin.audit_events.read",
      occurredAt: "2026-05-20T10:00:00.000Z",
      priority: "next",
      route: "/v1/admin/audit-events",
      source: "audit_event",
      status: "admin_role_required",
    },
  ],
  summary: { auditEvents: 1, blockedItems: 0, doneItems: 0, openItems: 1, timelineEvents: 1 },
  timeline: incidentPayload().incidents[0].timelinePreview,
});

describe("admin-incidents-api", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("stays disabled when VITE_YORSO_API_URL is empty", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    expect(isAdminIncidentsApiConfigured()).toBe(false);
    expect(createAdminIncidentsApiClient().enabled).toBe(false);
  });

  it("requires a self-hosted session before backend calls", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createAdminIncidentsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
    });

    await expect(client.list()).rejects.toMatchObject({
      code: "admin_incidents_session_required",
      status: 401,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("loads incidents with filters and self-hosted session headers, then acknowledges incidents without leaking session data", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/v1/admin/incidents/export?format=json")) {
        return new Response(JSON.stringify({
          count: 1,
          generatedAt: "2026-05-20T10:06:00.000Z",
          incidents: incidentPayload().incidents,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000514",
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/v1/admin/incidents/export?format=csv")) {
        return new Response("\"id\",\"status\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"open\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/v1/admin/incidents/execution-queue/export?format=json")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:14:00.000Z",
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: null,
              description: "Confirm admin role and review attempts.",
              evidenceNote: null,
              evidenceRequired: "Audit route evidence.",
              incidentDueAt: "2026-05-20T11:00:00.000Z",
              incidentId: "audit:admin-blocked:v1-admin-audit-events",
              incidentSeverity: "high",
              incidentSlaStatus: "breached",
              incidentSource: "audit",
              incidentStatus: "open",
              incidentTitle: "Blocked admin route access",
              itemId: "remediation:01:confirm-scope",
              note: null,
              overdue: true,
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "open",
              targetDueAt: "2026-05-20T10:15:00.000Z",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: null,
              updatedByUserHash: null,
            },
          ],
          limit: 50,
          offset: 0,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000522",
          summary: { assigned: 0, blocked: 0, done: 0, inProgress: 0, open: 1, overdue: 1, skipped: 0, total: 1, unassigned: 1 },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/v1/admin/incidents/execution-queue/export?format=csv")) {
        return new Response("\"incidentId\",\"itemId\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"remediation:01:confirm-scope\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/v1/admin/incidents/execution-workload/export?format=json")) {
        return new Response(JSON.stringify(workloadPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/v1/admin/incidents/execution-workload/export?format=csv")) {
        return new Response("\"incidentId\",\"loadScore\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"24\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/v1/admin/incidents/execution-workload/forecast?")) {
        return new Response(JSON.stringify(workloadForecastPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/v1/admin/incidents/execution-workload?")) {
        return new Response(JSON.stringify(workloadPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/correlation?limit=25")) {
        return new Response(JSON.stringify(correlationPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/v1/admin/incidents/execution-queue/bulk")) {
        return new Response(JSON.stringify({
          failed: [],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000523",
          succeeded: 1,
          updatedItems: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: null,
              description: "Confirm admin role and review attempts.",
              evidenceNote: null,
              evidenceRequired: "Audit route evidence.",
              incidentDueAt: "2026-05-20T11:00:00.000Z",
              incidentId: "audit:admin-blocked:v1-admin-audit-events",
              incidentSeverity: "high",
              incidentSlaStatus: "breached",
              incidentSource: "audit",
              incidentStatus: "open",
              incidentTitle: "Blocked admin route access",
              itemId: "remediation:01:confirm-scope",
              note: "Started.",
              overdue: true,
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "in_progress",
              targetDueAt: "2026-05-20T10:15:00.000Z",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: "2026-05-20T10:14:00.000Z",
              updatedByUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
            },
          ],
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/v1/admin/incidents/execution-queue?")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:14:00.000Z",
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: null,
              description: "Confirm admin role and review attempts.",
              evidenceNote: null,
              evidenceRequired: "Audit route evidence.",
              incidentDueAt: "2026-05-20T11:00:00.000Z",
              incidentId: "audit:admin-blocked:v1-admin-audit-events",
              incidentSeverity: "high",
              incidentSlaStatus: "breached",
              incidentSource: "audit",
              incidentStatus: "open",
              incidentTitle: "Blocked admin route access",
              itemId: "remediation:01:confirm-scope",
              note: null,
              overdue: true,
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "open",
              targetDueAt: "2026-05-20T10:15:00.000Z",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: null,
              updatedByUserHash: null,
            },
          ],
          limit: 50,
          offset: 0,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000521",
          summary: { assigned: 0, blocked: 0, done: 0, inProgress: 0, open: 1, overdue: 1, skipped: 0, total: 1, unassigned: 1 },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/handoff?format=json")) {
        return new Response(JSON.stringify({
          checklist: [
            { detail: "Owner missing.", label: "Owner assigned", status: "needs_attention" },
            { detail: "Escalation reviewed.", label: "Escalation reviewed", status: "ready" },
            { detail: "Evidence bounded.", label: "Evidence bounded", status: "ready" },
          ],
          generatedAt: "2026-05-20T10:09:00.000Z",
          handoffId: "handoff:audit:admin-blocked:v1-admin-audit-events",
          incident: incidentPayload().incidents[0],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000515",
          sections: [
            { body: ["Status: open"], title: "Incident snapshot" },
            { body: ["Confirm admin role."], title: "Recommended next actions" },
            { body: ["Confirm scope."], title: "Runbook" },
          ],
          timeline: incidentPayload().incidents[0].timelinePreview,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/handoff?format=markdown")) {
        return new Response("# Incident handoff\n\n- Status: open\n", {
          headers: { "content-type": "text/markdown" },
        });
      }
      if (url.endsWith("/remediation")) {
        return new Response(JSON.stringify({
          capacityNotes: ["Control-plane route.", "No polling."],
          generatedAt: "2026-05-20T10:10:00.000Z",
          incident: incidentPayload().incidents[0],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000516",
          rollbackPlan: ["Keep audit evidence.", "Rollback latest runtime change."],
          steps: [
            {
              description: "Confirm admin role and review attempts.",
              evidenceRequired: "Audit route evidence.",
              ownerRole: "operator",
              priority: "immediate",
              targetMinutes: 15,
              title: "Confirm scope",
            },
            {
              description: "Review metrics.",
              evidenceRequired: "Metrics snapshot.",
              ownerRole: "engineering",
              priority: "next",
              targetMinutes: 20,
              title: "Validate runtime",
            },
            {
              description: "Write final note.",
              evidenceRequired: "Timeline note.",
              ownerRole: "operator",
              priority: "follow_up",
              targetMinutes: 60,
              title: "Close loop",
            },
          ],
          verificationChecks: ["No raw identifiers.", "Route still blocked."],
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/postmortem?format=json")) {
        return new Response(JSON.stringify({
          actionItems: [
            {
              evidenceRequired: "Timeline note.",
              ownerRole: "operator",
              priority: "immediate",
              targetHours: 1,
              title: "Close incident narrative",
            },
            {
              evidenceRequired: "Regression guard.",
              ownerRole: "engineering",
              priority: "next",
              targetHours: 48,
              title: "Add regression guard",
            },
            {
              evidenceRequired: "Capacity note.",
              ownerRole: "engineering",
              priority: "follow_up",
              targetHours: 72,
              title: "Update capacity review",
            },
          ],
          capacityReview: ["Explicit operator action.", "Bounded payload.", "No customer hot-path scan."],
          executiveSummary: "Blocked admin route access was derived from audit signals.",
          generatedAt: "2026-05-20T10:11:00.000Z",
          impactSummary: ["Source: audit.", "Status: open."],
          incident: incidentPayload().incidents[0],
          ok: true,
          postmortemId: "postmortem:audit:admin-blocked:v1-admin-audit-events",
          preventionChecks: ["No raw identifiers.", "Route guard remains active.", "No polling added."],
          requestId: "00000000-0000-4000-8000-000000000517",
          rootCauseHypotheses: ["Role mismatch.", "Expected admin guard."],
          timeline: incidentPayload().incidents[0].timelinePreview,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/postmortem?format=markdown")) {
        return new Response("# Incident postmortem draft\n\n- Source: audit\n", {
          headers: { "content-type": "text/markdown" },
        });
      }
      if (url.endsWith("/execution/export?format=json")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:12:30.000Z",
          incident: incidentPayload().incidents[0],
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: null,
              description: "Confirm admin role and review attempts.",
              evidenceNote: null,
              evidenceRequired: "Audit route evidence.",
              itemId: "remediation:01:confirm-scope",
              note: null,
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "open",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: null,
              updatedByUserHash: null,
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000520",
          summary: { blocked: 0, done: 0, inProgress: 0, open: 1, skipped: 0, total: 1 },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/execution/export?format=csv")) {
        return new Response("\"itemId\",\"status\"\n\"remediation:01:confirm-scope\",\"open\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.endsWith("/execution")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:12:00.000Z",
          incident: incidentPayload().incidents[0],
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: null,
              description: "Confirm admin role and review attempts.",
              evidenceNote: null,
              evidenceRequired: "Audit route evidence.",
              itemId: "remediation:01:confirm-scope",
              note: null,
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "open",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: null,
              updatedByUserHash: null,
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000518",
          summary: { blocked: 0, done: 0, inProgress: 0, open: 1, skipped: 0, total: 1 },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/execution/remediation%3A01%3Aconfirm-scope")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:13:00.000Z",
          incident: incidentPayload().incidents[0],
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: "2026-05-20T10:13:00.000Z",
              description: "Confirm admin role and review attempts.",
              evidenceNote: "Audit route verified.",
              evidenceRequired: "Audit route evidence.",
              itemId: "remediation:01:confirm-scope",
              note: "Done.",
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "done",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: "2026-05-20T10:13:00.000Z",
              updatedByUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000519",
          summary: { blocked: 0, done: 1, inProgress: 0, open: 0, skipped: 0, total: 1 },
          updatedItem: {
            assignedToUserHash: null,
            blockedReason: null,
            completedAt: "2026-05-20T10:13:00.000Z",
            description: "Confirm admin role and review attempts.",
            evidenceNote: "Audit route verified.",
            evidenceRequired: "Audit route evidence.",
            itemId: "remediation:01:confirm-scope",
            note: "Done.",
            ownerRole: "operator",
            priority: "immediate",
            source: "remediation_step",
            status: "done",
            targetMinutes: 15,
            title: "Confirm scope",
            updatedAt: "2026-05-20T10:13:00.000Z",
            updatedByUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
          },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/workflow/bulk")) {
        return new Response(JSON.stringify({
          failed: [],
          incidents: [
            {
              ...incidentPayload().incidents[0],
              escalatedAt: "2026-05-20T10:05:00.000Z",
              escalationLevel: "engineering",
              status: "acknowledged",
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000513",
          succeeded: 1,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/acknowledge")) {
        return new Response(JSON.stringify({
          incident: {
            ...incidentPayload().incidents[0],
            acknowledgedAt: "2026-05-20T10:03:00.000Z",
            acknowledgedByUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
            note: "Checking incident.",
            status: "acknowledged",
          },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000502",
          timeline: incidentPayload().incidents[0].timelinePreview,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/workflow")) {
        return new Response(JSON.stringify({
          incident: {
            ...incidentPayload().incidents[0],
            assignedAt: "2026-05-20T10:04:00.000Z",
            assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
            status: "acknowledged",
          },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000512",
          timeline: [
            ...incidentPayload().incidents[0].timelinePreview,
            {
              actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
              assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
              escalationLevel: null,
              eventId: "evt_assign",
              note: "Assign.",
              occurredAt: "2026-05-20T10:04:00.000Z",
              status: "acknowledged",
              type: "assigned",
            },
          ],
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/v1/admin/incidents/audit%3Aadmin-blocked%3Av1-admin-audit-events")) {
        return new Response(JSON.stringify({
          incident: incidentPayload().incidents[0],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000511",
          timeline: incidentPayload().incidents[0].timelinePreview,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(incidentPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    const client = createAdminIncidentsApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-incidents",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(client.list({
      assigned: "assigned",
      escalationLevel: "engineering",
      limit: 25,
      severity: "high",
      slaStatus: "breached",
      source: "audit",
      status: "open",
    }))
      .resolves.toMatchObject({ incidents: [{ id: "audit:admin-blocked:v1-admin-audit-events" }] });
    await expect(client.acknowledge("audit:admin-blocked:v1-admin-audit-events", {
      note: "Checking incident.",
      status: "acknowledged",
    })).resolves.toMatchObject({ incident: { status: "acknowledged" } });
    await expect(client.workflow("audit:admin-blocked:v1-admin-audit-events", {
      action: "assign",
      assignedToUserId: "00000000-0000-4000-8000-000000000099",
      note: "Assign.",
    })).resolves.toMatchObject({ incident: { assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb" } });
    await expect(client.bulkWorkflow({
      action: "escalate",
      escalationLevel: "engineering",
      incidentIds: ["audit:admin-blocked:v1-admin-audit-events"],
      note: "Escalate selected.",
    })).resolves.toMatchObject({
      failed: [],
      incidents: [{ escalationLevel: "engineering" }],
      succeeded: 1,
    });
    await expect(client.detail("audit:admin-blocked:v1-admin-audit-events"))
      .resolves.toMatchObject({ incident: { id: "audit:admin-blocked:v1-admin-audit-events" } });
    await expect(client.exportJson({
      assigned: "assigned",
      limit: 25,
      status: "acknowledged",
    })).resolves.toMatchObject({ count: 1, incidents: [{ id: "audit:admin-blocked:v1-admin-audit-events" }] });
    await expect(client.exportCsv({ status: "acknowledged" })).resolves.toContain("audit:admin-blocked");
    const handoffJson = await client.handoffJson("audit:admin-blocked:v1-admin-audit-events");
    expect(handoffJson.handoffId).toBe("handoff:audit:admin-blocked:v1-admin-audit-events");
    expect(handoffJson.checklist.map((item) => item.label)).toContain("Owner assigned");
    await expect(client.handoffMarkdown("audit:admin-blocked:v1-admin-audit-events")).resolves.toContain("# Incident handoff");
    const remediation = await client.remediation("audit:admin-blocked:v1-admin-audit-events");
    expect(remediation.capacityNotes).toEqual(["Control-plane route.", "No polling."]);
    expect(remediation.steps.map((step) => step.title)).toContain("Confirm scope");
    const postmortemJson = await client.postmortemJson("audit:admin-blocked:v1-admin-audit-events");
    expect(postmortemJson.postmortemId).toBe("postmortem:audit:admin-blocked:v1-admin-audit-events");
    expect(postmortemJson.actionItems.map((item) => item.title)).toContain("Add regression guard");
    expect(postmortemJson.preventionChecks).toContain("No raw identifiers.");
    await expect(client.postmortemMarkdown("audit:admin-blocked:v1-admin-audit-events"))
      .resolves.toContain("# Incident postmortem draft");
    const execution = await client.execution("audit:admin-blocked:v1-admin-audit-events");
    expect(execution.summary.total).toBe(1);
    expect(execution.items[0].itemId).toBe("remediation:01:confirm-scope");
    await expect(client.executionExportJson("audit:admin-blocked:v1-admin-audit-events"))
      .resolves.toMatchObject({ summary: { total: 1 }, items: [{ itemId: "remediation:01:confirm-scope" }] });
    await expect(client.executionExportCsv("audit:admin-blocked:v1-admin-audit-events"))
      .resolves.toContain("\"itemId\",\"status\"");
    await expect(client.updateExecutionItem(
      "audit:admin-blocked:v1-admin-audit-events",
      "remediation:01:confirm-scope",
      {
        evidenceNote: "Audit route verified.",
        note: "Done.",
        status: "done",
      },
    )).resolves.toMatchObject({
      summary: { done: 1 },
      updatedItem: { status: "done", evidenceNote: "Audit route verified." },
    });
    await expect(client.executionQueue({ limit: 50, overdueOnly: true, priority: "immediate", status: "open" }))
      .resolves.toMatchObject({ items: [{ incidentId: "audit:admin-blocked:v1-admin-audit-events" }], summary: { overdue: 1 } });
    await expect(client.executionQueueExportJson({ status: "open" }))
      .resolves.toMatchObject({ items: [{ itemId: "remediation:01:confirm-scope" }], summary: { total: 1 } });
    await expect(client.executionQueueExportCsv({ status: "open" }))
      .resolves.toContain("\"incidentId\",\"itemId\"");
    await expect(client.bulkUpdateExecutionQueue({
      items: [{ incidentId: "audit:admin-blocked:v1-admin-audit-events", itemId: "remediation:01:confirm-scope" }],
      note: "Started.",
      status: "in_progress",
    })).resolves.toMatchObject({
      succeeded: 1,
      updatedItems: [{ status: "in_progress" }],
    });
    await expect(client.executionWorkload({ limit: 20, overdueOnly: true, ownerRole: "operator" }))
      .resolves.toMatchObject({
        hotIncidents: expect.arrayContaining([
          expect.objectContaining({ incidentId: "audit:admin-blocked:v1-admin-audit-events" }),
        ]),
        owners: expect.arrayContaining([
          expect.objectContaining({ ownerRole: "operator" }),
        ]),
        summary: { loadScore: 24, overdue: 1 },
      });
    await expect(client.executionWorkloadExportJson({ limit: 20 }))
      .resolves.toMatchObject({
        hotIncidents: expect.arrayContaining([expect.objectContaining({ loadScore: 24 })]),
        summary: { total: 1 },
      });
    await expect(client.executionWorkloadExportCsv({ limit: 20 }))
      .resolves.toContain("\"incidentId\",\"loadScore\"");
    await expect(client.executionWorkloadForecast({ horizonHours: 24, limit: 20 }))
      .resolves.toMatchObject({
        owners: expect.arrayContaining([expect.objectContaining({ ownerRole: "operator" })]),
        summary: { capacityRisk: "moderate", highestRiskOwnerRole: "operator" },
      });
    await expect(client.correlation("audit:admin-blocked:v1-admin-audit-events"))
      .resolves.toMatchObject({
        incident: { id: "audit:admin-blocked:v1-admin-audit-events" },
        signals: expect.arrayContaining([expect.objectContaining({ source: "audit_event" })]),
        summary: { auditEvents: 1, openItems: 1 },
      });

    const firstCall = fetchImpl.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(String(firstCall[0])).toBe(
      "https://api.yorso.test/v1/admin/incidents?limit=25&assigned=assigned&escalationLevel=engineering&severity=high&slaStatus=breached&source=audit&status=open",
    );
    const headers = firstCall[1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000099");
    expect(headers.get("x-yorso-session-id")).toBe("session-admin-incidents");
    expect(String(fetchImpl.mock.calls[1][0])).toContain("/acknowledge");
    expect(String(fetchImpl.mock.calls[2][0])).toContain("/workflow");
    expect(String(fetchImpl.mock.calls[3][0])).toContain("/workflow/bulk");
    expect(String(fetchImpl.mock.calls[4][0])).toContain("/v1/admin/incidents/audit%3Aadmin-blocked%3Av1-admin-audit-events");
    expect(String(fetchImpl.mock.calls[5][0])).toContain("/export?format=json");
    expect(String(fetchImpl.mock.calls[6][0])).toContain("/export?format=csv");
    expect(String(fetchImpl.mock.calls[7][0])).toContain("/handoff?format=json");
    expect(String(fetchImpl.mock.calls[8][0])).toContain("/handoff?format=markdown");
    expect(String(fetchImpl.mock.calls[9][0])).toContain("/remediation");
    expect(String(fetchImpl.mock.calls[10][0])).toContain("/postmortem?format=json");
    expect(String(fetchImpl.mock.calls[11][0])).toContain("/postmortem?format=markdown");
    expect(String(fetchImpl.mock.calls[12][0])).toContain("/execution");
    expect(String(fetchImpl.mock.calls[13][0])).toContain("/execution/export?format=json");
    expect(String(fetchImpl.mock.calls[14][0])).toContain("/execution/export?format=csv");
    expect(String(fetchImpl.mock.calls[15][0])).toContain("/execution/remediation%3A01%3Aconfirm-scope");
    expect(String(fetchImpl.mock.calls[16][0])).toContain("/execution-queue?limit=50");
    expect(String(fetchImpl.mock.calls[16][0])).toContain("overdueOnly=true");
    expect(String(fetchImpl.mock.calls[17][0])).toContain("/execution-queue/export?format=json");
    expect(String(fetchImpl.mock.calls[18][0])).toContain("/execution-queue/export?format=csv");
    expect(String(fetchImpl.mock.calls[19][0])).toContain("/execution-queue/bulk");
    expect(String(fetchImpl.mock.calls[20][0])).toContain("/execution-workload?limit=20");
    expect(String(fetchImpl.mock.calls[20][0])).toContain("overdueOnly=true");
    expect(String(fetchImpl.mock.calls[21][0])).toContain("/execution-workload/export?format=json");
    expect(String(fetchImpl.mock.calls[22][0])).toContain("/execution-workload/export?format=csv");
    expect(String(fetchImpl.mock.calls[23][0])).toContain("/execution-workload/forecast?");
    expect(String(fetchImpl.mock.calls[23][0])).toContain("limit=20");
    expect(String(fetchImpl.mock.calls[23][0])).toContain("horizonHours=24");
    expect(String(fetchImpl.mock.calls[24][0])).toContain("/correlation?limit=25");
  });

  it("maps admin role and invalid response failures", async () => {
    const forbiddenClient = createAdminIncidentsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: "admin_role_required" } }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-incidents",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(forbiddenClient.list()).rejects.toMatchObject({
      code: "admin_role_required",
      status: 403,
    });

    const invalidClient = createAdminIncidentsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ ok: true, incidents: null }), {
          headers: { "content-type": "application/json" },
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-incidents",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(invalidClient.list()).rejects.toBeInstanceOf(AdminIncidentsApiError);
    await expect(invalidClient.list()).rejects.toMatchObject({
      code: "admin_incidents_invalid_response",
    });
  });
});
