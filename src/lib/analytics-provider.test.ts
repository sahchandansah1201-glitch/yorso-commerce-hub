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
  getAnalyticsFailures,
  __resetAnalyticsFailures,
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

  it("serializes events as { events: [...] }", () => {
    const blobSpy = vi.spyOn(globalThis, "Blob").mockImplementation(
      ((parts: BlobPart[]) => ({ __parts: parts }) as unknown as Blob) as never,
    );
    try {
      const p = new BatchProvider();
      p.send(env("a"));
      p.send(env("b"));
      p.flush();
      const captured = beacon.mock.calls[0][1] as { __parts: string[] };
      const parsed = JSON.parse(captured.__parts[0]);
      expect(parsed.events).toHaveLength(2);
      expect(parsed.events[0].event).toBe("a");
    } finally {
      blobSpy.mockRestore();
    }
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

// ─── Degraded conditions ────────────────────────────────────────────────────
// Contract: analytics must never throw, and must never block UI flows, even
// when the transport is missing, offline, or the payload can't be serialized.

describe("BatchProvider degraded transports", () => {
  let originalBeacon: typeof navigator.sendBeacon | undefined;
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    originalBeacon = navigator.sendBeacon;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    if (originalBeacon === undefined) {
      delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    } else {
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: originalBeacon,
      });
    }
    globalThis.fetch = originalFetch as typeof globalThis.fetch;
  });

  it("falls back to fetch when sendBeacon is missing", () => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    const fetchSpy = vi.fn().mockResolvedValue(new Response(""));
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const p = new BatchProvider("/api/analytics");
    p.send(env("a"));
    p.flush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/analytics");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).keepalive).toBe(true);
    const parsed = JSON.parse((init as RequestInit).body as string);
    expect(parsed.events[0].event).toBe("a");
  });

  it("falls back to fetch when sendBeacon refuses (returns false)", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });
    const fetchSpy = vi.fn().mockResolvedValue(new Response(""));
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const p = new BatchProvider();
    p.send(env());
    p.flush();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw when offline (fetch rejects)", async () => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    const fetchSpy = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const p = new BatchProvider();
    p.send(env());
    expect(() => p.flush()).not.toThrow();
    // Allow the swallowed promise rejection to settle without unhandled errors.
    await Promise.resolve();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw when sendBeacon itself throws", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: () => {
        throw new Error("beacon disabled by policy");
      },
    });
    const p = new BatchProvider();
    p.send(env());
    expect(() => p.flush()).not.toThrow();
  });

  it("does not throw when both transports are missing", () => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    delete (globalThis as { fetch?: unknown }).fetch;

    const p = new BatchProvider();
    p.send(env());
    expect(() => p.flush()).not.toThrow();
  });

  it("drops the batch silently when JSON.stringify fails (circular ref)", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const p = new BatchProvider();
    const bad = env("bad");
    // Force a cycle inside payload
    (bad.payload as Record<string, unknown>).self = bad.payload;
    p.send(bad);

    expect(() => p.flush()).not.toThrow();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ─── UI safety contract ─────────────────────────────────────────────────────
// `analytics.track()` is the call site every UI component uses. It must never
// surface a transport failure to the caller — otherwise a flaky beacon would
// crash registration / checkout / etc.

describe("analytics.track UI safety", () => {
  it("never throws even when the active provider explodes", async () => {
    const { default: analytics } = await import("./analytics");
    setProvider({
      name: "boom",
      send() {
        throw new Error("transport down");
      },
    });
    expect(() => analytics.track("hero_primary_cta_click")).not.toThrow();
    expect(() =>
      analytics.track("hero_search_submit", { query: "salmon" }),
    ).not.toThrow();
  });

  it("never throws when scroll-depth event hits a broken provider", async () => {
    const { default: analytics } = await import("./analytics");
    setProvider({
      name: "boom",
      send() {
        throw new Error("nope");
      },
    });
    expect(() =>
      analytics.trackScrollDepth("scroll_depth_50", { depth: 50 }),
    ).not.toThrow();
  });
});

// ─── Failure counter ────────────────────────────────────────────────────────
// Internal `analytics_failures` telemetry: counts + recent context entries
// for transport/serialization issues. Must never reach the UI.

describe("analytics failure counter", () => {
  let originalBeacon: typeof navigator.sendBeacon | undefined;
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    __resetAnalyticsFailures();
    originalBeacon = navigator.sendBeacon;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    if (originalBeacon === undefined) {
      delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    } else {
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: originalBeacon,
      });
    }
    globalThis.fetch = originalFetch as typeof globalThis.fetch;
  });

  it("starts at zero", () => {
    const f = getAnalyticsFailures();
    expect(f.total).toBe(0);
    expect(f.recent).toEqual([]);
  });

  it("records 'serialize' on circular payload and drops the batch", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    const p = new BatchProvider();
    const bad = env("bad");
    (bad.payload as Record<string, unknown>).self = bad.payload;
    p.send(bad);
    p.flush();

    const f = getAnalyticsFailures();
    expect(f.total).toBe(1);
    expect(f.byReason.serialize).toBe(1);
    expect(f.recent[0]).toMatchObject({
      reason: "serialize",
      transport: "none",
      droppedEvents: 1,
    });
    expect(f.recent[0].errorMessage).toMatch(/circular|JSON/i);
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("records 'beacon_threw' and falls back to fetch", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: () => {
        throw new Error("beacon disabled");
      },
    });
    const fetchSpy = vi.fn().mockResolvedValue(new Response(""));
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    const p = new BatchProvider();
    p.send(env());
    p.flush();

    const f = getAnalyticsFailures();
    expect(f.byReason.beacon_threw).toBe(1);
    expect(f.recent[0]).toMatchObject({
      reason: "beacon_threw",
      transport: "beacon",
      errorName: "Error",
      errorMessage: "beacon disabled",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("records 'beacon_refused' when sendBeacon returns false", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("")) as unknown as typeof globalThis.fetch;

    const p = new BatchProvider();
    p.send(env());
    p.flush();

    const f = getAnalyticsFailures();
    expect(f.byReason.beacon_refused).toBe(1);
    expect(f.recent[0].transport).toBe("beacon");
  });

  it("records 'fetch_rejected' when fetch fails (offline)", async () => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof globalThis.fetch;

    const p = new BatchProvider();
    p.send(env());
    p.flush();
    await Promise.resolve();
    await Promise.resolve();

    const f = getAnalyticsFailures();
    expect(f.byReason.fetch_rejected).toBe(1);
    expect(f.recent.at(-1)).toMatchObject({
      reason: "fetch_rejected",
      transport: "fetch",
      errorName: "TypeError",
    });
  });

  it("records 'no_transport' when both beacon and fetch are gone", () => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    delete (globalThis as { fetch?: unknown }).fetch;

    const p = new BatchProvider();
    p.send(env());
    p.flush();

    const f = getAnalyticsFailures();
    expect(f.byReason.no_transport).toBe(1);
  });

  it("records 'provider_threw' from analytics.track without surfacing", async () => {
    const { default: analytics } = await import("./analytics");
    setProvider({
      name: "boom",
      send() {
        throw new Error("transport down");
      },
    });
    expect(() => analytics.track("hero_primary_cta_click")).not.toThrow();

    const f = getAnalyticsFailures();
    expect(f.byReason.provider_threw).toBeGreaterThanOrEqual(1);
    expect(f.recent.at(-1)).toMatchObject({
      reason: "provider_threw",
      transport: "provider",
      errorMessage: "transport down",
      droppedEvents: 1,
    });
  });

  it("caps recent[] at 20 entries", () => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    delete (globalThis as { fetch?: unknown }).fetch;

    const p = new BatchProvider();
    for (let i = 0; i < 30; i++) {
      p.send(env(`evt_${i}`));
      p.flush();
    }

    const f = getAnalyticsFailures();
    expect(f.total).toBe(30);
    expect(f.recent).toHaveLength(20);
  });

  it("exposes counters on window.__yorsoAnalyticsFailures", () => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    delete (globalThis as { fetch?: unknown }).fetch;

    const p = new BatchProvider();
    p.send(env());
    p.flush();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exposed = (window as any).__yorsoAnalyticsFailures;
    expect(exposed.total).toBeGreaterThan(0);
    expect(exposed.byReason.no_transport).toBeGreaterThan(0);
  });
});
