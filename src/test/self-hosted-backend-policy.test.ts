import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

const policyFiles = [
  "docs/backend/yorso-backend-implementation-plan.md",
  "docs/backend/yorso-backend-implementation-plan.ru.md",
  "docs/backend/frontend-backend-contract.md",
  "docs/backend/self-hosted-backend-architecture.md",
];

describe("self-hosted backend policy", () => {
  it("passes the repository policy guard", () => {
    const output = runNode(["scripts/check-self-hosted-backend-policy.mjs"]);

    expect(output).toContain("Self-hosted backend policy check passed");
    expect(output).toContain("self-hosted-backend-architecture.md");
  });

  it("keeps Supabase scoped to prototype/schema validation, not production backend", () => {
    const joined = policyFiles.map((file) => readFileSync(file, "utf8")).join("\n---\n");

    expect(joined).toContain("self-hosted YORSO API plus PostgreSQL");
    expect(joined).toContain("Supabase is no longer the future production backend");
    expect(joined).toContain("Supabase больше не рассматривается как будущий production backend");
    expect(joined).not.toMatch(/Use Supabase as the first backend layer\./i);
    expect(joined).not.toMatch(/Рекомендуемый первый backend-слой:\s*Supabase\./i);
  });

  it("exposes the policy check as an npm script", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));

    expect(pkg.scripts["check:backend-policy"]).toBe("node scripts/check-self-hosted-backend-policy.mjs");
    expect(pkg.scripts["check:supabase-boundary"]).toBe("node scripts/check-supabase-production-boundary.mjs");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:backend-policy");
    expect(pkg.scripts["ci:core"]).toContain("npm run check:supabase-boundary");
  });

  it("keeps Supabase direct imports out of new production UI surfaces", () => {
    const output = runNode(["scripts/check-supabase-production-boundary.mjs"]);

    expect(output).toContain("Supabase production boundary check passed");
    expect(output).toContain("Temporary legacy direct imports allowed");
    expect(output).toContain("src/pages/SignIn.tsx");
    expect(output).toContain("src/pages/ResetPassword.tsx");
  });
});
