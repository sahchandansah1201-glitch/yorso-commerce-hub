import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminSupplierDocumentManagementEventsApiError,
  createAdminSupplierDocumentManagementEventsApiClient,
  isAdminSupplierDocumentManagementEventsApiConfigured,
  type AdminSupplierDocumentManagementEventsListResponse,
} from "@/lib/admin-supplier-document-management-events-api";

const managementEventsPayload = (
  patch: Partial<AdminSupplierDocumentManagementEventsListResponse> = {},
): AdminSupplierDocumentManagementEventsListResponse => ({
  items: [
    {
      action: "supplier_document.approve",
      actorRole: "admin",
      actorUserId: "00000000-0000-4000-8000-000000000099",
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      id: "sdme_1",
      nextStatus: "approved",
      previousStatus: "review",
      reason: "Approved for buyer visibility",
      requestId: "req_management_1",
      supplierId: "sup-no-001",
    },
  ],
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000451",
  ...patch,
});

describe("admin-supplier-document-management-events-api", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("stays disabled when VITE_YORSO_API_URL is empty", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    expect(isAdminSupplierDocumentManagementEventsApiConfigured()).toBe(false);
    expect(createAdminSupplierDocumentManagementEventsApiClient().enabled).toBe(false);
  });

  it("requires a self-hosted admin session before calling the backend", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createAdminSupplierDocumentManagementEventsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
    });

    await expect(client.list()).rejects.toMatchObject({
      code: "admin_supplier_document_management_events_session_required",
      status: 401,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("lists management events with bounded filters and self-hosted session headers", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify(managementEventsPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createAdminSupplierDocumentManagementEventsApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-management-events",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(client.list({
      action: "supplier_document.approve",
      actorUserId: "00000000-0000-4000-8000-000000000099",
      documentId: "sup-no-001-health-certificate",
      limit: 50,
      offset: 25,
      supplierId: "sup-no-001",
    })).resolves.toMatchObject({
      items: [{ action: "supplier_document.approve", id: "sdme_1" }],
      ok: true,
    });

    const firstCall = fetchImpl.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(String(firstCall[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/management-events?limit=50&offset=25&action=supplier_document.approve&supplierId=sup-no-001&documentId=sup-no-001-health-certificate&actorUserId=00000000-0000-4000-8000-000000000099",
    );
    const headers = firstCall[1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000099");
    expect(headers.get("x-yorso-session-id")).toBe("session-admin-management-events");
  });

  it("exports sanitized JSON and CSV event handoffs", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("format=csv")) {
        return new Response("id,createdAt,action\nsdme_1,2026-05-31T08:00:00.000Z,supplier_document.approve\n", {
          headers: { "content-type": "text/csv" },
        });
      }

      return new Response(JSON.stringify(managementEventsPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    const client = createAdminSupplierDocumentManagementEventsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-management-events",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(client.exportEvents({ action: "supplier_document.approve", format: "json" })).resolves.toMatchObject({
      contentType: "application/json",
      filename: "supplier-document-management-events.json",
      text: expect.stringContaining("supplier_document.approve"),
    });
    await expect(client.exportEvents({ action: "supplier_document.approve", format: "csv" })).resolves.toMatchObject({
      contentType: "text/csv",
      filename: "supplier-document-management-events.csv",
      text: expect.stringContaining("sdme_1"),
    });

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/management-events/export?action=supplier_document.approve&format=json",
    );
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/management-events/export?action=supplier_document.approve&format=csv",
    );
  });

  it("maps admin role failures and rejects storage-leaking responses", async () => {
    const forbiddenClient = createAdminSupplierDocumentManagementEventsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: "admin_role_required" } }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-management-events",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(forbiddenClient.list()).rejects.toMatchObject({
      code: "admin_role_required",
      status: 403,
    });

    const invalidClient = createAdminSupplierDocumentManagementEventsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({
          ...managementEventsPayload(),
          items: [{ ...managementEventsPayload().items[0], fileAssetId: "asset-secret" }],
        }), {
          headers: { "content-type": "application/json" },
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-management-events",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(invalidClient.list()).rejects.toBeInstanceOf(AdminSupplierDocumentManagementEventsApiError);
    await expect(invalidClient.list()).rejects.toMatchObject({
      code: "admin_supplier_document_management_events_invalid_response",
    });
  });
});
