import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { emptyCatalogFilters, type CatalogFilterState } from "@/components/catalog/CatalogFilters";
import { SUPPLIER_ACCESS_CHANGE_EVENT } from "@/lib/supplier-access-requests";
import {
  offerCatalogApiQueryFromFilters,
  offerMatchesClientFilters,
  useOfferCatalogList,
} from "./use-offer-catalog";
import type { OfferCatalogItem } from "./offer-catalog-api";

const apiOffer = (patch: Partial<OfferCatalogItem> = {}): OfferCatalogItem => ({
  id: "offer-api-cod",
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
  certifications: ["MSC", "HACCP"],
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
  priceRangeLabel: "$11.00 - $12.50",
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
  ...patch,
});

const filters = (patch: Partial<CatalogFilterState> = {}): CatalogFilterState => ({
  ...emptyCatalogFilters,
  ...patch,
});

describe("useOfferCatalogList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses local fallback without exposing exact price or supplier identity when API is disabled", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() =>
      useOfferCatalogList({
        filters: filters({ category: "Salmon" }),
        level: "anonymous_locked",
        limit: 50,
        offset: 0,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.apiEnabled).toBe(false);
    expect(result.current.source).toBe("local");
    expect(result.current.serverFiltered).toBe(false);
    expect(result.current.offers.length).toBeGreaterThan(0);
    expect(result.current.offers[0]).toMatchObject({
      supplierName: "Имя поставщика скрыто",
      priceMin: undefined,
      priceMax: undefined,
      currency: undefined,
    });
  });

  it("maps supported catalog filters into the self-hosted /v1/offers query", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({
        ok: true,
        offers: [apiOffer()],
        total: 1,
        accessLevel: "anonymous_locked",
        limit: 25,
        offset: 50,
        requestId: "req-offers",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useOfferCatalogList({
        filters: filters({
          q: "cod loin",
          category: "Whitefish",
          origin: "Iceland",
          supplierCountry: "Iceland",
          state: "Fresh",
          certification: "MSC",
        }),
        level: "anonymous_locked",
        limit: 25,
        offset: 50,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const firstUrl = (fetchMock.mock.calls as unknown as [[string]])[0][0];
    expect(firstUrl).toBe(
      "http://api.test/v1/offers?q=cod+loin&category=Whitefish&originCode=IS&supplierCountryCode=IS&format=Fresh&certification=MSC&accessLevel=anonymous_locked&limit=25&offset=50",
    );
  });

  it("treats server-filtered API rows as source of truth for supported filters", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const remoteOffer = apiOffer({
      productName: "Remote private match",
      category: "Whitefish",
      origin: "Iceland",
    });
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        ok: true,
        offers: [remoteOffer],
        total: 1,
        accessLevel: "anonymous_locked",
        limit: 50,
        offset: 0,
        requestId: "req-offers",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    ));

    const activeFilters = filters({ q: "only backend knows this query" });
    const { result } = renderHook(() =>
      useOfferCatalogList({
        filters: activeFilters,
        level: "anonymous_locked",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.serverFiltered).toBe(true);
    expect(result.current.offers).toHaveLength(1);
    expect(offerMatchesClientFilters(result.current.offers[0], activeFilters, false, true)).toBe(true);
    expect(offerMatchesClientFilters(result.current.offers[0], activeFilters, false, false)).toBe(false);
  });

  it("refreshes self-hosted offer list after supplier access changes", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({
        ok: true,
        offers: [apiOffer()],
        total: 1,
        accessLevel: "registered_locked",
        limit: 50,
        offset: 0,
        requestId: "req-offers",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useOfferCatalogList({
        filters: filters({ category: "Whitefish" }),
        level: "registered_locked",
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      window.dispatchEvent(new CustomEvent(SUPPLIER_ACCESS_CHANGE_EVENT));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://api.test/v1/offers?category=Whitefish&accessLevel=registered_locked&limit=50&offset=0",
    );
  });

  it("falls back to safe prototype offers when the self-hosted API is unavailable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network unavailable");
    }));

    const { result } = renderHook(() =>
      useOfferCatalogList({
        filters: filters({ category: "Salmon" }),
        level: "anonymous_locked",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(warnSpy).toHaveBeenCalled();
    expect(result.current.usingFallback).toBe(true);
    expect(result.current.serverFiltered).toBe(false);
    expect(result.current.offers.length).toBeGreaterThan(0);
    expect(result.current.offers[0].supplierName).toBe("Имя поставщика скрыто");
  });
});

describe("offer catalog filter mapping", () => {
  it("keeps pagination bounded for high-concurrency catalog reads", () => {
    expect(offerCatalogApiQueryFromFilters(
      filters({ category: "Tuna", origin: "Philippines", supplierCountry: "Vietnam" }),
      "registered_locked",
      50,
      100,
    )).toMatchObject({
      category: "Tuna",
      originCode: "PH",
      supplierCountryCode: "VN",
      accessLevel: "registered_locked",
      limit: 50,
      offset: 100,
    });
  });
});
