import { describe, expect, it } from "vitest";
import { AuthService, AuthServiceError } from "./service.js";
import { MemoryAuthRepository } from "./repository.js";
import { MemoryAuthRateLimiter } from "./rate-limit.js";
import { DisabledAuthSessionCache, MemoryAuthSessionCache } from "./session-cache.js";
import { MemoryAuthTelemetrySink, sanitizeAuthTelemetryEvent } from "./observability.js";

const requestId = "00000000-0000-4000-8000-000000000081";
const metadata = {
  ip: "203.0.113.10",
  userAgent: "vitest",
};

const rateLimiter = () =>
  new MemoryAuthRateLimiter({
    driver: "memory",
    failMode: "open",
    maxFailedAttempts: 2,
    passwordResetMaxRequests: 2,
    passwordResetWindowMs: 60_000,
    windowMs: 60_000,
    keyPrefix: "yorso:test",
    redisUrl: "redis://localhost:6379",
  });

const sessionCache = () =>
  new MemoryAuthSessionCache({
    driver: "memory",
    failMode: "closed",
    ttlMs: 300_000,
    keyPrefix: "yorso:test",
    redisUrl: "redis://localhost:6379",
  });

describe("auth observability", () => {
  it("emits structured auth telemetry without PII", async () => {
    const telemetry = new MemoryAuthTelemetrySink();
    const service = new AuthService(new MemoryAuthRepository(), rateLimiter(), sessionCache(), telemetry);

    await expect(
      service.signIn({ email: "buyer@example.com", password: "bad-password" }, requestId, metadata),
    ).rejects.toBeInstanceOf(AuthServiceError);

    const signIn = await service.signIn({ email: "buyer@example.com", password: "Password1" }, requestId, metadata);
    await service.signOut(signIn.session.id, requestId, metadata);
    await expect(service.getSession(signIn.session.id, requestId, metadata)).rejects.toBeInstanceOf(AuthServiceError);

    expect(telemetry.events.map((event) => event.event)).toEqual([
      "auth.sign_in.failed",
      "auth.sign_in.succeeded",
      "auth.sign_out.succeeded",
      "auth.session.invalid",
    ]);

    const serialized = JSON.stringify(telemetry.events);
    expect(serialized).not.toContain("buyer@example.com");
    expect(serialized).not.toContain(signIn.session.id);
    expect(serialized).not.toContain(signIn.session.userId);
    expect(serialized).toContain("\"type\":\"auth_runtime_event\"");
    expect(serialized).toContain("\"schemaVersion\":1");
  });

  it("emits rate-limit telemetry and session-cache outage telemetry", async () => {
    const telemetry = new MemoryAuthTelemetrySink();
    const repository = new MemoryAuthRepository();
    const service = new AuthService(repository, rateLimiter(), new DisabledAuthSessionCache(), telemetry);

    await service.signIn({ email: "limited@example.com", password: "bad-password" }, requestId, metadata).catch(() => {});
    await service.signIn({ email: "limited@example.com", password: "bad-password" }, requestId, metadata).catch(() => {});
    await service.signIn({ email: "limited@example.com", password: "bad-password" }, requestId, metadata).catch(() => {});

    const cacheTelemetry = new MemoryAuthTelemetrySink();
    const cacheService = new AuthService(
      new MemoryAuthRepository(),
      rateLimiter(),
      {
        async getSession() {
          return { status: "unavailable", source: "redis", failMode: "closed", reason: "get:offline" };
        },
        async setSession() {
          return { status: "unavailable", source: "redis", failMode: "closed", reason: "set:offline" };
        },
        async deleteSession() {
          return { status: "unavailable", source: "redis", failMode: "closed", reason: "delete:offline" };
        },
      },
      cacheTelemetry,
    );
    await cacheService.signIn({ email: "buyer@example.com", password: "Password1" }, requestId, metadata).catch(() => {});

    expect(telemetry.events.map((event) => event.event)).toContain("auth.sign_in.rate_limited");
    expect(cacheTelemetry.events.map((event) => event.event)).toContain("auth.session_cache.unavailable");
    expect(JSON.stringify(cacheTelemetry.events)).not.toContain("buyer@example.com");
  });

  it("sanitizes undefined fields before writing JSONL events", () => {
    expect(
      sanitizeAuthTelemetryEvent({
        event: "auth.sign_in.succeeded",
        requestId,
        rateLimitSource: undefined,
      }),
    ).toEqual({
      type: "auth_runtime_event",
      schemaVersion: 1,
      service: "yorso-api",
      component: "auth",
      occurredAt: expect.any(String),
      event: "auth.sign_in.succeeded",
      severity: "info",
      requestId,
    });
  });
});
