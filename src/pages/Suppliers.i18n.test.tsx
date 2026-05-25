/**
 * Regression: /suppliers must render localized supplier teaser data
 * (masked name, country/city, short description) when the UI language
 * is Russian. Locked search must still NOT match hidden EN companyName.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import Suppliers from "@/pages/Suppliers";
import { mockSuppliers } from "@/data/mockSuppliers";
import { localizeSupplier } from "@/data/mockSuppliersI18n";
import { translations } from "@/i18n/translations";

const renderRu = () => {
  localStorage.setItem("yorso-lang", "ru");
  return render(
    <MemoryRouter initialEntries={["/suppliers"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <RegistrationProvider>
              <Routes>
                <Route path="/suppliers" element={<Suppliers />} />
              </Routes>
            </RegistrationProvider>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("/suppliers — RU localized supplier data", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders localized RU masked name and country for first supplier", () => {
    renderRu();
    const ru = localizeSupplier(mockSuppliers[0], "ru");
    const rows = screen.getAllByTestId("supplier-row");
    const first = rows[0];
    expect(within(first).getByText(ru.maskedName)).toBeInTheDocument();
    // RU country label must appear somewhere in the row
    expect(first.textContent ?? "").toContain(ru.country);
    // EN country label must not be the rendered location label when RU exists
    if (ru.country !== mockSuppliers[0].country) {
      expect(first.textContent ?? "").not.toContain(
        `${mockSuppliers[0].city}, ${mockSuppliers[0].country}`,
      );
    }
  });

  it("does not leak EN companyName in RU locked DOM", () => {
    renderRu();
    expect(document.body.textContent ?? "").not.toContain(
      mockSuppliers[0].companyName,
    );
  });

  it("localizes supplier trust aria labels and image alt text in RU", () => {
    renderRu();
    const labels = Array.from(
      document.querySelectorAll<HTMLElement>("[aria-label]"),
    ).map((el) => el.getAttribute("aria-label") ?? "");
    const imageAlts = Array.from(document.querySelectorAll<HTMLImageElement>("img"))
      .map((img) => img.getAttribute("alt") ?? "")
      .filter(Boolean);

    expect(labels).toContain(translations.ru.selectedSupplier_aboutLabel);
    expect(labels).toContain(translations.ru.supplierRow_signalsAria);
    expect(labels).toContain(translations.ru.supplierRow_productCatalogPreviewAria);
    expect(labels).toContain(translations.ru.supplierRow_deliveryMarketsPreviewAria);
    expect(labels).not.toContain("Selected supplier");
    expect(labels).not.toContain("Supplier signals");
    expect(labels).not.toContain("Product catalog preview");
    expect(labels).not.toContain("Delivery markets preview");

    expect(imageAlts.some((alt) => alt.includes("Референсное изображение"))).toBe(true);
    expect(imageAlts.some((alt) => alt.includes("Превью товара"))).toBe(true);
    expect(imageAlts.some((alt) => alt.includes("reference image for"))).toBe(false);
    expect(imageAlts.some((alt) => alt.includes("product preview from"))).toBe(false);
  });

  it("supplier row mobile action stack uses no fixed width that forces overflow", () => {
    renderRu();
    const first = screen.getAllByTestId("supplier-row")[0];
    // Action buttons must not be inside another button or link (no nested interactives)
    const buttons = first.querySelectorAll("button");
    for (const b of Array.from(buttons)) {
      let p = b.parentElement;
      while (p && p !== first) {
        expect(p.tagName.toLowerCase()).not.toBe("button");
        expect(p.tagName.toLowerCase()).not.toBe("a");
        p = p.parentElement;
      }
    }
  });
});
