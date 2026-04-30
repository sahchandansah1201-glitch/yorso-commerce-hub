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
      screen.getByRole("heading", { name: /product catalog preview/i }),
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
    expect(screen.getByRole("button", { name: /request price access/i }))
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

describe("SupplierProfile — supplier access request flow (one-click)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];
  const otherSupplier = mockSuppliers[1];

  it("anonymous_locked does not render the request panel; keeps Create buyer account CTA", () => {
    renderAt(`/suppliers/${supplier.id}`);
    expect(
      screen.queryByRole("button", { name: /request price access/i }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: /create buyer account/i }),
    ).toBeInTheDocument();
  });

  it("registered_locked: renders one-click Request price access CTA without reason checkboxes or message field", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    expect(
      screen.getByRole("button", { name: /request price access/i }),
    ).toBeInTheDocument();
    // No reason checkboxes, validation, or textarea.
    expect(screen.queryByText(/what are you requesting/i)).toBeNull();
    expect(screen.queryByLabelText(/exact price access/i)).toBeNull();
    expect(screen.queryByLabelText(/supplier contact/i)).toBeNull();
    expect(document.querySelectorAll("textarea").length).toBe(0);
    // Masked name shown, real companyName never leaks.
    expect(screen.getAllByText(supplier.maskedName).length).toBeGreaterThan(0);
    expect(document.body.textContent ?? "").not.toContain(supplier.companyName);
  });

  it("registered_locked: clicking the CTA stores a request with intent exact_price and shows status card", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    fireEvent.click(
      screen.getByRole("button", { name: /request price access/i }),
    );
    const status = screen.getByTestId("supplier-access-request-status");
    expect(status).toBeInTheDocument();
    // Status starts as "sent" or has already advanced to "pending" via the
    // boot-time approval scan that runs when the profile mounts.
    expect(["sent", "pending"]).toContain(
      status.getAttribute("data-status"),
    );

    const raw = localStorage.getItem("yorso_supplier_access_requests");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[supplier.id]).toBeTruthy();
    expect(parsed[supplier.id].intent).toBe("exact_price");
    expect(typeof parsed[supplier.id].sentAt).toBe("string");
    expect(typeof parsed[supplier.id].mockApproveAt).toBe("string");
  });

  it("preserves status state after re-render for the same supplier (using legacy sessionStorage record)", () => {
    seedRegisteredSession();
    sessionStorage.setItem(
      "yorso_supplier_access_requests",
      JSON.stringify({
        [supplier.id]: {
          status: "sent",
          intent: "exact_price",
          supplierId: supplier.id,
          sentAt: new Date().toISOString(),
          mockApproveAt: new Date(Date.now() + 60_000).toISOString(),
        },
      }),
    );
    renderAt(`/suppliers/${supplier.id}`);
    expect(
      screen.getByTestId("supplier-access-request-status"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /request price access/i }),
    ).toBeNull();
  });

  it("request status is supplier-specific", () => {
    seedRegisteredSession();
    localStorage.setItem(
      "yorso_supplier_access_requests",
      JSON.stringify({
        [supplier.id]: {
          status: "sent",
          intent: "exact_price",
          supplierId: supplier.id,
          sentAt: new Date().toISOString(),
          mockApproveAt: new Date(Date.now() + 60_000).toISOString(),
        },
      }),
    );
    renderAt(`/suppliers/${otherSupplier.id}`);
    expect(screen.queryByTestId("supplier-access-request-status")).toBeNull();
    expect(
      screen.getByRole("button", { name: /request price access/i }),
    ).toBeInTheDocument();
  });

  it("approved request: status card shows approved and qualified access is applied", async () => {
    seedRegisteredSession();
    // Seed a request whose mock approval is already due.
    localStorage.setItem(
      "yorso_supplier_access_requests",
      JSON.stringify({
        [supplier.id]: {
          status: "pending",
          intent: "exact_price",
          supplierId: supplier.id,
          sentAt: new Date(Date.now() - 10_000).toISOString(),
          pendingAt: new Date(Date.now() - 9_000).toISOString(),
          mockApproveAt: new Date(Date.now() - 1_000).toISOString(),
        },
      }),
    );
    renderAt(`/suppliers/${supplier.id}`);
    const status = await screen.findByTestId("supplier-access-request-status");
    expect(status.getAttribute("data-status")).toBe("approved");
    // Qualification was applied — companyName becomes visible.
    expect(screen.getAllByText(supplier.companyName).length).toBeGreaterThan(0);
  });

  it("queues a one-time approval notification that survives the next visit", () => {
    // Pre-seed an already-approved request whose notification has not been seen.
    localStorage.setItem(
      "yorso_supplier_access_requests",
      JSON.stringify({
        [supplier.id]: {
          status: "approved",
          intent: "exact_price",
          supplierId: supplier.id,
          sentAt: new Date(Date.now() - 60_000).toISOString(),
          pendingAt: new Date(Date.now() - 50_000).toISOString(),
          approvedAt: new Date(Date.now() - 10_000).toISOString(),
        },
      }),
    );
    localStorage.setItem(
      "yorso_supplier_access_notifications",
      JSON.stringify({
        [supplier.id]: {
          supplierId: supplier.id,
          approvedAt: new Date(Date.now() - 10_000).toISOString(),
          seen: false,
        },
      }),
    );
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    // The status card reflects approved.
    expect(
      screen.getByTestId("supplier-access-request-status").getAttribute(
        "data-status",
      ),
    ).toBe("approved");
    // Notification is delivered exactly once: store entry now marked seen.
    const notes = JSON.parse(
      localStorage.getItem("yorso_supplier_access_notifications") ?? "{}",
    );
    expect(notes[supplier.id]?.seen).toBe(true);
  });

  it("qualified_unlocked does not render request panel and still shows contact channels", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    expect(
      screen.queryByRole("button", { name: /request price access/i }),
    ).toBeNull();
    if (supplier.website) {
      expect(screen.getByRole("link", { name: /website/i })).toBeInTheDocument();
    }
  });

  it("does not render nested <button> elements with the panel visible", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    expect(document.querySelectorAll("button button").length).toBe(0);
    expect(document.querySelectorAll("a button").length).toBe(0);
  });
});

