/**
 * Supplier Profile v1 — access gating + structural tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import SupplierProfile from "@/pages/SupplierProfile";
import { mockSuppliers } from "@/data/mockSuppliers";
import { BUYER_SESSION_STORAGE_KEY } from "@/lib/buyer-session";
import { setQualified } from "@/lib/access-level";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <RegistrationProvider>
              <Routes>
                <Route
                  path="/suppliers/:supplierId"
                  element={<SupplierProfile />}
                />
              </Routes>
            </RegistrationProvider>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const seedRegisteredSession = () => {
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
};

const seedQualifiedSession = () => {
  seedRegisteredSession();
  setQualified(true, "Test Supplier");
};

describe("SupplierProfile — access gating", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];

  it("renders profile for a valid supplier id", () => {
    renderAt(`/suppliers/${supplier.id}`);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /product focus/i }),
    ).toBeInTheDocument();
  });

  it("anonymous_locked profile hides companyName, website, whatsapp, exact counts", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(supplier.companyName);
    if (supplier.website) expect(body).not.toContain(supplier.website);
    if (supplier.whatsapp) expect(body).not.toContain(supplier.whatsapp);
    expect(body).not.toContain(`${supplier.totalProductsCount} products`);
    expect(body).not.toContain(`${supplier.deliveryCountriesTotal} markets`);
    expect(body).toMatch(/Full delivery geography after supplier approval/i);
    expect(screen.getByText(supplier.maskedName)).toBeInTheDocument();
  });

  it("registered_locked profile still hides restricted fields", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(supplier.companyName);
    if (supplier.website) expect(body).not.toContain(supplier.website);
    if (supplier.whatsapp) expect(body).not.toContain(supplier.whatsapp);
    expect(body).not.toContain(`${supplier.totalProductsCount} products`);
    expect(body).not.toContain(`${supplier.deliveryCountriesTotal} markets`);
    expect(screen.getByRole("button", { name: /request supplier access/i }))
      .toBeInTheDocument();
  });

  it("qualified_unlocked profile shows companyName and contact channels", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    expect(screen.getByText(supplier.companyName)).toBeInTheDocument();
    const body = document.body.textContent ?? "";
    expect(body).toContain(`${supplier.totalProductsCount}`);
    expect(body).toContain(`${supplier.deliveryCountriesTotal}`);
    if (supplier.website) {
      const link = screen.getByRole("link", { name: /website/i });
      expect(link).toHaveAttribute("href", supplier.website);
    }
    if (supplier.whatsapp) {
      expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
    }
  });

  it("invalid supplierId shows not-found state", () => {
    renderAt(`/suppliers/does-not-exist`);
    expect(screen.getByText(/supplier not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to suppliers/i }))
      .toBeInTheDocument();
  });

  it("does not render nested <button> elements", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const buttons = document.querySelectorAll("button");
    for (const btn of Array.from(buttons)) {
      let parent = btn.parentElement;
      while (parent) {
        expect(parent.tagName.toLowerCase()).not.toBe("button");
        parent = parent.parentElement;
      }
    }
  });

  it("direct route access in locked state still respects gating", () => {
    // No session at all — anonymous_locked.
    renderAt(`/suppliers/${supplier.id}`);
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(supplier.companyName);
    expect(screen.getByText(/supplier identity restricted/i)).toBeInTheDocument();
    // Anonymous CTA navigates via Link (no onClick handler).
    const cta = screen.getByRole("link", { name: /create buyer account/i });
    expect(cta).toHaveAttribute("href", "/register");
  });

  it("renders breadcrumb back to /suppliers", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(within(nav).getByRole("link", { name: /suppliers/i }))
      .toHaveAttribute("href", "/suppliers");
  });
});
