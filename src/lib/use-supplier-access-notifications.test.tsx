import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queueApprovalNotification } from "@/lib/supplier-access-approval";
import {
  SUPPLIER_ACCESS_CHANGE_EVENT,
  type SupplierAccessChangeDetail,
} from "@/lib/supplier-access-requests";
import { useSupplierAccessNotifications } from "@/lib/use-supplier-access-notifications";

const SUPPLIER_ID = "sup-no-001";
const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";

const dispatchApprovalChange = () => {
  const detail: SupplierAccessChangeDetail = {
    changedAt: "2026-05-15T00:00:00.000Z",
    intent: "exact_price",
    source: "backend_notification",
    status: "approved",
    supplierId: SUPPLIER_ID,
  };
  act(() => {
    window.dispatchEvent(new CustomEvent(SUPPLIER_ACCESS_CHANGE_EVENT, { detail }));
  });
};

describe("useSupplierAccessNotifications", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads and acknowledges self-hosted access notifications", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/v1/access/notifications") && init?.method === "PATCH") {
        expect(JSON.parse(String(init.body))).toEqual({
          notificationIds: [NOTIFICATION_ID],
        });
        return new Response(JSON.stringify({
          ok: true,
          notifications: [{
            id: NOTIFICATION_ID,
            buyerUserId: "00000000-0000-4000-8000-000000000001",
            supplierId: SUPPLIER_ID,
            type: "price_access_approved",
            title: "Price access approved",
            body: "Approved",
            status: "read",
            createdAt: "2026-05-15T00:00:00.000Z",
            readAt: "2026-05-15T00:01:00.000Z",
          }],
          markedReadCount: 1,
          requestId: "ack",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({
        ok: true,
        notifications: [{
          id: NOTIFICATION_ID,
          buyerUserId: "00000000-0000-4000-8000-000000000001",
          supplierId: SUPPLIER_ID,
          type: "price_access_approved",
          title: "Price access approved",
          body: "Approved",
          status: "unread",
          createdAt: "2026-05-15T00:00:00.000Z",
          readAt: null,
        }],
        requestId: "list",
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSupplierAccessNotifications());

    await waitFor(() => expect(result.current.unreadCount).toBe(1));
    await act(async () => {
      await result.current.markAllRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0]).toMatchObject({
      id: NOTIFICATION_ID,
      status: "read",
      source: "self_hosted",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/access/notifications",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("uses local approval notifications when self-hosted API is disabled", async () => {
    queueApprovalNotification(SUPPLIER_ID, "2026-05-15T00:00:00.000Z");

    const { result } = renderHook(() => useSupplierAccessNotifications());

    await waitFor(() => expect(result.current.status).toBe("local"));
    expect(result.current.notifications[0]).toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "unread",
      source: "local_mock",
    });

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(result.current.notifications[0]).toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "read",
    });
  });

  it("refreshes the feed after supplier access approval events", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        ok: true,
        notifications: [],
        requestId: "list",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useSupplierAccessNotifications());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    dispatchApprovalChange();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
