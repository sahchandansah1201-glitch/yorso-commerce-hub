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
  });

  it("prints static dry-run apply without requiring a database", () => {
    const output = runCli(["apply", "--dry-run"]);

    expect(output).toContain("Dry-run apply preview from local plan");
    expect(output).toContain("dryRun=true");
    expect(output).toContain("pending=4");
    expect(output).toContain("pending 0003_account_files_and_documents");
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
