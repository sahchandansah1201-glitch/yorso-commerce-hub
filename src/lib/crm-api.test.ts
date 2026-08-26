import { describe, expect, it, vi } from "vitest";
import { createCrmApiClient, CrmAccessError } from "@/lib/crm-api";
import type { BuyerSession } from "@/lib/buyer-session";

const session: BuyerSession = {
  id: "session-1",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-08-26T00:00:00.000Z",
  displayName: "Admin",
  userId: "user-1",
};

describe("CRM API client", () => {
  it("returns the protected CRM URL with session headers", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      crmUrl: "http://127.0.0.1:3020",
      requestId: "request-1",
    }), { status: 200 })) as unknown as typeof fetch;

    const result = await createCrmApiClient({ baseUrl: "http://127.0.0.1:3000", fetchImpl, session })
      .getFullUiAccess();

    expect(result).toEqual({ crmUrl: "http://127.0.0.1:3020/", requestId: "request-1" });
    expect(fetchImpl).toHaveBeenCalledWith("http://127.0.0.1:3000/v1/crm/full-ui", {
      headers: {
        "x-yorso-session-id": "session-1",
        "x-yorso-user-id": "user-1",
      },
    });
  });

  it("requests a fresh CRM availability check when retrying", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      crmUrl: "http://127.0.0.1:3020",
      requestId: "request-refresh",
    }), { status: 200 })) as unknown as typeof fetch;

    await createCrmApiClient({ baseUrl: "http://127.0.0.1:3000", fetchImpl, session })
      .getFullUiAccess({ refresh: true });

    expect(fetchImpl).toHaveBeenCalledWith("http://127.0.0.1:3000/v1/crm/full-ui", {
      headers: {
        "cache-control": "no-cache",
        "x-yorso-session-id": "session-1",
        "x-yorso-user-id": "user-1",
      },
    });
  });

  it.each([
    [403, "crm_access_denied"],
    [503, "crm_unavailable"],
  ])("maps HTTP %i to %s", async (status, code) => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { code } }), { status })) as unknown as typeof fetch;
    await expect(createCrmApiClient({ baseUrl: "http://127.0.0.1:3000", fetchImpl, session }).getFullUiAccess())
      .rejects.toMatchObject({ code });
  });

  it("requires a self-hosted session before requesting CRM", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(createCrmApiClient({ baseUrl: "http://127.0.0.1:3000", fetchImpl, session: null }).getFullUiAccess())
      .rejects.toEqual(new CrmAccessError("crm_session_required"));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects malformed CRM URLs", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      crmUrl: "javascript:alert(1)",
      requestId: "request-1",
    }), { status: 200 })) as unknown as typeof fetch;
    await expect(createCrmApiClient({ baseUrl: "http://127.0.0.1:3000", fetchImpl, session }).getFullUiAccess())
      .rejects.toMatchObject({ code: "crm_invalid_response" });
  });
});
