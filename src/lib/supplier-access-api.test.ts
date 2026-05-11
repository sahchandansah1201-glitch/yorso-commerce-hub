import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  readSupplierAccessRequest,
  requestSupplierAccess,
} from "@/lib/supplier-access-api";
import {
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";

const SUPPLIER_ID = "sup-no-001";

const readStore = () =>
  JSON.parse(
    localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY) ?? "{}",
  ) as Record<string, SupplierAccessRequest>;

describe("supplier-access-api", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("falls back to local mock request when no Supabase auth user is available", async () => {
    const request = await requestSupplierAccess(SUPPLIER_ID);

    expect(request.supplierId).toBe(SUPPLIER_ID);
    expect(request.intent).toBe("exact_price");
    expect(request.status).toBe("sent");
    expect(readStore()[SUPPLIER_ID]).toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "sent",
    });
  });

  it("reads the local fallback request when backend has no authenticated user", async () => {
    await requestSupplierAccess(SUPPLIER_ID);

    const request = await readSupplierAccessRequest(SUPPLIER_ID);

    expect(request).toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "sent",
      intent: "exact_price",
    });
  });
});
