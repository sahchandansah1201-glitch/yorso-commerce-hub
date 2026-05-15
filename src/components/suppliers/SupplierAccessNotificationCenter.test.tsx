import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { queueApprovalNotification } from "@/lib/supplier-access-approval";
import { SupplierAccessNotificationBell } from "@/components/suppliers/SupplierAccessNotificationCenter";

const SUPPLIER_ID = "sup-no-001";
const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";

const renderBell = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <SupplierAccessNotificationBell />
      </MemoryRouter>
    </LanguageProvider>,
  );

describe("SupplierAccessNotificationCenter", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("shows self-hosted supplier access notifications and marks them read", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/v1/access/notifications") && init?.method === "PATCH") {
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

    renderBell();

    expect(screen.queryByTestId("header-supplier-access-notifications-count")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("header-supplier-access-notifications-bell"));
    await waitFor(() =>
      expect(screen.getByTestId("header-supplier-access-notifications-count")).toHaveTextContent("1"),
    );

    expect(await screen.findByTestId("supplier-access-notifications-popover")).toHaveTextContent(
      "Access notifications",
    );
    expect(screen.getByTestId(`supplier-access-notification-${NOTIFICATION_ID}`)).toHaveTextContent(
      "Price access approved",
    );

    fireEvent.click(screen.getByTestId("supplier-access-notifications-mark-all"));

    await waitFor(() =>
      expect(screen.queryByTestId("header-supplier-access-notifications-count")).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/access/notifications",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("shows local prototype approval notifications when API is disabled", async () => {
    queueApprovalNotification(SUPPLIER_ID, "2026-05-15T00:00:00.000Z");

    renderBell();

    fireEvent.click(screen.getByTestId("header-supplier-access-notifications-bell"));
    await waitFor(() =>
      expect(screen.getByTestId("header-supplier-access-notifications-count")).toHaveTextContent("1"),
    );

    expect(await screen.findByTestId("supplier-access-notifications-popover")).toHaveTextContent(
      "Prototype mode",
    );
    expect(screen.getByText("Open supplier profile")).toBeInTheDocument();
  });
});
