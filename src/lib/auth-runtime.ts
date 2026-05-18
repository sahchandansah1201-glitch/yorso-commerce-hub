import { authApi, getErrorMessage, isApiError } from "@/lib/api-contracts";

export type AuthRuntimeSource = "supabase_prototype" | "local_contract";

export type AuthRuntimeResult =
  | {
      ok: true;
      source: AuthRuntimeSource;
    }
  | {
      ok: false;
      code: string;
      message: string;
      source: AuthRuntimeSource;
    };

export type AuthRuntimeError = Extract<AuthRuntimeResult, { ok: false }>;

export const isAuthRuntimeError = (
  result: AuthRuntimeResult,
): result is AuthRuntimeError => result.ok === false;

const localError = (code: string, message: string): AuthRuntimeResult => ({
  ok: false,
  code,
  message,
  source: "local_contract",
});

const hasLegacyAuthSupabaseEnv = (): boolean =>
  Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

const loadLegacyAuthSupabaseAdapter = async () =>
  import("@/lib/legacy-auth-supabase-adapter");

export const signInWithEmail = async (input: {
  email: string;
  password: string;
}): Promise<AuthRuntimeResult> => {
  if (hasLegacyAuthSupabaseEnv()) {
    const legacyAuth = await loadLegacyAuthSupabaseAdapter();
    if (legacyAuth.isLegacyAuthSupabaseConfigured()) {
      return legacyAuth.signInWithPrototypeSupabase(input);
    }
  }

  const result = await authApi.signIn({
    method: "email",
    identifier: input.email,
    password: input.password,
  });
  if (isApiError(result)) {
    return localError(result.code, getErrorMessage(result.code));
  }
  return { ok: true, source: "local_contract" };
};

export const requestPasswordReset = async (input: {
  email: string;
  redirectTo: string;
}): Promise<AuthRuntimeResult> => {
  if (hasLegacyAuthSupabaseEnv()) {
    const legacyAuth = await loadLegacyAuthSupabaseAdapter();
    if (legacyAuth.isLegacyAuthSupabaseConfigured()) {
      return legacyAuth.requestPrototypePasswordReset(input);
    }
  }

  const result = await authApi.requestPasswordReset({ email: input.email });
  if (isApiError(result)) {
    return localError(result.code, getErrorMessage(result.code));
  }
  return { ok: true, source: "local_contract" };
};

export const observePasswordRecovery = (
  onReady: () => void,
): (() => void) => {
  if (!hasLegacyAuthSupabaseEnv()) return () => undefined;

  let active = true;
  let cleanup = () => undefined;

  void loadLegacyAuthSupabaseAdapter()
    .then((legacyAuth) => {
      if (!active || !legacyAuth.isLegacyAuthSupabaseConfigured()) return;
      cleanup = legacyAuth.observePrototypePasswordRecovery(() => {
        if (active) onReady();
      });
    })
    .catch(() => undefined);

  return () => {
    active = false;
    cleanup();
  };
};

export const updateRecoveredPassword = async (
  password: string,
): Promise<AuthRuntimeResult> => {
  if (!hasLegacyAuthSupabaseEnv()) {
    return localError(
      "recovery_unavailable",
      "Password recovery requires a valid recovery session.",
    );
  }

  const legacyAuth = await loadLegacyAuthSupabaseAdapter();
  if (!legacyAuth.isLegacyAuthSupabaseConfigured()) {
    return localError(
      "recovery_unavailable",
      "Password recovery requires a valid recovery session.",
    );
  }

  return legacyAuth.updatePrototypeRecoveredPassword(password);
};
