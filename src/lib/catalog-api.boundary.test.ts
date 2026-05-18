import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SeafoodOffer } from "@/data/mockOffers";

const importCatalogApi = async (
  selfHosted: {
    enabled: boolean;
    offers?: SeafoodOffer[];
    offer?: SeafoodOffer | null;
  },
) => {
  vi.resetModules();

  const listOffers = vi.fn(async () => ({
    offers: selfHosted.offers ?? [],
    total: selfHosted.offers?.length ?? 0,
    accessLevel: "anonymous_locked",
    limit: 50,
    offset: 0,
    requestId: "test-list",
  }));
  const getOfferById = vi.fn(async () => selfHosted.offer ?? null);
  const fetchLegacyCatalogOffers = vi.fn(async () => [{ id: "legacy-offer" } as SeafoodOffer]);
  const fetchLegacyCatalogOfferById = vi.fn(async () => ({ id: "legacy-offer" }) as SeafoodOffer);

  vi.doMock("@/lib/offer-catalog-api", () => ({
    createOfferCatalogApiClient: () => ({
      enabled: selfHosted.enabled,
      listOffers,
      getOfferById,
    }),
  }));
  vi.doMock("@/lib/legacy-catalog-supabase-adapter", () => ({
    fetchLegacyCatalogOffers,
    fetchLegacyCatalogOfferById,
  }));

  const catalogApi = await import("./catalog-api");
  return {
    catalogApi,
    listOffers,
    getOfferById,
    fetchLegacyCatalogOffers,
    fetchLegacyCatalogOfferById,
  };
};

describe("catalog-api self-hosted boundary", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/offer-catalog-api");
    vi.doUnmock("@/lib/legacy-catalog-supabase-adapter");
    vi.resetModules();
  });

  it("uses self-hosted offer catalog before legacy Supabase fallback", async () => {
    const apiOffer = { id: "api-offer" } as SeafoodOffer;
    const runtime = await importCatalogApi({
      enabled: true,
      offers: [apiOffer],
      offer: apiOffer,
    });

    await expect(runtime.catalogApi.fetchOffers("registered_locked")).resolves.toEqual([apiOffer]);
    await expect(runtime.catalogApi.fetchOfferById("api-offer", "qualified_unlocked")).resolves.toBe(apiOffer);

    expect(runtime.listOffers).toHaveBeenCalledWith({
      accessLevel: "registered_locked",
      limit: 50,
      offset: 0,
    });
    expect(runtime.getOfferById).toHaveBeenCalledWith("api-offer", "qualified_unlocked");
    expect(runtime.fetchLegacyCatalogOffers).not.toHaveBeenCalled();
    expect(runtime.fetchLegacyCatalogOfferById).not.toHaveBeenCalled();
  });

  it("falls back to the isolated legacy Supabase adapter only when self-hosted API is disabled", async () => {
    const runtime = await importCatalogApi({ enabled: false });

    await expect(runtime.catalogApi.fetchOffers("anonymous_locked")).resolves.toEqual([{ id: "legacy-offer" }]);
    await expect(runtime.catalogApi.fetchOfferById("legacy-offer", "anonymous_locked")).resolves.toEqual({ id: "legacy-offer" });

    expect(runtime.listOffers).not.toHaveBeenCalled();
    expect(runtime.getOfferById).not.toHaveBeenCalled();
    expect(runtime.fetchLegacyCatalogOffers).toHaveBeenCalledWith("anonymous_locked");
    expect(runtime.fetchLegacyCatalogOfferById).toHaveBeenCalledWith("legacy-offer", "anonymous_locked");
  });

  it("keeps direct Supabase imports out of catalog-api.ts", () => {
    const catalogApi = readFileSync("src/lib/catalog-api.ts", "utf8");
    const legacyAdapter = readFileSync("src/lib/legacy-catalog-supabase-adapter.ts", "utf8");

    expect(catalogApi).toContain("self-hosted-first catalog facade");
    expect(catalogApi).toContain("createOfferCatalogApiClient");
    expect(catalogApi).toContain("fetchLegacyCatalogOffers");
    expect(catalogApi).not.toContain("@/integrations/supabase/client");

    expect(legacyAdapter).toContain("@/integrations/supabase/client");
    expect(legacyAdapter).toContain("fetchLegacyCatalogOffers");
    expect(legacyAdapter).toContain("fetchLegacyCatalogOfferById");
  });
});
