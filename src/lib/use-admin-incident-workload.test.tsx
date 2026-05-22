import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminIncidentWorkload } from "@/lib/use-admin-incident-workload";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-incident-workload-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

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

const workloadPayload = () => ({
  generatedAt: "2026-05-20T10:16:00.000Z",
  hotIncidents: [{
    blockedItems: 0,
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
  owners: [
    { assigned: 0, blocked: 0, breachedIncidents: 1, done: 0, immediate: 1, inProgress: 0, loadScore: 24, oldestTargetMinutes: 1, open: 1, overdue: 1, ownerRole: "operator", skipped: 0, total: 1, unassigned: 1 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "engineering", skipped: 0, total: 0, unassigned: 0 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "security", skipped: 0, total: 0, unassigned: 0 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "founder", skipped: 0, total: 0, unassigned: 0 },
  ],
  requestId: "00000000-0000-4000-8000-000000000771",
  sourceMix: [{ blocked: 0, done: 0, inProgress: 0, key: "audit", open: 1, overdue: 1, total: 1 }],
  statusMix: [{ blocked: 0, done: 0, inProgress: 0, key: "open", open: 1, overdue: 1, total: 1 }],
  summary: { assigned: 0, blocked: 0, done: 0, hotIncidentCount: 1, inProgress: 0, loadScore: 24, open: 1, overdue: 1, total: 1, unassigned: 1 },
});

const correlationPayload = () => ({
  auditEvents: [{
    action: "admin.audit_events.read",
    actorUserHash: "sha256:111111111111111111111111",
    auditId: "aud_hook_workload_1",
    correlationId: "corr_hook_workload_1",
    httpMethod: "GET",
    occurredAt: "2026-05-20T10:16:00.000Z",
    outcome: "blocked",
    reason: "admin_role_required",
    requestId: "req_hook_workload_1",
    resourceHash: null,
    resourceType: "admin_audit_events",
    route: "/v1/admin/audit-events",
    sessionHash: "sha256:222222222222222222222222",
    statusCode: 403,
  }],
  executionItems: [],
  generatedAt: "2026-05-20T10:17:00.000Z",
  incident,
  ok: true,
  recommendedNextSteps: ["Compare audit and execution state.", "Record sanitized operator note."],
  requestId: "00000000-0000-4000-8000-000000000772",
  signals: [{ actorUserHash: null, evidence: [{ label: "type", value: "created" }], label: "Timeline created", occurredAt: "2026-05-20T10:00:00.000Z", priority: "next", route: null, source: "timeline_event", status: "open" }],
  summary: { auditEvents: 0, blockedItems: 0, doneItems: 0, openItems: 0, timelineEvents: 1 },
  timeline: incident.timelinePreview,
});

const forecastPayload = () => ({
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
  requestId: "00000000-0000-4000-8000-000000000773",
  summary: {
    capacityRisk: "moderate",
    highestRiskOwnerRole: "operator",
    projectedOpen: 2,
    projectedOverdue: 2,
    recommendedAction: "Moderate capacity risk: monitor operator workload and assign unowned work.",
  },
});

describe("useAdminIncidentWorkload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled without a configured self-hosted API", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminIncidentWorkload(adminSession, { limit: 20 }));

    expect(result.current.status).toBe("disabled");
  });

  it("loads workload filters, exports and correlation drill-down", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async (input) => {
      const url = String(input);
      if (url.includes("/execution-workload/export?format=json")) {
        return new Response(JSON.stringify(workloadPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/execution-workload/export?format=csv")) {
        return new Response("\"incidentId\",\"loadScore\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"24\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/correlation?")) {
        return new Response(JSON.stringify(correlationPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/execution-workload/forecast?")) {
        return new Response(JSON.stringify(forecastPayload()), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(workloadPayload()), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() =>
      useAdminIncidentWorkload(adminSession, {
        limit: 20,
        overdueOnly: true,
        ownerRole: "operator",
        priority: "immediate",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.summary.loadScore).toBe(24);
    expect(String(fetchImpl.mock.calls[0][0])).toContain("execution-workload?limit=20");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("ownerRole=operator");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("priority=immediate");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("overdueOnly=true");

    await expect(result.current.exportJson()).resolves.toMatchObject({ summary: { loadScore: 24 } });
    await expect(result.current.exportCsv()).resolves.toContain("\"incidentId\",\"loadScore\"");

    await act(async () => {
      await result.current.loadCorrelation(incident.id);
    });

    expect(result.current.correlation.status).toBe("ready");
    expect(result.current.correlation.data?.incident.id).toBe(incident.id);

    await act(async () => {
      await result.current.loadForecast(24);
    });

    expect(result.current.forecast.status).toBe("ready");
    expect(result.current.forecast.data?.summary.highestRiskOwnerRole).toBe("operator");
  });
});
