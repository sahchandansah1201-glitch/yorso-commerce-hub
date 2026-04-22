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

// ─── Failure telemetry ──────────────────────────────────────────────────────
// Internal counter + ring buffer for transport/serialization failures. Not
// shipped to the analytics endpoint (it would create a feedback loop on
// outage). Surfaced via `getAnalyticsFailures()` for diagnostics, manual
// inspection from DevTools, and tests.

export type AnalyticsFailureReason =
  | "serialize"
  | "beacon_threw"
  | "beacon_refused"
  | "fetch_rejected"
  | "no_transport"
  | "provider_threw";

export interface AnalyticsFailure {
  reason: AnalyticsFailureReason;
  transport: "beacon" | "fetch" | "none" | "provider";
  errorName?: string;
  errorMessage?: string;
  droppedEvents: number;
  at: string; // ISO timestamp
}

interface FailureCounters {
  total: number;
  byReason: Record<AnalyticsFailureReason, number>;
  recent: AnalyticsFailure[];
}

const MAX_RECENT_FAILURES = 20;

const failures: FailureCounters = {
  total: 0,
  byReason: {
    serialize: 0,
    beacon_threw: 0,
    beacon_refused: 0,
    fetch_rejected: 0,
    no_transport: 0,
    provider_threw: 0,
  },
  recent: [],
};

export function recordAnalyticsFailure(input: {
  reason: AnalyticsFailureReason;
  transport: AnalyticsFailure["transport"];
  error?: unknown;
  droppedEvents?: number;
}): void {
  const err = input.error;
  const entry: AnalyticsFailure = {
    reason: input.reason,
    transport: input.transport,
    errorName: err instanceof Error ? err.name : undefined,
    errorMessage:
      err instanceof Error
        ? err.message
        : err === undefined
        ? undefined
        : String(err),
    droppedEvents: input.droppedEvents ?? 0,
    at: new Date().toISOString(),
  };
  failures.total += 1;
  failures.byReason[input.reason] += 1;
  failures.recent.push(entry);
  if (failures.recent.length > MAX_RECENT_FAILURES) failures.recent.shift();

  // Dev-only context log. Prod stays silent so a broken endpoint doesn't
  // spam the user's console; counters are still queryable.
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[YORSO Analytics] failure (${entry.reason}/${entry.transport})`,
        entry,
      );
    }
  } catch {
    /* never break the caller */
  }

  // Expose to DevTools without leaking module internals.
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__yorsoAnalyticsFailures = failures;
  }
}

export function getAnalyticsFailures(): Readonly<FailureCounters> {
  return failures;
}

/** Test-only — reset counters between cases. */
export function __resetAnalyticsFailures(): void {
  failures.total = 0;
  (Object.keys(failures.byReason) as AnalyticsFailureReason[]).forEach((k) => {
    failures.byReason[k] = 0;
  });
  failures.recent.length = 0;
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
    const dropped = events.length;

    let payload: string;
    try {
      payload = JSON.stringify({ events });
    } catch (error) {
      recordAnalyticsFailure({
        reason: "serialize",
        transport: "none",
        error,
        droppedEvents: dropped,
      });
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          const ok = navigator.sendBeacon(this.endpoint, blob);
          if (ok) return;
          recordAnalyticsFailure({
            reason: "beacon_refused",
            transport: "beacon",
            droppedEvents: dropped,
          });
          // fall through to fetch
        } catch (error) {
          recordAnalyticsFailure({
            reason: "beacon_threw",
            transport: "beacon",
            error,
            droppedEvents: dropped,
          });
          // fall through to fetch
        }
      }
      if (typeof fetch !== "undefined") {
        // Fire-and-forget fallback
        void fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch((error) => {
          recordAnalyticsFailure({
            reason: "fetch_rejected",
            transport: "fetch",
            error,
            droppedEvents: dropped,
          });
        });
      } else {
        recordAnalyticsFailure({
          reason: "no_transport",
          transport: "none",
          droppedEvents: dropped,
        });
      }
    } catch (error) {
      recordAnalyticsFailure({
        reason: "provider_threw",
        transport: "provider",
        error,
        droppedEvents: dropped,
      });
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
