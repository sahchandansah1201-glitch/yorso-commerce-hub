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
    expect(compose).toContain("VITE_SUPABASE_URL: \"\"");
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
});
