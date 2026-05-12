import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260512203000_fix_request_supplier_access_rpc_ambiguity.sql",
);

const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

describe("request_supplier_access ambiguity fix", () => {
  it("replaces the RPC instead of mutating an already-applied migration", () => {
    expect(normalized).toContain("create or replace function public.request_supplier_access");
    expect(normalized).toContain("fix request_supplier_access pl/pgsql ambiguity");
  });

  it("uses ON CONSTRAINT instead of ambiguous column-list conflict target", () => {
    expect(normalized).toContain(
      "on conflict on constraint supplier_access_requests_buyer_user_id_supplier_id_key",
    );
    expect(normalized).not.toContain("on conflict (buyer_user_id, supplier_id)");
  });

  it("aliases returned columns away from output parameter names", () => {
    expect(normalized).toContain("sar.supplier_id as request_supplier_id");
    expect(normalized).toContain("upserted.request_supplier_id");
    expect(normalized).not.toContain("returning supplier_access_requests.supplier_id");
  });

  it("keeps authenticated-only RPC execution grants", () => {
    expect(normalized).toContain(
      "grant execute on function public.request_supplier_access(uuid, text) to authenticated",
    );
    expect(normalized).toContain(
      "revoke execute on function public.request_supplier_access(uuid, text) from anon, public",
    );
  });
});
