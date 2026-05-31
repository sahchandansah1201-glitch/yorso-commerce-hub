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

const managementActionPayload = (action = "supplier_document.approve") => ({
  audit: {
    action,
    actorRole: "admin",
    createdAt: "2026-05-31T08:05:00.000Z",
    documentId: "sup-no-001-health-certificate",
    nextStatus: action === "supplier_document.reject" ? "on_request" : action === "supplier_document.expire" ? "expired" : action === "supplier_document.delete" ? null : "approved",
    previousStatus: action === "supplier_document.expire" || action === "supplier_document.delete" ? "approved" : "review",
    reason: "Reviewed by admin",
    requestId: "req_management_action_1",
    supplierId: "sup-no-001",
  },
  document: {
    documentType: "health_certificate",
    expiresAt: null,
    id: "sup-no-001-health-certificate",
    issuedAt: null,
    status: action === "supplier_document.reject" ? "on_request" : action === "supplier_document.expire" ? "expired" : "approved",
    title: "Health certificate",
  },
  ok: true,
  requestId: "req_management_action_1",
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

  it("posts admin decision and lifecycle actions with sanitized responses", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/decision")) {
        const body = JSON.parse(String(init?.body)) as { decision: "approve" | "reject" };
        return new Response(JSON.stringify(managementActionPayload(`supplier_document.${body.decision}`)), {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.endsWith("/lifecycle")) {
        const body = JSON.parse(String(init?.body)) as { action: "expire" | "delete" };
        return new Response(JSON.stringify(managementActionPayload(`supplier_document.${body.action}`)), {
          headers: { "content-type": "application/json" },
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

    await expect(client.runDocumentAction({
      action: "approve",
      documentId: "sup-no-001-health-certificate",
      supplierId: "sup-no-001",
    })).resolves.toMatchObject({
      audit: { action: "supplier_document.approve" },
      ok: true,
    });
    await expect(client.runDocumentAction({
      action: "reject",
      documentId: "sup-no-001-health-certificate",
      reason: "Missing current certificate",
      supplierId: "sup-no-001",
    })).resolves.toMatchObject({
      audit: { action: "supplier_document.reject" },
      ok: true,
    });
    await expect(client.runDocumentAction({
      action: "expire",
      documentId: "sup-no-001-health-certificate",
      reason: "Certificate expired",
      supplierId: "sup-no-001",
    })).resolves.toMatchObject({
      audit: { action: "supplier_document.expire" },
      ok: true,
    });
    await expect(client.runDocumentAction({
      action: "delete",
      documentId: "sup-no-001-health-certificate",
      reason: "Duplicate upload",
      supplierId: "sup-no-001",
    })).resolves.toMatchObject({
      audit: { action: "supplier_document.delete" },
      ok: true,
    });

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/sup-no-001/documents/sup-no-001-health-certificate/decision",
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body))).toEqual({
      decision: "approve",
    });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/sup-no-001/documents/sup-no-001-health-certificate/decision",
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body))).toEqual({
      decision: "reject",
      reason: "Missing current certificate",
    });
    expect(String(fetchImpl.mock.calls[2]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/sup-no-001/documents/sup-no-001-health-certificate/lifecycle",
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[2]?.[1]?.body))).toEqual({
      action: "expire",
      reason: "Certificate expired",
    });
    expect(String(fetchImpl.mock.calls[3]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/sup-no-001/documents/sup-no-001-health-certificate/lifecycle",
    );
    expect(JSON.parse(String(fetchImpl.mock.calls[3]?.[1]?.body))).toEqual({
      action: "delete",
      reason: "Duplicate upload",
    });
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
