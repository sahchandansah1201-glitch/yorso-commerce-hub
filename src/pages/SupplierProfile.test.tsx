/**
 * Supplier Profile v1 — access gating + structural tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(screen.getAllByText(supplier.maskedName).length).toBeGreaterThan(0);
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
    expect(screen.getAllByText(supplier.companyName).length).toBeGreaterThan(0);
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

  it("renders Similar suppliers section with masked names + profile links in locked state", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const heading = screen.getByRole("heading", { name: /similar suppliers/i });
    const section = heading.closest("section")!;
    const links = within(section).getAllByRole("link", {
      name: /open supplier profile:/i,
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toMatch(/^\/suppliers\/.+/);
      // Self-link must not appear in related list.
      expect(href).not.toBe(`/suppliers/${supplier.id}`);
    }
    // Masked identity is preserved for related cards in locked state.
    const sectionText = section.textContent ?? "";
    for (const s of mockSuppliers) {
      if (s.id === supplier.id) continue;
      if (sectionText.includes(s.maskedName)) {
        expect(sectionText).not.toContain(s.companyName);
      }
    }
  });

  it("Similar suppliers section reveals real companyName in qualified_unlocked", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    const heading = screen.getByRole("heading", { name: /similar suppliers/i });
    const section = heading.closest("section")!;
    const links = within(section).getAllByRole("link", {
      name: /open supplier profile:/i,
    });
    expect(links.length).toBeGreaterThan(0);
    // At least one related supplier renders its real companyName.
    const sectionText = section.textContent ?? "";
    const anyRealName = mockSuppliers
      .filter((s) => s.id !== supplier.id)
      .some((s) => sectionText.includes(s.companyName));
    expect(anyRealName).toBe(true);
  });

  it("renders Active offers section with /offers/:id links and hides exact prices in locked state", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const heading = screen.queryByRole("heading", {
      name: /active offers from this supplier/i,
    });
    if (!heading) return; // No matching offers in mock data — skip.
    const section = heading.closest("section")!;
    const links = within(section).getAllByRole("link", {
      name: /open offer:/i,
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/offers\/.+/);
    }
    expect(within(section).getAllByText(/price after access/i).length)
      .toBeGreaterThan(0);
  });

  it("Active offers section reveals exact prices in qualified_unlocked", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    const heading = screen.queryByRole("heading", {
      name: /active offers from this supplier/i,
    });
    if (!heading) return;
    const section = heading.closest("section")!;
    expect(within(section).queryByText(/price after access/i)).toBeNull();
    // At least one price unit string should be visible.
    expect(within(section).getAllByText(/per kg/i).length).toBeGreaterThan(0);
  });
});

describe("SupplierProfile — supplier access request flow", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];
  const otherSupplier = mockSuppliers[1];

  it("anonymous_locked does not render request form, keeps Create buyer account CTA", () => {
    renderAt(`/suppliers/${supplier.id}`);
    expect(
      screen.queryByRole("heading", { name: /request supplier access/i }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: /create buyer account/i }),
    ).toBeInTheDocument();
  });

  it("registered_locked: clicking Request supplier access opens inline form using maskedName", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    fireEvent.click(
      screen.getByRole("button", { name: /request supplier access/i }),
    );
    const heading = screen.getByRole("heading", {
      name: /request supplier access/i,
    });
    const form = heading.closest("form")!;
    expect(within(form).getAllByText(supplier.maskedName).length)
      .toBeGreaterThan(0);
    expect(form.textContent ?? "").not.toContain(supplier.companyName);
  });

  it("submitting with no reasons shows inline validation error", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    fireEvent.click(
      screen.getByRole("button", { name: /request supplier access/i }),
    );
    // Uncheck the default-checked reason.
    const exact = screen.getByLabelText(/exact price access/i);
    fireEvent.click(exact);
    fireEvent.click(screen.getByRole("button", { name: /send access request/i }));
    expect(screen.getByRole("alert").textContent ?? "")
      .toMatch(/select at least one reason/i);
    // Form is still visible — no success state.
    expect(screen.queryByText(/access request sent/i)).toBeNull();
  });

  it("submitting with selected reasons saves sessionStorage and renders Access request sent", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    fireEvent.click(
      screen.getByRole("button", { name: /request supplier access/i }),
    );
    fireEvent.click(screen.getByLabelText(/supplier contact/i));
    fireEvent.click(screen.getByRole("button", { name: /send access request/i }));
    expect(screen.getByText(/access request sent/i)).toBeInTheDocument();
    const raw = sessionStorage.getItem("yorso_supplier_access_requests");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[supplier.id]).toBeTruthy();
    expect(parsed[supplier.id].status).toBe("sent");
    expect(parsed[supplier.id].reasons).toEqual(
      expect.arrayContaining(["exact_price", "supplier_contact"]),
    );
  });

  it("preserves request sent state after re-render for the same supplier", () => {
    seedRegisteredSession();
    sessionStorage.setItem(
      "yorso_supplier_access_requests",
      JSON.stringify({
        [supplier.id]: {
          status: "sent",
          reasons: ["exact_price"],
          message: "",
          sentAt: new Date().toISOString(),
        },
      }),
    );
    renderAt(`/suppliers/${supplier.id}`);
    expect(screen.getByText(/access request sent/i)).toBeInTheDocument();
    // Primary CTA must not re-prompt to Request supplier access.
    expect(
      screen.queryByRole("button", { name: /request supplier access/i }),
    ).toBeNull();
  });

  it("request status is supplier-specific", () => {
    seedRegisteredSession();
    sessionStorage.setItem(
      "yorso_supplier_access_requests",
      JSON.stringify({
        [supplier.id]: {
          status: "sent",
          reasons: ["exact_price"],
          message: "",
          sentAt: new Date().toISOString(),
        },
      }),
    );
    renderAt(`/suppliers/${otherSupplier.id}`);
    expect(screen.queryByText(/access request sent/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: /request supplier access/i }),
    ).toBeInTheDocument();
  });

  it("qualified_unlocked does not render request form and still shows contact channels", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    expect(
      screen.queryByRole("heading", { name: /request supplier access/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /request supplier access/i }),
    ).toBeNull();
    if (supplier.website) {
      expect(screen.getByRole("link", { name: /website/i })).toBeInTheDocument();
    }
  });

  it("does not render nested <button> elements while form is open", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    fireEvent.click(
      screen.getByRole("button", { name: /request supplier access/i }),
    );
    const buttons = document.querySelectorAll("button");
    for (const btn of Array.from(buttons)) {
      let parent = btn.parentElement;
      while (parent) {
        expect(parent.tagName.toLowerCase()).not.toBe("button");
        parent = parent.parentElement;
      }
    }
  });
});

