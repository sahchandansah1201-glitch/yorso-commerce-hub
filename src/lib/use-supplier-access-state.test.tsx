import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSupplierAccessState } from "@/lib/use-supplier-access-state";
import {
  persistSupplierAccessRequest,
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";

const SUPPLIER_ID = "sup-no-001";

const readStore = () =>
  JSON.parse(
    localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY) ?? "{}",
  ) as Record<string, SupplierAccessRequest>;

describe("useSupplierAccessState", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not synchronously expose stale local approval while self-hosted API is configured", async () => {
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
      new Response(JSON.stringify({
        ok: true,
        request: null,
        accessGranted: false,
        requestId: "api-no-access",
      }), { status: 200, headers: { "content-type": "application/json" } }),
    ));

    const { result } = renderHook(() => useSupplierAccessState(SUPPLIER_ID));

    expect(result.current.request).toBeNull();
    await waitFor(() => expect(readStore()[SUPPLIER_ID]).toBeUndefined());
    expect(result.current.request).toBeNull();
  });

  it("ignores late backend reads after unmount", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "http://localhost:3000");
    let resolveRead!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() =>
      new Promise<Response>((resolve) => {
        resolveRead = resolve;
      }),
    ));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { unmount } = renderHook(() => useSupplierAccessState(SUPPLIER_ID));
    unmount();
    resolveRead(new Response(JSON.stringify({
      ok: true,
      request: {
        id: "req-late",
        supplierId: SUPPLIER_ID,
        status: "approved",
        intent: "exact_price",
        message: "",
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:05:00.000Z",
        decidedAt: "2026-05-14T00:05:00.000Z",
      },
      accessGranted: true,
      requestId: "api-late",
    }), { status: 200, headers: { "content-type": "application/json" } }));
    await Promise.resolve();
    await Promise.resolve();

    const errors = consoleError.mock.calls.flat().join("\n");
    expect(errors).not.toContain("not wrapped in act");
    expect(errors).not.toContain("window is not defined");
  });
});
