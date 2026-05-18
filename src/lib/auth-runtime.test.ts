import { afterEach, describe, expect, it, vi } from "vitest";

const importRuntime = async (
  supabaseMock: {
    isConfigured: boolean;
    auth?: Record<string, unknown>;
  } = { isConfigured: false },
) => {
  vi.resetModules();
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
