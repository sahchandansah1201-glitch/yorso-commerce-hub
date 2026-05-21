import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminAuditListResponse } from "@/lib/admin-audit-api";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminAuditEvents } from "@/lib/use-admin-audit-events";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-audit-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const auditPayload = (): AdminAuditListResponse => ({
  events: [
    {
      action: "admin.operations.overview.read",
      actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
      auditId: "aud_hook_1",
      correlationId: "corr_hook_1",
      httpMethod: "GET",
      occurredAt: "2026-05-20T10:00:00.000Z",
      outcome: "success",
      reason: null,
      requestId: "req_hook_1",
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
});

describe("useAdminAuditEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled state without VITE_YORSO_API_URL", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminAuditEvents(adminSession, { limit: 25 }));

    expect(result.current.status).toBe("disabled");
  });

  it("loads audit events and supports refresh", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(auditPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() => useAdminAuditEvents(adminSession, { limit: 25, outcome: "success" }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.events[0]?.action).toBe("admin.operations.overview.read");
    expect(result.current.exportUrl).toContain("format=csv");
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
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

    const { result } = renderHook(() => useAdminAuditEvents(adminSession, { limit: 25 }));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
  });
});
