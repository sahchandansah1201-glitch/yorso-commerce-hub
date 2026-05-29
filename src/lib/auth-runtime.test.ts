import { afterEach, describe, expect, it, vi } from "vitest";

const selfHostedSession = {
  displayName: "Buyer QA",
  email: "buyer@yorso.test",
  expiresAt: "2026-05-20T12:00:00.000Z",
  id: "session_self_hosted_12345678901234567890",
  issuedAt: "2026-05-19T12:00:00.000Z",
  userId: "00000000-0000-4000-8000-000000000074",
};

const importRuntime = async (
  options: {
    selfHostedApiUrl?: string;
  } = {},
) => {
  vi.resetModules();
  vi.stubEnv("VITE_YORSO_API_URL", options.selfHostedApiUrl ?? "");
  return import("./auth-runtime");
};

describe("auth-runtime adapter boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("uses local contract auth when self-hosted API is not configured", async () => {
    vi.stubEnv("VITE_MOCK_LATENCY_MS", "0");
    const runtime = await importRuntime();

    const result = await runtime.signInWithEmail({
      email: "buyer@yorso.test",
      password: "Password1",
    });

    expect(result).toEqual({ ok: true, source: "local_contract" });
  });

  it("uses self-hosted email sign-in when VITE_YORSO_API_URL is configured", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.yorso.test/v1/auth/sign-in");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        email: "buyer@yorso.test",
        password: "Password1",
      });
      expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
      return new Response(
        JSON.stringify({
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000174",
          session: selfHostedSession,
        }),
        { headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const runtime = await importRuntime({ selfHostedApiUrl: "https://api.yorso.test" });

    const result = await runtime.signInWithEmail({
      email: "buyer@yorso.test",
      password: "Password1",
    });

    expect(result).toEqual({
      ok: true,
      session: selfHostedSession,
      source: "self_hosted",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns self-hosted auth errors without falling back to local prototype auth", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: {
              code: "auth_invalid_credentials",
              message: "Invalid email or password.",
            },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const runtime = await importRuntime({ selfHostedApiUrl: "https://api.yorso.test" });

    const result = await runtime.signInWithEmail({
      email: "buyer@yorso.test",
      password: "wrong-password",
    });

    expect(runtime.isAuthRuntimeError(result)).toBe(true);
    if (runtime.isAuthRuntimeError(result)) {
      expect(result.source).toBe("self_hosted");
      expect(result.code).toBe("auth_invalid_credentials");
      expect(result.message).toBe("Invalid email or password.");
    }
  });

  it("returns local contract errors when self-hosted API is disabled", async () => {
    vi.stubEnv("VITE_MOCK_LATENCY_MS", "0");
    const runtime = await importRuntime();

    const result = await runtime.signInWithEmail({
      email: "buyer@yorso.test",
      password: "wrong",
    });

    expect(runtime.isAuthRuntimeError(result)).toBe(true);
    if (runtime.isAuthRuntimeError(result)) {
      expect(result.source).toBe("local_contract");
      expect(result.code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("stays on the local contract when self-hosted API is disabled", async () => {
    vi.stubEnv("VITE_MOCK_LATENCY_MS", "0");
    const runtime = await importRuntime();

    await expect(
      runtime.signInWithEmail({ email: "buyer@yorso.test", password: "Password1" }),
    ).resolves.toEqual({ ok: true, source: "local_contract" });
    await expect(
      runtime.requestPasswordReset({
        email: "buyer@yorso.test",
        redirectTo: "https://app.test/reset-password",
      }),
    ).resolves.toEqual({ ok: true, source: "local_contract" });
  });

  it("keeps password recovery unavailable without a self-hosted recovery token", async () => {
    const runtime = await importRuntime();
    const onReady = vi.fn();
    const unsubscribe = runtime.observePasswordRecovery(onReady);

    unsubscribe();

    expect(onReady).not.toHaveBeenCalled();
    await expect(runtime.updateRecoveredPassword("Password1")).resolves.toMatchObject({
      ok: false,
      source: "local_contract",
      code: "recovery_unavailable",
    });
  });

  it("uses self-hosted password reset request and token completion when configured", async () => {
    const requests: Array<{ body: unknown; method: string | undefined; url: string }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({
          body: init?.body ? JSON.parse(String(init.body)) : undefined,
          method: init?.method,
          url: String(input),
        });
        return new Response(
          JSON.stringify({
            ok: true,
            requestId: "00000000-0000-4000-8000-000000000474",
            sent: true,
          }),
          { headers: { "content-type": "application/json" } },
        );
      }),
    );
    const runtime = await importRuntime({ selfHostedApiUrl: "https://api.yorso.test" });
    const onReady = vi.fn();

    await expect(
      runtime.requestPasswordReset({
        email: "buyer@yorso.test",
        redirectTo: "https://app.test/reset-password",
      }),
    ).resolves.toEqual({ ok: true, source: "self_hosted" });

    window.history.pushState(null, "", "/reset-password?token=self_hosted_reset_token_12345678901234567890");
    const unsubscribe = runtime.observePasswordRecovery(onReady);
    await expect(runtime.updateRecoveredPassword("NewPassword1")).resolves.toEqual({
      ok: true,
      source: "self_hosted",
    });
    unsubscribe();

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(requests).toEqual([
      {
        body: {
          email: "buyer@yorso.test",
          redirectTo: "https://app.test/reset-password",
        },
        method: "POST",
        url: "https://api.yorso.test/v1/auth/password-reset/request",
      },
      {
        body: {
          password: "NewPassword1",
          token: "self_hosted_reset_token_12345678901234567890",
        },
        method: "POST",
        url: "https://api.yorso.test/v1/auth/password-reset/complete",
      },
    ]);
  });

  it("reads and signs out the current self-hosted browser session", async () => {
    const requests: Array<{ headers: Headers; method: string | undefined; url: string }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({
          headers: new Headers(init?.headers),
          method: init?.method,
          url: String(input),
        });
        if (String(input).endsWith("/v1/auth/session")) {
          return new Response(
            JSON.stringify({
              ok: true,
              requestId: "00000000-0000-4000-8000-000000000274",
              session: selfHostedSession,
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            ok: true,
            requestId: "00000000-0000-4000-8000-000000000374",
            signedOut: true,
          }),
          { headers: { "content-type": "application/json" } },
        );
      }),
    );
    const runtime = await importRuntime({ selfHostedApiUrl: "https://api.yorso.test" });
    const { buyerSession } = await import("./buyer-session");
    buyerSession.signIn({
      displayName: selfHostedSession.displayName,
      expiresAt: selfHostedSession.expiresAt,
      id: selfHostedSession.id,
      identifier: selfHostedSession.email,
      method: "email",
      signedInAt: selfHostedSession.issuedAt,
      source: "self_hosted",
      userId: selfHostedSession.userId,
    });

    await expect(runtime.readCurrentAuthSession()).resolves.toEqual({
      ok: true,
      session: selfHostedSession,
      source: "self_hosted",
    });
    await expect(runtime.signOutCurrentAuthSession()).resolves.toEqual({
      ok: true,
      source: "self_hosted",
    });

    expect(requests.map((request) => request.url)).toEqual([
      "https://api.yorso.test/v1/auth/session",
      "https://api.yorso.test/v1/auth/sign-out",
    ]);
    expect(requests[0].headers.get("x-yorso-session-id")).toBe(selfHostedSession.id);
    expect(requests[1].headers.get("x-yorso-session-id")).toBe(selfHostedSession.id);
    expect(buyerSession.getSession()).toBeNull();
  });

});
