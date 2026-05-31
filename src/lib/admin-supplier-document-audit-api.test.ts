import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminSupplierDocumentAuditApiError,
  createAdminSupplierDocumentAuditApiClient,
  isAdminSupplierDocumentAuditApiConfigured,
  type AdminSupplierDocumentAuditListResponse,
} from "@/lib/admin-supplier-document-audit-api";

const auditPayload = (patch: Partial<AdminSupplierDocumentAuditListResponse> = {}): AdminSupplierDocumentAuditListResponse => ({
  items: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      expiresAt: "2026-05-31T08:15:00.000Z",
      grantedAt: "2026-05-31T08:00:00.000Z",
      id: "sdg_1",
      reason: "granted",
      requestId: "req_grant_1",
      status: "granted",
      supplierId: "sup-no-001",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000401",
  ...patch,
});

describe("admin-supplier-document-audit-api", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("stays disabled when VITE_YORSO_API_URL is empty", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    expect(isAdminSupplierDocumentAuditApiConfigured()).toBe(false);
    expect(createAdminSupplierDocumentAuditApiClient().enabled).toBe(false);
  });

  it("requires a self-hosted admin session before calling the backend", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createAdminSupplierDocumentAuditApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
    });

    await expect(client.list("download_grants")).rejects.toMatchObject({
      code: "admin_supplier_document_audit_session_required",
      status: 401,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("lists grant audit with filters and self-hosted session headers", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify(auditPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createAdminSupplierDocumentAuditApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-document-audit",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(client.list("download_grants", {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      limit: 25,
      offset: 10,
      status: "granted",
      supplierId: "sup-no-001",
    })).resolves.toMatchObject({
      items: [{ id: "sdg_1", status: "granted" }],
      ok: true,
    });

    const firstCall = fetchImpl.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(String(firstCall[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/download-grants?limit=25&offset=10&status=granted&supplierId=sup-no-001&buyerUserId=00000000-0000-4000-8000-000000000001",
    );
    const headers = firstCall[1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000099");
    expect(headers.get("x-yorso-session-id")).toBe("session-admin-document-audit");
  });

  it("lists download event audit through the events endpoint", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify(auditPayload({
        items: [
          {
            buyerUserId: "00000000-0000-4000-8000-000000000001",
            createdAt: "2026-05-31T08:01:00.000Z",
            documentId: "sup-no-001-health-certificate",
            grantId: "sdg_1",
            id: "sdde_1",
            reason: "downloaded",
            requestId: "req_download_1",
            status: "downloaded",
            supplierId: "sup-no-001",
          },
        ],
      })), {
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createAdminSupplierDocumentAuditApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-document-audit",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(client.list("download_events", { limit: 5, status: "downloaded" })).resolves.toMatchObject({
      items: [{ id: "sdde_1", grantId: "sdg_1", status: "downloaded" }],
      ok: true,
    });

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/download-events?limit=5&status=downloaded",
    );
  });

  it("maps admin role failures and rejects storage-leaking responses", async () => {
    const forbiddenClient = createAdminSupplierDocumentAuditApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: "admin_role_required" } }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-document-audit",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(forbiddenClient.list("download_grants")).rejects.toMatchObject({
      code: "admin_role_required",
      status: 403,
    });

    const invalidClient = createAdminSupplierDocumentAuditApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({
          ...auditPayload(),
          items: [{ ...auditPayload().items[0], downloadPath: "/v1/suppliers/sup-no-001/documents/x/download" }],
        }), {
          headers: { "content-type": "application/json" },
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-document-audit",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(invalidClient.list("download_grants")).rejects.toBeInstanceOf(AdminSupplierDocumentAuditApiError);
    await expect(invalidClient.list("download_grants")).rejects.toMatchObject({
      code: "admin_supplier_document_audit_invalid_response",
    });
  });
});
