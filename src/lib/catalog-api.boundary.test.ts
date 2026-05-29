import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";

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

  vi.doMock("@/lib/offer-catalog-api", () => ({
    createOfferCatalogApiClient: () => ({
      enabled: selfHosted.enabled,
      listOffers,
      getOfferById,
    }),
  }));

  const catalogApi = await import("./catalog-api");
  return {
    catalogApi,
    listOffers,
    getOfferById,
  };
};

describe("catalog-api self-hosted boundary", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/offer-catalog-api");
    vi.resetModules();
  });

  it("uses self-hosted offer catalog as the catalog source of truth", async () => {
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
  });

  it("delegates API-disabled preview to offer-catalog local fixtures, not hosted BaaS", async () => {
    const localPreviewOffer = { ...mockOffers[0], id: "local-preview-offer" };
    const runtime = await importCatalogApi({
      enabled: false,
      offers: [localPreviewOffer],
      offer: localPreviewOffer,
    });

    await expect(runtime.catalogApi.fetchOffers("anonymous_locked")).resolves.toEqual([localPreviewOffer]);
    await expect(runtime.catalogApi.fetchOfferById("local-preview-offer", "anonymous_locked")).resolves.toBe(localPreviewOffer);

    expect(runtime.listOffers).toHaveBeenCalledWith({
      accessLevel: "anonymous_locked",
      limit: 50,
      offset: 0,
    });
    expect(runtime.getOfferById).toHaveBeenCalledWith("local-preview-offer", "anonymous_locked");
  });

  it("removes the catalog hosted-provider fallback adapter from the facade path", () => {
    const catalogApi = readFileSync("src/lib/catalog-api.ts", "utf8");

    expect(catalogApi).toContain("self-hosted-first catalog facade");
    expect(catalogApi).toContain("createOfferCatalogApiClient");
    expect(catalogApi).not.toContain("legacy-catalog-supabase-adapter");
    expect(catalogApi).not.toContain("fetchLegacyCatalogOffers");
    expect(catalogApi).not.toContain("fetchLegacyCatalogOfferById");
    expect(catalogApi).not.toContain("@/integrations/supabase/client");

    expect(existsSync("src/lib/legacy-catalog-supabase-adapter.ts")).toBe(false);
  });
});
