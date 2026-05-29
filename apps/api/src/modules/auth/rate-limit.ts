import { createHash } from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import type { ApiConfig } from "../../config.js";
import type { AuthRepository } from "./repository.js";

export interface AuthRateLimitConfig {
  driver: "audit_log" | "memory" | "redis";
  failMode: "open" | "closed";
  maxFailedAttempts: number;
  passwordResetMaxRequests: number;
  passwordResetWindowMs: number;
  windowMs: number;
  keyPrefix: string;
  redisUrl: string;
}

export interface SignInRateLimitIdentity {
  email: string;
  ip?: string | null;
}

export type PasswordResetRateLimitIdentity = SignInRateLimitIdentity;

export interface AuthRateLimitDecision {
  limited: boolean;
  source: AuthRateLimitConfig["driver"];
  count: number;
  limit: number;
  windowMs: number;
  retryAfterSeconds: number;
  failMode?: AuthRateLimitConfig["failMode"];
  degraded?: boolean;
  reason?: string;
}

export interface AuthRateLimiter {
  checkSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision>;
  recordFailedSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision>;
  clearSignInFailures(identity: SignInRateLimitIdentity): Promise<void>;
  checkPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision>;
  recordPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision>;
}

export function authRateLimitConfigFromApiConfig(config: ApiConfig): AuthRateLimitConfig {
  return {
    driver: config.authRateLimitDriver,
    failMode: config.authRateLimitFailMode,
    maxFailedAttempts: config.authSignInMaxFailedAttempts,
    passwordResetMaxRequests: config.authPasswordResetMaxRequests,
    passwordResetWindowMs: config.authPasswordResetWindowMs,
    windowMs: config.authSignInFailureWindowMs,
    keyPrefix: config.authRateLimitKeyPrefix,
    redisUrl: config.redisUrl,
  };
}

export function createAuthRateLimiter(
  config: ApiConfig,
  repository: Pick<AuthRepository, "countRecentSecurityEvents">,
): AuthRateLimiter {
  const rateLimitConfig = authRateLimitConfigFromApiConfig(config);
  if (rateLimitConfig.driver === "redis") {
    return new RedisAuthRateLimiter(rateLimitConfig);
  }
  if (rateLimitConfig.driver === "memory") {
    return new MemoryAuthRateLimiter(rateLimitConfig);
  }
  return new SecurityEventAuthRateLimiter(repository, rateLimitConfig);
}

export class SecurityEventAuthRateLimiter implements AuthRateLimiter {
  constructor(
    private readonly repository: Pick<AuthRepository, "countRecentSecurityEvents">,
    private readonly config: AuthRateLimitConfig,
  ) {}

  async checkSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const count = await this.repository.countRecentSecurityEvents({
      eventType: "sign_in_failed",
      email: identity.email,
      since: new Date(Date.now() - this.config.windowMs),
    });
    return this.decision(count, count >= this.config.maxFailedAttempts);
  }

  async recordFailedSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const count = await this.repository.countRecentSecurityEvents({
      eventType: "sign_in_failed",
      email: identity.email,
      since: new Date(Date.now() - this.config.windowMs),
    });
    return this.decision(count, count > this.config.maxFailedAttempts);
  }

  async clearSignInFailures(): Promise<void> {
    // Audit-log mode is intentionally append-only. Successful sign-in does not delete audit evidence.
  }

  async checkPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const count = await this.repository.countRecentSecurityEvents({
      eventType: "password_reset_requested",
      email: identity.email,
      since: new Date(Date.now() - this.config.passwordResetWindowMs),
    });
    return this.decision(count, count >= this.config.passwordResetMaxRequests, "password_reset");
  }

  async recordPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const count = await this.repository.countRecentSecurityEvents({
      eventType: "password_reset_requested",
      email: identity.email,
      since: new Date(Date.now() - this.config.passwordResetWindowMs),
    });
    return this.decision(count, count > this.config.passwordResetMaxRequests, "password_reset");
  }

  private decision(
    count: number,
    limited: boolean,
    scope: "sign_in" | "password_reset" = "sign_in",
  ): AuthRateLimitDecision {
    const isPasswordReset = scope === "password_reset";
    return {
      limited,
      source: "audit_log",
      count,
      limit: isPasswordReset ? this.config.passwordResetMaxRequests : this.config.maxFailedAttempts,
      windowMs: isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs,
      retryAfterSeconds: Math.ceil((isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs) / 1000),
    };
  }
}

