import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminSupplierDocumentAuditListResponse } from "@/lib/admin-supplier-document-audit-api";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminSupplierDocumentAudit } from "@/lib/use-admin-supplier-document-audit";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-document-audit-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-31T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const auditPayload = (): AdminSupplierDocumentAuditListResponse => ({
  items: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      expiresAt: "2026-05-31T08:15:00.000Z",
      grantedAt: "2026-05-31T08:00:00.000Z",
      id: "sdg_hook_1",
      reason: "granted",
      requestId: "req_hook_1",
      status: "granted",
      supplierId: "sup-no-001",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000401",
});

describe("useAdminSupplierDocumentAudit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled state without VITE_YORSO_API_URL", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminSupplierDocumentAudit(adminSession, "download_grants", { limit: 25 }));

    expect(result.current.status).toBe("disabled");
  });

  it("loads audit rows and supports refresh", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(auditPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() =>
      useAdminSupplierDocumentAudit(adminSession, "download_grants", { limit: 25, status: "granted" }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.items[0]?.id).toBe("sdg_hook_1");
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

    const { result } = renderHook(() => useAdminSupplierDocumentAudit(adminSession, "download_events", { limit: 25 }));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
  });
});
