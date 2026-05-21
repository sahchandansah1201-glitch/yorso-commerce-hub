import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  isAdminIncidentsApiConfigured,
  type AdminIncidentListResponse,
} from "@/lib/admin-incidents-api";

const incidentPayload = (patch: Partial<AdminIncidentListResponse> = {}): AdminIncidentListResponse => ({
  incidents: [
    {
      acknowledgedAt: null,
      acknowledgedByUserHash: null,
      count: 2,
      description: "Blocked admin route access.",
      evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
      firstSeenAt: "2026-05-20T10:00:00.000Z",
      id: "audit:admin-blocked:v1-admin-audit-events",
      lastSeenAt: "2026-05-20T10:01:00.000Z",
      note: null,
      recommendedActions: ["Confirm admin role."],
      relatedAuditIds: ["aud_1"],
      route: "/v1/admin/audit-events",
      severity: "high",
      source: "audit",
      status: "open",
      title: "Blocked admin route access",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000501",
  summary: {
    acknowledged: 0,
    critical: 0,
    high: 1,
    open: 1,
    resolved: 0,
    total: 1,
  },
  ...patch,
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

    await expect(client.list({ limit: 25, severity: "high", source: "audit", status: "open" }))
      .resolves.toMatchObject({ incidents: [{ id: "audit:admin-blocked:v1-admin-audit-events" }] });
    await expect(client.acknowledge("audit:admin-blocked:v1-admin-audit-events", {
      note: "Checking incident.",
      status: "acknowledged",
    })).resolves.toMatchObject({ incident: { status: "acknowledged" } });

    const firstCall = fetchImpl.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(String(firstCall[0])).toBe(
      "https://api.yorso.test/v1/admin/incidents?limit=25&severity=high&source=audit&status=open",
    );
    const headers = firstCall[1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000099");
    expect(headers.get("x-yorso-session-id")).toBe("session-admin-incidents");
    expect(String(fetchImpl.mock.calls[1][0])).toContain("/acknowledge");
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
