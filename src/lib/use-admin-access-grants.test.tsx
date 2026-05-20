import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BuyerSession } from "@/lib/buyer-session";
import type { AdminAccessGrantListResponse } from "@/lib/admin-access-grants-api";
import { useAdminAccessGrants } from "@/lib/use-admin-access-grants";

const adminSession: BuyerSession = {
  displayName: "Admin Grants",
  id: "session_admin_access_grants",
  identifier: "admin@example.com",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000090",
};

const grantId = "00000000-0000-4000-8000-000000000301";

const responsePayload = (active = true): AdminAccessGrantListResponse => ({
  ok: true,
  items: [
    {
      ageHours: 2,
      buyer: {
        accountRole: "buyer",
        companyName: "Fjord Buyers GmbH",
        countryCode: "DE",
        displayName: "Buyer User",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: active ? null : "2026-05-20T11:00:00.000Z",
      grantedAt: "2026-05-20T10:00:00.000Z",
      grantedByUserId: adminSession.userId ?? null,
      grants: [],
      id: grantId,
      isActive: active,
      request: null,
      scopes: ["offer_price", "supplier_identity"],
      supplier: {
        city: "Ålesund",
        companyName: active ? "Nordfjord Sjømat AS" : null,
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
    active: active ? 1 : 0,
    expired: active ? 0 : 1,
    total: 1,
  },
  total: 1,
});

describe("useAdminAccessGrants", () => {
  it("returns disabled and session-required states before network work", () => {
    const disabled = renderHook(() => useAdminAccessGrants(adminSession, { limit: 25 }));
    expect(disabled.result.current.status).toBe("disabled");

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const sessionRequired = renderHook(() => useAdminAccessGrants(null, { limit: 25 }));
    expect(sessionRequired.result.current.status).toBe("session_required");
    vi.unstubAllEnvs();
  });

  it("loads grants and refreshes after revoke", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    let active = true;
    const fetchImpl = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.endsWith("/revoke")) {
          expect(init?.method).toBe("POST");
          active = false;
          return new Response(JSON.stringify({
            accessGranted: false,
            ok: true,
            request: null,
            requestId: "req_revoke",
            revokedGrants: responsePayload(false).items[0].grants,
          }), { status: 200 });
        }
        return new Response(JSON.stringify(responsePayload(active)), { status: 200 });
      });

    const { result } = renderHook(() => useAdminAccessGrants(adminSession, {
      limit: 25,
      q: "salmon",
      status: "active",
    }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.items[0].supplier.companyName).toBe("Nordfjord Sjømat AS");

    await act(async () => {
      await result.current.revoke(grantId, "Commercial access ended");
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

    const { result } = renderHook(() => useAdminAccessGrants(adminSession, { limit: 25 }));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
});
