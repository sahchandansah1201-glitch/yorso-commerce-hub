import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminIncidentsApiClient } from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";

const adminSession: BuyerSession = {
  displayName: "Admin Trends",
  id: "session-admin-incident-trends-api",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-22T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const trendsPayload = () => ({
  buckets: [
    {
      acknowledged: 1,
      access: 0,
      atRisk: 1,
      audit: 2,
      breached: 1,
      critical: 1,
      endAt: "2026-05-22T23:59:59.000Z",
      executionBlocked: 1,
      executionDone: 1,
      executionOpen: 2,
      high: 1,
      key: "2026-05-22",
      loadScore: 144,
      open: 2,
      policy: 0,
      resolved: 0,
      runtime: 1,
      security: 0,
      startAt: "2026-05-22T00:00:00.000Z",
      total: 3,
    },
  ],
  generatedAt: "2026-05-22T10:05:00.000Z",
  granularity: "day",
  limit: 30,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000941",
  routeRisks: [
    {
      blocked: 1,
      breached: 1,
      critical: 1,
      loadScore: 144,
      recommendedAction: "Assign owner and inspect blocked admin route.",
      route: "/v1/admin/audit-events",
      total: 3,
    },
  ],
  severityMix: [{ breached: 1, critical: 1, key: "critical", label: "Critical", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  sla: { acknowledgedPct: 33, breachRatePct: 33, breached: 1, openCritical: 1, oldestOpenMinutes: 45, unresolved: 2 },
  sourceMix: [{ breached: 1, critical: 1, key: "audit", label: "Audit", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  statusMix: [{ breached: 1, critical: 1, key: "open", label: "Open", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  summary: {
    averageLoadScore: 144,
    breached: 1,
    critical: 1,
    peakBucketKey: "2026-05-22",
    peakBucketLoadScore: 144,
    total: 3,
    trendDirection: "up",
  },
  window: "7d",
});

const anomaliesPayload = () => ({
  anomalies: [
    {
      baseline: 1,
      current: 3,
      deltaPct: 200,
      evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
      recommendedAction: "Review admin audit route pressure before capacity is saturated.",
      severity: "warning",
      signal: "route_pressure",
    },
  ],
  generatedAt: "2026-05-22T10:06:00.000Z",
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000942",
  summary: { critical: 0, highestSeverity: "warning", warning: 1, watch: 0 },
  window: "7d",
});

const briefingPayload = () => ({
  capacityReview: ["Keep admin audit inspection bounded to indexed route filters."],
  generatedAt: "2026-05-22T10:07:00.000Z",
  ok: true,
  operatorActions: ["Assign the blocked route incident.", "Review route pressure in the next shift."],
  requestId: "00000000-0000-4000-8000-000000000943",
  riskRegister: trendsPayload().routeRisks,
  sections: [
    { body: ["3 incidents in the selected trend window."], title: "Trend snapshot" },
    { body: ["1 critical item remains open."], title: "SLA posture" },
    { body: ["Route /v1/admin/audit-events needs owner review."], title: "Route risk" },
  ],
  summary: {
    headline: "Incident pressure is rising on admin audit routes.",
    highestAnomalySeverity: "warning",
    totalIncidents: 3,
    trendDirection: "up",
  },
  window: "7d",
});

const actionsPayload = () => ({
  actions: [
    {
      acceptedAt: null,
      actionId: "trend:route_risk_review:7d:v1-admin-audit-events",
      decidedByUserHash: null,
      description: "Review concentrated admin audit route pressure.",
      dismissedAt: null,
      evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
      kind: "route_risk_review",
      loadScore: 144,
      note: null,
      ownerRole: "engineering",
      priority: "immediate",
      recommendedAction: "Assign owner and inspect blocked admin route.",
      relatedIncidentIds: ["audit:admin-blocked:/v1/admin/audit-events"],
      route: "/v1/admin/audit-events",
      signal: "Route risk concentration",
      status: "proposed",
      title: "Review route risk: /v1/admin/audit-events",
    },
  ],
  generatedAt: "2026-05-22T10:08:00.000Z",
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000944",
  summary: { accepted: 0, dismissed: 0, immediate: 1, proposed: 1, relatedIncidents: 1, total: 1 },
  window: "7d",
});

const actionDecisionPayload = () => ({
  action: {
    ...actionsPayload().actions[0],
    acceptedAt: "2026-05-22T10:09:00.000Z",
    decidedByUserHash: "sha256:111111111111111111111111",
    status: "accepted",
  },
  affectedIncidents: [],
  decision: "accept",
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000945",
  timelineEventsCreated: 1,
});

describe("admin incident trend API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes trend analytics, exports, anomalies and briefing through self-hosted endpoints", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/trends/export") && url.includes("format=csv")) {
        return new Response("\"key\",\"loadScore\"\n\"2026-05-22\",\"144\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/trends/export")) {
        return new Response(JSON.stringify(trendsPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trends/anomalies")) {
        return new Response(JSON.stringify(anomaliesPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trends/briefing")) {
        return new Response(JSON.stringify(briefingPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trends/actions/") && url.includes("/decision")) {
        return new Response(JSON.stringify(actionDecisionPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trend-action-queue/export") && url.includes("format=csv")) {
        return new Response("\"actionId\",\"status\"\n\"trend:route_risk_review:7d:v1-admin-audit-events\",\"proposed\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/trend-action-queue/export")) {
        return new Response(JSON.stringify({ ...actionsPayload(), limit: 50, offset: 0 }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trend-action-queue/bulk")) {
        return new Response(JSON.stringify({
          failed: [{ actionId: "trend:missing:7d:not-found", code: "admin_incident_trend_action_not_found" }],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000946",
          succeeded: 1,
          timelineEventsCreated: 0,
          updatedActions: [{ ...actionsPayload().actions[0], dismissedAt: "2026-05-22T10:10:00.000Z", status: "dismissed" }],
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trend-action-queue")) {
        return new Response(JSON.stringify({ ...actionsPayload(), limit: 50, offset: 0 }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trends/actions")) {
        return new Response(JSON.stringify(actionsPayload()), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(trendsPayload()), { headers: { "content-type": "application/json" } });
    });
    const client = createAdminIncidentsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
      session: adminSession,
    });

    await expect(client.trends({
      granularity: "day",
      includeResolved: true,
      limit: 30,
      severity: "critical",
      source: "audit",
      status: "open",
      window: "7d",
    })).resolves.toMatchObject({ summary: { trendDirection: "up" } });
    await expect(client.trendsExportJson({ window: "7d" })).resolves.toMatchObject({ buckets: expect.any(Array) });
    await expect(client.trendsExportCsv({ window: "7d" })).resolves.toContain("\"key\",\"loadScore\"");
    await expect(client.trendAnomalies({ window: "7d" })).resolves.toMatchObject({ summary: { highestSeverity: "warning" } });
    await expect(client.trendBriefing({ window: "7d" })).resolves.toMatchObject({ summary: { totalIncidents: 3 } });
    await expect(client.trendActions({ window: "7d" })).resolves.toMatchObject({ summary: { proposed: 1 } });
    await expect(client.decideTrendAction(
      actionsPayload().actions[0].actionId,
      { decision: "accept", note: "Accept bounded trend action." },
      { window: "7d" },
    )).resolves.toMatchObject({ action: { status: "accepted" }, timelineEventsCreated: 1 });
    await expect(client.trendActionQueue({
      decision: "proposed",
      kind: "route_risk_review",
      limit: 50,
      ownerRole: "engineering",
      priority: "immediate",
      window: "7d",
    })).resolves.toMatchObject({ limit: 50, summary: { proposed: 1 } });
    await expect(client.trendActionQueueExportJson({ window: "7d" })).resolves.toMatchObject({ actions: expect.any(Array) });
    await expect(client.trendActionQueueExportCsv({ window: "7d" })).resolves.toContain("\"actionId\",\"status\"");
    await expect(client.bulkDecideTrendActions({
      actionIds: [actionsPayload().actions[0].actionId, "trend:missing:7d:not-found"],
      decision: "dismiss",
      note: "Bulk trend action queue test.",
    }, { window: "7d" })).resolves.toMatchObject({ failed: [{ code: "admin_incident_trend_action_not_found" }], succeeded: 1 });

    const urls = fetchImpl.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain("/v1/admin/incidents/trends?");
    expect(urls[0]).toContain("severity=critical");
    expect(urls[0]).toContain("includeResolved=true");
    expect(urls.some((url) => url.includes("/trends/export") && url.includes("format=json"))).toBe(true);
    expect(urls.some((url) => url.includes("/trends/export") && url.includes("format=csv"))).toBe(true);
    expect(urls.some((url) => url.includes("/trends/anomalies"))).toBe(true);
    expect(urls.some((url) => url.includes("/trends/briefing"))).toBe(true);
    expect(urls.some((url) => url.includes("/trends/actions?"))).toBe(true);
    expect(urls.some((url) => url.includes("/trends/actions/trend%3Aroute_risk_review"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue?") && url.includes("decision=proposed"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue/export") && url.includes("format=json"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue/export") && url.includes("format=csv"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue/bulk"))).toBe(true);
    const headers = fetchImpl.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe(adminSession.userId);
    expect(headers.get("x-yorso-session-id")).toBe(adminSession.id);
  });
});