describe("SupplierProfile — regression: invalid nested interactive controls", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];

  const assertNoInvalidNesting = () => {
    // No <button> nested inside another <button>.
    expect(document.querySelectorAll("button button").length).toBe(0);
    // No <button> nested inside an <a> — Link wrapping Button is invalid HTML.
    // Use Button asChild + Link, or a styled Link, instead.
    expect(document.querySelectorAll("a button").length).toBe(0);
  };

  it("anonymous_locked: no button>button and no a>button", () => {
    renderAt(`/suppliers/${supplier.id}`);
    assertNoInvalidNesting();
  });

  it("registered_locked: no button>button and no a>button", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    assertNoInvalidNesting();
  });

  it("qualified_unlocked: no button>button and no a>button", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    assertNoInvalidNesting();
  });

  it("not-found state (Back to suppliers): no a>button", () => {
    renderAt(`/suppliers/does-not-exist`);
    assertNoInvalidNesting();
  });
});

describe("SupplierProfile — regression: locked panel must not reveal exact active offers count", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const findAccessPanel = () =>
    document.querySelector('aside[aria-label="Access and next action"]') as HTMLElement | null;

  const expectNoExactCount = (count: number) => {
    const panel = findAccessPanel();
    expect(panel).not.toBeNull();
    const text = panel!.textContent ?? "";
    // The exact active offers count must not be rendered as a numeric value
    // in the locked access panel. We allow non-exact, teaser-style copy.
    // Match the exact count as a standalone number (not part of a year, etc).
    const exact = new RegExp(`(^|[^0-9])${count}([^0-9]|$)`);
    expect(text).not.toMatch(exact);
    // And there should be a soft teaser/explanation instead.
    expect(text).toMatch(
      /active offers.*after supplier approval|after supplier approval|available after/i,
    );
  };

  it("anonymous_locked: access panel does not show exact activeOffersCount", () => {
    const supplier = mockSuppliers[0];
    renderAt(`/suppliers/${supplier.id}`);
    expectNoExactCount(supplier.activeOffersCount);
  });

  it("registered_locked: access panel does not show exact activeOffersCount", () => {
    const supplier = mockSuppliers[0];
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    expectNoExactCount(supplier.activeOffersCount);
  });

  it("qualified_unlocked: exact activeOffersCount may be shown in access panel", () => {
    const supplier = mockSuppliers[0];
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    const panel = document.querySelector(
      'aside[aria-label="Access and next action"]',
    ) as HTMLElement | null;
    expect(panel).not.toBeNull();
    expect(panel!.textContent ?? "").toContain(
      String(supplier.activeOffersCount),
    );
  });
});

