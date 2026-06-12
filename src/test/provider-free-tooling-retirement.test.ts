import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readTrackedFileIfPresent = (path: string) => {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", path], { stdio: "ignore" });
  } catch {
    return "";
  }

  return existsSync(path) ? readFileSync(path, "utf8") : "";
};

describe("provider-free tooling retirement", () => {
  it("removes Supabase reference runtime and tooling from the tracked product surface", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const lockfile = readFileSync("package-lock.json", "utf8");
    const env = readTrackedFileIfPresent(".env");
    const envExample = readFileSync(".env.example", "utf8");
    const gitignore = readFileSync(".gitignore", "utf8");

    expect(existsSync("src/integrations/supabase")).toBe(false);
    expect(existsSync("supabase")).toBe(false);
    expect(gitignore).toContain("src/integrations/supabase/");
    expect(gitignore).toContain("supabase/");
    expect(existsSync("scripts/check-supabase-access-types.mjs")).toBe(false);
    expect(existsSync("scripts/check-supabase-production-boundary.mjs")).toBe(false);
    expect(existsSync("scripts/regenerate-supabase-types.mjs")).toBe(false);
    expect(existsSync("scripts/supabase-access-preflight.mjs")).toBe(false);
    expect(existsSync("scripts/supabase-access-write-smoke.mjs")).toBe(false);
    expect(existsSync("scripts/smoke-frontend-no-supabase-env.mjs")).toBe(false);
    expect(existsSync("scripts/smoke-frontend-provider-free-env.mjs")).toBe(true);
    expect(existsSync("e2e/frontend-no-supabase-env.spec.ts")).toBe(false);
    expect(existsSync("e2e/frontend-provider-free-env.spec.ts")).toBe(true);

    expect(pkg.scripts.prebuild).toBeUndefined();
    expect(Object.keys(pkg.scripts).join("\n")).not.toMatch(/supabase/i);
    expect(JSON.stringify(pkg.dependencies ?? {})).not.toMatch(/supabase/i);
    expect(JSON.stringify(pkg.devDependencies ?? {})).not.toMatch(/supabase/i);
    expect(lockfile).not.toMatch(/@supabase/i);
    expect(env).not.toMatch(/SUPABASE/i);
    expect(envExample).not.toMatch(/SUPABASE/i);
  });
});
