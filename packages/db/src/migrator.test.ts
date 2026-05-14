import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sha256 } from "./checksum.js";
import { buildMigrationPlan } from "./migrator.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

describe("self-hosted DB migration planner", () => {
  it("builds a deterministic migration plan from the manifest", () => {
    const plan = buildMigrationPlan(packageRoot);

    expect(plan.migrations.map((migration) => migration.id)).toEqual([
      "0000_migration_registry",
      "0001_account_company_baseline",
      "0002_account_workspace_sections",
      "0003_account_files_and_documents",
      "0004_supplier_directory",
      "0005_supplier_directory_search_scaling",
      "0006_offer_catalog",
      "0007_supplier_access_flow",
      "0008_access_notification_ack",
    ]);
    expect(plan.migrations.map((migration) => migration.file)).toEqual([
      "migrations/0000_migration_registry.sql",
      "migrations/0001_account_company_baseline.sql",
      "migrations/0002_account_workspace_sections.sql",
      "migrations/0003_account_files_and_documents.sql",
      "migrations/0004_supplier_directory.sql",
      "migrations/0005_supplier_directory_search_scaling.sql",
      "migrations/0006_offer_catalog.sql",
      "migrations/0007_supplier_access_flow.sql",
      "migrations/0008_access_notification_ack.sql",
    ]);
  });

  it("calculates stable SHA-256 checksums for every SQL file", () => {
    const plan = buildMigrationPlan(packageRoot);

    for (const migration of plan.migrations) {
      expect(migration.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(migration.checksum).toBe(sha256(migration.sql));
    }
  });

  it("keeps the registry before feature migrations", () => {
    const plan = buildMigrationPlan(packageRoot);
    const registry = plan.migrations[0];
    const account = plan.migrations[1];
    const workspaceSections = plan.migrations[2];
    const filesAndDocuments = plan.migrations[3];
    const supplierDirectory = plan.migrations[4];
    const supplierDirectorySearchScaling = plan.migrations[5];
    const offerCatalog = plan.migrations[6];
    const supplierAccessFlow = plan.migrations[7];
    const accessNotificationAck = plan.migrations[8];

    expect(registry.ownedTables).toEqual(["_yorso_migrations"]);
    expect(account.dependsOn).toEqual(["0000_migration_registry"]);
    expect(account.sql).toContain("create table if not exists yorso_companies");
    expect(workspaceSections.dependsOn).toEqual(["0001_account_company_baseline"]);
    expect(workspaceSections.sql).toContain("create table if not exists yorso_company_products");
    expect(filesAndDocuments.dependsOn).toEqual(["0002_account_workspace_sections"]);
    expect(filesAndDocuments.sql).toContain("create table if not exists yorso_file_assets");
    expect(supplierDirectory.dependsOn).toEqual(["0003_account_files_and_documents"]);
    expect(supplierDirectory.sql).toContain("create table if not exists yorso_suppliers_directory");
    expect(supplierDirectorySearchScaling.dependsOn).toEqual(["0004_supplier_directory"]);
    expect(supplierDirectorySearchScaling.sql).toContain("idx_yorso_suppliers_directory_certifications_search");
    expect(offerCatalog.dependsOn).toEqual(["0005_supplier_directory_search_scaling"]);
    expect(offerCatalog.sql).toContain("create table if not exists yorso_offers_catalog");
    expect(supplierAccessFlow.dependsOn).toEqual(["0006_offer_catalog"]);
    expect(supplierAccessFlow.sql).toContain("create table if not exists yorso_supplier_access_requests");
    expect(accessNotificationAck.dependsOn).toEqual(["0007_supplier_access_flow"]);
    expect(accessNotificationAck.sql).toContain("notification_read");
  });

  it("keeps self-hosted SQL free of managed-backend coupling", () => {
    const plan = buildMigrationPlan(packageRoot);
    const combinedSql = plan.migrations.map((migration) => migration.sql.toLowerCase()).join("\n");

    expect(combinedSql).not.toContain("auth.users");
    expect(combinedSql).not.toContain("supabase");
    expect(combinedSql).not.toContain("enable row level security");
  });
});
