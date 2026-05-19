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
  supabaseMock: {
    isConfigured: boolean;
    auth?: Record<string, unknown>;
  } = { isConfigured: false },
  options: {
    selfHostedApiUrl?: string;
  } = {},
) => {
  vi.resetModules();
  vi.stubEnv("VITE_YORSO_API_URL", options.selfHostedApiUrl ?? "");
  if (supabaseMock.isConfigured) {
    vi.stubEnv("VITE_SUPABASE_URL", "https://prototype.supabase.test");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "prototype-key");
  } else {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  }
  vi.doMock("@/integrations/supabase/client", () => ({
    isSupabaseConfigured: supabaseMock.isConfigured,
    supabase: {
      auth: supabaseMock.auth ?? {},
    },
  }));
  return import("./auth-runtime");
};

describe("auth-runtime adapter boundary", () => {
  afterEach(() => {
    vi.doUnmock("@/integrations/supabase/client");
    vi.doUnmock("@/lib/legacy-auth-supabase-adapter");
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("uses local contract auth when Supabase is not configured", async () => {
    vi.stubEnv("VITE_MOCK_LATENCY_MS", "0");
    const runtime = await importRuntime({ isConfigured: false });

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
    const runtime = await importRuntime(
      { isConfigured: false },
      { selfHostedApiUrl: "https://api.yorso.test" },
    );

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
    const runtime = await importRuntime(
      { isConfigured: false },
      { selfHostedApiUrl: "https://api.yorso.test" },
    );

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

  it("returns local contract errors without touching Supabase when disabled", async () => {
    vi.stubEnv("VITE_MOCK_LATENCY_MS", "0");
    const runtime = await importRuntime({ isConfigured: false });

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

  it("delegates email sign-in and reset to prototype Supabase only when configured", async () => {
    const signInWithPassword = vi.fn(async () => ({ error: null }));
    const resetPasswordForEmail = vi.fn(async () => ({ error: null }));
    const runtime = await importRuntime({
      isConfigured: true,
      auth: {
        signInWithPassword,
        resetPasswordForEmail,
      },
    });

    await expect(
      runtime.signInWithEmail({ email: "buyer@yorso.test", password: "secret" }),
    ).resolves.toEqual({ ok: true, source: "supabase_prototype" });
    await expect(
      runtime.requestPasswordReset({
        email: "buyer@yorso.test",
        redirectTo: "https://app.test/reset-password",
      }),
    ).resolves.toEqual({ ok: true, source: "supabase_prototype" });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "buyer@yorso.test",
      password: "secret",
    });
    expect(resetPasswordForEmail).toHaveBeenCalledWith("buyer@yorso.test", {
      redirectTo: "https://app.test/reset-password",
    });
  });

  it("keeps password recovery unavailable without a configured Supabase recovery session", async () => {
    const runtime = await importRuntime({ isConfigured: false });
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

  it("keeps password reset unavailable until self-hosted recovery endpoints exist", async () => {
    const runtime = await importRuntime(
      { isConfigured: false },
      { selfHostedApiUrl: "https://api.yorso.test" },
    );

    await expect(
      runtime.requestPasswordReset({
        email: "buyer@yorso.test",
        redirectTo: "https://app.test/reset-password",
      }),
    ).resolves.toMatchObject({
      ok: false,
      source: "self_hosted",
      code: "password_reset_unavailable",
    });
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
    const runtime = await importRuntime(
      { isConfigured: false },
      { selfHostedApiUrl: "https://api.yorso.test" },
    );
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

  it("observes prototype Supabase recovery events behind the adapter", async () => {
    const unsubscribe = vi.fn();
    const onAuthStateChange = vi.fn((callback: (event: string) => void) => {
      callback("PASSWORD_RECOVERY");
      return { data: { subscription: { unsubscribe } } };
    });
    const getSession = vi.fn(async () => ({ data: { session: null }, error: null }));
    const updateUser = vi.fn(async () => ({ error: null }));
    const signOut = vi.fn(async () => ({ error: null }));
    const runtime = await importRuntime({
      isConfigured: true,
      auth: {
        onAuthStateChange,
        getSession,
        updateUser,
        signOut,
      },
    });
    const onReady = vi.fn();

    const cleanup = runtime.observePasswordRecovery(onReady);
    const result = await runtime.updateRecoveredPassword("Password1");
    await vi.waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    cleanup();

    expect(result).toEqual({ ok: true, source: "supabase_prototype" });
    expect(updateUser).toHaveBeenCalledWith({ password: "Password1" });
    expect(signOut).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
