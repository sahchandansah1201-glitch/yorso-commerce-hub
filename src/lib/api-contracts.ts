/**
 * YORSO Registration & Auth API Contracts (v1)
 *
 * Frontend integration contract for the 9 registration / auth operations.
 * No real network calls — every function returns mock data with realistic
 * latency and error triggers so the UI can be exercised end-to-end.
 *
 * Replace each `authApi.*` body with a real fetch when the backend is ready.
 * Endpoints, payloads and error codes are stable — UI does not need to change.
 *
 * Mock triggers (deterministic, documented in
 * .lovable/backend-contract-registration.md):
 *
 *   email = "taken@yorso.test"   → EMAIL_ALREADY_EXISTS
 *   email = "blocked@yorso.test" → SERVER_ERROR
 *   email-verify code = "123456" → success
 *   email-verify code = anything else → INVALID_CODE
 *   phone-verify code = "0000"   → INVALID_CODE
 *   phone-verify code = anything else (≥4 digits) → success
 *   >5 phone code requests in one session → RATE_LIMITED
 *   missing/unknown sessionId in any post-start step → VERIFICATION_FAILED
 *   signIn email = "locked@yorso.test" → ACCOUNT_LOCKED
 *   signIn email = "missing@yorso.test" → ACCOUNT_NOT_FOUND
 *   signIn password ≠ "Password1" → INVALID_CREDENTIALS
 *
 * Env flags:
 *   VITE_MOCK_FLAKY=1       → 5% random SERVER_ERROR on every call
 *   VITE_MOCK_LATENCY_MS=ms → override default delays (default per-op)
 */

// ─── Shared types ────────────────────────────────────────────────────────────

export type ApiState =
  | "idle"
  | "loading"
  | "success"
  | "validation_error"
  | "server_error"
  | "verification_pending"
  | "verification_failed";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  code: string;
  message: string;
  field?: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

/** Type guard — narrows ApiResult to ApiError when result.ok is false. */
export function isApiError<T>(result: ApiResult<T>): result is ApiError {
  return result.ok === false;
}

// ─── Error codes ─────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  // Validation
  INVALID_EMAIL: "INVALID_EMAIL",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  INVALID_PHONE: "INVALID_PHONE",
  INVALID_VAT: "INVALID_VAT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Verification
  INVALID_CODE: "INVALID_CODE",
  CODE_EXPIRED: "CODE_EXPIRED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",

  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",

  // System
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.INVALID_EMAIL]: "Please enter a valid email address.",
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: "An account with this email already exists. Try signing in instead.",
  [ERROR_CODES.WEAK_PASSWORD]: "Password must be at least 8 characters with a mix of letters and numbers.",
  [ERROR_CODES.INVALID_PHONE]: "Please enter a valid phone number with country code.",
  [ERROR_CODES.INVALID_VAT]: "The VAT/TIN number format is not recognized. Please double-check.",
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: "Please fill in all required fields.",
  [ERROR_CODES.INVALID_CODE]: "The verification code is incorrect. Please check and try again.",
  [ERROR_CODES.CODE_EXPIRED]: "This code has expired. Please request a new one.",
  [ERROR_CODES.TOO_MANY_ATTEMPTS]: "Too many attempts. Please wait a few minutes before trying again.",
  [ERROR_CODES.VERIFICATION_FAILED]: "Your session expired. Please start registration again.",
  [ERROR_CODES.INVALID_CREDENTIALS]: "Email or password is incorrect. Please try again.",
  [ERROR_CODES.ACCOUNT_LOCKED]: "Your account has been temporarily locked. Please try again later or contact support.",
  [ERROR_CODES.ACCOUNT_NOT_FOUND]: "No account found with these credentials.",
  [ERROR_CODES.SERVER_ERROR]: "Something went wrong on our end. Please try again in a moment.",
  [ERROR_CODES.NETWORK_ERROR]: "Unable to connect. Please check your internet connection.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again shortly.",
  [ERROR_CODES.RATE_LIMITED]: "You're requesting codes too quickly. Please wait before trying again.",
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || "An unexpected error occurred. Please try again.";
}

