import { describe, expect, it } from "vitest";
import { MemoryOfferCatalogRepository } from "./repository.js";

describe("offer catalog repositories", () => {
  it("filters locked offer search without matching supplier identity", async () => {
    const repository = new MemoryOfferCatalogRepository();

    const privateSearch = await repository.listOffers({
      q: "Nordfjord",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });
    const publicSearch = await repository.listOffers({
      q: "salmon",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });
    const unlockedSearch = await repository.listOffers({
      q: "Nordfjord",
      accessLevel: "qualified_unlocked",
      limit: 20,
      offset: 0,
    });

    expect(privateSearch.total).toBe(0);
    expect(publicSearch.total).toBeGreaterThan(0);
    expect(unlockedSearch.total).toBe(1);
  });

  it("filters offer catalog by category, origin, supplier country, format and certification", async () => {
    const repository = new MemoryOfferCatalogRepository();

    const result = await repository.listOffers({
      category: "Shrimp",
      originCode: "EC",
      supplierCountryCode: "EC",
      format: "Frozen",
      certification: "BAP",
      accessLevel: "anonymous_locked",
      limit: 20,
      offset: 0,
    });

    expect(result.total).toBe(1);
    expect(result.offers[0]).toMatchObject({
      id: "2",
      category: "Shrimp",
      originCode: "EC",
    });
  });
});
