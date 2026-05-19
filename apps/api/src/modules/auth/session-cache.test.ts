import { describe, expect, it } from "vitest";
import type { AuthSession } from "../../../../../packages/contracts/dist/index.js";
import {
  DisabledAuthSessionCache,
  MemoryAuthSessionCache,
  RedisAuthSessionCache,
  type AuthSessionCacheConfig,
} from "./session-cache.js";

const baseConfig: AuthSessionCacheConfig = {
  driver: "memory",
  failMode: "closed",
  ttlMs: 300_000,
  keyPrefix: "yorso:test",
  redisUrl: "redis://127.0.0.1:1",
};

const session = (expiresAt = new Date(Date.now() + 60_000).toISOString()): AuthSession => ({
  id: "session-id-1234567890abcdef1234567890abcdef",
  userId: "00000000-0000-4000-8000-000000000001",
  email: "buyer@example.com",
  displayName: "Demo Buyer",
  issuedAt: new Date().toISOString(),
  expiresAt,
});

describe("auth session cache", () => {
  it("stores, reads and invalidates memory sessions", async () => {
    const cache = new MemoryAuthSessionCache(baseConfig);
    const authSession = session();

    await expect(cache.getSession(authSession.id)).resolves.toMatchObject({ status: "miss" });
    await expect(cache.setSession(authSession)).resolves.toMatchObject({ status: "ok" });
    await expect(cache.getSession(authSession.id)).resolves.toMatchObject({
      status: "hit",
      session: authSession,
    });
    await expect(cache.deleteSession(authSession.id)).resolves.toMatchObject({ status: "ok" });
    await expect(cache.getSession(authSession.id)).resolves.toMatchObject({ status: "miss" });
  });

  it("treats expired cached sessions as misses", async () => {
    const cache = new MemoryAuthSessionCache(baseConfig);
    const expired = session(new Date(Date.now() - 1_000).toISOString());

    await cache.setSession(expired);
    await expect(cache.getSession(expired.id)).resolves.toMatchObject({ status: "miss" });
  });

  it("keeps disabled cache as a no-op boundary", async () => {
    const cache = new DisabledAuthSessionCache();
    const authSession = session();

    await expect(cache.setSession(authSession)).resolves.toMatchObject({ status: "ok", source: "disabled" });
    await expect(cache.getSession(authSession.id)).resolves.toMatchObject({ status: "miss", source: "disabled" });
    await expect(cache.deleteSession(authSession.id)).resolves.toMatchObject({ status: "ok", source: "disabled" });
  });

  it("reports Redis unavailability without falling back silently in closed mode", async () => {
    const cache = new RedisAuthSessionCache({ ...baseConfig, driver: "redis", failMode: "closed" });

    await expect(cache.getSession("missing-session")).resolves.toMatchObject({
      status: "unavailable",
      source: "redis",
      failMode: "closed",
    });
  });
});
