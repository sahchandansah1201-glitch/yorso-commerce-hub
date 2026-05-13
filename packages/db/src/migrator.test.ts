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
    ]);
    expect(plan.migrations.map((migration) => migration.file)).toEqual([
      "migrations/0000_migration_registry.sql",
      "migrations/0001_account_company_baseline.sql",
      "migrations/0002_account_workspace_sections.sql",
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

    expect(registry.ownedTables).toEqual(["_yorso_migrations"]);
    expect(account.dependsOn).toEqual(["0000_migration_registry"]);
    expect(account.sql).toContain("create table if not exists yorso_companies");
    expect(workspaceSections.dependsOn).toEqual(["0001_account_company_baseline"]);
    expect(workspaceSections.sql).toContain("create table if not exists yorso_company_products");
  });

  it("keeps self-hosted SQL free of managed-backend coupling", () => {
    const plan = buildMigrationPlan(packageRoot);
    const combinedSql = plan.migrations.map((migration) => migration.sql.toLowerCase()).join("\n");

    expect(combinedSql).not.toContain("auth.users");
    expect(combinedSql).not.toContain("supabase");
    expect(combinedSql).not.toContain("enable row level security");
  });
});
