import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SupplierTrustPanel from "@/components/offer-detail/SupplierTrustPanel";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import { SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY } from "@/lib/supplier-access-requests";

const offerWithSupplierId = (): SeafoodOffer => ({
  ...mockOffers[0],
  supplier: {
    ...mockOffers[0].supplier,
    id: "sup-no-001",
  },
});

const renderPanel = (
  props: Partial<Parameters<typeof SupplierTrustPanel>[0]> = {},
) => render(
  <LanguageProvider>
    <SupplierTrustPanel
      offer={offerWithSupplierId()}
      accessLevel="registered_locked"
      {...props}
    />
  </LanguageProvider>,
);

describe("SupplierTrustPanel · offer detail access flow", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders one-click supplier access request for registered locked offer detail", async () => {
    const onAccessRequestSent = vi.fn();
    renderPanel({ onAccessRequestSent });

    const cta = screen.getByTestId("supplier-request-price-access");
    fireEvent.click(cta);

    await waitFor(() => expect(onAccessRequestSent).toHaveBeenCalledTimes(1));
    const saved = onAccessRequestSent.mock.calls[0][0];
    expect(saved).toMatchObject({
      supplierId: "sup-no-001",
      status: "sent",
      intent: "exact_price",
    });

    const stored = JSON.parse(localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY) ?? "{}");
    expect(stored["sup-no-001"]).toMatchObject({ status: "sent" });
  });

  it("renders existing sent/pending/approved status instead of a duplicate CTA", () => {
    renderPanel({
      accessRequest: {
        supplierId: "sup-no-001",
        intent: "exact_price",
        status: "pending",
        sentAt: "2026-05-14T10:00:00.000Z",
        pendingAt: "2026-05-14T10:01:00.000Z",
      },
    });

    expect(screen.queryByTestId("supplier-request-price-access")).toBeNull();
    expect(screen.getByTestId("supplier-access-request-status")).toHaveAttribute("data-status", "pending");
  });
});
