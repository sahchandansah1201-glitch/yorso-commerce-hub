import { createHash } from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import {
  authSessionSchema,
  type AuthSession,
} from "../../../../../packages/contracts/dist/index.js";
import type { ApiConfig } from "../../config.js";

export interface AuthSessionCacheConfig {
  driver: "disabled" | "memory" | "redis";
  failMode: "open" | "closed";
  ttlMs: number;
  keyPrefix: string;
  redisUrl: string;
}

export type AuthSessionCacheRead =
  | { status: "hit"; session: AuthSession; source: AuthSessionCacheConfig["driver"] }
  | { status: "miss"; source: AuthSessionCacheConfig["driver"] }
  | {
      status: "unavailable";
      source: AuthSessionCacheConfig["driver"];
      failMode: AuthSessionCacheConfig["failMode"];
      reason: string;
    };

export type AuthSessionCacheWrite =
  | { status: "ok"; source: AuthSessionCacheConfig["driver"] }
  | {
      status: "unavailable";
      source: AuthSessionCacheConfig["driver"];
      failMode: AuthSessionCacheConfig["failMode"];
      reason: string;
    };

export interface AuthSessionCache {
  getSession(sessionId: string): Promise<AuthSessionCacheRead>;
  setSession(session: AuthSession): Promise<AuthSessionCacheWrite>;
  deleteSession(sessionId: string): Promise<AuthSessionCacheWrite>;
}

export function authSessionCacheConfigFromApiConfig(config: ApiConfig): AuthSessionCacheConfig {
  return {
    driver: config.authSessionCacheDriver,
    failMode: config.authSessionCacheFailMode,
    ttlMs: config.authSessionCacheTtlMs,
    keyPrefix: config.authSessionCacheKeyPrefix,
    redisUrl: config.redisUrl,
  };
}

export function createAuthSessionCache(config: ApiConfig): AuthSessionCache {
  const cacheConfig = authSessionCacheConfigFromApiConfig(config);
  if (cacheConfig.driver === "redis") return new RedisAuthSessionCache(cacheConfig);
  if (cacheConfig.driver === "memory") return new MemoryAuthSessionCache(cacheConfig);
  return new DisabledAuthSessionCache();
}

export class DisabledAuthSessionCache implements AuthSessionCache {
  async getSession(): Promise<AuthSessionCacheRead> {
    return { status: "miss", source: "disabled" };
  }

  async setSession(): Promise<AuthSessionCacheWrite> {
    return { status: "ok", source: "disabled" };
  }

  async deleteSession(): Promise<AuthSessionCacheWrite> {
    return { status: "ok", source: "disabled" };
  }
}

export class MemoryAuthSessionCache implements AuthSessionCache {
  private readonly sessions = new Map<string, { session: AuthSession; expiresAt: number }>();

  constructor(private readonly config: AuthSessionCacheConfig) {}

  async getSession(sessionId: string): Promise<AuthSessionCacheRead> {
    const existing = this.sessions.get(cacheKey(this.config, sessionId));
    if (!existing) return { status: "miss", source: "memory" };
    if (existing.expiresAt <= Date.now() || sessionExpired(existing.session)) {
      this.sessions.delete(cacheKey(this.config, sessionId));
      return { status: "miss", source: "memory" };
    }
    return { status: "hit", source: "memory", session: { ...existing.session } };
  }

  async setSession(session: AuthSession): Promise<AuthSessionCacheWrite> {
    this.sessions.set(cacheKey(this.config, session.id), {
      session: { ...session },
      expiresAt: cacheExpiresAt(session, this.config.ttlMs),
    });
    return { status: "ok", source: "memory" };
  }

  async deleteSession(sessionId: string): Promise<AuthSessionCacheWrite> {
    this.sessions.delete(cacheKey(this.config, sessionId));
    return { status: "ok", source: "memory" };
  }
}

export class RedisAuthSessionCache implements AuthSessionCache {
  private clientPromise: Promise<RedisClientType> | null = null;

  constructor(private readonly config: AuthSessionCacheConfig) {}

  async getSession(sessionId: string): Promise<AuthSessionCacheRead> {
    return this.withRedisFallback("get", async (client) => {
      const value = await client.get(cacheKey(this.config, sessionId));
      if (!value) return { status: "miss", source: "redis" };
      const parsed = authSessionSchema.safeParse(JSON.parse(value));
      if (!parsed.success || sessionExpired(parsed.data)) {
        await client.del(cacheKey(this.config, sessionId));
        return { status: "miss", source: "redis" };
      }
      return { status: "hit", source: "redis", session: parsed.data };
    });
  }

  async setSession(session: AuthSession): Promise<AuthSessionCacheWrite> {
    return this.withRedisFallback("set", async (client) => {
      const ttlSeconds = Math.max(1, Math.ceil((cacheExpiresAt(session, this.config.ttlMs) - Date.now()) / 1000));
      await client.setEx(cacheKey(this.config, session.id), ttlSeconds, JSON.stringify(session));
      return { status: "ok", source: "redis" };
    });
  }

  async deleteSession(sessionId: string): Promise<AuthSessionCacheWrite> {
    return this.withRedisFallback("delete", async (client) => {
      await client.del(cacheKey(this.config, sessionId));
      return { status: "ok", source: "redis" };
    });
  }

  private async withRedisFallback<T extends AuthSessionCacheRead | AuthSessionCacheWrite>(
    operation: string,
    run: (client: RedisClientType) => Promise<T>,
  ): Promise<T | Extract<AuthSessionCacheRead | AuthSessionCacheWrite, { status: "unavailable" }>> {
    try {
      return await run(await this.client());
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return {
        status: "unavailable",
        source: "redis",
        failMode: this.config.failMode,
        reason: `${operation}:${reason}`,
      };
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
        console.error("auth_session_cache_redis_error", error);
      });
      this.clientPromise = client.connect().then(() => client as RedisClientType);
    }
    return this.clientPromise;
  }
}

function cacheKey(config: Pick<AuthSessionCacheConfig, "keyPrefix">, sessionId: string) {
  return `${config.keyPrefix}:session:${createHash("sha256").update(sessionId).digest("hex").slice(0, 48)}`;
}

function cacheExpiresAt(session: AuthSession, ttlMs: number) {
  return Math.min(Date.now() + ttlMs, new Date(session.expiresAt).getTime());
}

function sessionExpired(session: AuthSession) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}
