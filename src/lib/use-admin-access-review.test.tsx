import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminAccessReview } from "@/lib/use-admin-access-review";
import type { AdminAccessReviewListResponse } from "@/lib/admin-access-review-api";

const adminSession: BuyerSession = {
  displayName: "Admin Access",
  id: "session_admin_access_review",
  identifier: "admin@example.com",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000090",
};

const responsePayload = (status: "sent" | "approved" = "sent"): AdminAccessReviewListResponse => ({
  ok: true,
  items: [
    {
      ageHours: 1,
      buyer: {
        accountRole: "buyer",
        companyName: "Fjord Buyers GmbH",
        countryCode: "DE",
        displayName: "Buyer User",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      decisionSla: "fresh",
      request: {
        buyerUserId: "00000000-0000-4000-8000-000000000001",
        createdAt: "2026-05-20T10:00:00.000Z",
        decidedAt: status === "approved" ? "2026-05-20T10:05:00.000Z" : null,
        decidedByUserId: status === "approved" ? adminSession.userId ?? null : null,
        id: "00000000-0000-4000-8000-000000000111",
        intent: "exact_price",
        message: "Need exact price",
        status,
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
  requestId: "req_review",
  summary: {
    approved: status === "approved" ? 1 : 0,
    open: status === "approved" ? 0 : 1,
    pending: 0,
    rejected: 0,
    revoked: 0,
    sent: status === "sent" ? 1 : 0,
  },
  total: 1,
});

describe("useAdminAccessReview", () => {
  it("returns disabled and session-required states before network work", () => {
    const disabled = renderHook(() => useAdminAccessReview(adminSession, { limit: 25 }));
    expect(disabled.result.current.status).toBe("disabled");

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const sessionRequired = renderHook(() => useAdminAccessReview(null, { limit: 25 }));
    expect(sessionRequired.result.current.status).toBe("session_required");
    vi.unstubAllEnvs();
  });

  it("loads review queue and refreshes after decision", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.endsWith("/decision")) {
          expect(init?.method).toBe("POST");
          return new Response(JSON.stringify({
            ok: true,
            grants: [],
            notification: null,
            request: responsePayload("approved").items[0].request,
            requestId: "req_decision",
          }), { status: 200 });
        }
        return new Response(JSON.stringify(responsePayload("sent")), { status: 200 });
      });

    const { result } = renderHook(() => useAdminAccessReview(adminSession, {
      limit: 25,
      q: "salmon",
      status: "open",
    }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.items[0].supplier.companyName).toBe("Nordfjord Sjømat AS");

    await act(async () => {
      await result.current.decide("00000000-0000-4000-8000-000000000111", "approved");
    });

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));
    const headers = fetchImpl.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe(adminSession.userId);
    expect(headers.get("x-yorso-session-id")).toBe(adminSession.id);

    fetchImpl.mockRestore();
    vi.unstubAllEnvs();
  });

  it("maps admin role failures to forbidden state", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ ok: false, error: { code: "admin_role_required" } }),
      { status: 403 },
    ));

    const { result } = renderHook(() => useAdminAccessReview(adminSession, { limit: 25 }));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
});