export class MemoryAuthRateLimiter implements AuthRateLimiter {
  private readonly buckets = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly config: AuthRateLimitConfig) {}

  async checkSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const bucket = this.currentBucket(identity);
    return this.decision(bucket.count, bucket.count >= this.config.maxFailedAttempts);
  }

  async recordFailedSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const key = this.emailKey(identity.email);
    const now = Date.now();
    const bucket = this.bucketForKey(key, now, this.config.windowMs);
    bucket.count += 1;
    this.buckets.set(key, bucket);
    return this.decision(bucket.count, bucket.count > this.config.maxFailedAttempts);
  }

  async clearSignInFailures(identity: SignInRateLimitIdentity): Promise<void> {
    this.buckets.delete(this.emailKey(identity.email));
  }

  async checkPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const bucket = this.currentPasswordResetBucket(identity);
    return this.decision(bucket.count, bucket.count >= this.config.passwordResetMaxRequests, "password_reset");
  }

  async recordPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision> {
    const keys = this.passwordResetKeys(identity);
    const now = Date.now();
    const counts = keys.map((key) => {
      const bucket = this.bucketForKey(key, now, this.config.passwordResetWindowMs);
      bucket.count += 1;
      this.buckets.set(key, bucket);
      return bucket.count;
    });
    const count = Math.max(...counts);
    return this.decision(count, count > this.config.passwordResetMaxRequests, "password_reset");
  }

  private currentBucket(identity: SignInRateLimitIdentity) {
    return this.bucketForKey(this.emailKey(identity.email), Date.now(), this.config.windowMs);
  }

  private currentPasswordResetBucket(identity: PasswordResetRateLimitIdentity) {
    const now = Date.now();
    const buckets = this.passwordResetKeys(identity).map((key) =>
      this.bucketForKey(key, now, this.config.passwordResetWindowMs)
    );
    return buckets.reduce((selected, bucket) => bucket.count > selected.count ? bucket : selected, buckets[0]);
  }

  private bucketForKey(key: string, now: number, windowMs: number) {
    const existing = this.buckets.get(key);
    if (existing && existing.expiresAt > now) return existing;
    return { count: 0, expiresAt: now + windowMs };
  }

  private emailKey(email: string) {
    return `email:${hashIdentity(email)}`;
  }

  private passwordResetKeys(identity: PasswordResetRateLimitIdentity) {
    const keys = [`password-reset:email:${hashIdentity(identity.email)}`];
    if (identity.ip) keys.push(`password-reset:ip:${hashIdentity(identity.ip)}`);
    return keys;
  }

  private decision(
    count: number,
    limited: boolean,
    scope: "sign_in" | "password_reset" = "sign_in",
  ): AuthRateLimitDecision {
    const isPasswordReset = scope === "password_reset";
    return {
      limited,
      source: "memory",
      count,
      limit: isPasswordReset ? this.config.passwordResetMaxRequests : this.config.maxFailedAttempts,
      windowMs: isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs,
      retryAfterSeconds: Math.ceil((isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs) / 1000),
    };
  }
}

export class RedisAuthRateLimiter implements AuthRateLimiter {
  private clientPromise: Promise<RedisClientType> | null = null;

  constructor(private readonly config: AuthRateLimitConfig) {}

  async checkSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision> {
    return this.withRedisFallback("check", async (client) => {
      const keys = this.keys(identity);
      const counts = await Promise.all(keys.map((key) => client.get(key)));
      const count = Math.max(...counts.map((value) => Number(value ?? 0)));
      return this.decision(count, count >= this.config.maxFailedAttempts);
    });
  }

  async recordFailedSignIn(identity: SignInRateLimitIdentity): Promise<AuthRateLimitDecision> {
    return this.withRedisFallback("record", async (client) => {
      const counts = await Promise.all(
        this.keys(identity).map(async (key) => {
          const count = await client.incr(key);
          if (count === 1) await client.pExpire(key, this.config.windowMs);
          return count;
        }),
      );
      const count = Math.max(...counts);
      return this.decision(count, count > this.config.maxFailedAttempts);
    });
  }