describe("SupplierProfile — regression: locked profile must not leak exact active offers count anywhere", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const standaloneNumberRegex = (count: number) =>
    new RegExp(`(^|[^0-9A-Za-z-])${count}([^0-9A-Za-z-]|$)`);

  const expectNoExactCountInDocument = (count: number) => {
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(standaloneNumberRegex(count));
    const all = document.querySelectorAll("*");
    for (const el of Array.from(all)) {
      for (const attr of ["title", "aria-label"]) {
        const v = el.getAttribute(attr);
        if (v && standaloneNumberRegex(count).test(v)) {
          throw new Error(
            `Exact active offers count "${count}" leaked via ${attr}="${v}"`,
          );
        }
      }
    }
  };

  it("anonymous_locked: exact activeOffersCount is not rendered anywhere on the profile", () => {
    const supplier = mockSuppliers[0];
    renderAt(`/suppliers/${supplier.id}`);
    expectNoExactCountInDocument(supplier.activeOffersCount);
  });

  it("registered_locked: exact activeOffersCount is not rendered anywhere on the profile", () => {
    const supplier = mockSuppliers[0];
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    expectNoExactCountInDocument(supplier.activeOffersCount);
  });

  it("qualified_unlocked: exact activeOffersCount may be visible on the profile", () => {
    const supplier = mockSuppliers[0];
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    const text = document.body.textContent ?? "";
    expect(text).toContain(String(supplier.activeOffersCount));
  });
});

describe("SupplierProfile — regression: one-click access flow stays supplier-specific", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplierA = mockSuppliers[0];
  const supplierB = mockSuppliers[1];

  it("requesting for supplier A only writes supplier A under its id; supplier B keeps the CTA", () => {
    seedRegisteredSession();
    const { unmount } = renderAt(`/suppliers/${supplierA.id}`);
    fireEvent.click(
      screen.getByRole("button", { name: /request price access/i }),
    );
    expect(
      screen.getByTestId("supplier-access-request-status"),
    ).toBeInTheDocument();

    const raw = localStorage.getItem("yorso_supplier_access_requests");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Object.keys(parsed)).toEqual([supplierA.id]);
    expect(parsed[supplierB.id]).toBeUndefined();

    unmount();

    renderAt(`/suppliers/${supplierB.id}`);
    expect(screen.queryByTestId("supplier-access-request-status")).toBeNull();
    expect(
      screen.getByRole("button", { name: /request price access/i }),
    ).toBeInTheDocument();
  });
});

describe("SupplierProfile — regression: access request panel does not leak supplier identity", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];

  it("registered_locked: visible panel shows masked name, never companyName/website/whatsapp", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    const cta = screen.getByRole("button", { name: /request price access/i });
    const panel = cta.closest("div")!.parentElement!;
    const text = panel.textContent ?? "";
    expect(text).toContain(supplier.maskedName);
    expect(text).not.toContain(supplier.companyName);
    if (supplier.website) expect(text).not.toContain(supplier.website);
    if (supplier.whatsapp) expect(text).not.toContain(supplier.whatsapp);
  });
});

describe("SupplierProfile — regression: one-click request storage shape", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];

  it("clicking the CTA writes a record with the documented contract", () => {
    seedRegisteredSession();
    renderAt(`/suppliers/${supplier.id}`);
    fireEvent.click(
      screen.getByRole("button", { name: /request price access/i }),
    );

    const raw = localStorage.getItem("yorso_supplier_access_requests");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Object.keys(parsed)).toEqual([supplier.id]);
    const record = parsed[supplier.id];
    expect(["sent", "pending"]).toContain(record.status);
    expect(record.intent).toBe("exact_price");
    expect(record.supplierId).toBe(supplier.id);
    expect(typeof record.sentAt).toBe("string");
    expect(Number.isNaN(Date.parse(record.sentAt))).toBe(false);
    expect(record.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof record.mockApproveAt).toBe("string");
    expect(Number.isNaN(Date.parse(record.mockApproveAt))).toBe(false);
  });
});



