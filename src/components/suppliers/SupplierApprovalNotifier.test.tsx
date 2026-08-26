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
import {
  acknowledgeSupplierAccessNotifications,
  isSupplierAccessApiConfigured,
  readSupplierAccessNotifications,
} from "@/lib/supplier-access-api";
import {
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import { toast } from "@/hooks/use-toast";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";

vi.mock("@/lib/supplier-access-api", () => ({
  acknowledgeSupplierAccessNotifications: vi.fn(),
  isSupplierAccessApiConfigured: vi.fn(),
  readSupplierAccessNotifications: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const SUPPLIER_ID = "sup-no-001";
const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";

const approvalNotification = {
  id: NOTIFICATION_ID,
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

const renderNotifier = ({ signedIn = true }: { signedIn?: boolean } = {}) => {
  if (signedIn) {
    buyerSession.signIn({
      id: "session-42",
      identifier: "buyer@example.com",
      method: "email",
      source: "self_hosted",
      userId: "00000000-0000-4000-8000-000000000042",
    });
  }
  return render(
    <LanguageProvider>
      <BuyerSessionProvider>
        <MemoryRouter>
          <SupplierApprovalNotifier />
        </MemoryRouter>
      </BuyerSessionProvider>
    </LanguageProvider>,
  );
};

describe("SupplierApprovalNotifier", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    buyerSession.__resetForTests();
    vi.mocked(acknowledgeSupplierAccessNotifications).mockResolvedValue([]);
    vi.mocked(isSupplierAccessApiConfigured).mockReturnValue(true);
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
    buyerSession.__resetForTests();
  });

  it("does not poll protected backend notifications without a buyer session", async () => {
    vi.useFakeTimers();

    renderNotifier({ signedIn: false });
    await act(async () => {
      vi.advanceTimersByTime(BACKEND_NOTIFICATION_POLL_MS * 2);
      await Promise.resolve();
    });

    expect(readSupplierAccessNotifications).not.toHaveBeenCalled();
    expect(acknowledgeSupplierAccessNotifications).not.toHaveBeenCalled();
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
    await waitFor(() => {
      expect(acknowledgeSupplierAccessNotifications).toHaveBeenCalledWith([
        approvalNotification.id,
      ]);
    });
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
    expect(acknowledgeSupplierAccessNotifications).toHaveBeenCalledWith([
      approvalNotification.id,
    ]);
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

    expect(applied).toEqual([approvalNotification.id]);
    expect(readStore()[SUPPLIER_ID]).toMatchObject({ status: "approved" });
    expect(toastSpy).toHaveBeenCalledTimes(1);
  });
});
