import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

const policyFiles = [
  "docs/backend/yorso-backend-implementation-plan.md",
  "docs/backend/yorso-backend-implementation-plan.ru.md",
  "docs/backend/frontend-backend-contract.md",
  "docs/backend/self-hosted-production-policy.md",
  "docs/backend/self-hosted-production-deploy.md",
  "docs/backend/self-hosted-backend-architecture.md",
  "docs/backend/self-hosted-api-skeleton.md",
  "docs/backend/self-hosted-validation.md",
  "docs/backend/self-hosted-db-migrations.md",
];

describe("self-hosted backend policy", () => {
  it("passes the repository policy guard", () => {
    const output = runNode(["scripts/check-self-hosted-backend-policy.mjs"]);

    expect(output).toContain("Self-hosted backend policy check passed");
    expect(output).toContain("self-hosted-backend-architecture.md");
    expect(output).toContain("self-hosted-api-skeleton.md");
    expect(output).toContain("self-hosted-db-migrations.md");
  });

  it("keeps Supabase and similar hosted backends out of production architecture", () => {
    const joined = policyFiles.map((file) => readFileSync(file, "utf8")).join("\n---\n");

    expect(joined).toContain("self-hosted YORSO API plus PostgreSQL");
    expect(joined).toContain("longer the future production backend");
    expect(joined).toContain("Supabase больше не рассматривается как будущий production backend");
    expect(joined).toContain("Production runtime must not depend on Supabase, Firebase, Appwrite, Clerk");
    expect(joined).toContain("Self-Hosted Production Deploy");
    expect(joined).toContain("check:self-hosted-production-runtime");
    expect(joined).toMatch(
      /hosted BaaS\/SaaS application backends[\s\S]{0,160}(not production dependencies|excluded from production)/i,
    );
    expect(joined).not.toMatch(/Use Supabase as the first backend layer\./i);
    expect(joined).not.toMatch(/Рекомендуемый первый backend-слой:\s*Supabase\./i);
    expect(joined).not.toMatch(/Supabase Auth plus buyer-session bridge/i);
  });

  it("exposes the policy check as an npm script", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));

    expect(pkg.scripts["check:backend-policy"]).toBe("node scripts/check-self-hosted-backend-policy.mjs");
    expect(pkg.scripts["check:provider-boundary"]).toBe("node scripts/check-provider-production-boundary.mjs");
    expect(pkg.scripts["check:supabase-boundary"]).toBeUndefined();
    expect(pkg.scripts["check:supabase-types"]).toBeUndefined();
    expect(pkg.scripts["check:supabase-types:strict"]).toBeUndefined();
    expect(pkg.scripts["check:self-hosted-infra"]).toBe("node scripts/check-self-hosted-infra.mjs");
    expect(pkg.scripts["check:self-hosted-production-runtime"]).toBe(
      "node scripts/check-self-hosted-production-runtime.mjs",
    );
    expect(pkg.scripts["check:self-hosted-api"]).toBe("node scripts/check-self-hosted-api.mjs");
    expect(pkg.scripts["check:self-hosted-db"]).toBe("node scripts/check-self-hosted-db.mjs");
    expect(pkg.scripts["contracts:build"]).toBe("tsc -p packages/contracts/tsconfig.json");
    expect(pkg.scripts["db:build"]).toBe("tsc -p packages/db/tsconfig.json");
    expect(pkg.scripts["db:migrations:check"]).toContain("packages/db/dist/cli.js check");
    expect(pkg.scripts["db:migrations:status"]).toContain("packages/db/dist/cli.js status");
    expect(pkg.scripts["db:migrations:status:live"]).toContain("packages/db/dist/cli.js status --live");
    expect(pkg.scripts["db:migrations:apply:dry-run"]).toContain("packages/db/dist/cli.js apply --dry-run");
    expect(pkg.scripts["db:migrations:apply:live:dry-run"]).toContain("packages/db/dist/cli.js apply --live --dry-run");
    expect(pkg.scripts["db:migrations:apply:live"]).toContain("packages/db/dist/cli.js apply --live --confirm");
    expect(pkg.scripts["db:migrations:smoke:live"]).toContain("db:migrations:status:live");
    expect(pkg.scripts["test:db-migrations"]).toContain("packages/db/vitest.config.ts");
    expect(pkg.scripts["api:build"]).toBe("npm run contracts:build && tsc -p apps/api/tsconfig.json");
    expect(pkg.scripts["test:api"]).toBe("npm run contracts:build && vitest run --config apps/api/vitest.config.ts");
    expect(pkg.scripts["test:db-contract"]).toBe("vitest run src/test/self-hosted-db-contract.test.ts");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:backend-policy");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:provider-boundary");
    expect(pkg.scripts["ci:core"]).not.toContain("check:supabase");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:self-hosted-infra");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:self-hosted-production-runtime");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:self-hosted-api");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:self-hosted-db");
    expect(pkg.scripts["ci:core"]).toContain("npm run db:migrations:check");
    expect(pkg.scripts["ci:core"]).toContain("npm run db:migrations:status");
    expect(pkg.scripts["ci:core"]).toContain("npm run db:migrations:apply:dry-run");
    expect(pkg.scripts["ci:core"]).toContain("npm run api:build");
    expect(pkg.scripts["ci:core"]).toContain("npm run test:db-contract");
    expect(pkg.scripts["ci:core"]).toContain("npm run test:db-migrations");
    expect(pkg.scripts["ci:core"]).toContain("npm run test:api");
    expect(pkg.dependencies?.["@supabase/supabase-js"]).toBeUndefined();
    expect(pkg.devDependencies?.["@supabase/supabase-js"]).toBeUndefined();
  });

  it("keeps hosted BaaS imports and env keys out of production code", () => {
    const output = runNode(["scripts/check-provider-production-boundary.mjs"]);

    expect(output).toContain("Provider-free production boundary check passed");
    expect(output).toContain("No production code imports Supabase or hosted BaaS SDKs");
    expect(output).not.toContain("Temporary legacy direct imports allowed");
  });
});
