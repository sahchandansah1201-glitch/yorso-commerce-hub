import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { authApi, getErrorMessage, isApiError } from "@/lib/api-contracts";

type AuthRuntimeSource = "supabase_prototype" | "local_contract";

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

const supabaseError = (code: string, message: string): AuthRuntimeResult => ({
  ok: false,
  code,
  message,
  source: "supabase_prototype",
});

export const signInWithEmail = async (input: {
  email: string;
  password: string;
}): Promise<AuthRuntimeResult> => {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) return supabaseError("invalid_credentials", error.message);
    return { ok: true, source: "supabase_prototype" };
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
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: input.redirectTo,
    });
    if (error) return supabaseError("reset_failed", error.message);
    return { ok: true, source: "supabase_prototype" };
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
  if (!isSupabaseConfigured) return () => undefined;

  let active = true;
  const { data: sub } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY" && active) onReady();
  });

  void supabase.auth
    .getSession()
    .then(({ data }) => {
      if (active && data.session) onReady();
    })
    .catch(() => undefined);

  return () => {
    active = false;
    sub.subscription.unsubscribe();
  };
};

export const updateRecoveredPassword = async (
  password: string,
): Promise<AuthRuntimeResult> => {
  if (!isSupabaseConfigured) {
    return localError(
      "recovery_unavailable",
      "Password recovery requires a valid recovery session.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return supabaseError("reset_failed", error.message);

  await supabase.auth.signOut();
  return { ok: true, source: "supabase_prototype" };
};
