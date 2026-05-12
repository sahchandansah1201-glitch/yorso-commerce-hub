import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260512210000_fix_access_event_rpc_supplier_fk.sql",
);

const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.replace(/\s+/g, " ").toLowerCase();

const insertBlock =
  normalized.match(/insert into public\.access_events \(([\s\S]*?)\) values/)?.[1] ??
  "";

describe("log_supplier_access_event supplier FK fix", () => {
  it("keeps the audit RPC as SECURITY INVOKER", () => {
    expect(normalized).toContain("create or replace function public.log_supplier_access_event");
    expect(normalized).toContain("security invoker");
    expect(normalized).not.toContain("security definer");
  });

  it("links events through supplier_access_request_id", () => {
    expect(insertBlock).toContain("supplier_access_request_id");
    expect(normalized).toContain("v_request.id");
  });

  it("does not write access_events.supplier_id in the buyer invoker path", () => {
    expect(insertBlock).not.toContain("supplier_id");
    expect(normalized).not.toContain("v_request.supplier_id");
  });

  it("keeps execution authenticated-only", () => {
    expect(normalized).toContain(
      "grant execute on function public.log_supplier_access_event(uuid, public.access_event_type, jsonb) to authenticated",
    );
    expect(normalized).toContain(
      "revoke execute on function public.log_supplier_access_event(uuid, public.access_event_type, jsonb) from anon, public",
    );
  });
});
