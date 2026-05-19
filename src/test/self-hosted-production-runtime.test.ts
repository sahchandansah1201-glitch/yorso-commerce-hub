import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

describe("self-hosted production runtime", () => {
  it("passes the production runtime guard", () => {
    const output = runNode(["scripts/check-self-hosted-production-runtime.mjs"]);

    expect(output).toContain("Self-hosted production runtime check passed");
    expect(output).toContain(".env.production.example contains only self-hosted production runtime keys");
    expect(output).toContain("ci:core enforces check:self-hosted-production-runtime");
  });

  it("keeps production env free of hosted BaaS providers", () => {
    const productionEnv = readFileSync(".env.production.example", "utf8");
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(productionEnv).toContain("NODE_ENV=production");
    expect(productionEnv).toContain("VITE_YORSO_API_URL=https://api.yorso.example");
    expect(productionEnv).toContain("ACCOUNT_REPOSITORY=postgres");
    expect(productionEnv).toContain("DATABASE_URL=postgres://");
    expect(productionEnv).toContain("REDIS_URL=redis://redis:6379");
    expect(productionEnv).toContain("AUTH_RATE_LIMIT_DRIVER=redis");
    expect(productionEnv).toContain("AUTH_RATE_LIMIT_FAIL_MODE=closed");
    expect(productionEnv).toContain("AUTH_SESSION_CACHE_DRIVER=redis");
    expect(productionEnv).toContain("AUTH_SESSION_CACHE_FAIL_MODE=closed");
    expect(productionEnv).toContain("AUTH_OBSERVABILITY_DRIVER=console");
    expect(productionEnv).toContain("STORAGE_DRIVER=local");
    expect(productionEnv).not.toMatch(/SUPABASE|FIREBASE|APPWRITE|CLERK|AUTH0/i);
    expect(compose).not.toMatch(/SUPABASE/i);
    expect(pkg.scripts["ci:core"]).toContain("npm run check:self-hosted-production-runtime");
  });

  it("documents the owned-server deployment boundary", () => {
    const deployDoc = readFileSync("docs/backend/self-hosted-production-deploy.md", "utf8");
    const baseline = readFileSync("docs/backend/production-scale-baseline.md", "utf8");

    expect(deployDoc).toContain("Self-Hosted Production Deploy");
    expect(deployDoc).toContain("Minimum production topology");
    expect(deployDoc).toContain("Production env must not contain");
    expect(deployDoc).toContain("check:self-hosted-production-runtime");
    expect(baseline).toContain("Batch #72");
    expect(baseline).toContain("self-hosted production runtime guard");
  });
});
