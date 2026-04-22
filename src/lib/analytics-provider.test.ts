/**
 * Provider acceptance tests.
 * Maps to .lovable/analytics-acceptance.md (R5, R6, R8).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BatchProvider,
  ConsoleProvider,
  NoopProvider,
  setProvider,
  getProvider,
} from "./analytics-provider";
import type { AnalyticsEnvelope } from "./analytics";

const env = (event = "hero_primary_cta_click"): AnalyticsEnvelope => ({
  event,
  timestamp: new Date().toISOString(),
  url: "/",
  language: "en",
  sessionId: "s_test",
  role: "unknown",
  payload: {},
});

describe("ConsoleProvider (R5)", () => {
  it("logs with [YORSO Analytics] prefix", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    new ConsoleProvider().send(env());
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[YORSO Analytics] hero_primary_cta_click"),
      expect.any(Object),
    );
    spy.mockRestore();
  });
});

describe("NoopProvider", () => {
  it("never throws and returns undefined", () => {
    const p = new NoopProvider();
    expect(() => p.send()).not.toThrow();
  });
});

describe("BatchProvider (R6)", () => {
  let beacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: beacon,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes on max buffer (20 events)", () => {
    const p = new BatchProvider("/api/analytics");
    for (let i = 0; i < 20; i++) p.send(env(`evt_${i}`));
    expect(beacon).toHaveBeenCalledTimes(1);
    const [url, blob] = beacon.mock.calls[0];
    expect(url).toBe("/api/analytics");
    expect(blob).toBeInstanceOf(Blob);
  });

  it("flushes after the 5s timer", () => {
    const p = new BatchProvider();
    p.send(env());
    expect(beacon).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(beacon).toHaveBeenCalledTimes(1);
  });

  it("flush() is a no-op on empty buffer", () => {
    new BatchProvider().flush();
    expect(beacon).not.toHaveBeenCalled();
  });

  it("serializes events as { events: [...] }", async () => {
    const p = new BatchProvider();
    p.send(env("a"));
    p.send(env("b"));
    p.flush();
    const blob = beacon.mock.calls[0][1] as Blob;
    const text = await new Response(blob).text();
    const parsed = JSON.parse(text);
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0].event).toBe("a");
  });
});

describe("setProvider (R8)", () => {
  it("swaps the active provider at runtime", () => {
    const stub = { name: "stub", send: vi.fn() };
    setProvider(stub);
    expect(getProvider()).toBe(stub);
    getProvider().send(env());
    expect(stub.send).toHaveBeenCalledTimes(1);
  });
});
