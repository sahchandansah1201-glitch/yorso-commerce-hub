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
    const payload = JSON.stringify({ events: this.buffer });
    this.buffer = [];

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(this.endpoint, blob);
      } else if (typeof fetch !== "undefined") {
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

// ─── Selection ──────────────────────────────────────────────────────────────
function pickProvider(): AnalyticsProvider {
  const envChoice = (import.meta.env.VITE_ANALYTICS_PROVIDER as string | undefined)?.toLowerCase();
  const choice = envChoice ?? (import.meta.env.DEV ? "console" : "noop");

  switch (choice) {
    case "batch":
      return new BatchProvider();
    case "noop":
      return new NoopProvider();
    case "console":
    default:
      return new ConsoleProvider();
  }
}

let activeProvider: AnalyticsProvider = pickProvider();

export function getProvider(): AnalyticsProvider {
  return activeProvider;
}

/** Override at runtime — primarily for tests. */
export function setProvider(provider: AnalyticsProvider): void {
  activeProvider = provider;
}

export { ConsoleProvider, NoopProvider, BatchProvider };
