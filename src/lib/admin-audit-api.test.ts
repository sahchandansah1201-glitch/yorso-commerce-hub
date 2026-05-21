import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminAuditApiError,
  createAdminAuditApiClient,
  isAdminAuditApiConfigured,
  type AdminAuditListResponse,
} from "@/lib/admin-audit-api";

const auditPayload = (patch: Partial<AdminAuditListResponse> = {}): AdminAuditListResponse => ({
  events: [
    {
      action: "admin.operations.overview.read",
      actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
      auditId: "aud_1",
      correlationId: "corr_1",
      httpMethod: "GET",
      occurredAt: "2026-05-20T10:00:00.000Z",
      outcome: "success",
      reason: null,
      requestId: "req_1",
      resourceHash: null,
      resourceType: "admin_operations_overview",
      route: "/v1/admin/operations/overview",
      sessionHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
      statusCode: 200,
    },
  ],
  limit: 25,
  nextCursor: null,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000401",
  ...patch,
});

describe("admin-audit-api", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("stays disabled when VITE_YORSO_API_URL is empty", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    expect(isAdminAuditApiConfigured()).toBe(false);
    expect(createAdminAuditApiClient().enabled).toBe(false);
  });

  it("requires a self-hosted session before calling the backend", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createAdminAuditApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
    });

    await expect(client.list()).rejects.toMatchObject({
      code: "admin_audit_session_required",
      status: 401,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends filters with self-hosted session headers", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify(auditPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createAdminAuditApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-audit",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(client.list({ limit: 25, outcome: "blocked", route: "/v1/admin/audit-events", statusClass: "4xx" }))
      .resolves.toMatchObject({
        events: [{ action: "admin.operations.overview.read" }],
        ok: true,
      });

    const firstCall = fetchImpl.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(String(firstCall[0])).toBe(
      "https://api.yorso.test/v1/admin/audit-events?limit=25&outcome=blocked&route=%2Fv1%2Fadmin%2Faudit-events&statusClass=4xx",
    );
    const headers = firstCall[1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000099");
    expect(headers.get("x-yorso-session-id")).toBe("session-admin-audit");
  });

  it("maps admin role and invalid response failures", async () => {
    const forbiddenClient = createAdminAuditApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: "admin_role_required" } }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-audit",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(forbiddenClient.list()).rejects.toMatchObject({
      code: "admin_role_required",
      status: 403,
    });

    const invalidClient = createAdminAuditApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ ok: true, events: null }), {
          headers: { "content-type": "application/json" },
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-audit",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(invalidClient.list()).rejects.toBeInstanceOf(AdminAuditApiError);
    await expect(invalidClient.list()).rejects.toMatchObject({
      code: "admin_audit_invalid_response",
    });
  });
});
