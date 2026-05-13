import { describe, expect, it } from "vitest";

import { maskDatabaseUrl, resolveMigrationAppliedBy, resolveMigrationDatabaseUrl } from "./postgres-client.js";
import { MigrationRuntimeError } from "./runtime.js";

describe("PostgreSQL migration client helpers", () => {
  it("requires MIGRATION_DATABASE_URL for live migration commands", () => {
    expect(() => resolveMigrationDatabaseUrl({})).toThrow(MigrationRuntimeError);
    expect(() =>
      resolveMigrationDatabaseUrl({
        DATABASE_URL: "postgres://app:secret@localhost:5432/yorso",
      }),
    ).toThrow(MigrationRuntimeError);
  });

  it("uses MIGRATION_DATABASE_URL as the explicit live migration target", () => {
    expect(
      resolveMigrationDatabaseUrl({
        MIGRATION_DATABASE_URL: "postgres://migrator:secret@localhost:5432/yorso",
      }),
    ).toBe("postgres://migrator:secret@localhost:5432/yorso");
  });

  it("masks credentials before printing connection targets", () => {
    expect(maskDatabaseUrl("postgres://migrator:secret@localhost:5432/yorso")).toBe(
      "postgres://***:***@localhost:5432/yorso",
    );
    expect(maskDatabaseUrl("not a url")).toBe("[invalid database url]");
  });

  it("uses MIGRATION_APPLIED_BY with a safe default", () => {
    expect(resolveMigrationAppliedBy({})).toBe("yorso-migrator");
    expect(resolveMigrationAppliedBy({ MIGRATION_APPLIED_BY: "deploy-operator" })).toBe("deploy-operator");
    expect(resolveMigrationAppliedBy({ MIGRATION_APPLIED_BY: "   " })).toBe("yorso-migrator");
  });
});
