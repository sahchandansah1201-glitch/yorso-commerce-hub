/**
 * Focused regression tests for Supplier Catalog (/suppliers):
 *  1. SupplierRow does not render nested <button> inside another <button>.
 *  2. Locked search must not match real companyName (anonymous_locked).
 *  3. Qualified search MAY match real companyName (qualified_unlocked).
 *  4. Neutral selected-panel state visible until user picks a supplier.
 *  5. Product preview images render with meaningful alt text.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import Suppliers from "@/pages/Suppliers";
import { mockSuppliers } from "@/data/mockSuppliers";
import { BUYER_SESSION_STORAGE_KEY } from "@/lib/buyer-session";
import { setQualified } from "@/lib/access-level";

const renderPage = () =>
  render(
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

const seedQualifiedSession = () => {
  sessionStorage.setItem(
    BUYER_SESSION_STORAGE_KEY,
    JSON.stringify({
      id: "test-buyer",
      identifier: "buyer@example.com",
      method: "email",
      signedInAt: new Date().toISOString(),
      displayName: "Test Buyer",
    }),
  );
  setQualified(true, "Test Supplier");
};

describe("/suppliers — implementation quality fixes", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("does not render nested <button> elements inside supplier rows", () => {
    renderPage();
    const rows = screen.getAllByTestId("supplier-row");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const buttons = row.querySelectorAll("button");
      for (const btn of Array.from(buttons)) {
        let parent = btn.parentElement;
        while (parent && parent !== row) {
          expect(parent.tagName.toLowerCase()).not.toBe("button");
          parent = parent.parentElement;
        }
      }
    }
  });

  it("locked search does not match the real companyName", () => {
    renderPage();
    const search = screen.getByLabelText(/search suppliers/i);
    // Search for distinctive token from the real (hidden) company name.
    fireEvent.change(search, { target: { value: "Nordfjord" } });

    expect(
      screen.queryByText(mockSuppliers[0].maskedName),
    ).not.toBeInTheDocument();

    // Visible masked identity / category should still match.
    fireEvent.change(search, { target: { value: "Norwegian salmon" } });
    expect(screen.getByText(mockSuppliers[0].maskedName)).toBeInTheDocument();
  });

  it("qualified_unlocked search matches the real companyName", () => {
    seedQualifiedSession();
    renderPage();

    const search = screen.getByLabelText(/search suppliers/i);
    fireEvent.change(search, { target: { value: "Nordfjord" } });

    // In qualified state, the real company name is displayed in the row.
    expect(screen.getByText(mockSuppliers[0].companyName)).toBeInTheDocument();
  });

  it("shows neutral selected-panel state until the user picks a supplier", () => {
    renderPage();
    expect(
      screen.getByText(/select a supplier to review product focus/i),
    ).toBeInTheDocument();

    const firstRow = screen.getAllByTestId("supplier-row")[0];
    const selectBtn = within(firstRow).getByRole("button", {
      name: /select .* to review details/i,
    });
    fireEvent.click(selectBtn);

    expect(
      screen.queryByText(/select a supplier to review product focus/i),
    ).not.toBeInTheDocument();
  });

  it("renders at least one product preview image per supplier with productPreviewImages", () => {
    renderPage();
    const firstRow = screen.getAllByTestId("supplier-row")[0];
    const imgs = within(firstRow).getAllByRole("img");
    expect(imgs.length).toBeGreaterThan(0);

    const alt = imgs[0].getAttribute("alt") ?? "";
    // Alt text should reference a species and the displayed (masked here) name.
    expect(alt).toContain(mockSuppliers[0].productFocus[0].species);
    expect(alt).toContain(mockSuppliers[0].maskedName);
  });

  it("does not leak exact supplier catalog breadth in locked states", () => {
    renderPage();
    const supplier = mockSuppliers[0];
    const hidden = supplier.totalProductsCount - 3;
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(`${supplier.totalProductsCount} products`);
    expect(body).not.toContain(`+${hidden} products`);
    expect(body).not.toContain(`+${hidden} more products`);
  });

  it("shows exact catalog breadth in qualified_unlocked", () => {
    seedQualifiedSession();
    renderPage();
    const supplier = mockSuppliers[0];
    const firstRow = screen.getAllByTestId("supplier-row")[0];
    const selectBtn = within(firstRow).getByRole("button", {
      name: /select .* to review details/i,
    });
    fireEvent.click(selectBtn);

    const body = document.body.textContent ?? "";
    expect(body).toContain(`${supplier.totalProductsCount} products`);
  });

  it("does not leak exact delivery geography in locked states", () => {
    renderPage();
    const supplier = mockSuppliers[0];
    const hiddenRow = supplier.deliveryCountriesTotal - 3;
    const hiddenPanel = supplier.deliveryCountriesTotal - 6;

    const firstRow = screen.getAllByTestId("supplier-row")[0];
    const selectBtn = within(firstRow).getByRole("button", {
      name: /select .* to review details/i,
    });
    fireEvent.click(selectBtn);

    const body = document.body.textContent ?? "";
    expect(body).not.toContain(`${supplier.deliveryCountriesTotal} countries`);
    if (hiddenRow > 0) expect(body).not.toContain(`+${hiddenRow} markets`);
    if (hiddenPanel > 0) expect(body).not.toContain(`+${hiddenPanel} markets`);
    expect(body).toMatch(/Delivery preview/i);
    expect(body).toMatch(/Full delivery geography after supplier approval/i);
  });

  it("shows exact delivery geography in qualified_unlocked", () => {
    seedQualifiedSession();
    renderPage();
    const supplier = mockSuppliers[0];
    const firstRow = screen.getAllByTestId("supplier-row")[0];
    const selectBtn = within(firstRow).getByRole("button", {
      name: /select .* to review details/i,
    });
    fireEvent.click(selectBtn);

    const body = document.body.textContent ?? "";
    expect(body).toContain(`${supplier.deliveryCountriesTotal} countries`);
  });
});