describe("SupplierProfile — standalone page contract", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];

  it("/suppliers/:supplierId direct route renders SupplierProfile (h1 + breadcrumb)", () => {
    renderAt(`/suppliers/${supplier.id}`);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /breadcrumb/i }),
    ).toBeInTheDocument();
  });

  it("standalone page does not render the supplier directory search input", () => {
    renderAt(`/suppliers/${supplier.id}`);
    expect(screen.queryByLabelText(/search suppliers/i)).toBeNull();
  });

  it("standalone page does not render the directory's Selected supplier preview panel", () => {
    renderAt(`/suppliers/${supplier.id}`);
    // The directory's preview-label test id only exists in SelectedSupplierPanel,
    // which must not appear on the standalone profile page.
    expect(
      screen.queryByTestId("selected-supplier-preview-label"),
    ).toBeNull();
    expect(
      screen.queryByTestId("selected-supplier-open-profile"),
    ).toBeNull();
    // No "Quick preview" label either.
    expect(screen.queryByText(/quick preview/i)).toBeNull();
  });

  it("renders the Documents & certifications section with all six checklist rows", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const section = screen.getByTestId("supplier-profile-documents");
    expect(
      within(section).getByRole("heading", {
        name: /documents.*certifications/i,
      }),
    ).toBeInTheDocument();
    for (const key of [
      "health",
      "haccp",
      "iuu",
      "sustainability",
      "packing",
      "traceability",
    ]) {
      expect(within(section).getByTestId(`doc-row-${key}`)).toBeInTheDocument();
      expect(
        within(section).getByTestId(`doc-status-${key}`),
      ).toBeInTheDocument();
    }
    // Honest copy: the visible labels should match the spec.
    expect(within(section).getByText(/health certificate/i)).toBeInTheDocument();
    expect(within(section).getByText(/haccp/i)).toBeInTheDocument();
    expect(within(section).getByText(/catch.*iuu declaration/i)).toBeInTheDocument();
    expect(within(section).getByText(/sustainability certificate/i)).toBeInTheDocument();
    expect(within(section).getByText(/packing list/i)).toBeInTheDocument();
    expect(within(section).getByText(/traceability data/i)).toBeInTheDocument();
  });

  it("locked: Documents section uses 'Available after supplier approval' status for all rows", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const section = screen.getByTestId("supplier-profile-documents");
    for (const key of [
      "health",
      "haccp",
      "iuu",
      "sustainability",
      "packing",
      "traceability",
    ]) {
      const status = within(section).getByTestId(`doc-status-${key}`);
      expect(status.textContent ?? "").toMatch(/after supplier approval/i);
    }
  });

  it("invalid supplier id renders not-found state with a valid link back to /suppliers", () => {
    renderAt(`/suppliers/does-not-exist`);
    expect(screen.getByText(/supplier not found/i)).toBeInTheDocument();
    const back = screen.getByRole("link", { name: /back to suppliers/i });
    expect(back.getAttribute("href")).toBe("/suppliers");
  });

  it("no invalid interactive nesting: a button = 0, button button = 0", () => {
    renderAt(`/suppliers/${supplier.id}`);
    expect(document.querySelectorAll("button button").length).toBe(0);
    expect(document.querySelectorAll("a button").length).toBe(0);
  });

  it("locked profile does not leak companyName, website, whatsapp or exact counts", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(supplier.companyName);
    if (supplier.website) expect(body).not.toContain(supplier.website);
    if (supplier.whatsapp) expect(body).not.toContain(supplier.whatsapp);
    expect(body).not.toContain(`${supplier.totalProductsCount} products`);
    expect(body).not.toContain(`${supplier.deliveryCountriesTotal} countries`);
    // Exact activeOffersCount is asserted in detail by other suites; assert here as a smoke check.
    const exact = new RegExp(
      `(^|[^0-9])${supplier.activeOffersCount}([^0-9]|$)`,
    );
    expect(body).not.toMatch(exact);
  });
});

describe("SupplierProfile — Commercial fit section", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const supplier = mockSuppliers[0];
  const labels = [
    /typical moq/i,
    /trade terms/i,
    /lead time/i,
    /payment terms/i,
    /shipment ports/i,
    /best fit/i,
  ];

  it("renders Commercial fit section with all six labels (locked)", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const section = screen.getByTestId("supplier-profile-commercial-fit");
    expect(
      within(section).getByRole("heading", { name: /commercial fit/i }),
    ).toBeInTheDocument();
    for (const l of labels) {
      expect(within(section).getAllByText(l).length).toBeGreaterThan(0);
    }
  });

  it("locked: Commercial fit does not expose supplier identity or exact terms", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const section = screen.getByTestId("supplier-profile-commercial-fit");
    const text = section.textContent ?? "";
    expect(text).not.toContain(supplier.companyName);
    if (supplier.website) expect(text).not.toContain(supplier.website);
    if (supplier.whatsapp) expect(text).not.toContain(supplier.whatsapp);
    expect(text).not.toMatch(/advance|net \d+ days|against b\/l/i);
    expect(text).toMatch(/after supplier access|request access/i);
  });

  it("qualified_unlocked: Commercial fit shows concrete derived values", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    const section = screen.getByTestId("supplier-profile-commercial-fit");
    const text = section.textContent ?? "";
    expect(text).toMatch(/FOB|CIF|FCA|CFR|DAP|EXW/);
    expect(text).toMatch(/days/i);
    expect(text).toContain(supplier.country);
  });

  it("Commercial fit section: no nested interactive controls", () => {
    renderAt(`/suppliers/${supplier.id}`);
    const section = screen.getByTestId("supplier-profile-commercial-fit");
    expect(section.querySelectorAll("button button").length).toBe(0);
    expect(section.querySelectorAll("a button").length).toBe(0);
  });

  it("Commercial fit copy contains no em dash", () => {
    seedQualifiedSession();
    renderAt(`/suppliers/${supplier.id}`);
    const section = screen.getByTestId("supplier-profile-commercial-fit");
    expect(section.textContent ?? "").not.toContain("—");
  });
});
