import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

describe("self-hosted infra validation", () => {
  it("passes the static compose and env guard without requiring Docker", () => {
    const output = runNode(["scripts/check-self-hosted-infra.mjs"]);

    expect(output).toContain("Self-hosted infra check passed");
    expect(output).toContain("API, postgres, PgBouncer, Redis, MinIO and upload volume");
    expect(output).toContain("prototype Supabase values are empty");
    expect(output).toContain("production runtime does not require Supabase env");
  });

  it("keeps the local deployment surface self-hosted and Supabase-free", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const env = readFileSync(".env.example", "utf8");

    expect(compose).toContain("api:");
    expect(compose).toContain("dockerfile: apps/api/Dockerfile");
    expect(compose).toContain("DATABASE_URL: postgres://${POSTGRES_USER");
    expect(compose).toContain("image: postgres:17-alpine");
    expect(compose).toContain("image: edoburu/pgbouncer:");
    expect(compose).toContain("POOL_MODE: transaction");
    expect(compose).toContain("image: redis:7-alpine");
    expect(compose).toContain("image: minio/minio:");
    expect(compose).toContain("STORAGE_DRIVER: local");
    expect(compose).toContain("yorso-api-uploads:");
    expect(compose).not.toMatch(/SUPABASE/i);
    expect(env).toContain("DATABASE_URL=postgres://yorso_app:change-me-local-only@localhost:6432/yorso");
    expect(env).toContain("STORAGE_LOCAL_ROOT=.data/api-uploads");
    expect(env).toMatch(/^VITE_YORSO_API_URL=$/m);
    expect(env).toMatch(/^VITE_YORSO_ACCOUNT_USER_ID=00000000-0000-4000-8000-000000000001$/m);
    expect(env).toContain("MIGRATION_DATABASE_URL=postgres://yorso_app:change-me-local-only@localhost:5432/yorso");
    expect(env).toContain("MIGRATION_APPLIED_BY=local-operator");
    expect(env).toContain("PGBOUNCER_DATABASE_URL=postgres://yorso_app:change-me-local-only@localhost:6432/yorso");
    expect(env).toMatch(/^VITE_SUPABASE_URL=$/m);
    expect(env).toMatch(/^VITE_SUPABASE_PUBLISHABLE_KEY=$/m);
  });

  it("documents that compose validation is a local server baseline, not Supabase deployment", () => {
    const readme = readFileSync("infra/README.md", "utf8");
    const architecture = readFileSync("docs/backend/self-hosted-backend-architecture.md", "utf8");

    expect(readme).toContain("without Supabase as a production dependency");
    expect(architecture).toContain("deployable as one coherent");
    expect(architecture).toContain("PgBouncer");
    expect(architecture).toContain("Object storage");
  });
});
