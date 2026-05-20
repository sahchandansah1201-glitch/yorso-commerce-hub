import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

const runCli = (args: string[], env: NodeJS.ProcessEnv = {}) =>
  execFileSync("node", ["packages/db/dist/cli.js", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "test",
      ...env,
    },
  });

const runCliFailure = (args: string[], env: NodeJS.ProcessEnv = {}) => {
  try {
    runCli(args, env);
    throw new Error("Expected CLI to fail");
  } catch (error) {
    const failure = error as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string };
    return {
      status: failure.status,
      output: `${String(failure.stdout ?? "")}${String(failure.stderr ?? "")}`,
    };
  }
};

describe("self-hosted DB migration CLI", () => {
  it("prints static status without requiring a database", () => {
    const output = runCli(["status"]);

    expect(output).toContain("Static status from local plan");
    expect(output).toContain("0000_migration_registry planned");
    expect(output).toContain("0001_account_company_baseline planned");
    expect(output).toContain("0002_account_workspace_sections planned");
    expect(output).toContain("0003_account_files_and_documents planned");
    expect(output).toContain("0004_supplier_directory planned");
    expect(output).toContain("0005_supplier_directory_search_scaling planned");
    expect(output).toContain("0006_offer_catalog planned");
    expect(output).toContain("0007_supplier_access_flow planned");
    expect(output).toContain("0008_access_notification_ack planned");
    expect(output).toContain("0009_supplier_directory_pagination_sort planned");
    expect(output).toContain("0010_offer_catalog_pagination_sort planned");
    expect(output).toContain("0011_auth_sessions planned");
    expect(output).toContain("0012_auth_security_events planned");
    expect(output).toContain("0013_api_audit_events planned");
    expect(output).toContain("0014_admin_audit_access planned");
    expect(output).toContain("0015_admin_audit_retention_query_hardening planned");
  });

  it("prints static dry-run apply without requiring a database", () => {
    const output = runCli(["apply", "--dry-run"]);

    expect(output).toContain("Dry-run apply preview from local plan");
    expect(output).toContain("dryRun=true");
    expect(output).toContain("pending=16");
    expect(output).toContain("pending 0007_supplier_access_flow");
    expect(output).toContain("pending 0008_access_notification_ack");
    expect(output).toContain("pending 0009_supplier_directory_pagination_sort");
    expect(output).toContain("pending 0010_offer_catalog_pagination_sort");
    expect(output).toContain("pending 0011_auth_sessions");
    expect(output).toContain("pending 0012_auth_security_events");
    expect(output).toContain("pending 0013_api_audit_events");
    expect(output).toContain("pending 0014_admin_audit_access");
    expect(output).toContain("pending 0015_admin_audit_retention_query_hardening");
  });

  it("blocks live apply without explicit confirmation", () => {
    const failure = runCliFailure(["apply", "--live"]);

    expect(failure.status).toBe(2);
    expect(failure.output).toContain("Live apply requires --confirm");
  });

  it("blocks live status/apply when MIGRATION_DATABASE_URL is missing", () => {
    const statusFailure = runCliFailure(["status", "--live"]);
    const applyFailure = runCliFailure(["apply", "--live", "--confirm"]);

    expect(statusFailure.status).toBe(1);
    expect(applyFailure.status).toBe(1);
    expect(statusFailure.output).toContain("MIGRATION_DATABASE_URL is required");
    expect(applyFailure.output).toContain("MIGRATION_DATABASE_URL is required");
  });
});
