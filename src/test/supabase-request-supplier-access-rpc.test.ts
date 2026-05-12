import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260512200000_request_supplier_access_rpc.sql",
);

const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

describe("request_supplier_access RPC migration", () => {
  it("creates a narrow buyer RPC for supplier access requests", () => {
    expect(normalized).toContain("create or replace function public.request_supplier_access");
    expect(normalized).toContain("p_supplier_id uuid");
    expect(normalized).toContain("returns table");
  });

  it("runs as SECURITY DEFINER but requires authenticated buyer role", () => {
    expect(normalized).toContain("security definer");
    expect(normalized).toContain("v_uid uuid := auth.uid()");
    expect(normalized).toContain("buyer role required");
    expect(normalized).toContain("public.has_role(v_uid, 'buyer'::public.app_role)");
  });

  it("checks supplier existence without exposing supplier fields", () => {
    expect(normalized).toContain("from public.suppliers s");
    expect(normalized).toContain("where s.id = p_supplier_id");
    expect(normalized).not.toContain("company_name");
    expect(normalized).not.toContain("website");
    expect(normalized).not.toContain("contact_email");
  });

  it("grants execution to authenticated only", () => {
    expect(normalized).toContain(
      "grant execute on function public.request_supplier_access(uuid, text) to authenticated",
    );
    expect(normalized).toContain(
      "revoke execute on function public.request_supplier_access(uuid, text) from anon, public",
    );
  });
});
