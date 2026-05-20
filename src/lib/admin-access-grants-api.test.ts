import { describe, expect, it, vi } from "vitest";
import {
  AdminAccessGrantsApiError,
  createAdminAccessGrantsApiClient,
  isAdminAccessGrantsApiConfigured,
  type AdminAccessGrantListResponse,
  type AdminAccessGrantRevokeResponse,
} from "@/lib/admin-access-grants-api";

const userId = "00000000-0000-4000-8000-000000000090";
const sessionId = "session_admin_access_grants";
const grantId = "00000000-0000-4000-8000-000000000301";

const listPayload = (): AdminAccessGrantListResponse => ({
  ok: true,
  items: [
    {
      ageHours: 3,
      buyer: {
        accountRole: "buyer",
        companyName: "Fjord Buyers GmbH",
        countryCode: "DE",
        displayName: "Procurement Manager",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: null,
      grantedAt: "2026-05-20T10:05:00.000Z",
      grantedByUserId: userId,
      grants: [
        {
          buyerUserId: "00000000-0000-4000-8000-000000000001",
          expiresAt: null,
          grantedAt: "2026-05-20T10:05:00.000Z",
          grantedByUserId: userId,
          id: grantId,
          offerId: null,
          scope: "supplier_identity",
          supplierId: "sup-no-001",
        },
      ],
      id: grantId,
      isActive: true,
      request: null,
      scopes: ["supplier_identity"],
      supplier: {
        city: "Ålesund",
        companyName: "Nordfjord Sjømat AS",
        country: "Norway",
        maskedName: "Norwegian salmon producer",
        supplierId: "sup-no-001",
        verificationLevel: "documents_reviewed",
      },
      supplierId: "sup-no-001",
    },
  ],
  limit: 25,
  offset: 0,
  requestId: "req_grants",
  summary: {
    active: 1,
    expired: 0,
    total: 1,
  },
  total: 1,
});

const revokePayload = (): AdminAccessGrantRevokeResponse => ({
  accessGranted: false,
  ok: true,
  request: null,
  requestId: "req_revoke",
  revokedGrants: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: "2026-05-20T11:00:00.000Z",
      grantedAt: "2026-05-20T10:05:00.000Z",
      grantedByUserId: userId,
      id: grantId,
      offerId: null,
      scope: "supplier_identity",
      supplierId: "sup-no-001",
    },
  ],
});

describe("admin access grants API client", () => {
  it("is disabled without self-hosted API URL", () => {
    expect(isAdminAccessGrantsApiConfigured()).toBe(false);
    expect(createAdminAccessGrantsApiClient().enabled).toBe(false);
  });

  it("lists grants with session headers and URL filters", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(listPayload()), { status: 200 }));
    const client = createAdminAccessGrantsApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl,
      sessionId,
      userId,
    });

    const response = await client.list({
      limit: 25,
      offset: 50,
      q: "Nordfjord",
      status: "active",
    });

    expect(response.items).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.yorso.test/v1/admin/access-grants?status=active&q=Nordfjord&limit=25&offset=50",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchImpl.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe(userId);
    expect(headers.get("x-yorso-session-id")).toBe(sessionId);
  });

  it("posts revoke through the admin grants endpoint", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(revokePayload()), { status: 200 }));
    const client = createAdminAccessGrantsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
      sessionId,
      userId,
    });

    const response = await client.revoke(grantId, "Commercial access ended");

    expect(response.accessGranted).toBe(false);
    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.yorso.test/v1/admin/access-grants/${grantId}/revoke`,
      expect.objectContaining({
        body: JSON.stringify({ reason: "Commercial access ended" }),
        method: "POST",
      }),
    );
  });

  it("maps forbidden and invalid response errors", async () => {
    const forbidden = createAdminAccessGrantsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () => new Response(
        JSON.stringify({ ok: false, error: { code: "admin_role_required" } }),
        { status: 403 },
      )),
      sessionId,
      userId,
    });

    await expect(forbidden.list()).rejects.toMatchObject({
      code: "admin_role_required",
      status: 403,
    });

    const invalid = createAdminAccessGrantsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
      sessionId,
      userId,
    });

    await expect(invalid.list()).rejects.toBeInstanceOf(AdminAccessGrantsApiError);
    await expect(invalid.list()).rejects.toMatchObject({
      code: "admin_access_grants_invalid_response",
    });
  });
});
