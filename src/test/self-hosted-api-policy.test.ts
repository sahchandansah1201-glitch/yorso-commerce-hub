import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

describe("self-hosted API policy", () => {
  it("passes the API skeleton guard", () => {
    const output = runNode(["scripts/check-self-hosted-api.mjs"]);

    expect(output).toContain("Self-hosted API skeleton check passed");
    expect(output).toContain("apps/api exposes health and account-contract endpoints");
  });

  it("keeps the API service wired into compose as a deployable backend process", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const dockerfile = readFileSync("apps/api/Dockerfile", "utf8");

    expect(compose).toContain("api:");
    expect(compose).toContain("pgbouncer:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("minio:");
    expect(compose).not.toMatch(/SUPABASE/i);
    expect(dockerfile).toContain("RUN npm run api:build");
    expect(dockerfile).toContain("CMD [\"node\", \"apps/api/dist/index.js\"]");
  });

  it("keeps the runtime account API smoke wired into CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const smoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-account-api-smoke.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-account-api"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-account-api:run",
    );
    expect(pkg.scripts["smoke:self-hosted-account-api:run"]).toBe(
      "node scripts/smoke-self-hosted-account-api.mjs",
    );
    expect(pkg.scripts["ci:core"]).toContain("npm run smoke:self-hosted-account-api:run");
    expect(smoke).toContain("apps/api/dist/index.js");
    expect(smoke).toContain("x-yorso-user-id");
    expect(smoke).toContain("file_owner_guard=ok");
    expect(docs).toContain("self_hosted_account_api_smoke=ok");
  });

  it("keeps self-hosted auth smoke fail-closed after sign-out", () => {
    const smoke = readFileSync("scripts/smoke-self-hosted-auth-api.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-auth-api-smoke.md", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    for (const marker of [
      "auth_sign_out_revokes_session=ok",
      "auth_sign_out_blocks_account=ok",
      "auth_sign_out_blocks_access=ok",
      "auth_sign_out_blocks_offer_unlock=ok",
      "auth_sign_out_preserves_public_catalog=ok",
    ]) {
      expect(smoke).toContain(marker);
      expect(docs).toContain(marker);
    }

    expect(baseline).toContain("Batch #76");
    expect(baseline).toContain("revoked-session behavior");
    expect(baseline).toContain("10,000 concurrent-user baseline");
  });

  it("keeps row-level account workspace CRUD guarded across API, contracts and adapter", () => {
    const routes = readFileSync("apps/api/src/modules/account/routes.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/account/service.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/account/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/account/postgres-repository.ts", "utf8");
    const accountApi = readFileSync("src/lib/account-api.ts", "utf8");
    const contracts = readFileSync("packages/contracts/src/account-company.ts", "utf8");
    const accountSmoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");
    const workspaceSmoke = readFileSync("scripts/smoke-self-hosted-workspace-postgres.mjs", "utf8");
    const skeletonDocs = readFileSync("docs/backend/self-hosted-api-skeleton.md", "utf8");

    expect(routes).toContain("/v1/account/branches/");
    expect(routes).toContain("/v1/account/products/");
    expect(routes).toContain("/v1/account/meta-regions/");
    expect(routes).toContain("/v1/account/notifications/");
    expect(routes).toContain("GET, POST, PATCH, DELETE");
    expect(routes).toContain("workspace_item_conflict");
    expect(routes).toContain("workspace_item_not_found");

    expect(service).toContain("companyBranchCreateSchema.parse");
    expect(service).toContain("companyProductUpdateSchema.parse");
    expect(service).toContain("notificationPreferenceUpdateSchema.parse");

    for (const method of [
      "createBranch",
      "updateBranch",
      "deleteBranch",
      "createProduct",
      "updateProduct",
      "deleteProduct",
      "createMetaRegion",
      "updateMetaRegion",
      "deleteMetaRegion",
      "createNotification",
      "updateNotification",
      "deleteNotification",
    ]) {
      expect(repository).toContain(method);
      expect(postgresRepository).toContain(method);
      expect(accountApi).toContain(method);
    }

    expect(contracts).toContain("companyBranchCreateSchema");
    expect(contracts).toContain("companyProductUpdateSchema");
    expect(contracts).toContain("metaRegionCreateSchema");
    expect(contracts).toContain("notificationPreferenceUpdateSchema");
    expect(accountSmoke).toContain("branch_row_create=ok");
    expect(accountSmoke).toContain("notification_row_validation_guard=ok");
    expect(workspaceSmoke).toContain("product_row_patch=ok");
    expect(skeletonDocs).toContain("Batch #33 adds owner-scoped row-level CRUD");
  });

  it("keeps supplier directory API behind self-hosted contracts and access shaping", () => {
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const routes = readFileSync("apps/api/src/modules/suppliers/routes.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/suppliers/service.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/suppliers/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/suppliers/postgres-repository.ts", "utf8");
    const contracts = readFileSync("packages/contracts/src/supplier-directory.ts", "utf8");
    const adapter = readFileSync("src/lib/supplier-directory-api.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");

    expect(server).toContain("handleSupplierDirectoryRoute");
    expect(server).toContain("createSupplierRepository(config)");
    expect(routes).toContain("/v1/suppliers");
    expect(routes).toContain("/v1/suppliers/");
    expect(routes).toContain("resolveOptionalAuthenticatedAccountSession");
    expect(routes).toContain("supplier_not_found");
    expect(service).toContain("shapeSupplierForAccess");
    expect(service).toContain("hasSupplierAccess");
    expect(service).toContain("listAccessibleSupplierIds");
    expect(service).toContain("resolveDetailAccessLevel");
    expect(repository).toContain("privateSearchSupplierIds");
    expect(service).toContain("qualified_unlocked");
    expect(repository).toContain("MemorySupplierRepository");
    expect(postgresRepository).toContain("from yorso_suppliers_directory");
    expect(postgresRepository).toContain("publication_status = 'published'");
    expect(postgresRepository).toContain("private_search_text");
    expect(contracts).toContain("supplierDirectoryRecordSchema");
    expect(contracts).toContain("supplierDirectoryItemSchema");
    expect(contracts).toContain("verificationLevel: supplierVerificationLevelSchema.optional()");
    expect(adapter).toContain("createSupplierDirectoryApiClient");
    expect(adapter).toContain("ACCOUNT_USER_ID_HEADER");
    expect(adapter).toContain("verificationLevel");
    expect(adapter).toContain("mockSuppliers");
    expect(smoke).toContain("supplier_directory_locked=ok");
    expect(smoke).toContain("supplier_directory_verified_filter=ok");
    expect(smoke).toContain("supplier_directory_requires_grant=ok");
    expect(smoke).toContain("supplier_directory_private_search_requires_grant=ok");
    expect(smoke).toContain("supplier_directory_unlocked=ok");
    expect(smoke).toContain("supplier_directory_granted_private_search=ok");
    expect(smoke).toContain("supplier_directory_ungranted_private_search_guard=ok");
  });

  it("keeps offer catalog API behind self-hosted contracts and access shaping", () => {
    const server = readFileSync("apps/api/src/server.ts", "utf8");
    const routes = readFileSync("apps/api/src/modules/offers/routes.ts", "utf8");
    const service = readFileSync("apps/api/src/modules/offers/service.ts", "utf8");
    const repository = readFileSync("apps/api/src/modules/offers/repository.ts", "utf8");
    const postgresRepository = readFileSync("apps/api/src/modules/offers/postgres-repository.ts", "utf8");
    const contracts = readFileSync("packages/contracts/src/offer-catalog.ts", "utf8");
    const adapter = readFileSync("src/lib/offer-catalog-api.ts", "utf8");
    const smoke = readFileSync("scripts/smoke-self-hosted-account-api.mjs", "utf8");

    expect(server).toContain("handleOfferCatalogRoute");
    expect(server).toContain("createOfferCatalogRepository(config)");
    expect(routes).toContain("/v1/offers");
    expect(routes).toContain("/v1/offers/");
    expect(routes).toContain("resolveOptionalAuthenticatedAccountSession");
    expect(routes).toContain("offer_not_found");
    expect(service).toContain("shapeOfferForAccess");
    expect(service).toContain("listAccessibleSupplierIds");
    expect(service).toContain("resolveListAccessLevel");
    expect(service).toContain("qualified_unlocked");
    expect(repository).toContain("privateSearchSupplierIds");
    expect(repository).toContain("MemoryOfferCatalogRepository");
    expect(postgresRepository).toContain("from yorso_offers_catalog");
    expect(postgresRepository).toContain("publication_status = 'published'");
    expect(postgresRepository).toContain("supplier_directory_id = any");
    expect(contracts).toContain("offerCatalogRecordSchema");
    expect(contracts).toContain("offerCatalogItemSchema");
    expect(contracts).toContain("supplierCountryCode: z.string().length(2).optional()");
    expect(adapter).toContain("createOfferCatalogApiClient");
    expect(adapter).toContain("supplierCountryCode");
    expect(adapter).toContain("mockOffers");
    expect(smoke).toContain("offer_catalog_locked=ok");
    expect(smoke).toContain("offer_catalog_private_search_guard=ok");
    expect(smoke).toContain("offer_catalog_private_search_requires_grant=ok");
    expect(smoke).toContain("offer_catalog_list_requires_grant=ok");
    expect(smoke).toContain("offer_catalog_unlocked=ok");
    expect(smoke).toContain("offer_catalog_granted_private_search=ok");
    expect(smoke).toContain("offer_catalog_ungranted_private_search_guard=ok");
  });

  it("keeps the optional live PostgreSQL account smoke available without requiring it in CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const smoke = readFileSync("scripts/smoke-self-hosted-account-postgres.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-account-postgres-smoke.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-account-postgres"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-account-postgres:run",
    );
    expect(pkg.scripts["smoke:self-hosted-account-postgres:run"]).toBe(
      "node scripts/smoke-self-hosted-account-postgres.mjs",
    );
    expect(pkg.scripts["ci:core"]).not.toContain("npm run smoke:self-hosted-account-postgres:run");
    expect(smoke).toContain("MIGRATION_DATABASE_URL");
    expect(smoke).toContain("self_hosted_account_postgres_smoke=skipped");
    expect(smoke).toContain("ACCOUNT_REPOSITORY: \"postgres\"");
    expect(smoke).toContain("file_owner_guard=ok");
    expect(docs).toContain("optional live runtime smoke");
    expect(docs).toContain("self_hosted_account_postgres_smoke=ok");
  });

  it("keeps the optional live PostgreSQL workspace smoke available without requiring it in CI", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const smoke = readFileSync("scripts/smoke-self-hosted-workspace-postgres.mjs", "utf8");
    const docs = readFileSync("docs/backend/self-hosted-workspace-postgres-smoke.md", "utf8");

    expect(pkg.scripts["smoke:self-hosted-workspace-postgres"]).toBe(
      "npm run api:build && npm run smoke:self-hosted-workspace-postgres:run",
    );
    expect(pkg.scripts["smoke:self-hosted-workspace-postgres:run"]).toBe(
      "node scripts/smoke-self-hosted-workspace-postgres.mjs",
    );
    expect(pkg.scripts["ci:core"]).not.toContain("npm run smoke:self-hosted-workspace-postgres:run");
    expect(smoke).toContain("MIGRATION_DATABASE_URL");
    expect(smoke).toContain("self_hosted_workspace_postgres_smoke=skipped");
    expect(smoke).toContain("ACCOUNT_REPOSITORY: \"postgres\"");
    expect(smoke).toContain("branches_replace=ok");
    expect(smoke).toContain("products_replace=ok");
    expect(smoke).toContain("meta_regions_replace=ok");
    expect(smoke).toContain("notifications_validation_guard=ok");
    expect(smoke).toContain("workspace_owner_isolation=ok");
    expect(docs).toContain("optional live runtime smoke");
    expect(docs).toContain("self_hosted_workspace_postgres_smoke=ok");
  });
});
