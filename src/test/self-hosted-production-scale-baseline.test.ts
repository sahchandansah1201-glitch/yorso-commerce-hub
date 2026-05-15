import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

describe("production scale baseline", () => {
  it("passes the production scale guard", () => {
    const output = runNode(["scripts/check-production-scale-baseline.mjs"]);

    expect(output).toContain("Production scale baseline check passed");
    expect(output).toContain("10,000 concurrent-user target is documented");
  });

  it("keeps the 10,000-user target visible in backend docs and CI", () => {
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");
    const architecture = readFileSync("docs/backend/self-hosted-backend-architecture.md", "utf8");
    const validation = readFileSync("docs/backend/self-hosted-validation.md", "utf8");
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(baseline).toContain("10,000 concurrent web users");
    expect(baseline).toContain("Queue/backpressure");
    expect(baseline).toContain("Load test");
    expect(architecture).toContain("10,000 direct PostgreSQL connections are not an acceptable architecture");
    expect(validation).toContain("check:production-scale-baseline");
    expect(pkg.scripts["check:production-scale-baseline"]).toBe(
      "node scripts/check-production-scale-baseline.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run check:production-scale-baseline");
  });

  it("keeps supplier discovery bounded and index-backed for high concurrency", () => {
    const supplierApi = readFileSync("src/lib/supplier-directory-api.ts", "utf8");
    const offerApi = readFileSync("src/lib/offer-catalog-api.ts", "utf8");
    const suppliersPage = readFileSync("src/pages/Suppliers.tsx", "utf8");
    const offersPage = readFileSync("src/pages/Offers.tsx", "utf8");
    const supplierScaling = readFileSync(
      "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
      "utf8",
    );
    const supplierPaginationSort = readFileSync(
      "packages/db/migrations/0009_supplier_directory_pagination_sort.sql",
      "utf8",
    );
    const offerCatalog = readFileSync("packages/db/migrations/0006_offer_catalog.sql", "utf8");
    const offerPaginationSort = readFileSync(
      "packages/db/migrations/0010_offer_catalog_pagination_sort.sql",
      "utf8",
    );
    const supplierAccess = readFileSync("packages/db/migrations/0007_supplier_access_flow.sql", "utf8");

    expect(supplierApi).toContain("limit");
    expect(supplierApi).toContain("offset");
    expect(offerApi).toContain("limit");
    expect(offerApi).toContain("offset");
    expect(offerApi).toContain("sortBy");
    expect(offerApi).toContain("sortDirection");
    expect(offerApi).toContain("supplierCountryCode");
    expect(suppliersPage).toContain("pageSize");
    expect(suppliersPage).toContain("offset: (page - 1) * pageSize");
    expect(suppliersPage).toContain("supplier-directory-pagination");
    expect(offersPage).toContain("pageSize");
    expect(offersPage).toContain("offset: (page - 1) * pageSize");
    expect(offersPage).toContain("offer-catalog-pagination");
    expect(offersPage).toContain("offer-catalog-sort");
    expect(suppliersPage).toContain("setTimeout");
    expect(supplierScaling).toContain("gin_trgm_ops");
    expect(supplierScaling).toContain("idx_yorso_suppliers_directory_verification_level");
    expect(supplierPaginationSort).toContain("idx_yorso_suppliers_directory_published_updated");
    expect(supplierPaginationSort).toContain("idx_yorso_suppliers_directory_published_country");
    expect(offerCatalog).toContain("gin_trgm_ops");
    expect(offerCatalog).toContain("idx_yorso_offers_catalog_public_search_text");
    expect(offerCatalog).toContain("idx_yorso_offers_catalog_supplier_country_code");
    expect(offerPaginationSort).toContain("idx_yorso_offers_catalog_published_updated");
    expect(offerPaginationSort).toContain("idx_yorso_offers_catalog_published_category");
    expect(supplierAccess).toContain("idx_yorso_supplier_access_requests_buyer");
    expect(supplierAccess).toContain("idx_yorso_access_grants_buyer_supplier_scope");
    expect(supplierAccess).toContain("idx_yorso_access_notifications_buyer_status_created");
  });
});
