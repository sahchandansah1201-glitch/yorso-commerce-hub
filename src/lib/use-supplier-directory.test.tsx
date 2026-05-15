import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockSuppliers } from "@/data/mockSuppliers";
import { SUPPLIER_ACCESS_CHANGE_EVENT } from "@/lib/supplier-access-requests";
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
    website: null,
    whatsapp: null,
    updatedAt: "2026-05-14T00:00:00.000Z",
    accessLevel: "registered_locked",
    ...patch,
  };
};

describe("useSupplierDirectory runtime refresh", () => {
  afterEach(() => {
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
      "http://api.test/v1/suppliers?q=salmon&accessLevel=registered_locked&limit=50&offset=0",
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
      `http://api.test/v1/suppliers/${mockSuppliers[0].id}?accessLevel=registered_locked`,
    );
  });
});