const err = (code: ErrorCode, field?: string): ApiError => ({
  ok: false,
  code,
  message: getErrorMessage(code),
  ...(field ? { field } : {}),
});

// ─── Mock infrastructure ─────────────────────────────────────────────────────

const DEFAULT_LATENCY: Record<string, number> = {
  startRegistration: 700,
  verifyEmail: 500,
  submitDetails: 800,
  requestPhoneVerification: 900,
  verifyPhone: 600,
  submitOnboarding: 400,
  submitMarkets: 400,
  completeRegistration: 900,
  signIn: 700,
  requestPasswordReset: 700,
};

function delay(op: keyof typeof DEFAULT_LATENCY): Promise<void> {
  const override = Number(import.meta.env.VITE_MOCK_LATENCY_MS);
  const ms = Number.isFinite(override) && override >= 0 ? override : DEFAULT_LATENCY[op];
  return new Promise((r) => setTimeout(r, ms));
}

function maybeFlake(): ApiError | null {
  if (import.meta.env.VITE_MOCK_FLAKY === "1" && Math.random() < 0.05) {
    return err(ERROR_CODES.SERVER_ERROR);
  }
  return null;
}

// In-memory session registry — persisted in sessionStorage so a refresh keeps it alive.
const SESSION_REGISTRY_KEY = "yorso_mock_sessions";
interface MockSession {
  email: string;
  role: "buyer" | "supplier";
  emailVerified: boolean;
  phoneCodeRequests: number;
  createdAt: number;
}

