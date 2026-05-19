import { describe, expect, it, vi } from "vitest";
import {
  MemoryAuthRateLimiter,
  RedisAuthRateLimiter,
  SecurityEventAuthRateLimiter,
  type AuthRateLimitConfig,
} from "./rate-limit.js";
import { MemoryAuthRepository } from "./repository.js";

const config = {
  driver: "memory",
  failMode: "open",
  maxFailedAttempts: 2,
  windowMs: 60_000,
  keyPrefix: "test:auth",
  redisUrl: "redis://localhost:6379",
} satisfies AuthRateLimitConfig;

describe("auth rate limiters", () => {
  it("blocks after the configured in-memory failed sign-in threshold", async () => {
    const limiter = new MemoryAuthRateLimiter(config);
    const identity = { email: "buyer@example.com", ip: "203.0.113.10" };

    expect(await limiter.checkSignIn(identity)).toMatchObject({ limited: false, count: 0 });
    expect(await limiter.recordFailedSignIn(identity)).toMatchObject({ limited: false, count: 1 });
    expect(await limiter.recordFailedSignIn(identity)).toMatchObject({ limited: false, count: 2 });
    expect(await limiter.checkSignIn(identity)).toMatchObject({
      limited: true,
      source: "memory",
      limit: 2,
      retryAfterSeconds: 60,
    });

    await limiter.clearSignInFailures(identity);
    expect(await limiter.checkSignIn(identity)).toMatchObject({ limited: false, count: 0 });
  });

  it("uses security-event audit data as the local fallback limiter", async () => {
    const repository = new MemoryAuthRepository();
    const limiter = new SecurityEventAuthRateLimiter(repository, {
      ...config,
      driver: "audit_log",
    });

    await repository.recordSecurityEvent({
      eventType: "sign_in_failed",
      email: "buyer@example.com",
      requestId: "00000000-0000-4000-8000-000000000001",
      metadata: {},
    });
    await repository.recordSecurityEvent({
      eventType: "sign_in_failed",
      email: "buyer@example.com",
      requestId: "00000000-0000-4000-8000-000000000002",
      metadata: {},
    });

    expect(await limiter.checkSignIn({ email: "buyer@example.com" })).toMatchObject({
      limited: true,
      source: "audit_log",
      count: 2,
      limit: 2,
    });
  });

  it("fails closed when Redis rate limiting is unavailable and configured closed", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const limiter = new RedisAuthRateLimiter({
      ...config,
      driver: "redis",
      failMode: "closed",
      redisUrl: "redis://127.0.0.1:1",
    });

    try {
      await expect(limiter.checkSignIn({ email: "buyer@example.com" })).resolves.toMatchObject({
        limited: true,
        source: "redis",
        degraded: true,
        failMode: "closed",
      });
    } finally {
      errorSpy.mockRestore();
    }
  });
});
