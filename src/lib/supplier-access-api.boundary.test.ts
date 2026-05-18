import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupplierAccessRequest } from "@/lib/supplier-access-requests";

const SUPPLIER_ID = "sup-no-001";

const importSupplierAccessApi = async (
  legacy: {
    configured: boolean;
    read?: SupplierAccessRequest | null;
    request?: SupplierAccessRequest | null;
  },
) => {
  vi.resetModules();

  const readLegacySupplierAccessRequest = vi.fn(async () => legacy.read ?? null);
  const requestLegacySupplierAccess = vi.fn(async () => legacy.request ?? null);

  vi.doMock("@/lib/legacy-supplier-access-supabase-adapter", () => ({
    isLegacySupplierAccessSupabaseConfigured: () => legacy.configured,
    readLegacySupplierAccessRequest,
    requestLegacySupplierAccess,
  }));

  const api = await import("./supplier-access-api");
  return {
    api,
    readLegacySupplierAccessRequest,
    requestLegacySupplierAccess,
  };
};

describe("supplier-access-api prototype boundary", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.doUnmock("@/lib/legacy-supplier-access-supabase-adapter");
    vi.resetModules();
  });

  it("reads through the isolated legacy Supabase adapter only when self-hosted API is disabled", async () => {
    const legacyRequest: SupplierAccessRequest = {
      supplierId: SUPPLIER_ID,
      intent: "exact_price",
      status: "pending",
      sentAt: "2026-05-14T00:00:00.000Z",
      pendingAt: "2026-05-14T00:01:00.000Z",
      reasons: ["exact_price"],
      message: "",
    };
    const runtime = await importSupplierAccessApi({
      configured: true,
      read: legacyRequest,
    });

    await expect(runtime.api.readSupplierAccessRequest(SUPPLIER_ID)).resolves.toBe(legacyRequest);

    expect(runtime.readLegacySupplierAccessRequest).toHaveBeenCalledWith(SUPPLIER_ID);
  });

  it("requests through the isolated legacy Supabase adapter before local mock fallback", async () => {
    const legacyRequest: SupplierAccessRequest = {
      supplierId: SUPPLIER_ID,
      intent: "exact_price",
      status: "sent",
      sentAt: "2026-05-14T00:00:00.000Z",
      reasons: ["exact_price"],
      message: "",
    };
    const runtime = await importSupplierAccessApi({
      configured: true,
      request: legacyRequest,
    });

    await expect(runtime.api.requestSupplierAccess(SUPPLIER_ID)).resolves.toBe(legacyRequest);

    expect(runtime.requestLegacySupplierAccess).toHaveBeenCalledWith(SUPPLIER_ID);
    expect(localStorage.getItem("yorso_supplier_access_requests")).toBeNull();
  });

  it("falls back to local mock storage when no backend adapter returns a request", async () => {
    const runtime = await importSupplierAccessApi({
      configured: false,
      read: null,
      request: null,
    });

    const request = await runtime.api.requestSupplierAccess(SUPPLIER_ID);

    expect(request).toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "sent",
      intent: "exact_price",
    });
    expect(runtime.requestLegacySupplierAccess).not.toHaveBeenCalled();
    expect(localStorage.getItem("yorso_supplier_access_requests")).toContain(SUPPLIER_ID);
  });

  it("keeps direct Supabase imports out of supplier-access-api.ts", () => {
    const supplierAccessApi = readFileSync("src/lib/supplier-access-api.ts", "utf8");
    const legacyAdapter = readFileSync("src/lib/legacy-supplier-access-supabase-adapter.ts", "utf8");

    expect(supplierAccessApi).toContain("legacy-supplier-access-supabase-adapter");
    expect(supplierAccessApi).toContain("createSupplierAccessApiClient");
    expect(supplierAccessApi).not.toContain("@/integrations/supabase/client");

    expect(legacyAdapter).toContain("@/integrations/supabase/client");
    expect(legacyAdapter).toContain("readLegacySupplierAccessRequest");
    expect(legacyAdapter).toContain("requestLegacySupplierAccess");
    expect(legacyAdapter).toContain("log_supplier_access_event");
  });
});
