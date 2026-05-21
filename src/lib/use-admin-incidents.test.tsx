import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminIncidentListResponse, AdminIncidentSummary } from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminIncidents } from "@/lib/use-admin-incidents";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-incidents-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const incidentSummary = (patch: Partial<AdminIncidentSummary> = {}): AdminIncidentSummary => ({
  acknowledged: 0,
  access: 0,
  assigned: 0,
  assignmentCoveragePct: 0,
  atRisk: 0,
  audit: 0,
  breachRatePct: 100,
  breached: 1,
  critical: 1,
  engineeringEscalations: 0,
  escalated: 0,
  executiveEscalations: 0,
  high: 0,
  leadEscalations: 0,
  open: 1,
  openCritical: 1,
  oldestOpenMinutes: 1,
  policy: 0,
  resolved: 0,
  runtime: 1,
  security: 0,
  total: 1,
  unassigned: 1,
  ...patch,
});

const incidentPayload = (): AdminIncidentListResponse => ({
  incidents: [
    {
      acknowledgedAt: null,
      acknowledgedByUserHash: null,
      assignedAt: null,
      assignedToUserHash: null,
      count: 1,
      description: "Runtime diagnostic warning.",
      dueAt: "2026-05-20T10:15:00.000Z",
      escalatedAt: null,
      escalationLevel: "none",
      evidence: [{ label: "check", value: "session_cache" }],
      firstSeenAt: "2026-05-20T10:00:00.000Z",
      id: "runtime:session_cache",
      lastSeenAt: "2026-05-20T10:00:00.000Z",
      note: null,
      recommendedActions: ["Use Redis session cache."],
      relatedAuditIds: [],
      route: "/v1/admin/runtime/diagnostics",
      runbook: [
        {
          description: "Confirm runtime diagnostic scope.",
          label: "Confirm scope",
          ownerRole: "operator",
          targetMinutes: 5,
        },
      ],
      severity: "critical",
      slaStatus: "breached",
      source: "runtime",
      status: "open",
      timelinePreview: [
        {
          actorUserHash: null,
          assignedToUserHash: null,
          escalationLevel: null,
          eventId: "runtime:session_cache:created",
          note: null,
          occurredAt: "2026-05-20T10:00:00.000Z",
          status: "open",
          type: "created",
        },
      ],
      title: "Session cache runtime",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000503",
  summary: incidentSummary(),
});

describe("useAdminIncidents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled state without VITE_YORSO_API_URL", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminIncidents(adminSession, { limit: 25 }));

    expect(result.current.status).toBe("disabled");
  });

  it("loads incidents and supports acknowledge refresh", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async (input) => {
      const url = String(input);
      if (url.includes("/export?format=json")) {
        return new Response(JSON.stringify({
          count: 1,
          generatedAt: "2026-05-20T10:06:00.000Z",
          incidents: incidentPayload().incidents,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000516",
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/export?format=csv")) {
        return new Response("\"id\",\"status\"\n\"runtime:session_cache\",\"open\"", {
          headers: { "content-type": "text/csv" },
        });
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
          requestId: "00000000-0000-4000-8000-000000000515",
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
          requestId: "00000000-0000-4000-8000-000000000504",
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
          requestId: "00000000-0000-4000-8000-000000000514",
          timeline: incidentPayload().incidents[0].timelinePreview,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(incidentPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() => useAdminIncidents(adminSession, { limit: 25, status: "open" }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.incidents[0]?.title).toBe("Session cache runtime");
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.acknowledge("runtime:session_cache", {
        note: "Checking incident.",
        status: "acknowledged",
      });
    });
    expect(result.current.data?.incidents[0]?.status).toBe("acknowledged");

    await act(async () => {
      await result.current.workflow("runtime:session_cache", {
        action: "assign",
        assignedToUserId: "00000000-0000-4000-8000-000000000099",
        note: "Assigning incident.",
      });
    });
    expect(result.current.data?.incidents[0]?.assignedToUserHash).toBe("sha256:bbbbbbbbbbbbbbbbbbbbbbbb");

    await act(async () => {
      await result.current.bulkWorkflow({
        action: "escalate",
        escalationLevel: "engineering",
        incidentIds: ["runtime:session_cache"],
        note: "Escalate selected.",
      });
    });
    expect(result.current.data?.incidents[0]?.escalationLevel).toBe("engineering");

    await expect(result.current.exportJson()).resolves.toMatchObject({ count: 1 });
    await expect(result.current.exportCsv()).resolves.toContain("runtime:session_cache");

    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(7));
  });

  it("maps 403 responses to forbidden state", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({
          error: { code: "admin_role_required", message: "Admin role is required." },
        }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ),
    );

    const { result } = renderHook(() => useAdminIncidents(adminSession, { limit: 25 }));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
  });
});
