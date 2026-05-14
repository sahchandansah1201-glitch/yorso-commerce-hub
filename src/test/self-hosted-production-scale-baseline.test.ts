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
    const supplierScaling = readFileSync(
      "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
      "utf8",
    );
    const offerCatalog = readFileSync("packages/db/migrations/0006_offer_catalog.sql", "utf8");

    expect(supplierApi).toContain("limit");
    expect(supplierApi).toContain("offset");
    expect(offerApi).toContain("limit");
    expect(offerApi).toContain("offset");
    expect(offerApi).toContain("supplierCountryCode");
    expect(suppliersPage).toContain("limit: 50");
    expect(suppliersPage).toContain("offset: 0");
    expect(suppliersPage).toContain("setTimeout");
    expect(supplierScaling).toContain("gin_trgm_ops");
    expect(supplierScaling).toContain("idx_yorso_suppliers_directory_verification_level");
    expect(offerCatalog).toContain("gin_trgm_ops");
    expect(offerCatalog).toContain("idx_yorso_offers_catalog_public_search_text");
    expect(offerCatalog).toContain("idx_yorso_offers_catalog_supplier_country_code");
  });
});
