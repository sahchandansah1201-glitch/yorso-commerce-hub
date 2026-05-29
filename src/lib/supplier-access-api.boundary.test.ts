import { existsSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  persistSupplierAccessRequest,
} from "@/lib/supplier-access-requests";

const SUPPLIER_ID = "sup-no-001";

const importSupplierAccessApi = async () => {
  vi.resetModules();
  return import("./supplier-access-api");
};

describe("supplier-access-api prototype boundary", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps API-disabled preview local-only without hosted auth or RLS fallback", async () => {
    const api = await importSupplierAccessApi();
    const request = await api.requestSupplierAccess(SUPPLIER_ID);

    expect(request).toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "sent",
      intent: "exact_price",
    });
    expect(await api.readSupplierAccessRequest(SUPPLIER_ID)).toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "sent",
      intent: "exact_price",
    });
    expect(localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY)).toContain(SUPPLIER_ID);
  });

  it("does not expose local stale approval when the configured self-hosted API read fails", async () => {
    persistSupplierAccessRequest({
      supplierId: SUPPLIER_ID,
      intent: "exact_price",
      status: "approved",
      sentAt: "2026-05-14T00:00:00.000Z",
      pendingAt: "2026-05-14T00:01:00.000Z",
      approvedAt: "2026-05-14T00:02:00.000Z",
      reasons: ["exact_price"],
      message: "",
    });
    vi.stubEnv("VITE_YORSO_API_URL", "http://localhost:3000");
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: "supplier_access_unavailable" } }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    ));
    const api = await importSupplierAccessApi();

    await expect(api.readSupplierAccessRequest(SUPPLIER_ID)).resolves.toBeNull();

    expect(localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY)).not.toContain(SUPPLIER_ID);
  });

  it("does not create a local mock request when the configured self-hosted API request fails", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://localhost:3000");
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: "supplier_access_unavailable" } }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    ));
    const api = await importSupplierAccessApi();

    await expect(api.requestSupplierAccess(SUPPLIER_ID)).rejects.toThrow("supplier_access_unavailable");

    expect(localStorage.getItem("yorso_supplier_access_requests")).toBeNull();
  });

  it("keeps hosted-provider fallbacks and the deleted legacy adapter out of supplier-access-api.ts", () => {
    const supplierAccessApi = readFileSync("src/lib/supplier-access-api.ts", "utf8");

    expect(supplierAccessApi).toContain("createSupplierAccessApiClient");
    expect(supplierAccessApi).toContain("/v1/access/suppliers/");
    expect(supplierAccessApi).toContain("/v1/access/notifications");
    expect(supplierAccessApi).not.toContain("legacy-supplier-access-supabase-adapter");
    expect(supplierAccessApi).not.toContain("readLegacySupplierAccessRequest");
    expect(supplierAccessApi).not.toContain("requestLegacySupplierAccess");
    expect(supplierAccessApi).not.toContain("isLegacySupplierAccessSupabaseConfigured");
    expect(supplierAccessApi).not.toContain("@/integrations/supabase/client");
    expect(existsSync("src/lib/legacy-supplier-access-supabase-adapter.ts")).toBe(false);
  });
});
