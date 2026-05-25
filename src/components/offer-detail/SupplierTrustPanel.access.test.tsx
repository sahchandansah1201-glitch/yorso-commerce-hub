import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SupplierTrustPanel from "@/components/offer-detail/SupplierTrustPanel";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import { SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY } from "@/lib/supplier-access-requests";
import type { Language } from "@/i18n/translations";

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

const renderPanelInLanguage = (
  lang: Language,
  props: Partial<Parameters<typeof SupplierTrustPanel>[0]> = {},
) => {
  localStorage.setItem("yorso-lang", lang);
  return renderPanel(props);
};

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

  it("localizes supplier trust labels and qualified CTAs in Russian", () => {
    renderPanelInLanguage("ru", { accessLevel: "qualified_unlocked" });
    const yearsInBusiness = new Date().getFullYear() - offerWithSupplierId().supplier.inBusinessSince;
    const verification = within(screen.getByTestId("offer-detail-supplier-verification"));

    expect(verification.getByText(/Поставщик проверен/)).toBeVisible();
    expect(verification.getByText(/Проверено: March 2025/)).toBeVisible();
    expect(screen.getByText("На рынке")).toBeVisible();
    expect(screen.getByText(new RegExp(`^${yearsInBusiness}\\s`))).toBeVisible();
    expect(screen.getByText("Ответ")).toBeVisible();
    expect(screen.getByText("Сертификаты")).toBeVisible();
    expect(screen.getByText("Проверенные документы")).toBeVisible();
    expect(screen.getByRole("button", { name: "Открыть профиль поставщика" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Связаться с поставщиком/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /В шортлист/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Сравнить похожие предложения/ })).toBeVisible();

    const reviewToggle = verification.getByRole("button", { name: "Что проверено?" });
    fireEvent.click(reviewToggle);
    expect(verification.getByRole("button", { name: "Скрыть детали" })).toBeVisible();

    for (const leaked of [
      "Verified Supplier",
      "Pending Full Verification",
      "What was reviewed?",
      "Hide details",
      "In business",
      "Response",
      "Reviewed documents",
      "View Supplier Profile",
      "Contact Supplier",
      "Save to Shortlist",
      "Compare Similar Offers",
    ]) {
      expect(screen.queryByText(leaked)).toBeNull();
    }
  });

  it("localizes supplier trust labels in Spanish", () => {
    renderPanelInLanguage("es", { accessLevel: "registered_locked" });
    const yearsInBusiness = new Date().getFullYear() - offerWithSupplierId().supplier.inBusinessSince;
    const verification = within(screen.getByTestId("offer-detail-supplier-verification"));

    expect(verification.getByText(/Proveedor verificado/)).toBeVisible();
    expect(verification.getByText(/Verificado: March 2025/)).toBeVisible();
    expect(screen.getByText("En operación")).toBeVisible();
    expect(screen.getByText(`${yearsInBusiness} años`)).toBeVisible();
    expect(screen.getByText("Respuesta")).toBeVisible();
    expect(screen.getByText("Certificaciones")).toBeVisible();

    const reviewToggle = verification.getByRole("button", { name: "¿Qué se revisó?" });
    fireEvent.click(reviewToggle);
    expect(verification.getByRole("button", { name: "Ocultar detalles" })).toBeVisible();

    expect(screen.queryByText("What was reviewed?")).toBeNull();
    expect(screen.queryByText("In business")).toBeNull();
    expect(screen.queryByText("Reviewed documents")).toBeNull();
  });
});
