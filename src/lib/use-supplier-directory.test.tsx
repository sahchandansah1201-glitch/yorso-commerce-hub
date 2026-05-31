import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockSuppliers } from "@/data/mockSuppliers";
import {
  localPreviewSupplierLogisticsFacts,
  localPreviewSupplierProductionFacts,
} from "@/lib/supplier-dossier-facts";
import {
  localPreviewSupplierFaqItems,
  localPreviewSupplierShipmentCases,
} from "@/lib/supplier-evidence-blocks";
import {
  SUPPLIER_ACCESS_CHANGE_EVENT,
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
} from "@/lib/supplier-access-requests";
import { useSupplierDirectoryDetail, useSupplierDirectoryList } from "./use-supplier-directory";
import type { SupplierDirectoryItem } from "./supplier-directory-api";

const apiSupplier = (patch: Partial<SupplierDirectoryItem> = {}): SupplierDirectoryItem => {
  const supplier = mockSuppliers[0];
  return {
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
    website: null,
    whatsapp: null,
    updatedAt: "2026-05-14T00:00:00.000Z",
    accessLevel: "registered_locked",
    ...patch,
  };
};

describe("useSupplierDirectory runtime refresh", () => {
  afterEach(() => {
    localStorage.removeItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY);
    sessionStorage.removeItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY);
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("refreshes self-hosted supplier list after supplier access changes", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({
        ok: true,
        suppliers: [apiSupplier()],
        total: 1,
        accessLevel: "registered_locked",
        limit: 50,
        offset: 0,
        requestId: "req-suppliers",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useSupplierDirectoryList({
        accessLevel: "registered_locked",
        language: "en",
        query: "salmon",
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      window.dispatchEvent(new CustomEvent(SUPPLIER_ACCESS_CHANGE_EVENT));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://api.test/v1/suppliers?q=salmon&sortBy=updated_at&sortDirection=desc&accessLevel=qualified_unlocked&limit=50&offset=0",
    );
  });

  it("refreshes self-hosted supplier detail after supplier access changes", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({
        ok: true,
        supplier: apiSupplier(),
        accessLevel: "registered_locked",
        requestId: "req-supplier-detail",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useSupplierDirectoryDetail({
        accessLevel: "registered_locked",
        language: "en",
        supplierId: mockSuppliers[0].id,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      window.dispatchEvent(new CustomEvent(SUPPLIER_ACCESS_CHANGE_EVENT));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe(
      `http://api.test/v1/suppliers/${mockSuppliers[0].id}?accessLevel=qualified_unlocked`,
    );
  });

  it("does not substitute local prototype suppliers when the configured API list fails", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async () => {
      throw new Error("supplier api offline");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useSupplierDirectoryList({
        accessLevel: "anonymous_locked",
        language: "en",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.apiEnabled).toBe(true);
    expect(result.current.source).toBe("api");
    expect(result.current.serverFiltered).toBe(true);
    expect(result.current.total).toBe(0);
    expect(result.current.suppliers).toEqual([]);
  });

  it("does not substitute the local fallback supplier when the configured API detail fails", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async () => {
      throw new Error("supplier detail api offline");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useSupplierDirectoryDetail({
        accessLevel: "anonymous_locked",
        fallbackSupplier: mockSuppliers[0],
        language: "en",
        supplierId: mockSuppliers[0].id,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.apiEnabled).toBe(true);
    expect(result.current.source).toBe("api");
    expect(result.current.missing).toBe(false);
    expect(result.current.supplier).toBeUndefined();
  });

  it("local fallback unlocks only suppliers with approved access after the access event", async () => {
    const { result } = renderHook(() =>
      useSupplierDirectoryList({
        accessLevel: "registered_locked",
        language: "en",
        query: "salmon",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.suppliers.find((supplier) => supplier.id === "sup-no-001")?.accessLevel)
      .toBe("registered_locked");

    const now = new Date().toISOString();
    localStorage.setItem(
      SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
      JSON.stringify({
        "sup-no-001": {
          supplierId: "sup-no-001",
          intent: "exact_price",
          status: "approved",
          sentAt: now,
          pendingAt: now,
          approvedAt: now,
        },
      }),
    );

    act(() => {
      window.dispatchEvent(new CustomEvent(SUPPLIER_ACCESS_CHANGE_EVENT));
    });

    await waitFor(() => {
      expect(result.current.suppliers.find((supplier) => supplier.id === "sup-no-001")?.accessLevel)
        .toBe("qualified_unlocked");
    });
    expect(result.current.suppliers.find((supplier) => supplier.id === "sup-cn-002")?.accessLevel)
      .toBe("registered_locked");
  });
});
