import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260513001000_owner_policy_helper_functions.sql",
);

const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

const policyBlock = (name: string) => {
  const index = normalized.indexOf(`create policy "${name.toLowerCase()}"`);
  if (index < 0) return "";
  const next = normalized.indexOf("drop policy if exists", index + 1);
  return normalized.slice(index, next > index ? next : undefined);
};

describe("owner helper functions for RLS policies", () => {
  it("creates SECURITY DEFINER boolean helpers for supplier ownership checks", () => {
    for (const functionName of [
      "is_supplier_owner",
      "is_offer_supplier_owner",
      "is_supplier_access_request_supplier_owner",
    ]) {
      expect(normalized).toContain(`create or replace function public.${functionName}`);
    }

    expect(normalized.match(/security definer/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("does not expose helper execution to anon/public", () => {
    expect(normalized).toContain(
      "revoke execute on function public.is_supplier_owner(uuid, uuid) from anon, public",
    );
    expect(normalized).toContain(
      "grant execute on function public.is_supplier_owner(uuid, uuid) to authenticated",
    );
  });

  it("rewrites supplier_access_requests owner policies to use helpers", () => {
    const viewPolicy = policyBlock("Supplier owners view incoming access requests");
    const updatePolicy = policyBlock("Supplier owners update incoming access requests");

    expect(viewPolicy).toContain("public.is_supplier_owner");
    expect(updatePolicy).toContain("public.is_supplier_owner");
    expect(viewPolicy).not.toContain("from public.suppliers");
    expect(updatePolicy).not.toContain("from public.suppliers");
  });

  it("rewrites access_events owner policy to avoid direct suppliers/offers joins", () => {
    const eventPolicy = policyBlock("Supplier owners view access events for own suppliers");

    expect(eventPolicy).toContain("public.is_supplier_owner");
    expect(eventPolicy).toContain("public.is_offer_supplier_owner");
    expect(eventPolicy).toContain("public.is_supplier_access_request_supplier_owner");
    expect(eventPolicy).not.toContain("from public.suppliers");
    expect(eventPolicy).not.toContain("join public.suppliers");
    expect(eventPolicy).not.toContain("from public.offers");
  });

  it("documents that helpers are predicates and do not expose supplier fields", () => {
    expect(normalized).toContain("does not expose supplier fields");
    expect(normalized).toContain("rls supplier ownership checks");
  });
});