  async clearSignInFailures(identity: SignInRateLimitIdentity): Promise<void> {
    await this.withRedisFallback("clear", async (client) => {
      await client.del(this.keys(identity));
      return this.decision(0, false);
    });
  }

  async checkPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision> {
    return this.withRedisFallback("password_reset_check", async (client) => {
      const keys = this.passwordResetKeys(identity);
      const counts = await Promise.all(keys.map((key) => client.get(key)));
      const count = Math.max(...counts.map((value) => Number(value ?? 0)));
      return this.decision(count, count >= this.config.passwordResetMaxRequests, "password_reset");
    }, "password_reset");
  }

  async recordPasswordReset(identity: PasswordResetRateLimitIdentity): Promise<AuthRateLimitDecision> {
    return this.withRedisFallback("password_reset_record", async (client) => {
      const counts = await Promise.all(
        this.passwordResetKeys(identity).map(async (key) => {
          const count = await client.incr(key);
          if (count === 1) await client.pExpire(key, this.config.passwordResetWindowMs);
          return count;
        }),
      );
      const count = Math.max(...counts);
      return this.decision(count, count > this.config.passwordResetMaxRequests, "password_reset");
    }, "password_reset");
  }

  private async withRedisFallback(
    operation: string,
    run: (client: RedisClientType) => Promise<AuthRateLimitDecision>,
    scope: "sign_in" | "password_reset" = "sign_in",
  ): Promise<AuthRateLimitDecision> {
    try {
      return await run(await this.client());
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (this.config.failMode === "open") {
        return this.degradedDecision(false, operation, reason, scope);
      }
      return this.degradedDecision(true, operation, reason, scope);
    }
  }

  private async client(): Promise<RedisClientType> {
    if (!this.clientPromise) {
      const client = createClient({
        url: this.config.redisUrl,
        socket: {
          connectTimeout: 500,
          reconnectStrategy: false,
        },
      });
      client.on("error", (error) => {
        console.error("auth_rate_limit_redis_error", error);
      });
      this.clientPromise = client.connect().then(() => client as RedisClientType);
    }
    return this.clientPromise;
  }

  private keys(identity: SignInRateLimitIdentity) {
    const keys = [`${this.config.keyPrefix}:signin:email:${hashIdentity(identity.email)}`];
    if (identity.ip) keys.push(`${this.config.keyPrefix}:signin:ip:${hashIdentity(identity.ip)}`);
    return keys;
  }

  private passwordResetKeys(identity: PasswordResetRateLimitIdentity) {
    const keys = [`${this.config.keyPrefix}:password-reset:email:${hashIdentity(identity.email)}`];
    if (identity.ip) keys.push(`${this.config.keyPrefix}:password-reset:ip:${hashIdentity(identity.ip)}`);
    return keys;
  }

  private decision(
    count: number,
    limited: boolean,
    scope: "sign_in" | "password_reset" = "sign_in",
  ): AuthRateLimitDecision {
    const isPasswordReset = scope === "password_reset";
    return {
      limited,
      source: "redis",
      count,
      limit: isPasswordReset ? this.config.passwordResetMaxRequests : this.config.maxFailedAttempts,
      windowMs: isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs,
      retryAfterSeconds: Math.ceil((isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs) / 1000),
    };
  }

  private degradedDecision(
    limited: boolean,
    operation: string,
    reason: string,
    scope: "sign_in" | "password_reset" = "sign_in",
  ): AuthRateLimitDecision {
    const isPasswordReset = scope === "password_reset";
    return {
      limited,
      source: "redis",
      count: 0,
      limit: isPasswordReset ? this.config.passwordResetMaxRequests : this.config.maxFailedAttempts,
      windowMs: isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs,
      retryAfterSeconds: Math.ceil((isPasswordReset ? this.config.passwordResetWindowMs : this.config.windowMs) / 1000),
      failMode: this.config.failMode,
      degraded: true,
      reason: `${operation}:${reason}`,
    };
  }
}

function hashIdentity(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}
