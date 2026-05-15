import { describe, expect, it } from "vitest";
import { PostgresOfferCatalogRepository, type OfferQueryClient } from "./postgres-repository.js";
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
    const grantedSearch = await repository.listOffers(
      {
        q: "Nordfjord",
        accessLevel: "qualified_unlocked",
        limit: 20,
        offset: 0,
      },
      { privateSearchSupplierIds: ["sup-no-001"] },
    );

    expect(privateSearch.total).toBe(0);
    expect(publicSearch.total).toBeGreaterThan(0);
    expect(unlockedSearch.total).toBe(0);
    expect(grantedSearch.total).toBe(1);
  });

  it("filters offer catalog by category, origin, supplier country, format and certification", async () => {
    const repository = new MemoryOfferCatalogRepository();

    const result = await repository.listOffers({
      category: "Shrimp",
      originCode: "EC",
      supplierCountryCode: "EC",
      format: "Frozen",
      certification: "BAP",
      sortBy: "origin",
      sortDirection: "asc",
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

  it("PostgreSQL repository scopes private offer search to granted supplier ids", async () => {
    const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
    const client: OfferQueryClient = {
      async query(sql, params) {
        calls.push({ sql, params });
        return {
          rows: [
            {
              id: "offer-row",
              product_name: "Atlantic Salmon Fillet",
              species: "Atlantic Salmon",
              latin_name: "Salmo salar",
              category: "Salmon",
              origin: "Norway",
              origin_code: "NO",
              origin_flag: "🇳🇴",
              format: "Frozen",
              cut_type: "Fillet",
              packaging: "10 kg carton",
              certifications: ["ASC"],
              image: "/offers/salmon.webp",
              images: ["/offers/salmon.webp"],
              gallery: [],
              photo_source_label: "Supplier-provided",
              sample_available: true,
              inspection_available: true,
              traceability: "Traceability available after access.",
              freshness: "Updated today",
              moq_label: "MOQ: 1,000 kg",
              moq_value: 1000,
              moq_unit: "kg",
              price_range_label: "$8.50 – $9.20",
              price_unit: "per kg",
              price_min: 8.5,
              price_max: 9.2,
              currency: "USD",
              supplier: {
                id: "sup-no-001",
                name: "Nordfjord Sjømat AS",
                country: "Norway",
                countryCode: "NO",
                countryFlag: "🇳🇴",
                isVerified: true,
                inBusinessSince: 2002,
                responseTime: "< 1 day",
                certifications: ["ASC"],
                documentsReviewed: ["HACCP"],
                profileSlug: "nordfjord-sjomat",
              },
              specs: {},
              commercial: { incoterm: "FOB", paymentTerms: "30/70", availableVolume: "Weekly", leadTime: "14 days", stockStatus: "In Stock", shipmentPort: "Ålesund" },
              delivery_basis_options: [],
              related_articles: [],
              volume_breaks: [],
              updated_at: new Date("2026-05-14T00:00:00.000Z"),
              total_count: 1,
            },
          ],
        };
      },
    };
    const repository = new PostgresOfferCatalogRepository({ databaseUrl: "postgres://example" }, { client });

    await repository.listOffers({
      q: "Nordfjord",
      sortBy: "category",
      sortDirection: "asc",
      accessLevel: "qualified_unlocked",
      limit: 10,
      offset: 0,
    });
    expect(calls[0].sql).toContain("public_search_text ilike $1");
    expect(calls[0].sql).not.toContain("private_search_text");
    expect(calls[0].sql).toContain("order by category asc, product_name asc, id asc");
    expect(calls[0].params).toEqual(["%Nordfjord%", 10, 0]);

    await repository.listOffers(
      {
        q: "Nordfjord",
        sortBy: "origin",
        sortDirection: "desc",
        accessLevel: "qualified_unlocked",
        limit: 10,
        offset: 0,
      },
      { privateSearchSupplierIds: ["sup-no-001"] },
    );
    expect(calls[1].sql).toContain("public_search_text ilike $1");
    expect(calls[1].sql).toContain("supplier_directory_id = any($2::text[])");
    expect(calls[1].sql).toContain("private_search_text ilike $1");
    expect(calls[1].sql).toContain("order by origin_code desc, origin desc, product_name desc, id asc");
    expect(calls[1].params).toEqual(["%Nordfjord%", ["sup-no-001"], 10, 0]);
  });
});
