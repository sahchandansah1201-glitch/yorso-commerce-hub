import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260512183000_security_invoker_views_and_access_event_rpc.sql",
);

const sql = readFileSync(migrationPath, "utf8");

const normalized = sql.replace(/\s+/g, " ").toLowerCase();

const columnGrantFor = (table: "offers" | "suppliers") => {
  const match = sql.match(
    new RegExp(`GRANT\\\\s+SELECT\\\\s*\\\\(([\\\\s\\\\S]*?)\\\\)\\\\s+ON\\\\s+public\\\\.${table}\\\\s+TO`, "i"),
  );
  return match?.[1].toLowerCase() ?? "";
};

describe("Supabase Advisor hardening migration", () => {
  it("moves Advisor-flagged views to SECURITY INVOKER", () => {
    for (const view of ["offers_public", "suppliers_public", "access_events_admin"]) {
      expect(normalized).toContain(`alter view public.${view} set (security_invoker = on)`);
    }
  });

  it("keeps public view grants read-only", () => {
    expect(normalized).toContain("revoke all on public.offers_public from anon, authenticated, public");
    expect(normalized).toContain("revoke all on public.suppliers_public from anon, authenticated, public");
    expect(normalized).toContain("grant select on public.offers_public to anon, authenticated");
    expect(normalized).toContain("grant select on public.suppliers_public to anon, authenticated");
  });

  it("does not grant sensitive offer columns to public invoker views", () => {
    const offerGrant = columnGrantFor("offers");
    for (const forbidden of ["price_min", "price_max", "price_currency", "price_unit", "supplier_id"]) {
      expect(offerGrant).not.toContain(forbidden);
    }
  });

  it("does not grant sensitive supplier columns to public invoker views", () => {
    const supplierGrant = columnGrantFor("suppliers");
    for (const forbidden of [
      "company_name",
      "website",
      "contact_email",
      "contact_phone",
      "owner_user_id",
      "legal",
    ]) {
      expect(supplierGrant).not.toContain(forbidden);
    }
  });

  it("removes public API exposure from the admin audit view", () => {
    expect(normalized).toContain(
      "revoke all on public.access_events_admin from anon, authenticated, public",
    );
    expect(normalized).not.toContain("grant select on public.access_events_admin to authenticated");
  });

  it("replaces log_supplier_access_event with a SECURITY INVOKER function", () => {
    const functionBlock = sql.match(
      /CREATE OR REPLACE FUNCTION public\.log_supplier_access_event\([\s\S]*?\$\$;/i,
    )?.[0].toLowerCase();

    expect(functionBlock).toBeTruthy();
    expect(functionBlock).toContain("security invoker");
    expect(functionBlock).not.toContain("security definer");
    expect(functionBlock).toContain("p_event_type <> 'supplier_access_requested'");
  });
});
