/**
 * Regression: /suppliers search must respect access level.
 *
 * In locked levels (anonymous_locked, registered_locked), the search
 * filter must NOT match against hidden fields:
 *   - companyName (real legal name)
 *   - about (full description)
 *   - website
 *   - whatsapp
 *
 * In qualified_unlocked, the same query MUST match these fields and
 * leave the matching supplier visible.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import Suppliers from "@/pages/Suppliers";
import { mockSuppliers } from "@/data/mockSuppliers";
import { setQualified } from "@/lib/access-level";
import { buyerSession } from "@/lib/buyer-session";

const target = mockSuppliers[0]; // Nordfjord Sjømat AS — has website + whatsapp + about + companyName

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

const search = (q: string) => {
  const input = screen.getByRole("searchbox");
  fireEvent.change(input, { target: { value: q } });
};

const visibleRowCount = () => screen.queryAllByTestId("supplier-row").length;

describe("/suppliers search · respects access level", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    buyerSession.signOut?.();
    setQualified(false);
  });

  describe("anonymous_locked", () => {
    it("does not match companyName", () => {
      renderPage();
      search(target.companyName);
      expect(visibleRowCount()).toBe(0);
    });
    it("does not match about", () => {
      renderPage();
      const aboutFragment = target.about.split(/\s+/).slice(0, 6).join(" ");
      search(aboutFragment);
      expect(visibleRowCount()).toBe(0);
    });
    it("does not match website", () => {
      renderPage();
      search(target.website!);
      expect(visibleRowCount()).toBe(0);
    });
    it("does not match whatsapp", () => {
      renderPage();
      search(target.whatsapp!);
      expect(visibleRowCount()).toBe(0);
    });
  });

  describe("registered_locked", () => {
    beforeEach(() => {
      buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    });
    it("does not match companyName", () => {
      renderPage();
      search(target.companyName);
      expect(visibleRowCount()).toBe(0);
    });
    it("does not match website", () => {
      renderPage();
      search(target.website!);
      expect(visibleRowCount()).toBe(0);
    });
    it("does not match whatsapp", () => {
      renderPage();
      search(target.whatsapp!);
      expect(visibleRowCount()).toBe(0);
    });
  });

  describe("qualified_unlocked", () => {
    beforeEach(() => {
      buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
      setQualified(true, "Test Supplier");
    });
    it("matches companyName", () => {
      renderPage();
      search(target.companyName);
      const rows = screen.getAllByTestId("supplier-row");
      expect(rows.length).toBe(1);
    });
    it("matches website", () => {
      renderPage();
      search(target.website!);
      const rows = screen.getAllByTestId("supplier-row");
      expect(rows.length).toBe(1);
    });
    it("matches whatsapp", () => {
      renderPage();
      search(target.whatsapp!);
      const rows = screen.getAllByTestId("supplier-row");
      expect(rows.length).toBe(1);
    });
    it("matches about fragment", () => {
      renderPage();
      const aboutFragment = target.about.split(/\s+/).slice(0, 6).join(" ");
      search(aboutFragment);
      const rows = screen.getAllByTestId("supplier-row");
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });
  });
});