function loadSessions(): Record<string, MockSession> {
  try {
    const raw = sessionStorage.getItem(SESSION_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveSessions(s: Record<string, MockSession>): void {
  try {
    sessionStorage.setItem(SESSION_REGISTRY_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
function getSession(id: string): MockSession | null {
  return loadSessions()[id] ?? null;
}
function upsertSession(id: string, patch: Partial<MockSession>): void {
  const all = loadSessions();
  all[id] = { ...all[id], ...patch } as MockSession;
  saveSessions(all);
}
function requireSession(sessionId: string): ApiError | null {
  if (!sessionId || !getSession(sessionId)) return err(ERROR_CODES.VERIFICATION_FAILED);
  return null;
}

// ─── Contract definitions ────────────────────────────────────────────────────

/** 1. POST /api/auth/register/start */
export interface StartRegistrationPayload {
  email: string;
  role: "buyer" | "supplier";
}
export interface StartRegistrationResponse {
  sessionId: string;
  emailSent: boolean;
}

/** 2. POST /api/auth/register/verify-email */
export interface VerifyEmailPayload {
  sessionId: string;
  code: string;
}
export interface VerifyEmailResponse {
  verified: boolean;
}

/** 3. POST /api/auth/register/details */
export interface SubmitDetailsPayload {
  sessionId: string;
  fullName: string;
  company: string;
  country: string;
  vatTin: string;
  password: string;
}
export interface SubmitDetailsResponse {
  profileCreated: boolean;
}

/** 4. POST /api/auth/register/phone/send */
export interface RequestPhoneVerificationPayload {
  sessionId: string;
  phone: string;
  method: "sms" | "whatsapp";
}
export interface RequestPhoneVerificationResponse {
  sent: boolean;
  expiresInSeconds: number;
}

/** 5. POST /api/auth/register/phone/verify */
export interface VerifyPhonePayload {
  sessionId: string;
  phone: string;
  code: string;
}
export interface VerifyPhoneResponse {
  verified: boolean;
}

/** 6. POST /api/auth/register/onboarding */
export interface SubmitOnboardingPayload {
  sessionId: string;
  categories: string[];
  volume: string;
  certifications: string[];
}
export interface SubmitOnboardingResponse {
  saved: boolean;
}

/** 7. POST /api/auth/register/markets */
export interface SubmitMarketsPayload {
  sessionId: string;
  countries: string[];
}
export interface SubmitMarketsResponse {
  saved: boolean;
}

/** 8. POST /api/auth/register/complete */
export interface CompleteRegistrationPayload {
  sessionId: string;
}
export interface CompleteRegistrationResponse {
  userId: string;
  token: string;
  profile: {
    fullName: string;
    company: string;
    role: "buyer" | "supplier";
    country: string;
  };
}

/** 9a. POST /api/auth/signin */
export interface SignInPayload {
  method: "email" | "phone";
  identifier: string;
  password: string;
}
export interface SignInResponse {
  token: string;
  userId: string;
  profile: {
    fullName: string;
    company: string;
    role: "buyer" | "supplier";
  };
}

/** 9b. POST /api/auth/password/reset */
export interface PasswordResetPayload {
  email: string;
}
export interface PasswordResetResponse {
  sent: boolean;
}

// ─── Mock service layer ──────────────────────────────────────────────────────

export const authApi = {
  /** 1. Start registration — creates a session and "sends" the email OTP. */
  async startRegistration(payload: StartRegistrationPayload): Promise<ApiResult<StartRegistrationResponse>> {
    await delay("startRegistration");
    const flake = maybeFlake();
    if (flake) return flake;

    const email = payload.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(ERROR_CODES.INVALID_EMAIL, "email");
    if (email === "taken@yorso.test") return err(ERROR_CODES.EMAIL_ALREADY_EXISTS, "email");
    if (email === "blocked@yorso.test") return err(ERROR_CODES.SERVER_ERROR);

    const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    upsertSession(sessionId, {
      email,
      role: payload.role,
      emailVerified: false,
      phoneCodeRequests: 0,
      createdAt: Date.now(),
    });
    return { ok: true, data: { sessionId, emailSent: true } };
  },

  /** 2. Verify the email OTP. Code "123456" is the only one accepted. */
  async verifyEmail(payload: VerifyEmailPayload): Promise<ApiResult<VerifyEmailResponse>> {
    await delay("verifyEmail");
    const flake = maybeFlake();
    if (flake) return flake;

    const sessErr = requireSession(payload.sessionId);
    if (sessErr) return sessErr;

    if (payload.code !== "123456") return err(ERROR_CODES.INVALID_CODE);

    upsertSession(payload.sessionId, { emailVerified: true });
    return { ok: true, data: { verified: true } };
  },

  /** 3. Submit account details (name, company, country, VAT, password). */
  async submitDetails(payload: SubmitDetailsPayload): Promise<ApiResult<SubmitDetailsResponse>> {
    await delay("submitDetails");
    const flake = maybeFlake();
    if (flake) return flake;

    const sessErr = requireSession(payload.sessionId);
    if (sessErr) return sessErr;

    if (!payload.fullName?.trim()) return err(ERROR_CODES.MISSING_REQUIRED_FIELD, "fullName");
    if (!payload.company?.trim()) return err(ERROR_CODES.MISSING_REQUIRED_FIELD, "company");
    if (!payload.country?.trim()) return err(ERROR_CODES.MISSING_REQUIRED_FIELD, "country");
    if (!payload.vatTin?.trim() || payload.vatTin.trim().length < 3) return err(ERROR_CODES.INVALID_VAT, "vatTin");
    if (!payload.password || payload.password.length < 8) return err(ERROR_CODES.WEAK_PASSWORD, "password");

    return { ok: true, data: { profileCreated: true } };
  },

  /** 4. Request a phone verification code (SMS or WhatsApp). Rate-limited to 5/session. */
  async requestPhoneVerification(
    payload: RequestPhoneVerificationPayload,
  ): Promise<ApiResult<RequestPhoneVerificationResponse>> {
    await delay("requestPhoneVerification");
    const flake = maybeFlake();
    if (flake) return flake;

    const sessErr = requireSession(payload.sessionId);
    if (sessErr) return sessErr;

    const digits = payload.phone.replace(/\D/g, "");
    if (digits.length < 5) return err(ERROR_CODES.INVALID_PHONE, "phone");

    const session = getSession(payload.sessionId)!;
    if (session.phoneCodeRequests >= 5) return err(ERROR_CODES.RATE_LIMITED);
    upsertSession(payload.sessionId, { phoneCodeRequests: session.phoneCodeRequests + 1 });

    return { ok: true, data: { sent: true, expiresInSeconds: 300 } };
  },

  /** 5. Verify the phone OTP. Code "0000" is rejected; anything else (≥4 digits) accepted. */
  async verifyPhone(payload: VerifyPhonePayload): Promise<ApiResult<VerifyPhoneResponse>> {
    await delay("verifyPhone");
    const flake = maybeFlake();
    if (flake) return flake;

    const sessErr = requireSession(payload.sessionId);
    if (sessErr) return sessErr;

    if (payload.code === "0000") return err(ERROR_CODES.INVALID_CODE);
    if (payload.code.length < 4) return err(ERROR_CODES.INVALID_CODE);

    return { ok: true, data: { verified: true } };
  },

  /** 6. Save onboarding (categories, volume, certifications). */
  async submitOnboarding(payload: SubmitOnboardingPayload): Promise<ApiResult<SubmitOnboardingResponse>> {
    await delay("submitOnboarding");
    const flake = maybeFlake();
    if (flake) return flake;

    const sessErr = requireSession(payload.sessionId);
    if (sessErr) return sessErr;

    return { ok: true, data: { saved: true } };
  },

  /** 7. Save target markets / countries. */
  async submitMarkets(payload: SubmitMarketsPayload): Promise<ApiResult<SubmitMarketsResponse>> {
    await delay("submitMarkets");
    const flake = maybeFlake();
    if (flake) return flake;

    const sessErr = requireSession(payload.sessionId);
    if (sessErr) return sessErr;

    return { ok: true, data: { saved: true } };
  },

  /** 8. Finalize registration — issues userId+token, returns profile. */
  async completeRegistration(
    payload: CompleteRegistrationPayload,
  ): Promise<ApiResult<CompleteRegistrationResponse>> {
    await delay("completeRegistration");
    const flake = maybeFlake();
    if (flake) return flake;

    const session = getSession(payload.sessionId);
    if (!session) return err(ERROR_CODES.VERIFICATION_FAILED);

    return {
      ok: true,
      data: {
        userId: `user_${Date.now().toString(36)}`,
        token: `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
        profile: { fullName: "", company: "", role: session.role, country: "" },
      },
    };
  },

  /** 9a. Sign in with email or phone + password. Password must be "Password1". */
  async signIn(payload: SignInPayload): Promise<ApiResult<SignInResponse>> {
    await delay("signIn");
    const flake = maybeFlake();
    if (flake) return flake;

    if (!payload.identifier?.trim() || !payload.password) {
      return err(ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const id = payload.identifier.trim().toLowerCase();
    if (id === "locked@yorso.test") return err(ERROR_CODES.ACCOUNT_LOCKED);
    if (id === "missing@yorso.test") return err(ERROR_CODES.ACCOUNT_NOT_FOUND);
    if (payload.password !== "Password1") return err(ERROR_CODES.INVALID_CREDENTIALS, "password");

    return {
      ok: true,
      data: {
        token: `tok_${Date.now().toString(36)}`,
        userId: `user_${Date.now().toString(36)}`,
        profile: { fullName: "", company: "", role: "buyer" },
      },
    };
  },

  /** 9b. Request a password reset email. */
  async requestPasswordReset(payload: PasswordResetPayload): Promise<ApiResult<PasswordResetResponse>> {
    await delay("requestPasswordReset");
    const flake = maybeFlake();
    if (flake) return flake;

    const email = payload.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(ERROR_CODES.INVALID_EMAIL, "email");
    return { ok: true, data: { sent: true } };
  },
};
