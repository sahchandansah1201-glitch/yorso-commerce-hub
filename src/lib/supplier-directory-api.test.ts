import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupplierDirectoryApiClient } from "./supplier-directory-api";
import { SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY } from "@/lib/supplier-access-requests";

describe("supplier directory API adapter", () => {
  afterEach(() => {
    localStorage.removeItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY);
    sessionStorage.removeItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY);
  });

  it("uses local mock fallback without exposing locked supplier identity", async () => {
    const client = createSupplierDirectoryApiClient({ baseUrl: "" });
    const result = await client.listSuppliers({
      species: "Atlantic Salmon",
      countryCode: "NO",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });

    expect(client.enabled).toBe(false);
    expect(result.total).toBe(1);
    expect(result.suppliers[0]).toMatchObject({
      id: "sup-no-001",
      companyName: null,
      about: null,
      activeOffersCount: null,
      website: null,
      whatsapp: null,
    });

    const verified = await client.listSuppliers({
      verificationLevel: "documents_reviewed",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });
    expect(verified.total).toBeGreaterThan(0);
    expect(verified.suppliers.every((supplier) => supplier.verificationLevel === "documents_reviewed")).toBe(true);

    const unverified = await client.listSuppliers({
      verificationLevel: "unverified",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });
    expect(unverified.total).toBeGreaterThan(0);
    expect(unverified.suppliers.every((supplier) => supplier.verificationLevel === "unverified")).toBe(true);

    await expect(client.listSuppliers({
      q: "Nordfjord",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({ total: 0 });
  });

  it("unlocks local supplier detail only for qualified access", async () => {
    const client = createSupplierDirectoryApiClient({ baseUrl: "" });

    await expect(client.getSupplierById("sup-no-001", "registered_locked")).resolves.toMatchObject({
      id: "sup-no-001",
      companyName: null,
      website: null,
    });
    await expect(client.getSupplierById("sup-no-001", "qualified_unlocked")).resolves.toMatchObject({
      id: "sup-no-001",
      companyName: "Nordfjord Sjømat AS",
      website: "https://example-nordfjord.no",
    });
  });

  it("unlocks local supplier list and detail only for approved suppliers", async () => {
    const client = createSupplierDirectoryApiClient({ baseUrl: "" });
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

    await expect(client.listSuppliers({
      q: "Nordfjord",
      accessLevel: "registered_locked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({
      total: 1,
      suppliers: [
        {
          id: "sup-no-001",
          accessLevel: "qualified_unlocked",
          companyName: "Nordfjord Sjømat AS",
        },
      ],
    });

    await expect(client.listSuppliers({
      q: "Qingdao Ocean Harvest Foods",
      accessLevel: "registered_locked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({ total: 0 });

    await expect(client.getSupplierById("sup-no-001", "registered_locked")).resolves.toMatchObject({
      id: "sup-no-001",
      accessLevel: "qualified_unlocked",
      companyName: "Nordfjord Sjømat AS",
    });
    await expect(client.getSupplierById("sup-cn-002", "registered_locked")).resolves.toMatchObject({
      id: "sup-cn-002",
      accessLevel: "registered_locked",
      companyName: null,
    });
  });


  it("calls self-hosted supplier directory endpoints when API URL is configured", async () => {
    const fetchImpl = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.includes("/v1/suppliers?")) {
        return new Response(JSON.stringify({
          ok: true,
          suppliers: [],
          total: 0,
          accessLevel: "anonymous_locked",
          limit: 5,
          offset: 10,
          requestId: "req-list",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({
        ok: true,
        supplier: {
          id: "sup-test",
          maskedName: "Masked supplier",
          companyName: null,
          country: "Norway",
          countryCode: "NO",
          city: "Alesund",
          supplierType: "producer",
          inBusinessSinceYear: 2012,
          productFocus: [],
          certifications: [],
          certificationBadges: [],
          activeOffersCount: null,
          shortDescription: "Short",
          about: null,
          responseSignal: "normal",
          documentReadiness: "partial",
          verificationLevel: "basic",
          heroImage: "/offers/salmon.webp",
          logoImage: null,
          deliveryCountries: [],
          deliveryCountriesTotal: null,
          totalProductsCount: null,
          productCatalogPreview: [],
          productionFacts: {
            dailyTons: 0,
            lines: 0,
            coldStorageT: 0,
            blastFreezerT: 0,
            staff: 0,
          },
          logisticsFacts: {
            incoterms: ["FCA"],
            transitDaysMin: 0,
            transitDaysMax: 0,
            minBatchTons: 0,
            containers: ["TBC"],
            tempRange: "TBC",
          },
          website: null,
          whatsapp: null,
          updatedAt: "2026-05-14T00:00:00.000Z",
          accessLevel: "anonymous_locked",
        },
        accessLevel: "anonymous_locked",
        requestId: "req-detail",
      }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const client = createSupplierDirectoryApiClient({ baseUrl: "http://localhost:3000/", fetchImpl: fetchImpl as unknown as typeof fetch });
    await client.listSuppliers({
      q: "cod",
      countryCode: "NO",
      verificationLevel: "documents_reviewed",
      sortBy: "country",
      sortDirection: "asc",
      accessLevel: "anonymous_locked",
      limit: 5,
      offset: 10,
    });
    await client.getSupplierById("sup-test");

    expect(fetchImpl.mock.calls[0][0]).toBe("http://localhost:3000/v1/suppliers?q=cod&countryCode=NO&verificationLevel=documents_reviewed&sortBy=country&sortDirection=asc&accessLevel=anonymous_locked&limit=5&offset=10");
    expect(fetchImpl.mock.calls[1][0]).toBe("http://localhost:3000/v1/suppliers/sup-test?accessLevel=anonymous_locked");
    expect((fetchImpl.mock.calls[0][1]?.headers as Headers).get("x-yorso-user-id")).toBeTruthy();
    expect((fetchImpl.mock.calls[1][1]?.headers as Headers).get("x-yorso-user-id")).toBeTruthy();
  });
});
