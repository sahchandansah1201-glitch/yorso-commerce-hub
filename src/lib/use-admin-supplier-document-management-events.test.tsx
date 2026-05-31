import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminSupplierDocumentManagementEventsListResponse } from "@/lib/admin-supplier-document-management-events-api";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminSupplierDocumentManagementEvents } from "@/lib/use-admin-supplier-document-management-events";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-management-events-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-31T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const eventsPayload = (): AdminSupplierDocumentManagementEventsListResponse => ({
  items: [
    {
      action: "supplier_document.approve",
      actorRole: "admin",
      actorUserId: "00000000-0000-4000-8000-000000000099",
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      id: "sdme_hook_1",
      nextStatus: "approved",
      previousStatus: "review",
      reason: "Approved for buyer visibility",
      requestId: "req_hook_1",
      supplierId: "sup-no-001",
    },
  ],
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000451",
});

describe("useAdminSupplierDocumentManagementEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled state without VITE_YORSO_API_URL", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminSupplierDocumentManagementEvents(adminSession, { limit: 50 }));

    expect(result.current.status).toBe("disabled");
  });

  it("loads management events and supports refresh", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(eventsPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() =>
      useAdminSupplierDocumentManagementEvents(adminSession, {
        action: "supplier_document.approve",
        limit: 50,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.items[0]?.id).toBe("sdme_hook_1");
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

    const { result } = renderHook(() => useAdminSupplierDocumentManagementEvents(adminSession, { limit: 50 }));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
  });
});
