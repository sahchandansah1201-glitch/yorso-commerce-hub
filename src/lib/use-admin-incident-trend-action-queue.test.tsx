import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminIncidentTrendActionQueue } from "@/lib/use-admin-incident-trend-action-queue";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-trend-action-queue-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-22T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const queuePayload = (status: "proposed" | "dismissed" = "proposed") => ({
  actions: [
    {
      acceptedAt: null,
      actionId: "trend:route_risk_review:7d:v1-admin-audit-events",
      decidedByUserHash: status === "proposed" ? null : "sha256:111111111111111111111111",
      description: "Review concentrated admin audit route pressure.",
      dismissedAt: status === "dismissed" ? "2026-05-22T10:10:00.000Z" : null,
      evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
      kind: "route_risk_review",
      loadScore: 144,
      note: status === "dismissed" ? "Bulk trend action queue test." : null,
      ownerRole: "engineering",
      priority: "immediate",
      recommendedAction: "Assign owner and inspect blocked admin route.",
      relatedIncidentIds: ["audit:admin-blocked:/v1/admin/audit-events"],
      route: "/v1/admin/audit-events",
      signal: "Route risk concentration",
      status,
      title: "Review route risk: /v1/admin/audit-events",
    },
  ],
  generatedAt: "2026-05-22T10:08:00.000Z",
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000906",
  summary: {
    accepted: 0,
    dismissed: status === "dismissed" ? 1 : 0,
    immediate: 1,
    proposed: status === "proposed" ? 1 : 0,
    relatedIncidents: 1,
    total: 1,
  },
  window: "7d",
});

describe("useAdminIncidentTrendActionQueue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled without a configured self-hosted API", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminIncidentTrendActionQueue(adminSession, { limit: 50 }));

    expect(result.current.state.status).toBe("disabled");
  });

  it("loads queue filters, exports and bulk decisions without leaking session material", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    let currentStatus: "proposed" | "dismissed" = "proposed";
    const fetchImpl = vi.fn(async (input) => {
      const url = String(input);
      if (url.includes("/trend-action-queue/export") && url.includes("format=csv")) {
        return new Response("\"actionId\",\"status\"\n\"trend:route_risk_review:7d:v1-admin-audit-events\",\"proposed\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/trend-action-queue/export")) {
        return new Response(JSON.stringify(queuePayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trend-action-queue/bulk")) {
        currentStatus = "dismissed";
        return new Response(JSON.stringify({
          failed: [{ actionId: "trend:missing:7d:not-found", code: "admin_incident_trend_action_not_found" }],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000907",
          succeeded: 1,
          timelineEventsCreated: 0,
          updatedActions: queuePayload("dismissed").actions,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(queuePayload(currentStatus)), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() =>
      useAdminIncidentTrendActionQueue(adminSession, {
        decision: "proposed",
        kind: "route_risk_review",
        limit: 50,
        ownerRole: "engineering",
        priority: "immediate",
        window: "7d",
      }),
    );

    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.state.data?.summary.proposed).toBe(1);

    await expect(result.current.exportJson()).resolves.toMatchObject({ limit: 50 });
    await expect(result.current.exportCsv()).resolves.toContain("\"actionId\",\"status\"");

    await act(async () => {
      await result.current.bulkDecide({
        actionIds: [queuePayload().actions[0].actionId, "trend:missing:7d:not-found"],
        decision: "dismiss",
        note: "Bulk trend action queue test.",
      });
    });

    expect(result.current.state.data?.actions[0].status).toBe("dismissed");
    expect(result.current.state.data?.summary.dismissed).toBe(1);
    expect(JSON.stringify(result.current.state.data)).not.toContain(adminSession.identifier);
    expect(JSON.stringify(result.current.state.data)).not.toContain(adminSession.id);

    const urls = fetchImpl.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes("decision=proposed"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue/bulk"))).toBe(true);
  });
});
