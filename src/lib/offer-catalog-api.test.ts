import { describe, expect, it, vi } from "vitest";
import { createOfferCatalogApiClient } from "./offer-catalog-api";

describe("offer catalog API adapter", () => {
  it("uses local mock fallback without exposing locked supplier identity or exact price", async () => {
    const client = createOfferCatalogApiClient({ baseUrl: "" });
    const result = await client.listOffers({
      category: "Salmon",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });

    expect(client.enabled).toBe(false);
    expect(result.total).toBeGreaterThan(0);
    expect(result.offers[0]).toMatchObject({
      supplierName: "Имя поставщика скрыто",
      priceMin: undefined,
      priceMax: undefined,
      currency: undefined,
    });

    await expect(client.listOffers({
      q: "Nordic Seafood",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    })).resolves.toMatchObject({ total: 0 });
  });

  it("unlocks local offer detail only for qualified access", async () => {
    const client = createOfferCatalogApiClient({ baseUrl: "" });

    await expect(client.getOfferById("1", "registered_locked")).resolves.toMatchObject({
      id: "1",
      supplierName: "Имя поставщика скрыто",
      priceMin: undefined,
    });
    await expect(client.getOfferById("1", "qualified_unlocked")).resolves.toMatchObject({
      id: "1",
      supplierName: "Nordic Seafood AS",
      priceMin: 8.5,
      currency: "USD",
    });
  });

  it("calls self-hosted offer catalog endpoints when API URL is configured", async () => {
    const apiOffer = {
      id: "offer-test",
      productName: "API Cod Loin",
      species: "Atlantic Cod",
      latinName: "Gadus morhua",
      category: "Whitefish",
      origin: "Iceland",
      originCode: "IS",
      originFlag: "🇮🇸",
      format: "Fresh",
      cutType: "Loin",
      packaging: "5 kg carton",
      certifications: ["MSC"],
      image: "/offers/cod.webp",
      images: ["/offers/cod.webp"],
      gallery: [],
      photoSourceLabel: "Supplier-provided",
      sampleAvailable: false,
      inspectionAvailable: true,
      traceability: null,
      freshness: "Updated today",
      moqLabel: "MOQ: 2,000 kg",
      moqValue: 2000,
      moqUnit: "kg",
      priceRangeLabel: "$11.00 – $12.50",
      priceUnit: "per kg",
      priceMin: null,
      priceMax: null,
      currency: null,
      supplier: {
        id: "sup-is-005",
        name: null,
        country: "Iceland",
        countryCode: "IS",
        countryFlag: "🇮🇸",
        isVerified: true,
        inBusinessSince: null,
        responseTime: null,
        certifications: ["MSC"],
        documentsReviewed: [],
        profileSlug: null,
      },
      specs: {
        catchingMethod: "Wild caught",
        freezingProcess: "Fresh chilled",
        glazing: "0%",
        storageTemperature: "0-2°C",
        fishingArea: "FAO 27",
        ingredients: "100% cod",
        nutritionPer100g: { calories: "90 kcal", protein: "18 g", fat: "1 g", carbs: "0 g" },
        packingWeight: "5 kg net",
        shelfLife: "10 days",
      },
      commercial: {
        incoterm: "FCA",
        paymentTerms: "Net 14 days",
        availableVolume: "Weekly",
        leadTime: "3-5 days",
        stockStatus: "In Stock",
        shipmentPort: "Reykjavik",
      },
      deliveryBasisOptions: [],
      relatedArticles: [],
      volumeBreaks: [],
      updatedAt: "2026-05-14T00:00:00.000Z",
      accessLevel: "anonymous_locked",
    };

    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/v1/offers?")) {
        return new Response(JSON.stringify({
          ok: true,
          offers: [apiOffer],
          total: 1,
          accessLevel: "anonymous_locked",
          limit: 5,
          offset: 10,
          requestId: "req-list",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({
        ok: true,
        offer: apiOffer,
        accessLevel: "anonymous_locked",
        requestId: "req-detail",
      }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const client = createOfferCatalogApiClient({ baseUrl: "http://localhost:3000/", fetchImpl: fetchImpl as unknown as typeof fetch });
    const list = await client.listOffers({
      q: "cod",
      originCode: "IS",
      category: "Whitefish",
      accessLevel: "anonymous_locked",
      limit: 5,
      offset: 10,
    });
    const detail = await client.getOfferById("offer-test");

    expect(list.offers[0]).toMatchObject({ productName: "API Cod Loin", supplierName: "Имя поставщика скрыто" });
    expect(detail).toMatchObject({
      productName: "API Cod Loin",
      priceMin: undefined,
      supplier: expect.objectContaining({ id: "sup-is-005" }),
    });
    expect(fetchImpl.mock.calls[0][0]).toBe("http://localhost:3000/v1/offers?q=cod&originCode=IS&category=Whitefish&accessLevel=anonymous_locked&limit=5&offset=10");
    expect(fetchImpl.mock.calls[1][0]).toBe("http://localhost:3000/v1/offers/offer-test?accessLevel=anonymous_locked");
  });
});
