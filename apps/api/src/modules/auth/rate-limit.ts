import { createHash } from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import type { ApiConfig } from "../../config.js";
import type { AuthRepository } from "./repository.js";

export interface AuthRateLimitConfig {
  driver: "audit_log" | "memory" | "redis";
  failMode: "open" | "closed";
  maxFailedAttempts: number;
  windowMs: number;
  keyPrefix: string;
  redisUrl: string;
}

export interface SignInRateLimitIdentity {
  email: string;
  ip?: string | null;
}

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
}

export function authRateLimitConfigFromApiConfig(config: ApiConfig): AuthRateLimitConfig {
  return {
    driver: config.authRateLimitDriver,
    failMode: config.authRateLimitFailMode,
    maxFailedAttempts: config.authSignInMaxFailedAttempts,
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

  private decision(count: number, limited: boolean): AuthRateLimitDecision {
    return {
      limited,
      source: "audit_log",
      count,
      limit: this.config.maxFailedAttempts,
      windowMs: this.config.windowMs,
      retryAfterSeconds: Math.ceil(this.config.windowMs / 1000),
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
    const bucket = this.bucketForKey(key, now);
    bucket.count += 1;
    this.buckets.set(key, bucket);
    return this.decision(bucket.count, bucket.count > this.config.maxFailedAttempts);
  }

  async clearSignInFailures(identity: SignInRateLimitIdentity): Promise<void> {
    this.buckets.delete(this.emailKey(identity.email));
  }

  private currentBucket(identity: SignInRateLimitIdentity) {
    return this.bucketForKey(this.emailKey(identity.email), Date.now());
  }

  private bucketForKey(key: string, now: number) {
    const existing = this.buckets.get(key);
    if (existing && existing.expiresAt > now) return existing;
    return { count: 0, expiresAt: now + this.config.windowMs };
  }

  private emailKey(email: string) {
    return `email:${hashIdentity(email)}`;
  }

  private decision(count: number, limited: boolean): AuthRateLimitDecision {
    return {
      limited,
      source: "memory",
      count,
      limit: this.config.maxFailedAttempts,
      windowMs: this.config.windowMs,
      retryAfterSeconds: Math.ceil(this.config.windowMs / 1000),
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

  private async withRedisFallback(
    operation: string,
    run: (client: RedisClientType) => Promise<AuthRateLimitDecision>,
  ): Promise<AuthRateLimitDecision> {
    try {
      return await run(await this.client());
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (this.config.failMode === "open") {
        return this.degradedDecision(false, operation, reason);
      }
      return this.degradedDecision(true, operation, reason);
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

  private decision(count: number, limited: boolean): AuthRateLimitDecision {
    return {
      limited,
      source: "redis",
      count,
      limit: this.config.maxFailedAttempts,
      windowMs: this.config.windowMs,
      retryAfterSeconds: Math.ceil(this.config.windowMs / 1000),
    };
  }

  private degradedDecision(
    limited: boolean,
    operation: string,
    reason: string,
  ): AuthRateLimitDecision {
    return {
      limited,
      source: "redis",
      count: 0,
      limit: this.config.maxFailedAttempts,
      windowMs: this.config.windowMs,
      retryAfterSeconds: Math.ceil(this.config.windowMs / 1000),
      failMode: this.config.failMode,
      degraded: true,
      reason: `${operation}:${reason}`,
    };
  }
}

function hashIdentity(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}
