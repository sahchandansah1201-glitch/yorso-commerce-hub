import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  type AdminUserRole,
  authPasswordResetCompleteResponseSchema,
  authPasswordResetCompleteSchema,
  authPasswordResetRequestResponseSchema,
  authPasswordResetRequestSchema,
  authRegisterCompleteResponseSchema,
  authRegisterDetailsResponseSchema,
  authRegisterDetailsSchema,
  authRegisterMarketsResponseSchema,
  authRegisterMarketsSchema,
  authRegisterOnboardingResponseSchema,
  authRegisterOnboardingSchema,
  authRegisterPhoneRequestResponseSchema,
  authRegisterPhoneRequestSchema,
  authRegisterPhoneVerifyResponseSchema,
  authRegisterPhoneVerifySchema,
  authRegisterStartResponseSchema,
  authRegisterStartSchema,
  authRegisterVerifyEmailResponseSchema,
  authRegisterVerifyEmailSchema,
  authSessionResponseSchema,
  authSignInSchema,
  authSignOutResponseSchema,
  type AuthSession,
  type AuthSessionResponse,
  type AuthSignOutResponse,
} from "../../../../../packages/contracts/dist/index.js";
import { SecurityEventAuthRateLimiter, type AuthRateLimitDecision, type AuthRateLimiter } from "./rate-limit.js";
import type { AuthRepository, AuthSecurityEventInput, AuthUser, RegistrationDeliveryOutboxEntry } from "./repository.js";
import {
  DisabledAuthSessionCache,
  type AuthSessionCache,
  type AuthSessionCacheRead,
  type AuthSessionCacheWrite,
} from "./session-cache.js";
import {
  NoopAuthTelemetrySink,
  type AuthTelemetryEvent,
  type AuthTelemetrySink,
} from "./observability.js";
import { hashPasswordRecoveryToken, PasswordRecoveryTokenIssuer } from "./password-recovery.js";
import { RegistrationVerificationCodeIssuer } from "./verification-code.js";

const authSessionTtlMs = 7 * 24 * 60 * 60 * 1000;
const registrationDraftTtlMs = 24 * 60 * 60 * 1000;
const registrationVerificationTtlSeconds = 5 * 60;
const registrationVerificationMaxAttempts = 5;
const passwordRecoveryTtlSeconds = 30 * 60;

export interface AuthServiceVerificationOptions {
  generateCode?: () => string;
  maxAttempts?: number;
  now?: () => Date;
  ttlSeconds?: number;
}

export interface AuthServicePasswordRecoveryOptions {
  generateToken?: () => string;
  now?: () => Date;
  ttlSeconds?: number;
}

export interface AuthRequestMetadata {
  ip?: string | null;
  userAgent?: string | null;
}

