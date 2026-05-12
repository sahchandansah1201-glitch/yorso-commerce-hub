import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260512193000_grant_has_role_for_rls.sql",
);

const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

describe("Supabase has_role RLS grant migration", () => {
  it("grants has_role execution to authenticated users", () => {
    expect(normalized).toContain(
      "grant execute on function public.has_role(uuid, public.app_role) to authenticated",
    );
  });

  it("keeps anon/public blocked from has_role execution", () => {
    expect(normalized).toContain(
      "revoke execute on function public.has_role(uuid, public.app_role) from anon, public",
    );
  });

  it("documents that the grant is for RLS policy predicates", () => {
    expect(normalized).toContain("rls policy predicates");
    expect(normalized).toContain("not expose table rows directly");
  });

  it("reloads PostgREST schema cache", () => {
    expect(normalized).toContain("notify pgrst, 'reload schema'");
  });
});
