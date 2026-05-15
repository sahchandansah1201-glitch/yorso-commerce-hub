import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { mockOffers } from "@/data/mockOffers";
import { legacyOfferIdToUuid } from "@/lib/legacy-offer-id";
import { SUPPLIER_ACCESS_CHANGE_EVENT } from "@/lib/supplier-access-requests";
import { useOfferDetail } from "./use-offer-detail";
import type { OfferCatalogItem } from "./offer-catalog-api";

const seededOfferUuid = legacyOfferIdToUuid(mockOffers[0].id);

const apiOffer = (patch: Partial<OfferCatalogItem> = {}): OfferCatalogItem => ({
  id: "offer-api-detail",
  productName: "API Yellowfin Tuna Loin",
  species: "Yellowfin Tuna",
  latinName: "Thunnus albacares",
  category: "Tuna",
  origin: "Philippines",
  originCode: "PH",
  originFlag: "🇵🇭",
  format: "Chilled",
  cutType: "Loin",
  packaging: "10 kg carton",
  certifications: ["HACCP"],
  image: "/offers/tuna.webp",
  images: ["/offers/tuna.webp"],
  gallery: [],
  photoSourceLabel: "Supplier-provided",
  sampleAvailable: true,
  inspectionAvailable: true,
  traceability: null,
  freshness: "Updated today",
  moqLabel: "MOQ: 1,000 kg",
  moqValue: 1000,
  moqUnit: "kg",
  priceRangeLabel: "Price on request",
  priceUnit: "per kg",
  priceMin: null,
  priceMax: null,
  currency: null,
  supplier: {
    id: "sup-ph-010",
    name: null,
    country: "Philippines",
    countryCode: "PH",
    countryFlag: "🇵🇭",
    isVerified: true,
    inBusinessSince: null,
    responseTime: null,
    certifications: ["HACCP"],
    documentsReviewed: [],
    profileSlug: null,
  },
  specs: {
    catchingMethod: "Wild caught",
    freezingProcess: "Fresh chilled",
    glazing: "0%",
    storageTemperature: "0-2°C",
    fishingArea: "FAO 71",
    ingredients: "100% tuna",
    nutritionPer100g: { calories: "130 kcal", protein: "24 g", fat: "3 g", carbs: "0 g" },
    packingWeight: "10 kg net",
    shelfLife: "8 days",
  },
  commercial: {
    incoterm: "FOB",
    paymentTerms: "30% advance",
    availableVolume: "Weekly",
    leadTime: "5-7 days",
    stockStatus: "In Stock",
    shipmentPort: "General Santos",
  },
  deliveryBasisOptions: [],
  relatedArticles: [],
  volumeBreaks: [],
  updatedAt: "2026-05-14T00:00:00.000Z",
  accessLevel: "anonymous_locked",
  ...patch,
});

describe("useOfferDetail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses local fallback without exposing exact price or supplier identity when API is disabled", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useOfferDetail(seededOfferUuid, "registered_locked"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.apiEnabled).toBe(false);
    expect(result.current.source).toBe("local");
    expect(result.current.usingFallback).toBe(false);
    expect(result.current.offer).toMatchObject({
      productName: mockOffers[0].productName,
      supplierName: "Имя поставщика скрыто",
      priceMin: undefined,
      priceMax: undefined,
      currency: undefined,
    });
  });

  it("calls the self-hosted offer detail endpoint when API URL is configured", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test/");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({
        ok: true,
        offer: apiOffer(),
        accessLevel: "anonymous_locked",
        requestId: "req-detail",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useOfferDetail("offer-api-detail", "anonymous_locked"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.source).toBe("api");
    expect(result.current.usingFallback).toBe(false);
    expect(result.current.offer?.productName).toBe("API Yellowfin Tuna Loin");
    expect(result.current.offer?.supplierName).toBe("Имя поставщика скрыто");
    const firstUrl = (fetchMock.mock.calls as unknown as [[string]])[0][0];
    expect(firstUrl).toBe("http://api.test/v1/offers/offer-api-detail?accessLevel=anonymous_locked");
  });

  it("refreshes self-hosted offer detail after supplier access changes", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test/");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({
        ok: true,
        offer: apiOffer(),
        accessLevel: "registered_locked",
        requestId: "req-detail",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useOfferDetail("offer-api-detail", "registered_locked"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      window.dispatchEvent(new CustomEvent(SUPPLIER_ACCESS_CHANGE_EVENT));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://api.test/v1/offers/offer-api-detail?accessLevel=registered_locked",
    );
  });

  it("falls back to safe prototype offer when the self-hosted detail API is unavailable", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network unavailable");
    }));

    const { result } = renderHook(() => useOfferDetail(seededOfferUuid, "anonymous_locked"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.usingFallback).toBe(true);
    expect(result.current.source).toBe("local");
    expect(result.current.failedAttempts).toBe(1);
    expect(result.current.lastErrorCode).toBe("network unavailable");
    expect(result.current.offer).toMatchObject({
      productName: mockOffers[0].productName,
      supplierName: "Имя поставщика скрыто",
      priceMin: undefined,
    });
  });

  it("returns not-found state for remote 404 when no safe local fallback exists", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        error: { code: "offer_not_found", message: "Offer not found" },
      }), { status: 404, headers: { "content-type": "application/json" } }),
    ));

    const { result } = renderHook(() =>
      useOfferDetail("00000000-0000-0000-0000-000000009999", "anonymous_locked"),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.offer).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.usingFallback).toBe(false);
  });
});
