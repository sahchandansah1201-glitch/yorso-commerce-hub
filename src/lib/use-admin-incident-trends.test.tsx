import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminIncidentTrends } from "@/lib/use-admin-incident-trends";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-incident-trends-hook",
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
  requestId: "00000000-0000-4000-8000-000000000901",
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
  requestId: "00000000-0000-4000-8000-000000000902",
  summary: { critical: 0, highestSeverity: "warning", warning: 1, watch: 0 },
  window: "7d",
});

const briefingPayload = () => ({
  capacityReview: ["Keep admin audit inspection bounded to indexed route filters."],
  generatedAt: "2026-05-22T10:07:00.000Z",
  ok: true,
  operatorActions: ["Assign the blocked route incident.", "Review route pressure in the next shift."],
  requestId: "00000000-0000-4000-8000-000000000903",
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
  requestId: "00000000-0000-4000-8000-000000000904",
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
  requestId: "00000000-0000-4000-8000-000000000905",
  timelineEventsCreated: 1,
});

describe("useAdminIncidentTrends", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled without a configured self-hosted API", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminIncidentTrends(adminSession, { limit: 30 }));

    expect(result.current.status).toBe("disabled");
  });

  it("loads trend filters, exports, anomalies, briefing and trend action proposals without leaking session material", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async (input) => {
      const url = String(input);
      if (url.includes("/trends/export") && url.includes("format=json")) {
        return new Response(JSON.stringify(trendsPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trends/export") && url.includes("format=csv")) {
        return new Response("\"key\",\"loadScore\"\n\"2026-05-22\",\"144\"", {
          headers: { "content-type": "text/csv" },
        });
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
      if (url.includes("/trends/actions")) {
        return new Response(JSON.stringify(actionsPayload()), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(trendsPayload()), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() =>
      useAdminIncidentTrends(adminSession, {
        granularity: "day",
        includeResolved: true,
        limit: 30,
        severity: "critical",
        source: "audit",
        status: "open",
        window: "7d",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.summary.averageLoadScore).toBe(144);
    expect(String(fetchImpl.mock.calls[0][0])).toContain("/v1/admin/incidents/trends?");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("source=audit");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("severity=critical");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("includeResolved=true");

    await expect(result.current.exportJson()).resolves.toMatchObject({ summary: { trendDirection: "up" } });
    await expect(result.current.exportCsv()).resolves.toContain("\"key\",\"loadScore\"");

    await act(async () => {
      await result.current.loadAnomalies();
    });
    expect(result.current.anomalies.status).toBe("ready");
    expect(result.current.anomalies.data?.summary.highestSeverity).toBe("warning");

    await act(async () => {
      await result.current.loadBriefing();
    });
    expect(result.current.briefing.status).toBe("ready");
    expect(result.current.briefing.data?.summary.headline).toContain("Incident pressure");

    await act(async () => {
      await result.current.loadActions();
    });
    expect(result.current.actions.status).toBe("ready");
    expect(result.current.actions.data?.summary.proposed).toBe(1);

    await act(async () => {
      await result.current.decideAction(actionsPayload().actions[0].actionId, {
        decision: "accept",
        note: "Accept bounded trend action.",
      });
    });
    expect(result.current.actions.data?.actions[0].status).toBe("accepted");
    expect(result.current.actions.data?.summary.accepted).toBe(1);

    expect(JSON.stringify(result.current.data)).not.toContain(adminSession.identifier);
    expect(JSON.stringify(result.current.data)).not.toContain(adminSession.id);
  });
});
