/**
 * Focused regression tests for Supplier Catalog (/suppliers):
 *  1. SupplierRow does not render nested <button> inside another <button>.
 *  2. Locked search must not match real companyName (anonymous_locked).
 *  3. Qualified search MAY match real companyName (qualified_unlocked).
 *  4. Neutral selected-panel state visible until user picks a supplier.
 *  5. Product preview images render with meaningful alt text.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import Suppliers from "@/pages/Suppliers";
import { mockSuppliers } from "@/data/mockSuppliers";
import { BUYER_SESSION_STORAGE_KEY } from "@/lib/buyer-session";
import { setQualified } from "@/lib/access-level";
import {
  localPreviewSupplierLogisticsFacts,
  localPreviewSupplierProductionFacts,
} from "@/lib/supplier-dossier-facts";
import {
  localPreviewSupplierFaqItems,
  localPreviewSupplierShipmentCases,
} from "@/lib/supplier-evidence-blocks";

const renderPage = (initialEntry = "/suppliers") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
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

const apiSupplier = (supplier = mockSuppliers[0]) => ({
  id: supplier.id,
  maskedName: supplier.maskedName,
  companyName: null,
  country: supplier.country,
  countryCode: supplier.countryCode,
  city: supplier.city,
  supplierType: supplier.supplierType,
  inBusinessSinceYear: supplier.inBusinessSinceYear,
  productFocus: supplier.productFocus,
  certifications: supplier.certifications,
  certificationBadges: supplier.certificationBadges.map((badge) => ({
    code: badge.code,
    label: badge.label,
    logo: badge.logo ?? null,
  })),
  activeOffersCount: null,
  shortDescription: supplier.shortDescription,
  about: null,
  responseSignal: supplier.responseSignal,
  documentReadiness: supplier.documentReadiness,
  verificationLevel: supplier.verificationLevel,
  heroImage: supplier.heroImage,
  logoImage: supplier.logoImage ?? null,
  deliveryCountries: supplier.deliveryCountries,
  deliveryCountriesTotal: null,
  totalProductsCount: null,
  productCatalogPreview: supplier.productCatalogPreview.slice(0, 3),
  productionFacts: localPreviewSupplierProductionFacts(supplier.id),
  logisticsFacts: localPreviewSupplierLogisticsFacts(supplier.id),
  shipmentCases: localPreviewSupplierShipmentCases(
    supplier.id,
    supplier.productFocus[0]?.species ?? "Seafood",
  ),
  faqItems: localPreviewSupplierFaqItems(supplier.id),
  legalDetails: null,
  supplierDocuments: null,
  website: null,
  whatsapp: null,
  updatedAt: "2026-05-14T00:00:00.000Z",
  accessLevel: "anonymous_locked",
});

const supplierListResponse = (suppliers = [apiSupplier()], total = suppliers.length) => ({
  ok: true,
  suppliers,
  total,
  accessLevel: "anonymous_locked",
  limit: 50,
  offset: 0,
  requestId: "test-supplier-directory",
});

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

const stubSupplierDirectoryApi = (response = supplierListResponse()) => {
  vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
  const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
    new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("/suppliers — implementation quality fixes", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not render nested <button> elements inside supplier rows", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /supplier results/i, level: 2 }),
    ).toBeInTheDocument();
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

  it("uses self-hosted supplier directory API when configured while preserving locked shaping", async () => {
    const fetchMock = stubSupplierDirectoryApi(supplierListResponse([apiSupplier(mockSuppliers[0])], 123));

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://api.test/v1/suppliers?sortBy=updated_at&sortDirection=desc&accessLevel=anonymous_locked&limit=10&offset=0",
    );
    expect((await screen.findAllByText(mockSuppliers[0].maskedName)).length).toBeGreaterThan(0);
    expect(document.body.textContent ?? "").not.toContain(mockSuppliers[0].companyName);
  });

  it("debounces supplier directory search before calling the self-hosted API", async () => {
    const fetchMock = stubSupplierDirectoryApi(supplierListResponse([], 0));

    renderPage();
    const search = screen.getByLabelText(/search suppliers/i);
    fireEvent.change(search, { target: { value: "Nor" } });
    fireEvent.change(search, { target: { value: "Norwegian" } });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes("q=Norwegian")),
      ).toBe(true);
    });

    const queryCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("q="));
    expect(queryCalls).toHaveLength(1);
  });

  it("pushes certified quick filter to the API instead of filtering only the first local page", async () => {
    const fetchMock = stubSupplierDirectoryApi(supplierListResponse([], 0));

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /certified suppliers/i }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes("verificationLevel=documents_reviewed")),
      ).toBe(true);
    });
  });

  it("shows a live directory error without substituting prototype suppliers when the self-hosted API is unavailable", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async () => {
      throw new Error("network unavailable");
    });
    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    expect(await screen.findByTestId("supplier-directory-error")).toBeInTheDocument();
    expect(screen.getByTestId("supplier-directory-source")).toHaveTextContent(/live directory error/i);
    expect(screen.queryByText(mockSuppliers[0].maskedName)).not.toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toContain(mockSuppliers[0].companyName);
  });

  it("uses API results as the source of truth instead of refiltering remote localized rows", async () => {
    const remote = {
      ...apiSupplier(mockSuppliers[0]),
      id: "sup-remote-only",
      maskedName: "Remote cod processor · IS-777",
      country: "Iceland",
      countryCode: "IS",
      city: "Reykjavik",
      shortDescription: "Returned by the self-hosted supplier search endpoint.",
      productFocus: [{ species: "Cod", forms: "Loins" }],
      productCatalogPreview: [
        {
          name: "Cod loins",
          species: "Cod",
          form: "Loins",
          image: "/offers/cod.webp",
        },
      ],
    };
    const fetchMock = stubSupplierDirectoryApi(supplierListResponse([remote], 1));

    renderPage();
    fireEvent.change(screen.getByLabelText(/search suppliers/i), { target: { value: "private server match" } });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes("q=private+server+match")),
      ).toBe(true);
    });
    expect(await screen.findByText("Remote cod processor · IS-777")).toBeInTheDocument();
    expect(screen.queryByText(mockSuppliers[0].maskedName)).not.toBeInTheDocument();
  });

  it("hydrates supplier directory URL state into server pagination and sort query", async () => {
    const fetchMock = stubSupplierDirectoryApi(supplierListResponse([], 0));

    renderPage("/suppliers?q=cod&filter=certified&sort=country&dir=asc&rows=20&page=2");

    await waitFor(() => {
      expect(fetchMock.mock.calls[0][0]).toBe(
        "http://api.test/v1/suppliers?q=cod&verificationLevel=documents_reviewed&sortBy=country&sortDirection=asc&accessLevel=anonymous_locked&limit=20&offset=20",
      );
    });
    expect(screen.getByTestId("supplier-directory-sort")).toHaveValue("country");
    expect(screen.getByTestId("supplier-directory-direction")).toHaveValue("asc");
    expect(screen.getByTestId("supplier-directory-page-size")).toHaveValue("20");
  });

  it("paginates local supplier fallback without changing access shaping", () => {
    renderPage();

    expect(screen.getByTestId("supplier-directory-page-summary")).toHaveTextContent("Showing 1-10 of 12");
    expect(screen.getAllByTestId("supplier-row")).toHaveLength(10);

    fireEvent.click(screen.getByTestId("supplier-directory-next"));

    expect(screen.getByTestId("supplier-directory-page-summary")).toHaveTextContent("Showing 11-12 of 12");
    expect(screen.getAllByTestId("supplier-row")).toHaveLength(2);
    expect(document.body.textContent ?? "").not.toContain(mockSuppliers[0].companyName);
  });
});

describe("/suppliers — standalone profile navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("each supplier row exposes a title link to /suppliers/:id", () => {
    renderPage();
    const rows = screen.getAllByTestId("supplier-row");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const titleLink = within(row).getByTestId("supplier-row-title-link");
      expect(titleLink.tagName.toLowerCase()).toBe("a");
      const href = titleLink.getAttribute("href") ?? "";
      expect(href).toMatch(/^\/suppliers\/sup-/);
    }
  });

  it("each supplier row exposes an explicit Open profile link to /suppliers/:id", () => {
    renderPage();
    const rows = screen.getAllByTestId("supplier-row");
    for (const row of rows) {
      const link = within(row).getByTestId("supplier-row-open-profile");
      expect(link.tagName.toLowerCase()).toBe("a");
      const href = link.getAttribute("href") ?? "";
      expect(href).toMatch(/^\/suppliers\/sup-/);
    }
  });

  it("first supplier row Open profile link points at supplier id sup-no-001", () => {
    renderPage();
    const rows = screen.getAllByTestId("supplier-row");
    const link = within(rows[0]).getByTestId("supplier-row-open-profile");
    expect(link.getAttribute("href")).toBe(`/suppliers/${mockSuppliers[0].id}`);
  });

  it("does not contain invalid interactive nesting on /suppliers", () => {
    renderPage();
    expect(document.querySelectorAll("button button").length).toBe(0);
    expect(document.querySelectorAll("a button").length).toBe(0);
  });

  it("selecting a supplier exposes an Open full profile link in the right preview panel", () => {
    renderPage();
    const firstRow = screen.getAllByTestId("supplier-row")[0];
    const selectBtn = within(firstRow).getByRole("button", {
      name: /select .* to review details/i,
    });
    fireEvent.click(selectBtn);
    const openLink = screen.getByTestId("selected-supplier-open-profile");
    expect(openLink.tagName.toLowerCase()).toBe("a");
    expect(openLink.getAttribute("href")).toBe(
      `/suppliers/${mockSuppliers[0].id}`,
    );
    // Preview label clarifies this is a quick preview, not the full page.
    expect(screen.getByTestId("selected-supplier-preview-label")).toBeInTheDocument();
  });
});
