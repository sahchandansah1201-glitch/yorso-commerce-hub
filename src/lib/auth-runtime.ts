import { authApi, getErrorMessage, isApiError } from "@/lib/api-contracts";
import { buyerSession } from "@/lib/buyer-session";

export type AuthRuntimeSource = "self_hosted" | "supabase_prototype" | "local_contract";

export interface AuthRuntimeSession {
  displayName: string;
  email: string;
  expiresAt: string;
  id: string;
  issuedAt: string;
  userId: string;
}

export type AuthRuntimeResult =
  | {
      ok: true;
      session?: AuthRuntimeSession;
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

const isAuthRuntimeErrorLike = (value: unknown): value is AuthRuntimeError =>
  Boolean(
    value &&
      typeof value === "object" &&
      (value as { ok?: unknown }).ok === false &&
      typeof (value as { code?: unknown }).code === "string" &&
      typeof (value as { message?: unknown }).message === "string" &&
      typeof (value as { source?: unknown }).source === "string",
  );

const localError = (code: string, message: string): AuthRuntimeResult => ({
  ok: false,
  code,
  message,
  source: "local_contract",
});

const selfHostedError = (code: string, message: string): AuthRuntimeResult => ({
  ok: false,
  code,
  message,
  source: "self_hosted",
});

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const getSelfHostedAuthBaseUrl = () =>
  normalizeBaseUrl(import.meta.env.VITE_YORSO_API_URL as string | undefined);

export const isSelfHostedAuthConfigured = () => Boolean(getSelfHostedAuthBaseUrl());

const hasLegacyAuthSupabaseEnv = (): boolean =>
  Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

const loadLegacyAuthSupabaseAdapter = async () =>
  import("@/lib/legacy-auth-supabase-adapter");

interface SelfHostedAuthSessionResponse {
  ok: true;
  requestId: string;
  session: AuthRuntimeSession;
}

interface SelfHostedPasswordResetResponse {
  ok: true;
  requestId: string;
  sent?: true;
  passwordUpdated?: true;
}

interface SelfHostedAuthErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
  ok: false;
  requestId?: string;
}

const requestSelfHostedAuth = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const baseUrl = getSelfHostedAuthBaseUrl();
  if (!baseUrl) throw new Error("self_hosted_auth_disabled");
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
  const body = (await response.json().catch(() => ({}))) as T & SelfHostedAuthErrorResponse;
  if (!response.ok) {
    const code = body.error?.code ?? `auth_http_${response.status}`;
    const message = body.error?.message ?? getErrorMessage(code);
    throw selfHostedError(code, message);
  }
  return body;
};

const signInWithSelfHostedEmail = async (input: {
  email: string;
  password: string;
}): Promise<AuthRuntimeResult> => {
  try {
    const response = await requestSelfHostedAuth<SelfHostedAuthSessionResponse>(
      "/v1/auth/sign-in",
      {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          password: input.password,
        }),
      },
    );
    return {
      ok: true,
      session: response.session,
      source: "self_hosted",
    };
  } catch (error) {
    if (isAuthRuntimeErrorLike(error)) {
      return error;
    }
    return selfHostedError("NETWORK_ERROR", getErrorMessage("NETWORK_ERROR"));
  }
};

export const signInWithEmail = async (input: {
  email: string;
  password: string;
}): Promise<AuthRuntimeResult> => {
  if (isSelfHostedAuthConfigured()) {
    return signInWithSelfHostedEmail(input);
  }

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
  if (isSelfHostedAuthConfigured()) {
    try {
      await requestSelfHostedAuth<SelfHostedPasswordResetResponse>(
        "/v1/auth/password-reset/request",
        {
          method: "POST",
          body: JSON.stringify({
            email: input.email,
            redirectTo: input.redirectTo,
          }),
        },
      );
      return { ok: true, source: "self_hosted" };
    } catch (error) {
      if (isAuthRuntimeErrorLike(error)) {
        return error;
      }
      return selfHostedError("NETWORK_ERROR", getErrorMessage("NETWORK_ERROR"));
    }
  }

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
  if (isSelfHostedAuthConfigured()) {
    if (readSelfHostedRecoveryToken()) onReady();
    return () => undefined;
  }

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
  if (isSelfHostedAuthConfigured()) {
    const token = readSelfHostedRecoveryToken();
    if (!token) {
      return selfHostedError(
        "recovery_unavailable",
        "Password recovery requires a valid recovery session.",
      );
    }
    try {
      await requestSelfHostedAuth<SelfHostedPasswordResetResponse>(
        "/v1/auth/password-reset/complete",
        {
          method: "POST",
          body: JSON.stringify({
            token,
            password,
          }),
        },
      );
      return { ok: true, source: "self_hosted" };
    } catch (error) {
      if (isAuthRuntimeErrorLike(error)) {
        return error;
      }
      return selfHostedError("NETWORK_ERROR", getErrorMessage("NETWORK_ERROR"));
    }
  }

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

function readSelfHostedRecoveryToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromSearch = new URLSearchParams(window.location.search).get("token");
  if (fromSearch?.trim()) return fromSearch.trim();
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const fromHash = new URLSearchParams(hash).get("token");
  return fromHash?.trim() || null;
}

export const readCurrentAuthSession = async (): Promise<AuthRuntimeResult> => {
  if (!isSelfHostedAuthConfigured()) {
    return localError("self_hosted_auth_disabled", "Self-hosted auth is not configured.");
  }

  const sessionId = buyerSession.getSession()?.id;
  if (!sessionId) {
    return selfHostedError("auth_session_required", "Auth session id is required.");
  }

  try {
    const response = await requestSelfHostedAuth<SelfHostedAuthSessionResponse>(
      "/v1/auth/session",
      {
        headers: {
          "x-yorso-session-id": sessionId,
        },
      },
    );
    return {
      ok: true,
      session: response.session,
      source: "self_hosted",
    };
  } catch (error) {
    if (isAuthRuntimeErrorLike(error)) {
      return error;
    }
    return selfHostedError("NETWORK_ERROR", getErrorMessage("NETWORK_ERROR"));
  }
};

export const signOutCurrentAuthSession = async (): Promise<AuthRuntimeResult> => {
  if (!isSelfHostedAuthConfigured()) {
    buyerSession.signOut();
    return { ok: true, source: "local_contract" };
  }

  const sessionId = buyerSession.getSession()?.id;
  if (!sessionId) {
    buyerSession.signOut();
    return { ok: true, source: "self_hosted" };
  }

  buyerSession.signOut();
  try {
    await requestSelfHostedAuth<{ ok: true; requestId: string; signedOut: boolean }>(
      "/v1/auth/sign-out",
      {
        method: "POST",
        headers: {
          "x-yorso-session-id": sessionId,
        },
      },
    );
  } catch {
    // Local session is still cleared so the browser does not keep stale access.
  }
  return { ok: true, source: "self_hosted" };
};
