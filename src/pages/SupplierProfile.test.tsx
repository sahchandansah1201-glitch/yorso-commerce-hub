/**
 * SupplierProfile — clean-sheet trading dossier tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import SupplierProfile from "./SupplierProfile";
import { mockSuppliers } from "@/data/mockSuppliers";
import { setQualified } from "@/lib/access-level";
import { buyerSession } from "@/lib/buyer-session";

const supplier = mockSuppliers[0]; // sup-no-001 / Nordfjord Sjømat AS

const renderAt = (path = `/suppliers/${supplier.id}`) =>
  render(
    <LanguageProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/suppliers/:supplierId" element={<SupplierProfile />} />
            </Routes>
          </BuyerSessionProvider>
        </MemoryRouter>
      </TooltipProvider>
    </LanguageProvider>,
  );

const resetSession = () => {
  try {
    sessionStorage.clear();
    localStorage.clear();
  } catch {
    /* ignore */
  }
  buyerSession.signOut();
};

describe("SupplierProfile (clean-sheet)", () => {
  beforeEach(() => {
    resetSession();
  });

  it("renders the supplier profile route and main scaffolding", () => {
    renderAt();
    expect(screen.getByTestId("supplier-profile-main-content")).toBeInTheDocument();
    expect(screen.getByTestId("supplier-trading-dossier")).toBeInTheDocument();
  });

  it("renders the access panel inside the trading dossier", () => {
    renderAt();
    const dossier = screen.getByTestId("supplier-trading-dossier");
    const panel = within(dossier).getByTestId("supplier-profile-access-panel");
    expect(panel).toBeInTheDocument();
  });

  it("locks supplier identity and contact channels for anonymous users", () => {
    renderAt();
    expect(screen.queryByText(supplier.companyName)).not.toBeInTheDocument();
    expect(screen.getAllByText(supplier.maskedName).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("supplier-contact-website")).not.toBeInTheDocument();
    expect(screen.queryByTestId("supplier-contact-whatsapp")).not.toBeInTheDocument();
    if (supplier.website) {
      expect(screen.queryByText(supplier.website)).not.toBeInTheDocument();
    }
    if (supplier.whatsapp) {
      expect(screen.queryByText(supplier.whatsapp)).not.toBeInTheDocument();
    }
  });

  it("shows real identity and contact channels for qualified buyers", () => {
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    setQualified(true, supplier.companyName);
    renderAt();
    expect(screen.getAllByText(supplier.companyName).length).toBeGreaterThan(0);
    if (supplier.website) {
      expect(screen.getByTestId("supplier-contact-website")).toBeInTheDocument();
    }
    if (supplier.whatsapp) {
      expect(screen.getByTestId("supplier-contact-whatsapp")).toBeInTheDocument();
    }
  });

  it("renders the procurement sections below the dossier", () => {
    renderAt();
    expect(screen.getByText("Product catalog preview")).toBeInTheDocument();
    expect(screen.getByText("Commercial fit")).toBeInTheDocument();
    expect(screen.getByText("Trade and delivery")).toBeInTheDocument();
    expect(screen.getByText("Documents and certifications")).toBeInTheDocument();
    expect(screen.getByText("Trust evidence")).toBeInTheDocument();
    expect(screen.getByText("Active offers from this supplier")).toBeInTheDocument();
  });

  it("renders similar suppliers when peers exist", () => {
    renderAt();
    expect(screen.getByText("Similar suppliers")).toBeInTheDocument();
  });

  it("does not nest a button inside another button or inside an anchor", () => {
    renderAt();
    const root = screen.getByTestId("supplier-profile-main-content");
    expect(root.querySelectorAll("button button").length).toBe(0);
    expect(root.querySelectorAll("a button").length).toBe(0);
  });

  it("contains no em dash or double hyphen in visible UI copy", () => {
    renderAt();
    const text = screen.getByTestId("supplier-profile-main-content").textContent ?? "";
    expect(text.includes("\u2014")).toBe(false); // em dash
    expect(/--/.test(text)).toBe(false); // double hyphen
  });
});
