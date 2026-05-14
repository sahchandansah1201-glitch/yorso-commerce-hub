import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createSupplierAccessApiClient,
  readSupplierAccessRequest,
  requestSupplierAccess,
} from "@/lib/supplier-access-api";
import {
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  persistSupplierAccessRequest,
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
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

  it("calls self-hosted supplier access endpoints when API URL is configured", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.headers).toBeInstanceOf(Headers);
      expect((init?.headers as Headers).get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000042");

      if (init?.method === "POST") {
        return new Response(JSON.stringify({
          ok: true,
          request: {
            id: "req-1",
            buyerUserId: "00000000-0000-4000-8000-000000000042",
            supplierId: SUPPLIER_ID,
            status: "sent",
            intent: "exact_price",
            message: "",
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            decidedAt: null,
            decidedByUserId: null,
          },
          accessGranted: false,
          requestId: "api-req",
        }), { status: 201, headers: { "content-type": "application/json" } });
      }

      if (url.endsWith("/v1/access/notifications")) {
        return new Response(JSON.stringify({
          ok: true,
          notifications: [{
            id: "n-1",
            buyerUserId: "00000000-0000-4000-8000-000000000042",
            supplierId: SUPPLIER_ID,
            type: "price_access_approved",
            title: "Price access approved",
            body: "Approved",
            status: "unread",
            createdAt: "2026-05-14T00:10:00.000Z",
            readAt: null,
          }],
          requestId: "api-notifications",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({
        ok: true,
        request: {
          id: "req-1",
          buyerUserId: "00000000-0000-4000-8000-000000000042",
          supplierId: SUPPLIER_ID,
          status: "approved",
          intent: "exact_price",
          message: "",
          createdAt: "2026-05-14T00:00:00.000Z",
          updatedAt: "2026-05-14T00:05:00.000Z",
          decidedAt: "2026-05-14T00:05:00.000Z",
          decidedByUserId: "00000000-0000-4000-8000-000000000099",
        },
        accessGranted: true,
        requestId: "api-read",
      }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const client = createSupplierAccessApiClient({
      baseUrl: "http://localhost:3000/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      userId: "00000000-0000-4000-8000-000000000042",
      sessionId: "session-42",
    });

    await expect(client.read(SUPPLIER_ID)).resolves.toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "approved",
      approvedAt: "2026-05-14T00:05:00.000Z",
    });
    await expect(client.request(SUPPLIER_ID)).resolves.toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "sent",
    });
    await expect(client.notifications()).resolves.toHaveLength(1);

    expect(fetchImpl.mock.calls[0][0]).toBe(
      "http://localhost:3000/v1/access/suppliers/sup-no-001/request",
    );
    expect(fetchImpl.mock.calls[1][0]).toBe(
      "http://localhost:3000/v1/access/suppliers/sup-no-001/request",
    );
    expect(fetchImpl.mock.calls[2][0]).toBe(
      "http://localhost:3000/v1/access/notifications",
    );
  });

  it("persists an approved local request when backend reports an existing grant without a request row", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({
        ok: true,
        request: null,
        accessGranted: true,
        requestId: "api-grant-only",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );

    const client = createSupplierAccessApiClient({
      baseUrl: "http://localhost:3000",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      userId: "00000000-0000-4000-8000-000000000042",
    });

    await expect(client.read(SUPPLIER_ID)).resolves.toMatchObject({
      supplierId: SUPPLIER_ID,
      status: "approved",
      intent: "exact_price",
    });
    expect(readStore()[SUPPLIER_ID]).toMatchObject({ status: "approved" });
  });

  it("clears stale local approval when self-hosted API reports no request or grant", async () => {
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
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({
        ok: true,
        request: null,
        accessGranted: false,
        requestId: "api-no-access",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    await expect(readSupplierAccessRequest(SUPPLIER_ID)).resolves.toBeNull();

    expect(readStore()[SUPPLIER_ID]).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/v1/access/suppliers/sup-no-001/request",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });
});
