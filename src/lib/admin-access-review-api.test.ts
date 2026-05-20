import { describe, expect, it, vi } from "vitest";
import {
  AdminAccessReviewApiError,
  createAdminAccessReviewApiClient,
  isAdminAccessReviewApiConfigured,
  type AdminAccessReviewDecisionResponse,
  type AdminAccessReviewListResponse,
} from "@/lib/admin-access-review-api";

const userId = "00000000-0000-4000-8000-000000000090";
const sessionId = "session_admin_access_review";

const listPayload = (): AdminAccessReviewListResponse => ({
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
      decisionSla: "fresh",
      request: {
        buyerUserId: "00000000-0000-4000-8000-000000000001",
        createdAt: "2026-05-20T10:00:00.000Z",
        decidedAt: null,
        decidedByUserId: null,
        id: "00000000-0000-4000-8000-000000000111",
        intent: "exact_price",
        message: "Need exact price",
        status: "sent",
        supplierId: "sup-no-001",
        updatedAt: "2026-05-20T10:00:00.000Z",
      },
      supplier: {
        city: "Ålesund",
        companyName: "Nordfjord Sjømat AS",
        country: "Norway",
        maskedName: "Norwegian salmon producer · NO-114",
        supplierId: "sup-no-001",
        verificationLevel: "documents_reviewed",
      },
    },
  ],
  limit: 25,
  offset: 0,
  requestId: "req_admin_review",
  summary: {
    approved: 0,
    open: 1,
    pending: 0,
    rejected: 0,
    revoked: 0,
    sent: 1,
  },
  total: 1,
});

const decisionPayload = (): AdminAccessReviewDecisionResponse => ({
  ok: true,
  grants: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: null,
      grantedAt: "2026-05-20T10:05:00.000Z",
      grantedByUserId: userId,
      id: "grant_supplier_identity",
      offerId: null,
      scope: "supplier_identity",
      supplierId: "sup-no-001",
    },
  ],
  notification: {
    body: "The supplier approved your request. Exact prices and supplier details are now available.",
    buyerUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-20T10:05:00.000Z",
    id: "00000000-0000-4000-8000-000000000222",
    readAt: null,
    status: "unread",
    supplierId: "sup-no-001",
    title: "Price access approved",
    type: "price_access_approved",
  },
  request: {
    buyerUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-20T10:00:00.000Z",
    decidedAt: "2026-05-20T10:05:00.000Z",
    decidedByUserId: userId,
    id: "00000000-0000-4000-8000-000000000111",
    intent: "exact_price",
    message: "Need exact price",
    status: "approved",
    supplierId: "sup-no-001",
    updatedAt: "2026-05-20T10:05:00.000Z",
  },
  requestId: "req_decision",
});

describe("admin access review API client", () => {
  it("is disabled without self-hosted API URL", () => {
    expect(isAdminAccessReviewApiConfigured()).toBe(false);
    expect(createAdminAccessReviewApiClient().enabled).toBe(false);
  });

  it("lists review requests with session headers and URL filters", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(listPayload()), { status: 200 }));
    const client = createAdminAccessReviewApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl,
      sessionId,
      userId,
    });

    const response = await client.list({
      limit: 25,
      offset: 50,
      q: "Nordfjord",
      status: "open",
    });

    expect(response.items).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.yorso.test/v1/admin/access-requests?status=open&q=Nordfjord&limit=25&offset=50",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchImpl.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe(userId);
    expect(headers.get("x-yorso-session-id")).toBe(sessionId);
  });

  it("posts approve decisions through the admin review endpoint", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(decisionPayload()), { status: 200 }));
    const client = createAdminAccessReviewApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
      sessionId,
      userId,
    });

    const response = await client.decide("00000000-0000-4000-8000-000000000111", "approved");

    expect(response.request.status).toBe("approved");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.yorso.test/v1/admin/access-requests/00000000-0000-4000-8000-000000000111/decision",
      expect.objectContaining({
        body: JSON.stringify({ status: "approved" }),
        method: "POST",
      }),
    );
  });

  it("maps forbidden and invalid response errors", async () => {
    const forbidden = createAdminAccessReviewApiClient({
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

    const invalid = createAdminAccessReviewApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
      sessionId,
      userId,
    });

    await expect(invalid.list()).rejects.toBeInstanceOf(AdminAccessReviewApiError);
    await expect(invalid.list()).rejects.toMatchObject({
      code: "admin_access_review_invalid_response",
    });
  });
});
