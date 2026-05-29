import { afterEach, describe, expect, it, vi } from "vitest";

const importContracts = async (apiUrl = "") => {
  vi.resetModules();
  vi.stubEnv("VITE_YORSO_API_URL", apiUrl);
  vi.stubEnv("VITE_MOCK_LATENCY_MS", "0");
  return import("./api-contracts");
};

describe("registration API contract boundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it("uses self-hosted registration endpoints when VITE_YORSO_API_URL is configured", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          sessionId: "registration-session-12345678901234567890",
          emailSent: true,
          expiresInSeconds: 300,
          requestId: "00000000-0000-4000-8000-000000000201",
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { authApi } = await importContracts("https://api.yorso.test/");

    const result = await authApi.startRegistration({
      email: "Buyer@Yorso.Test",
      role: "buyer",
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        sessionId: "registration-session-12345678901234567890",
        emailSent: true,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.yorso.test/v1/auth/register/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "Buyer@Yorso.Test",
          role: "buyer",
        }),
      }),
    );
  });

  it("maps self-hosted registration errors to the existing UI error contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            error: {
              code: "registration_email_exists",
              message: "An account with this email already exists.",
            },
          }),
          { status: 409, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const { authApi, ERROR_CODES } = await importContracts("https://api.yorso.test");

    const result = await authApi.startRegistration({
      email: "taken@yorso.test",
      role: "buyer",
    });

    expect(result).toMatchObject({
      ok: false,
      code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
      message: "An account with this email already exists.",
    });
  });

  it("stores the self-hosted auth session returned by registration complete", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            userId: "00000000-0000-4000-8000-000000000222",
            token: "session-registration-12345678901234567890",
            profile: {
              fullName: "Phase Buyer",
              company: "Phase 2A Procurement LLC",
              role: "buyer",
              country: "Spain",
            },
            session: {
              id: "session-registration-12345678901234567890",
              userId: "00000000-0000-4000-8000-000000000222",
              email: "phase2a@yorso.test",
              displayName: "Phase Buyer",
              issuedAt: "2026-05-29T08:00:00.000Z",
              expiresAt: "2026-06-05T08:00:00.000Z",
            },
            requestId: "00000000-0000-4000-8000-000000000202",
          }),
          { headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const { authApi } = await importContracts("https://api.yorso.test");

    const result = await authApi.completeRegistration({
      sessionId: "registration-session-12345678901234567890",
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        userId: "00000000-0000-4000-8000-000000000222",
        session: {
          id: "session-registration-12345678901234567890",
        },
      },
    });
  });
});
