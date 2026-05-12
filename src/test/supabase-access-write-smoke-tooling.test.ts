import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Supabase access write smoke tooling", () => {
  it("exposes explicit npm scripts for seed and smoke", () => {
    const pkg = JSON.parse(read("package.json"));

    expect(pkg.scripts["supabase:access-seed"]).toBe(
      "npx supabase db query --linked --file supabase/seeds/access-smoke-baseline.sql",
    );
    expect(pkg.scripts["supabase:access-smoke"]).toBe(
      "node scripts/supabase-access-write-smoke.mjs",
    );
  });

  it("keeps local env backup files out of git", () => {
    const gitignore = read(".gitignore");

    expect(gitignore).toContain("*.local");
    expect(gitignore).toContain("*.local.save");
    expect(gitignore).toContain(".env*.save");
  });

  it("seed baseline creates catalog data but no users or secrets", () => {
    const seed = read("supabase/seeds/access-smoke-baseline.sql").toLowerCase();

    expect(seed).toContain("codex-smoke-supplier");
    expect(seed).toContain("insert into public.suppliers");
    expect(seed).toContain("insert into public.offers");
    expect(seed).not.toContain("auth.users");
    expect(seed).not.toContain("service_role");
    expect(seed).not.toContain("supabase_service_role_key");
  });

  it("write smoke requires caller-provided buyer credentials and never service-role access", () => {
    const script = read("scripts/supabase-access-write-smoke.mjs");

    expect(script).toContain("SUPABASE_SMOKE_EMAIL");
    expect(script).toContain("SUPABASE_SMOKE_PASSWORD");
    expect(script).toContain("anon_insert=blocked");
    expect(script).toContain("request_supplier_access");
    expect(script).toContain("log_supplier_access_event");
    expect(script).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(script).not.toContain("service_role");
  });

  it("documents the safe flow and warns against the public seed-demo function", () => {
    const doc = read("docs/backend/supabase-access-write-smoke.md");

    expect(doc).toContain("npm run supabase:access-seed");
    expect(doc).toContain("npm run supabase:access-smoke");
    expect(doc).toContain("Do not deploy the old `seed-demo-user` function as a public function");
  });
});
