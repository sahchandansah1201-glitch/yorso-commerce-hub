import { act, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { SupplierApprovalNotifier } from "@/components/suppliers/SupplierApprovalNotifier";
import {
  BACKEND_NOTIFICATION_POLL_MS,
  BACKEND_NOTIFICATION_SEEN_KEY,
  MOCK_ACCESS_TICK_MS,
  applyBackendSupplierAccessNotifications,
} from "@/lib/supplier-approval-notifications";
import { readSupplierAccessNotifications } from "@/lib/supplier-access-api";
import {
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import { toast } from "@/hooks/use-toast";

vi.mock("@/lib/supplier-access-api", () => ({
  readSupplierAccessNotifications: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const SUPPLIER_ID = "sup-no-001";

const approvalNotification = {
  id: "notif-1",
  supplierId: SUPPLIER_ID,
  type: "price_access_approved" as const,
  title: "Price access approved",
  body: "Approved",
  status: "unread" as const,
  createdAt: "2026-05-14T00:10:00.000Z",
  readAt: null,
};

const readStore = () =>
  JSON.parse(
    localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY) ?? "{}",
  ) as Record<string, SupplierAccessRequest>;

const renderNotifier = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <SupplierApprovalNotifier />
      </MemoryRouter>
    </LanguageProvider>,
  );

describe("SupplierApprovalNotifier", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(readSupplierAccessNotifications).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    localStorage.clear();
    sessionStorage.clear();
  });

  it("applies self-hosted approval notifications to local access state", async () => {
    vi.mocked(readSupplierAccessNotifications).mockResolvedValue([approvalNotification]);

    renderNotifier();

    await waitFor(() => {
      expect(readStore()[SUPPLIER_ID]).toMatchObject({
        status: "approved",
        supplierId: SUPPLIER_ID,
        intent: "exact_price",
        approvedAt: approvalNotification.createdAt,
      });
    });
    expect(toast).toHaveBeenCalledWith({
      title: "Price access approved",
      description: "You can now view exact prices and supplier details.",
    });
    expect(JSON.parse(localStorage.getItem(BACKEND_NOTIFICATION_SEEN_KEY) ?? "[]")).toEqual([
      approvalNotification.id,
    ]);
  });

  it("does not re-apply already seen backend notifications", async () => {
    localStorage.setItem(
      BACKEND_NOTIFICATION_SEEN_KEY,
      JSON.stringify([approvalNotification.id]),
    );
    vi.mocked(readSupplierAccessNotifications).mockResolvedValue([approvalNotification]);

    renderNotifier();

    await waitFor(() => expect(readSupplierAccessNotifications).toHaveBeenCalledTimes(1));
    expect(readStore()[SUPPLIER_ID]).toBeUndefined();
    expect(toast).not.toHaveBeenCalled();
  });

  it("keeps backend notification polling separate from the fast local mock tick", async () => {
    vi.useFakeTimers();
    vi.mocked(readSupplierAccessNotifications).mockResolvedValue([]);

    renderNotifier();
    await act(async () => {
      await Promise.resolve();
    });
    expect(readSupplierAccessNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(MOCK_ACCESS_TICK_MS * 3);
      await Promise.resolve();
    });
    expect(readSupplierAccessNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(BACKEND_NOTIFICATION_POLL_MS);
      await Promise.resolve();
    });
    expect(readSupplierAccessNotifications).toHaveBeenCalledTimes(2);
  });

  it("syncs backend notifications when a hidden tab becomes visible", async () => {
    vi.mocked(readSupplierAccessNotifications).mockResolvedValue([]);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    renderNotifier();
    expect(readSupplierAccessNotifications).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    window.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => expect(readSupplierAccessNotifications).toHaveBeenCalledTimes(1));
  });

  it("exposes a pure applier for access-state tests", () => {
    const toastSpy = vi.fn();

    const applied = applyBackendSupplierAccessNotifications(
      [approvalNotification],
      toastSpy,
    );

    expect(applied).toBe(1);
    expect(readStore()[SUPPLIER_ID]).toMatchObject({ status: "approved" });
    expect(toastSpy).toHaveBeenCalledTimes(1);
  });
});
