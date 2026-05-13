import { describe, expect, it } from "vitest";

import type { MigrationPlan } from "./migrator.js";
import {
  applyPendingMigrations,
  formatApplyResult,
  formatMigrationStatus,
  getMigrationStatus,
  MigrationRuntimeError,
  type AppliedMigrationRecord,
  type MigrationClient,
} from "./runtime.js";

class FakeMigrationClient implements MigrationClient {
  public readonly queries: Array<{ sql: string; params?: unknown[] }> = [];
  public readonly applied = new Map<string, AppliedMigrationRecord>();

  constructor(records: AppliedMigrationRecord[] = []) {
    for (const record of records) this.applied.set(record.id, record);
  }

  async query<Row = unknown>(sql: string, params?: unknown[]) {
    this.queries.push({ sql, params });

    if (sql.startsWith("select id, checksum")) {
      return { rows: [...this.applied.values()] as Row[] };
    }

    if (sql.startsWith("insert into _yorso_migrations")) {
      const [id, checksum, executionMs, appliedBy] = params as [string, string, number, string];
      this.applied.set(id, { id, checksum, executionMs, appliedBy, appliedAt: new Date(0).toISOString() });
    }

    return { rows: [] as Row[] };
  }
}

const makePlan = (): MigrationPlan => ({
  rootDir: "/repo/packages/db",
  manifestFile: "/repo/packages/db/migration-manifest.json",
  migrations: [
    {
      id: "0000_migration_registry",
      file: "migrations/0000_migration_registry.sql",
      description: "registry",
      ownedTables: ["_yorso_migrations"],
      dependsOn: [],
      absoluteFile: "/repo/packages/db/migrations/0000_migration_registry.sql",
      sql: "create table if not exists _yorso_migrations (id text primary key);",
      checksum: "a".repeat(64),
    },
    {
      id: "0001_account_company_baseline",
      file: "migrations/0001_account_company_baseline.sql",
      description: "account",
      ownedTables: ["yorso_users"],
      dependsOn: ["0000_migration_registry"],
      absoluteFile: "/repo/packages/db/migrations/0001_account_company_baseline.sql",
      sql: "create table if not exists yorso_users (id uuid primary key);",
      checksum: "b".repeat(64),
    },
  ],
});

describe("self-hosted DB migration runtime", () => {
  it("reports pending and applied migrations from the registry", async () => {
    const client = new FakeMigrationClient([{ id: "0000_migration_registry", checksum: "a".repeat(64) }]);
    const status = await getMigrationStatus(client, makePlan());

    expect(status.applied.map((migration) => migration.id)).toEqual(["0000_migration_registry"]);
    expect(status.pending.map((migration) => migration.id)).toEqual(["0001_account_company_baseline"]);
    expect(status.drifted).toEqual([]);
    expect(formatMigrationStatus(status)).toEqual([
      `0000_migration_registry applied ${"a".repeat(64)}`,
      `0001_account_company_baseline pending ${"b".repeat(64)}`,
    ]);
  });

  it("detects checksum drift before applying anything", async () => {
    const client = new FakeMigrationClient([{ id: "0000_migration_registry", checksum: "c".repeat(64) }]);

    await expect(applyPendingMigrations(client, makePlan(), { dryRun: false })).rejects.toThrow(MigrationRuntimeError);
    expect(client.queries.some((query) => query.sql === "begin")).toBe(false);
  });

  it("dry-run apply returns pending migrations without running SQL", async () => {
    const client = new FakeMigrationClient();
    const result = await applyPendingMigrations(client, makePlan(), { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.applied).toEqual([]);
    expect(result.pending.map((migration) => migration.id)).toEqual([
      "0000_migration_registry",
      "0001_account_company_baseline",
    ]);
    expect(client.queries.some((query) => query.sql.includes("create table if not exists _yorso_migrations"))).toBe(false);
    expect(client.queries.some((query) => query.sql.includes("yorso_users"))).toBe(false);
  });

  it("applies pending migrations in transactions when live execution is requested", async () => {
    const client = new FakeMigrationClient();
    let current = 100;
    const result = await applyPendingMigrations(client, makePlan(), {
      dryRun: false,
      appliedBy: "test-runner",
      now: () => {
        current += 7;
        return current;
      },
    });

    expect(result.applied.map((migration) => migration.id)).toEqual([
      "0000_migration_registry",
      "0001_account_company_baseline",
    ]);
    expect(formatApplyResult(result)).toContain("applied=2");
    expect([...client.applied.keys()]).toEqual(["0000_migration_registry", "0001_account_company_baseline"]);
    expect(client.queries.some((query) => query.sql.includes("create table if not exists _yorso_migrations"))).toBe(true);
    expect(client.queries.filter((query) => query.sql === "begin")).toHaveLength(2);
    expect(client.queries.filter((query) => query.sql === "commit")).toHaveLength(2);
    expect(client.queries.some((query) => query.sql === "rollback")).toBe(false);
  });
});
