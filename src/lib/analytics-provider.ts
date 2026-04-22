/**
 * Analytics Provider Adapter
 *
 * Defines the integration boundary between YORSO's typed event contract
 * (analytics.ts) and an actual analytics destination (GA4, PostHog, Amplitude,
 * server endpoint, etc.).
 *
 * Phase 0 ships three providers:
 *   - ConsoleProvider — pretty-prints to the dev console (default in DEV)
 *   - NoopProvider    — drops everything (default in PROD until wired up)
 *   - BatchProvider   — buffers events and flushes via sendBeacon to /api/analytics
 *
 * Selection is controlled by `import.meta.env.VITE_ANALYTICS_PROVIDER`:
 *   "console" | "noop" | "batch"  (defaults: console in DEV, noop in PROD)
 */

import type { AnalyticsEnvelope } from "./analytics";

export interface AnalyticsProvider {
  readonly name: string;
  send(envelope: AnalyticsEnvelope): void;
  flush?(): void;
}

// ─── Console ────────────────────────────────────────────────────────────────
class ConsoleProvider implements AnalyticsProvider {
  readonly name = "console";
  send(envelope: AnalyticsEnvelope) {
    // eslint-disable-next-line no-console
    console.log(`[YORSO Analytics] ${envelope.event}`, envelope);
  }
}

// ─── Noop ───────────────────────────────────────────────────────────────────
class NoopProvider implements AnalyticsProvider {
  readonly name = "noop";
  send() {
    /* intentionally empty */
  }
}

// ─── Batch (sendBeacon) ─────────────────────────────────────────────────────
class BatchProvider implements AnalyticsProvider {
  readonly name = "batch";
  private buffer: AnalyticsEnvelope[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly endpoint: string;
  private readonly flushIntervalMs = 5000;
  private readonly maxBuffer = 20;

  constructor(endpoint = "/api/analytics") {
    this.endpoint = endpoint;
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", () => this.flush());
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  send(envelope: AnalyticsEnvelope) {
    this.buffer.push(envelope);
    if (this.buffer.length >= this.maxBuffer) {
      this.flush();
      return;
    }
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) return;
    const events = this.buffer;
    this.buffer = [];

    let payload: string;
    try {
      payload = JSON.stringify({ events });
    } catch {
      // Serialization failed (e.g. circular reference) — drop the batch.
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        const ok = navigator.sendBeacon(this.endpoint, blob);
        if (ok) return;
        // sendBeacon refused (queue full / disabled) — fall through to fetch.
      }
      if (typeof fetch !== "undefined") {
        // Fire-and-forget fallback
        void fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          /* swallow — analytics must never break the app */
        });
      }
    } catch {
      /* swallow */
    }
  }
}

// ─── Tap (E2E inspection) ───────────────────────────────────────────────────
/**
 * Wraps another provider and additionally pushes every envelope into
 * `window.__yorsoAnalyticsTap`. Enabled by `?analytics-tap=1` (sticky via
 * localStorage `yorso_analytics_tap=1`). E2E tests read the array to assert
 * the funnel without owning a full mock pipeline.
 */
class TapProvider implements AnalyticsProvider {
  readonly name: string;
  constructor(private inner: AnalyticsProvider) {
    this.name = `tap(${inner.name})`;
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__yorsoAnalyticsTap = (window as any).__yorsoAnalyticsTap ?? [];
    }
  }
  send(envelope: AnalyticsEnvelope) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tap = (window as any).__yorsoAnalyticsTap as AnalyticsEnvelope[] | undefined;
      if (tap) tap.push(envelope);
    }
    this.inner.send(envelope);
  }
  flush() {
    this.inner.flush?.();
  }
}

function tapEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("analytics-tap") === "1") {
      localStorage.setItem("yorso_analytics_tap", "1");
      return true;
    }
    return localStorage.getItem("yorso_analytics_tap") === "1";
  } catch {
    return false;
  }
}

// ─── Selection ──────────────────────────────────────────────────────────────
function pickProvider(): AnalyticsProvider {
  const envChoice = (import.meta.env.VITE_ANALYTICS_PROVIDER as string | undefined)?.toLowerCase();
  const choice = envChoice ?? (import.meta.env.DEV ? "console" : "noop");

  let base: AnalyticsProvider;
  switch (choice) {
    case "batch":
      base = new BatchProvider();
      break;
    case "noop":
      base = new NoopProvider();
      break;
    case "console":
    default:
      base = new ConsoleProvider();
  }

  return tapEnabled() ? new TapProvider(base) : base;
}

let activeProvider: AnalyticsProvider = pickProvider();

export function getProvider(): AnalyticsProvider {
  return activeProvider;
}

/** Override at runtime — primarily for tests. */
export function setProvider(provider: AnalyticsProvider): void {
  activeProvider = provider;
}

export { ConsoleProvider, NoopProvider, BatchProvider, TapProvider };
