/**
 * Focused tests for Supplier Catalog implementation quality fixes:
 *  1. SupplierRow does not render nested <button> inside another <button>.
 *  2. Locked search must not match real companyName (anonymous_locked).
 *  3. Neutral selected panel is reachable until the user picks a supplier.
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
        // No button should have a button ancestor inside the row.
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
    const realName = mockSuppliers[0].companyName; // e.g. "Nordfjord Sjømat AS"
    const search = screen.getByLabelText(/search suppliers/i);
    fireEvent.change(search, { target: { value: realName } });

    // The masked identity for that supplier must not be on screen
    // because the real name shouldn't match in locked mode.
    expect(
      screen.queryByText(mockSuppliers[0].maskedName),
    ).not.toBeInTheDocument();

    // But searching the masked name should match.
    fireEvent.change(search, { target: { value: mockSuppliers[0].maskedName } });
    expect(screen.getByText(mockSuppliers[0].maskedName)).toBeInTheDocument();
  });

  it("shows neutral selected-panel state until the user picks a supplier", () => {
    renderPage();
    // Neutral copy from EmptyState
    expect(
      screen.getByText(/select a supplier to review product focus/i),
    ).toBeInTheDocument();

    // Click first row's selection control
    const firstRow = screen.getAllByTestId("supplier-row")[0];
    const selectBtn = within(firstRow).getByRole("button", {
      name: /select .* to review details/i,
    });
    fireEvent.click(selectBtn);

    expect(
      screen.queryByText(/select a supplier to review product focus/i),
    ).not.toBeInTheDocument();
  });
});
