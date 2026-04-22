/**
 * Analytics Contract v1 — runtime acceptance tests.
 * Maps to .lovable/analytics-acceptance.md section 2 (R1..R8).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import analytics, { initScrollDepthTracking, type AnalyticsEnvelope } from "./analytics";
import { setProvider, type AnalyticsProvider } from "./analytics-provider";

class StubProvider implements AnalyticsProvider {
  readonly name = "stub";
  events: AnalyticsEnvelope[] = [];
  send(e: AnalyticsEnvelope) {
    this.events.push(e);
  }
}

let stub: StubProvider;

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  stub = new StubProvider();
  setProvider(stub);
});

describe("analytics envelope (R1)", () => {
  it("attaches all required fields", () => {
    analytics.track("hero_primary_cta_click");
    expect(stub.events).toHaveLength(1);
    const env = stub.events[0];
    expect(env.event).toBe("hero_primary_cta_click");
    expect(env.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof env.url).toBe("string");
    expect(typeof env.language).toBe("string");
    expect(typeof env.sessionId).toBe("string");
    expect(env.sessionId.length).toBeGreaterThan(0);
    expect(env.role).toBe("unknown");
    expect(env.payload).toEqual({});
  });

  it("preserves typed payload fields", () => {
    analytics.track("hero_search_submit", { query: "salmon" });
    expect(stub.events[0].payload).toEqual({ query: "salmon" });
  });
});

describe("session + role (R2, R3)", () => {
  it("keeps sessionId stable across calls within the tab", () => {
    analytics.track("hero_primary_cta_click");
    analytics.track("header_signin_click");
    expect(stub.events[0].sessionId).toBe(stub.events[1].sessionId);
  });

  it("derives role from sessionStorage", () => {
    sessionStorage.setItem("yorso_registration", JSON.stringify({ role: "buyer" }));
    analytics.track("hero_primary_cta_click");
    expect(stub.events[0].role).toBe("buyer");
  });

  it("falls back to 'unknown' on malformed registration state", () => {
    sessionStorage.setItem("yorso_registration", "{not json");
    analytics.track("hero_primary_cta_click");
    expect(stub.events[0].role).toBe("unknown");
  });
});

describe("provider safety (R4)", () => {
  it("does not throw if provider.send throws", () => {
    setProvider({
      name: "boom",
      send() {
        throw new Error("nope");
      },
    });
    expect(() => analytics.track("hero_primary_cta_click")).not.toThrow();
  });
});

describe("scroll depth (R7)", () => {
  it("fires 25/50/75 exactly once each", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });

    const cleanup = initScrollDepthTracking();

    const scrollTo = (y: number) => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: y });
      window.dispatchEvent(new Event("scroll"));
    };

    scrollTo(260); // 26%
    scrollTo(510); // 51%
    scrollTo(760); // 76%
    scrollTo(800); // no new threshold
    scrollTo(100); // back up — must not refire

    cleanup();

    const depths = stub.events
      .filter((e) => e.event.startsWith("scroll_depth_"))
      .map((e) => e.payload.depth);
    expect(depths).toEqual([25, 50, 75]);
  });
});

describe("registration funnel events", () => {
  it("emits step + sessionId on each funnel event", () => {
    sessionStorage.setItem("yorso_registration", JSON.stringify({ role: "buyer" }));

    analytics.track("registration_role_selected", { role: "buyer", step: 1 });
    analytics.track("registration_email_submitted", {
      role: "buyer",
      step: 2,
      sessionId: "s_test",
      emailDomain: "yorso.test",
    });
    analytics.track("registration_email_verified", {
      role: "buyer",
      step: 3,
      sessionId: "s_test",
      verificationLatencyMs: 1234,
      isResend: false,
      attempt: 1,
    });
    analytics.track("registration_complete", {
      role: "buyer",
      step: 7,
      sessionId: "s_test",
      country: "ES",
      categories: 2,
      countries: 3,
      funnelDurationMs: 60000,
    });

    const steps = stub.events.map((e) => e.payload.step);
    expect(steps).toEqual([1, 2, 3, 7]);
    // Envelope sessionId stable across all four
    const ids = new Set(stub.events.map((e) => e.sessionId));
    expect(ids.size).toBe(1);
  });
});
