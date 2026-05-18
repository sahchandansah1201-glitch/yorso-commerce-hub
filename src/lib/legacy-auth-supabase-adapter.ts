/**
 * Legacy Supabase auth adapter.
 *
 * Supabase is not the production backend for YORSO. This adapter is kept only
 * for prototype/reference email sign-in and password recovery while the
 * self-hosted auth service is still being introduced. Production-facing pages
 * should call `auth-runtime.ts`, not this adapter directly.
 */

import {
  isSupabaseConfigured,
  supabase,
} from "@/integrations/supabase/client";
import type { AuthRuntimeResult } from "@/lib/auth-runtime";

const supabaseError = (code: string, message: string): AuthRuntimeResult => ({
  ok: false,
  code,
  message,
  source: "supabase_prototype",
});

export const isLegacyAuthSupabaseConfigured = (): boolean =>
  isSupabaseConfigured;

export const signInWithPrototypeSupabase = async (input: {
  email: string;
  password: string;
}): Promise<AuthRuntimeResult> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) return supabaseError("invalid_credentials", error.message);
  return { ok: true, source: "supabase_prototype" };
};

export const requestPrototypePasswordReset = async (input: {
  email: string;
  redirectTo: string;
}): Promise<AuthRuntimeResult> => {
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.redirectTo,
  });
  if (error) return supabaseError("reset_failed", error.message);
  return { ok: true, source: "supabase_prototype" };
};

export const observePrototypePasswordRecovery = (
  onReady: () => void,
): (() => void) => {
  if (!isLegacyAuthSupabaseConfigured()) return () => undefined;

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

export const updatePrototypeRecoveredPassword = async (
  password: string,
): Promise<AuthRuntimeResult> => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return supabaseError("reset_failed", error.message);

  await supabase.auth.signOut();
  return { ok: true, source: "supabase_prototype" };
};
