import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminIncidentListResponse } from "@/lib/admin-incidents-api";
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

const incidentPayload = (): AdminIncidentListResponse => ({
  incidents: [
    {
      acknowledgedAt: null,
      acknowledgedByUserHash: null,
      count: 1,
      description: "Runtime diagnostic warning.",
      evidence: [{ label: "check", value: "session_cache" }],
      firstSeenAt: "2026-05-20T10:00:00.000Z",
      id: "runtime:session_cache",
      lastSeenAt: "2026-05-20T10:00:00.000Z",
      note: null,
      recommendedActions: ["Use Redis session cache."],
      relatedAuditIds: [],
      route: "/v1/admin/runtime/diagnostics",
      severity: "critical",
      source: "runtime",
      status: "open",
      title: "Session cache runtime",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000503",
  summary: { acknowledged: 0, critical: 1, high: 0, open: 1, resolved: 0, total: 1 },
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

    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
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