export class AuthServiceError extends Error {
  constructor(
    public readonly code:
      | "auth_invalid_credentials"
      | "auth_rate_limited"
      | "auth_session_required"
      | "auth_session_invalid"
      | "auth_session_cache_unavailable"
      | "password_reset_token_invalid"
      | "password_reset_token_expired"
      | "registration_email_exists"
      | "registration_session_invalid"
      | "registration_invalid_code"
      | "registration_code_expired"
      | "registration_rate_limited"
      | "registration_email_not_verified"
      | "registration_phone_not_verified"
      | "registration_details_required",
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export class AuthService {
  private readonly verificationCodeIssuer: RegistrationVerificationCodeIssuer;
  private readonly verificationMaxAttempts: number;
  private readonly verificationNow: () => Date;
  private readonly verificationTtlSeconds: number;
  private readonly passwordRecoveryIssuer: PasswordRecoveryTokenIssuer;
  private readonly passwordRecoveryNow: () => Date;
  private readonly passwordRecoveryTtlSeconds: number;

  constructor(
    private readonly repository: AuthRepository,
    private readonly rateLimiter: AuthRateLimiter = new SecurityEventAuthRateLimiter(repository, {
      driver: "audit_log",
      failMode: "open",
      maxFailedAttempts: 5,
      passwordResetMaxRequests: 5,
      passwordResetWindowMs: 15 * 60 * 1000,
      windowMs: 15 * 60 * 1000,
      keyPrefix: "yorso:auth",
      redisUrl: "redis://localhost:6379",
    }),
    private readonly sessionCache: AuthSessionCache = new DisabledAuthSessionCache(),
    private readonly telemetry: AuthTelemetrySink = new NoopAuthTelemetrySink(),
    verification: AuthServiceVerificationOptions = {},
    passwordRecovery: AuthServicePasswordRecoveryOptions = {},
  ) {
    this.verificationTtlSeconds = verification.ttlSeconds ?? registrationVerificationTtlSeconds;
    this.verificationNow = verification.now ?? (() => new Date());
    this.verificationMaxAttempts = verification.maxAttempts ?? registrationVerificationMaxAttempts;
    this.verificationCodeIssuer = new RegistrationVerificationCodeIssuer({
      generateCode: verification.generateCode,
      now: this.verificationNow,
      ttlSeconds: this.verificationTtlSeconds,
    });
    this.passwordRecoveryTtlSeconds = passwordRecovery.ttlSeconds ?? passwordRecoveryTtlSeconds;
    this.passwordRecoveryNow = passwordRecovery.now ?? (() => new Date());
    this.passwordRecoveryIssuer = new PasswordRecoveryTokenIssuer({
      generateToken: passwordRecovery.generateToken,
      now: this.passwordRecoveryNow,
      ttlSeconds: this.passwordRecoveryTtlSeconds,
    });
  }

  async signIn(
    payload: unknown,
    requestId: string,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSessionResponse> {
    const parsed = authSignInSchema.parse(payload);
    const identity = { email: parsed.email, ip: metadata.ip };
    await this.throwIfRateLimited(
      await this.rateLimiter.checkSignIn(identity),
      parsed.email,
      requestId,
      metadata,
    );

    const user = await this.repository.findUserByEmail(parsed.email);

    if (!user || !verifyPasswordSecret(parsed.password, user)) {
      await this.repository.recordSecurityEvent({
        eventType: "sign_in_failed",
        userId: user?.id ?? null,
        email: parsed.email,
        requestId,
        metadata: securityMetadata(metadata),
      });
      await this.emitTelemetry({
        event: "auth.sign_in.failed",
        requestId,
        severity: "warn",
        outcome: "failure",
        reason: "invalid_credentials",
        userKnown: Boolean(user),
        ...requestPresence(metadata),
      });
      await this.throwIfRateLimited(
        await this.rateLimiter.recordFailedSignIn(identity),
        parsed.email,
        requestId,
        metadata,
      );
      throw new AuthServiceError("auth_invalid_credentials", "Invalid email or password.");
    }

    await this.rateLimiter.clearSignInFailures(identity);
    const session = await this.repository.createSession(user, authSessionTtlMs);
    await this.throwIfCacheUnavailable(
      await this.sessionCache.setSession(session),
      session.id,
      requestId,
      metadata,
      "session_cache_set",
    );
    await this.repository.recordSecurityEvent({
      eventType: "sign_in_succeeded",
      userId: user.id,
      email: parsed.email,
      sessionId: session.id,
      requestId,
      metadata: securityMetadata(metadata),
    });
    await this.emitTelemetry({
      event: "auth.sign_in.succeeded",
      requestId,
      severity: "info",
      outcome: "success",
      cacheSource: "session_cache",
      cacheStatus: "set",
      ...requestPresence(metadata),
    });
    return authSessionResponseSchema.parse({
      ok: true,
      session,
      requestId,
    });
  }

  async startRegistration(
    payload: unknown,
    requestId: string,
  ) {
    const parsed = authRegisterStartSchema.parse(payload);
    const existing = await this.repository.findUserByEmail(parsed.email);
    if (existing) {
      throw new AuthServiceError("registration_email_exists", "An account with this email already exists.");
    }

    const emailCode = this.verificationCodeIssuer.issue();
    const draft = await this.repository.startRegistrationDraft({
      ...parsed,
      delivery: {
        channel: "email",
        destinationHash: hashDeliveryDestination(parsed.email),
        destinationPreview: maskEmail(parsed.email),
        purpose: "email_verification",
        requestId,
        templateKey: "registration_email_verification",
        verificationCode: emailCode.code,
      },
      emailCodeExpiresAt: emailCode.expiresAt,
      emailCodeSecret: emailCode.secret,
      expiresAt: new Date(Date.now() + registrationDraftTtlMs),
    });

    return authRegisterStartResponseSchema.parse({
      ok: true,
      sessionId: draft.draft.id,
      emailSent: true,
      delivery: toRegistrationDeliveryResponse(draft.delivery),
      expiresInSeconds: this.verificationTtlSeconds,
      requestId,
    });
  }

  async requestPasswordReset(
    payload: unknown,
    requestId: string,
    metadata: AuthRequestMetadata = {},
  ) {
    const parsed = authPasswordResetRequestSchema.parse(payload);
    const identity = { email: parsed.email, ip: metadata.ip };
    await this.throwIfRateLimited(
      await this.rateLimiter.checkPasswordReset(identity),
      parsed.email,
      requestId,
      metadata,
      {
        event: "auth.password_reset.rate_limited",
        eventType: "password_reset_rate_limited",
        message: "Too many password reset requests. Try again later.",
        reason: "too_many_password_reset_requests",
      },
    );
    await this.rateLimiter.recordPasswordReset(identity);
    const user = await this.repository.findUserByEmail(parsed.email);
    if (user) {
      const token = this.passwordRecoveryIssuer.issue();
      await this.repository.createPasswordRecovery({
        delivery: {
          destinationHash: hashDeliveryDestination(parsed.email),
          destinationPreview: maskEmail(parsed.email),
          recoveryToken: token.token,
          requestId,
          templateKey: "password_recovery_email",
        },
        email: parsed.email,
        expiresAt: token.expiresAt,
        tokenLookupHash: token.tokenLookupHash,
        tokenSecret: token.secret,
        userId: user.id,
      });
      await this.repository.recordSecurityEvent({
        eventType: "password_reset_requested",
        userId: user.id,
        email: parsed.email,
        requestId,
        metadata: securityMetadata(metadata, {
          destinationPreview: maskEmail(parsed.email),
          redirectToPresent: Boolean(parsed.redirectTo),
        }),
      });
    } else {
      await this.repository.recordSecurityEvent({
        eventType: "password_reset_requested",
        userId: null,
        email: parsed.email,
        requestId,
        metadata: securityMetadata(metadata, {
          userKnown: false,
          redirectToPresent: Boolean(parsed.redirectTo),
        }),
      });
    }
    return authPasswordResetRequestResponseSchema.parse({
      ok: true,
      sent: true,
      expiresInSeconds: this.passwordRecoveryTtlSeconds,
      requestId,
    });
  }

  async completePasswordReset(
    payload: unknown,
    requestId: string,
    metadata: AuthRequestMetadata = {},
  ) {
    const parsed = authPasswordResetCompleteSchema.parse(payload);
    const recovery = await this.repository.findPasswordRecoveryByTokenHash(hashPasswordRecoveryToken(parsed.token));
    if (!recovery || recovery.usedAt || !verifyPasswordSecret(parsed.token, { passwordSecret: recovery.tokenSecret })) {
      await this.repository.recordSecurityEvent({
        eventType: "password_reset_invalid",
        requestId,
        metadata: securityMetadata(metadata, { reason: "invalid_or_used_token" }),
      });
      throw new AuthServiceError("password_reset_token_invalid", "Password reset token is invalid or already used.");
    }
    if (new Date(recovery.expiresAt).getTime() <= this.passwordRecoveryNow().getTime()) {
      await this.repository.recordSecurityEvent({
        eventType: "password_reset_invalid",
        userId: recovery.userId,
        email: recovery.email,
        requestId,
        metadata: securityMetadata(metadata, { reason: "expired_token" }),
      });
      throw new AuthServiceError("password_reset_token_expired", "Password reset token has expired.");
    }
    const updated = await this.repository.completePasswordRecovery(
      recovery.id,
      recovery.userId,
      createPasswordSecret(parsed.password),
    );
    if (!updated) {
      await this.repository.recordSecurityEvent({
        eventType: "password_reset_invalid",
        userId: recovery.userId,
        email: recovery.email,
        requestId,
        metadata: securityMetadata(metadata, { reason: "credential_update_failed" }),
      });
      throw new AuthServiceError("password_reset_token_invalid", "Password reset token is invalid or already used.");
    }
    const revokedSessionIds = await this.repository.deleteSessionsForUser(recovery.userId);
    for (const sessionId of revokedSessionIds) {
      await this.throwIfCacheUnavailable(
        await this.sessionCache.deleteSession(sessionId),
        sessionId,
        requestId,
        metadata,
        "session_cache_delete_after_password_reset",
      );
    }
    await this.repository.recordSecurityEvent({
      eventType: "password_reset_completed",
      userId: recovery.userId,
      email: recovery.email,
      requestId,
      metadata: securityMetadata(metadata),
    });
    return authPasswordResetCompleteResponseSchema.parse({
      ok: true,
      passwordUpdated: true,
      requestId,
    });
  }

  async verifyRegistrationEmail(payload: unknown, requestId: string) {
    const parsed = authRegisterVerifyEmailSchema.parse(payload);
    const draft = await this.requireRegistrationDraft(parsed.sessionId);
    this.throwIfVerificationBlocked(draft.emailCodeAttemptCount);
    this.throwIfVerificationExpired(draft.emailCodeExpiresAt);
    if (!verifyPasswordSecret(parsed.code, { passwordSecret: draft.emailCodeSecret })) {
      const updated = await this.repository.recordRegistrationEmailCodeAttempt(parsed.sessionId);
      if (updated.emailCodeAttemptCount >= this.verificationMaxAttempts) {
        throw new AuthServiceError("registration_rate_limited", "Too many verification attempts.", 60);
      }
      throw new AuthServiceError("registration_invalid_code", "The verification code is incorrect.");
    }
    await this.repository.markRegistrationEmailVerified(parsed.sessionId);
    return authRegisterVerifyEmailResponseSchema.parse({
      ok: true,
      verified: true,
      requestId,
    });
  }

  async submitRegistrationDetails(payload: unknown, requestId: string) {
    const parsed = authRegisterDetailsSchema.parse(payload);
    const draft = await this.requireRegistrationDraft(parsed.sessionId);
    if (!draft.emailVerifiedAt) {
      throw new AuthServiceError("registration_email_not_verified", "Email must be verified before account details are accepted.");
    }

    await this.repository.updateRegistrationDetails(parsed.sessionId, {
      ...parsed,
      countryCode: countryCodeForRegistration(parsed.country),
      passwordSecret: createPasswordSecret(parsed.password),
    });
    return authRegisterDetailsResponseSchema.parse({
      ok: true,
      profileCreated: true,
      requestId,
    });
  }

  async requestRegistrationPhoneVerification(payload: unknown, requestId: string) {
    const parsed = authRegisterPhoneRequestSchema.parse(payload);
    const draft = await this.requireRegistrationDraft(parsed.sessionId);
    if (draft.phoneCodeRequests >= 5) {
      throw new AuthServiceError("registration_rate_limited", "Too many verification code requests.", 60);
    }
    const phoneCode = this.verificationCodeIssuer.issue();
    const phoneDelivery = await this.repository.recordRegistrationPhoneRequest(parsed.sessionId, {
      ...parsed,
      delivery: {
        channel: parsed.method,
        destinationHash: hashDeliveryDestination(parsed.phone),
        destinationPreview: maskPhone(parsed.phone),
        purpose: "phone_verification",
        requestId,
        templateKey: parsed.method === "whatsapp" ? "registration_whatsapp_verification" : "registration_sms_verification",
        verificationCode: phoneCode.code,
      },
      phoneCodeExpiresAt: phoneCode.expiresAt,
      phoneCodeSecret: phoneCode.secret,
    });
    return authRegisterPhoneRequestResponseSchema.parse({
      ok: true,
      sent: true,
      delivery: toRegistrationDeliveryResponse(phoneDelivery.delivery),
      expiresInSeconds: this.verificationTtlSeconds,
      requestId,
    });
  }

  async verifyRegistrationPhone(payload: unknown, requestId: string) {
    const parsed = authRegisterPhoneVerifySchema.parse(payload);
    const draft = await this.requireRegistrationDraft(parsed.sessionId);
    if (!draft.phoneCodeSecret || draft.phone !== parsed.phone) {
      throw new AuthServiceError("registration_session_invalid", "Registration phone verification session is invalid.");
    }
    this.throwIfVerificationBlocked(draft.phoneCodeAttemptCount);
    this.throwIfVerificationExpired(draft.phoneCodeExpiresAt);
    if (!verifyPasswordSecret(parsed.code, { passwordSecret: draft.phoneCodeSecret })) {
      const updated = await this.repository.recordRegistrationPhoneCodeAttempt(parsed.sessionId);
      if (updated.phoneCodeAttemptCount >= this.verificationMaxAttempts) {
        throw new AuthServiceError("registration_rate_limited", "Too many verification attempts.", 60);
      }
      throw new AuthServiceError("registration_invalid_code", "The verification code is incorrect.");
    }
    await this.repository.markRegistrationPhoneVerified(parsed.sessionId, parsed.phone);
    return authRegisterPhoneVerifyResponseSchema.parse({
      ok: true,
      verified: true,
      requestId,
    });
  }

  async submitRegistrationOnboarding(payload: unknown, requestId: string) {
    const parsed = authRegisterOnboardingSchema.parse(payload);
    await this.requireRegistrationDraft(parsed.sessionId);
    await this.repository.updateRegistrationOnboarding(parsed.sessionId, parsed);
    return authRegisterOnboardingResponseSchema.parse({
      ok: true,
      saved: true,
      requestId,
    });
  }

  async submitRegistrationMarkets(payload: unknown, requestId: string) {
    const parsed = authRegisterMarketsSchema.parse(payload);
    await this.requireRegistrationDraft(parsed.sessionId);
    await this.repository.updateRegistrationMarkets(parsed.sessionId, parsed);
    return authRegisterMarketsResponseSchema.parse({
      ok: true,
      saved: true,
      requestId,
    });
  }

  async completeRegistration(payload: unknown, requestId: string) {
    const parsed = authRegisterVerifyEmailSchema.pick({ sessionId: true }).parse(payload);
    const result = await this.repository.completeRegistration(parsed.sessionId, authSessionTtlMs).catch((error) => {
      if (!(error instanceof Error)) throw error;
      if (error.message === "registration_session_invalid" || error.message === "registration_completion_precondition_failed") {
        throw new AuthServiceError("registration_session_invalid", "Registration session is invalid or expired.");
      }
      if (error.message === "registration_email_not_verified") {
        throw new AuthServiceError("registration_email_not_verified", "Email must be verified before registration can complete.");
      }
      if (error.message === "registration_phone_not_verified") {
        throw new AuthServiceError("registration_phone_not_verified", "Phone must be verified before registration can complete.");
      }
      if (error.message === "registration_details_required") {
        throw new AuthServiceError("registration_details_required", "Account details are required before registration can complete.");
      }
      throw error;
    });
    await this.throwIfCacheUnavailable(
      await this.sessionCache.setSession(result.session),
      result.session.id,
      requestId,
      {},
      "session_cache_set_after_registration",
    );
    return authRegisterCompleteResponseSchema.parse({
      ok: true,
      userId: result.userId,
      token: result.session.id,
      profile: result.profile,
      session: result.session,
      requestId,
    });
  }

  async getSession(
    sessionId: string | undefined,
    requestId: string,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSessionResponse> {
    const session = await this.requireSession(sessionId, requestId, metadata, "session_invalid");
    return authSessionResponseSchema.parse({
      ok: true,
      session,
      requestId,
    });
  }

  async signOut(
    sessionId: string | undefined,
    requestId: string,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthSignOutResponse> {
    const session = await this.requireSession(sessionId, requestId, metadata, "sign_out_invalid");
    const signedOut = await this.repository.deleteSession(session.id);
    await this.throwIfCacheUnavailable(
      await this.sessionCache.deleteSession(session.id),
      session.id,
      requestId,
      metadata,
      "session_cache_delete",
    );
    await this.repository.recordSecurityEvent({
      eventType: "sign_out_succeeded",
      userId: session.userId,
      email: session.email,
      sessionId: session.id,
      requestId,
      metadata: securityMetadata(metadata),
    });
    await this.emitTelemetry({
      event: "auth.sign_out.succeeded",
      requestId,
      severity: "info",
      outcome: "success",
      signedOut,
      ...requestPresence(metadata),
    });
    return authSignOutResponseSchema.parse({
      ok: true,
      signedOut,
      requestId,
    });
  }

  async hasRole(userId: string, role: AdminUserRole): Promise<boolean> {
    return this.repository.hasRole(userId, role);
  }

  private async requireSession(
    sessionId: string | undefined,
    requestId: string,
    metadata: AuthRequestMetadata,
    invalidEventType: "session_invalid" | "sign_out_invalid",
  ): Promise<AuthSession> {
    if (!sessionId?.trim()) {
      await this.repository.recordSecurityEvent({
        eventType: invalidEventType,
        sessionId: null,
        requestId,
        metadata: securityMetadata(metadata, { reason: "missing_session_id" }),
      });
      await this.emitTelemetry({
        event: invalidEventType === "sign_out_invalid" ? "auth.sign_out.invalid" : "auth.session.required",
        requestId,
        severity: "warn",
        outcome: "failure",
        reason: "missing_session_id",
        ...requestPresence(metadata),
      });
      throw new AuthServiceError("auth_session_required", "Auth session id is required.");
    }

    const trimmedSessionId = sessionId.trim();
    const cached = await this.sessionCache.getSession(trimmedSessionId);
    await this.throwIfCacheUnavailable(cached, trimmedSessionId, requestId, metadata, "session_cache_get");
    if (cached.status === "hit") return cached.session;

    const session = await this.repository.getSession(trimmedSessionId);
    if (!session) {
      await this.repository.recordSecurityEvent({
        eventType: invalidEventType,
        sessionId: trimmedSessionId,
        requestId,
        metadata: securityMetadata(metadata, { reason: "invalid_or_expired_session" }),
      });
      await this.emitTelemetry({
        event: invalidEventType === "sign_out_invalid" ? "auth.sign_out.invalid" : "auth.session.invalid",
        requestId,
        severity: "warn",
        outcome: "failure",
        reason: "invalid_or_expired_session",
        ...requestPresence(metadata),
      });
      throw new AuthServiceError("auth_session_invalid", "Auth session is invalid or expired.");
    }
    await this.throwIfCacheUnavailable(
      await this.sessionCache.setSession(session),
      session.id,
      requestId,
      metadata,
      "session_cache_set_after_miss",
    );
    return session;
  }

  private async requireRegistrationDraft(sessionId: string) {
    const draft = await this.repository.getRegistrationDraft(sessionId);
    if (!draft) {
      throw new AuthServiceError("registration_session_invalid", "Registration session is invalid or expired.");
    }
    return draft;
  }

  private throwIfVerificationBlocked(attemptCount: number) {
    if (attemptCount < this.verificationMaxAttempts) return;
    throw new AuthServiceError("registration_rate_limited", "Too many verification attempts.", 60);
  }

  private throwIfVerificationExpired(expiresAt: string | null) {
    if (expiresAt && new Date(expiresAt).getTime() > this.verificationNow().getTime()) return;
    throw new AuthServiceError("registration_code_expired", "This verification code has expired.");
  }

  private async throwIfRateLimited(
    decision: AuthRateLimitDecision,
    email: string,
    requestId: string,
    metadata: AuthRequestMetadata,
    options: {
      event?: string;
      eventType?: AuthSecurityEventInput["eventType"];
      message?: string;
      reason?: string;
    } = {},
  ) {
    if (!decision.limited) return;
    const eventType = options.eventType ?? "sign_in_rate_limited";
    const telemetryEvent = options.event ?? "auth.sign_in.rate_limited";
    const reason = decision.reason ?? options.reason ?? "too_many_failed_attempts";

    await this.repository.recordSecurityEvent({
      eventType,
      email,
      requestId,
      metadata: securityMetadata(metadata, {
        rateLimitSource: decision.source,
        rateLimitCount: decision.count,
        rateLimitLimit: decision.limit,
        retryAfterSeconds: decision.retryAfterSeconds,
        failureWindowMs: decision.windowMs,
        failMode: decision.failMode,
        degraded: decision.degraded,
        reason: decision.reason,
      }),
    });
    await this.emitTelemetry({
      event: telemetryEvent,
      requestId,
      severity: "warn",
      outcome: "blocked",
      reason,
      rateLimitSource: decision.source,
      rateLimitCount: decision.count,
      rateLimitLimit: decision.limit,
      retryAfterSeconds: decision.retryAfterSeconds,
      failMode: decision.failMode,
      degraded: decision.degraded,
      ...requestPresence(metadata),
    });
    throw new AuthServiceError(
      "auth_rate_limited",
      options.message ?? "Too many sign-in attempts. Try again later.",
      decision.retryAfterSeconds,
    );
  }

  private async throwIfCacheUnavailable(
    result: AuthSessionCacheRead | AuthSessionCacheWrite,
    sessionId: string,
    requestId: string,
    metadata: AuthRequestMetadata,
    operation: string,
  ) {
    if (result.status !== "unavailable" || result.failMode !== "closed") return;

    await this.repository.recordSecurityEvent({
      eventType: "session_invalid",
      sessionId,
      requestId,
      metadata: securityMetadata(metadata, {
        reason: "session_cache_unavailable",
        cacheSource: result.source,
        cacheOperation: operation,
        cacheReason: result.reason,
        failMode: result.failMode,
      }),
    });
    await this.emitTelemetry({
      event: "auth.session_cache.unavailable",
      requestId,
      severity: "error",
      outcome: "blocked",
      reason: result.reason,
      operation,
      cacheSource: result.source,
      cacheStatus: result.status,
      failMode: result.failMode,
      ...requestPresence(metadata),
    });
    throw new AuthServiceError(
      "auth_session_cache_unavailable",
      "Auth session cache is unavailable.",
    );
  }

  private async emitTelemetry(event: AuthTelemetryEvent) {
    try {
      await this.telemetry.emit(event);
    } catch (error) {
      console.error("auth_telemetry_emit_error", error);
    }
  }
}

function requestPresence(metadata: AuthRequestMetadata) {
  return {
    ipPresent: Boolean(metadata.ip),
    userAgentPresent: Boolean(metadata.userAgent),
  };
}

function securityMetadata(
  metadata: AuthRequestMetadata,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...extra,
    ip: metadata.ip ?? null,
    userAgent: metadata.userAgent ?? null,
  };
}

function createPasswordSecret(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `sha256:${salt}:${hash}`;
}

function toRegistrationDeliveryResponse(delivery: RegistrationDeliveryOutboxEntry) {
  return {
    id: delivery.id,
    purpose: delivery.purpose,
    channel: delivery.channel,
    status: delivery.status,
    destinationPreview: delivery.destinationPreview,
  };
}

function hashDeliveryDestination(destination: string): string {
  const normalized = destination.trim().toLowerCase();
  return `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}

function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const [local = "", domain = ""] = normalized.split("@");
  const visible = local.length > 0 ? local.slice(0, 1) : "*";
  return `${visible}***@${domain || "email"}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 2) return "**";
  return `***${digits.slice(-2)}`;
}

function verifyPasswordSecret(password: string, user: Pick<AuthUser, "passwordSecret">): boolean {
  const secret = user.passwordSecret;

  if (secret.startsWith("plain:")) {
    return safeEqual(password, secret.slice("plain:".length));
  }

  if (secret.startsWith("sha256:")) {
    const [, salt, expectedHash] = secret.split(":");
    if (!salt || !expectedHash) return false;
    const actualHash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
    return safeEqual(actualHash, expectedHash);
  }

  return false;
}

const countryCodeMap: Record<string, string> = {
  Argentina: "AR",
  Australia: "AU",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Croatia: "HR",
  "Czech Republic": "CZ",
  Denmark: "DK",
  Ecuador: "EC",
  Estonia: "EE",
  Finland: "FI",
  France: "FR",
  Germany: "DE",
  Greece: "GR",
  "Hong Kong": "HK",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Ireland: "IE",
  Italy: "IT",
  Japan: "JP",
  Kenya: "KE",
  Latvia: "LV",
  Lithuania: "LT",
  Mexico: "MX",
  Morocco: "MA",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nigeria: "NG",
  Norway: "NO",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Romania: "RO",
  Russia: "RU",
  Serbia: "RS",
  Singapore: "SG",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Taiwan: "TW",
  Thailand: "TH",
  Turkey: "TR",
  UAE: "AE",
  Ukraine: "UA",
  "United Kingdom": "GB",
  "United States": "US",
  Vietnam: "VN",
};

function countryCodeForRegistration(country: string): string {
  return countryCodeMap[country.trim()] ?? "ZZ";
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.byteLength !== rightBuffer.byteLength) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
