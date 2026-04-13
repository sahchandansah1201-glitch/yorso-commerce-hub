/**
 * YORSO Registration & Auth API Contracts
 *
 * This module defines the frontend integration contract for all registration
 * and authentication flows. It centralizes expected request/response shapes,
 * state transitions, and error semantics so backend engineers can implement
 * matching endpoints without reworking the frontend.
 *
 * IMPORTANT: No real network calls are made. All functions return mock data.
 * Replace implementations with real fetch/axios calls when backend is ready.
 */

// ─── Shared Types ────────────────────────────────────────────────

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
  field?: string; // for validation errors tied to a specific field
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ─── Error Codes ─────────────────────────────────────────────────

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

// ─── User-Friendly Error Messages ────────────────────────────────

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
  [ERROR_CODES.VERIFICATION_FAILED]: "Verification could not be completed. Please try again or contact support.",
  [ERROR_CODES.INVALID_CREDENTIALS]: "Email or password is incorrect. Please try again.",
  [ERROR_CODES.ACCOUNT_LOCKED]: "Your account has been temporarily locked. Please try again later or contact support.",
  [ERROR_CODES.ACCOUNT_NOT_FOUND]: "No account found with these credentials.",
  [ERROR_CODES.SERVER_ERROR]: "Something went wrong on our end. Please try again in a moment.",
  [ERROR_CODES.NETWORK_ERROR]: "Unable to connect. Please check your internet connection.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again shortly.",
  [ERROR_CODES.RATE_LIMITED]: "You're making requests too quickly. Please slow down.",
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || "An unexpected error occurred. Please try again.";
}

// ─── Contract Definitions ────────────────────────────────────────

/**
 * POST /api/auth/register/start
 *
 * Initiates registration. Validates email uniqueness.
 * Frontend state: idle → loading → success | validation_error
 */
export interface StartRegistrationPayload {
  email: string;
  role: "buyer" | "supplier";
}

export interface StartRegistrationResponse {
  sessionId: string;
  emailSent: boolean;
}

/**
 * POST /api/auth/register/verify-email
 *
 * Verifies the email OTP code.
 * Frontend state: verification_pending → loading → success | verification_failed
 */
export interface VerifyEmailPayload {
  sessionId: string;
  code: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
}

/**
 * POST /api/auth/register/details
 *
 * Submits account details (name, company, country, VAT, password).
 * Frontend state: idle → loading → success | validation_error
 */
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

/**
 * POST /api/auth/register/phone/send
 *
 * Requests a phone verification code via SMS or WhatsApp.
 * Frontend state: idle → loading → verification_pending | validation_error
 */
export interface RequestPhoneVerificationPayload {
  sessionId: string;
  phone: string;
  method: "sms" | "whatsapp";
}

export interface RequestPhoneVerificationResponse {
  sent: boolean;
  expiresInSeconds: number;
}

/**
 * POST /api/auth/register/phone/verify
 *
 * Verifies the phone OTP code.
 * Frontend state: verification_pending → loading → success | verification_failed
 */
export interface VerifyPhonePayload {
  sessionId: string;
  phone: string;
  code: string;
}

export interface VerifyPhoneResponse {
  verified: boolean;
}

/**
 * POST /api/auth/register/onboarding
 *
 * Saves onboarding preferences (categories, volume, certifications).
 * Frontend state: idle → loading → success | server_error
 */
export interface SubmitOnboardingPayload {
  sessionId: string;
  categories: string[];
  volume: string;
  certifications: string[];
}

export interface SubmitOnboardingResponse {
  saved: boolean;
}

/**
 * POST /api/auth/register/markets
 *
 * Saves selected target markets/countries.
 * Frontend state: idle → loading → success | server_error
 */
export interface SubmitMarketsPayload {
  sessionId: string;
  countries: string[];
}

export interface SubmitMarketsResponse {
  saved: boolean;
}

/**
 * POST /api/auth/register/complete
 *
 * Finalizes registration. Creates the account.
 * Frontend state: idle → loading → success | server_error
 */
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

/**
 * POST /api/auth/signin
 *
 * Authenticates with email+password or phone+password.
 * Frontend state: idle → loading → success | validation_error
 */
