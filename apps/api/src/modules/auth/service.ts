import { createHash, timingSafeEqual } from "node:crypto";
import {
  authSessionResponseSchema,
  authSignInSchema,
  authSignOutResponseSchema,
  type AuthSession,
  type AuthSessionResponse,
  type AuthSignOutResponse,
} from "../../../../../packages/contracts/dist/index.js";
import { SecurityEventAuthRateLimiter, type AuthRateLimitDecision, type AuthRateLimiter } from "./rate-limit.js";
import type { AuthRepository, AuthUser } from "./repository.js";
import {
  DisabledAuthSessionCache,
  type AuthSessionCache,
  type AuthSessionCacheRead,
  type AuthSessionCacheWrite,
} from "./session-cache.js";

const authSessionTtlMs = 7 * 24 * 60 * 60 * 1000;

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
      | "auth_session_cache_unavailable",
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly rateLimiter: AuthRateLimiter = new SecurityEventAuthRateLimiter(repository, {
      driver: "audit_log",
      failMode: "open",
      maxFailedAttempts: 5,
      windowMs: 15 * 60 * 1000,
      keyPrefix: "yorso:auth",
      redisUrl: "redis://localhost:6379",
    }),
    private readonly sessionCache: AuthSessionCache = new DisabledAuthSessionCache(),
  ) {}

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
    return authSessionResponseSchema.parse({
      ok: true,
      session,
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
    return authSignOutResponseSchema.parse({
      ok: true,
      signedOut,
      requestId,
    });
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

  private async throwIfRateLimited(
    decision: AuthRateLimitDecision,
    email: string,
    requestId: string,
    metadata: AuthRequestMetadata,
  ) {
    if (!decision.limited) return;

    await this.repository.recordSecurityEvent({
      eventType: "sign_in_rate_limited",
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
    throw new AuthServiceError(
      "auth_rate_limited",
      "Too many sign-in attempts. Try again later.",
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
    throw new AuthServiceError(
      "auth_session_cache_unavailable",
      "Auth session cache is unavailable.",
    );
  }
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

function verifyPasswordSecret(password: string, user: AuthUser): boolean {
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

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.byteLength !== rightBuffer.byteLength) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
