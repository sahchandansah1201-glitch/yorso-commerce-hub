import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SupplierAccessRefreshBanner from "@/components/suppliers/SupplierAccessRefreshBanner";
import {
  SUPPLIER_ACCESS_CHANGE_EVENT,
  type SupplierAccessChangeDetail,
} from "@/lib/supplier-access-requests";

const SUPPLIER_ID = "sup-no-001";

const dispatchAccessChange = (detail: SupplierAccessChangeDetail) => {
  act(() => {
    window.dispatchEvent(new CustomEvent(SUPPLIER_ACCESS_CHANGE_EVENT, { detail }));
  });
};

const renderBanner = (onRefresh = vi.fn()) =>
  render(
    <LanguageProvider>
      <SupplierAccessRefreshBanner supplierId={SUPPLIER_ID} onRefresh={onRefresh} />
    </LanguageProvider>,
  );

describe("SupplierAccessRefreshBanner", () => {
  it("shows a localized refresh notice for a matching approval event", () => {
    const onRefresh = vi.fn();
    renderBanner(onRefresh);

    expect(screen.queryByTestId("supplier-access-refresh-banner")).not.toBeInTheDocument();

    dispatchAccessChange({
      changedAt: "2026-05-15T00:00:00.000Z",
      intent: "exact_price",
      source: "backend_notification",
      status: "approved",
      supplierId: SUPPLIER_ID,
    });

    expect(screen.getByTestId("supplier-access-refresh-banner")).toHaveTextContent(
      "Access updated",
    );

    fireEvent.click(screen.getByTestId("supplier-access-refresh-now"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("supplier-access-refresh-banner")).not.toBeInTheDocument();
  });

  it("ignores approved reads and approvals for a different supplier", () => {
    renderBanner();

    dispatchAccessChange({
      changedAt: "2026-05-15T00:00:00.000Z",
      intent: "exact_price",
      source: "backend_read",
      status: "approved",
      supplierId: SUPPLIER_ID,
    });
    dispatchAccessChange({
      changedAt: "2026-05-15T00:00:01.000Z",
      intent: "exact_price",
      source: "backend_notification",
      status: "approved",
      supplierId: "sup-ec-051",
    });

    expect(screen.queryByTestId("supplier-access-refresh-banner")).not.toBeInTheDocument();
  });
});