export interface SignInPayload {
  method: "email" | "phone";
  identifier: string; // email or phone number
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

/**
 * POST /api/auth/password/reset
 *
 * Requests a password reset email.
 * Frontend state: idle → loading → success | validation_error
 */
export interface PasswordResetPayload {
  email: string;
}

export interface PasswordResetResponse {
  sent: boolean;
}

// ─── Mock Service Layer ──────────────────────────────────────────
// Replace these implementations with real API calls when backend is ready.

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const authApi = {
  async startRegistration(payload: StartRegistrationPayload): Promise<ApiResult<StartRegistrationResponse>> {
    await delay(800);
    if (!payload.email.includes("@")) {
      return { ok: false, code: ERROR_CODES.INVALID_EMAIL, message: getErrorMessage(ERROR_CODES.INVALID_EMAIL), field: "email" };
    }
    return { ok: true, data: { sessionId: `sess_${Date.now()}`, emailSent: true } };
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<ApiResult<VerifyEmailResponse>> {
    await delay(600);
    if (payload.code === "000000") {
      return { ok: false, code: ERROR_CODES.INVALID_CODE, message: getErrorMessage(ERROR_CODES.INVALID_CODE) };
    }
    return { ok: true, data: { verified: true } };
  },

  async submitDetails(payload: SubmitDetailsPayload): Promise<ApiResult<SubmitDetailsResponse>> {
    await delay(800);
    if (payload.password.length < 8) {
      return { ok: false, code: ERROR_CODES.WEAK_PASSWORD, message: getErrorMessage(ERROR_CODES.WEAK_PASSWORD), field: "password" };
    }
    return { ok: true, data: { profileCreated: true } };
  },

  async requestPhoneVerification(payload: RequestPhoneVerificationPayload): Promise<ApiResult<RequestPhoneVerificationResponse>> {
    await delay(1200);
    return { ok: true, data: { sent: true, expiresInSeconds: 300 } };
  },

  async verifyPhone(payload: VerifyPhonePayload): Promise<ApiResult<VerifyPhoneResponse>> {
    await delay(800);
    if (payload.code === "0000") {
      return { ok: false, code: ERROR_CODES.INVALID_CODE, message: getErrorMessage(ERROR_CODES.INVALID_CODE) };
    }
    return { ok: true, data: { verified: true } };
  },

  async submitOnboarding(payload: SubmitOnboardingPayload): Promise<ApiResult<SubmitOnboardingResponse>> {
    await delay(500);
    return { ok: true, data: { saved: true } };
  },

  async submitMarkets(payload: SubmitMarketsPayload): Promise<ApiResult<SubmitMarketsResponse>> {
    await delay(500);
    return { ok: true, data: { saved: true } };
  },

  async completeRegistration(payload: CompleteRegistrationPayload): Promise<ApiResult<CompleteRegistrationResponse>> {
    await delay(1000);
    return {
      ok: true,
      data: {
        userId: `user_${Date.now()}`,
        token: `tok_${Date.now()}`,
        profile: { fullName: "", company: "", role: "buyer", country: "" },
      },
    };
  },

  async signIn(payload: SignInPayload): Promise<ApiResult<SignInResponse>> {
    await delay(800);
    if (!payload.identifier || !payload.password) {
      return { ok: false, code: ERROR_CODES.MISSING_REQUIRED_FIELD, message: getErrorMessage(ERROR_CODES.MISSING_REQUIRED_FIELD) };
    }
    return {
      ok: true,
      data: {
        token: `tok_${Date.now()}`,
        userId: `user_${Date.now()}`,
        profile: { fullName: "", company: "", role: "buyer" },
      },
    };
  },

  async requestPasswordReset(payload: PasswordResetPayload): Promise<ApiResult<PasswordResetResponse>> {
    await delay(800);
    if (!payload.email.includes("@")) {
      return { ok: false, code: ERROR_CODES.INVALID_EMAIL, message: getErrorMessage(ERROR_CODES.INVALID_EMAIL), field: "email" };
    }
    return { ok: true, data: { sent: true } };
  },
};
