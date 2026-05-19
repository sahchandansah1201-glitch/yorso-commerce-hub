import type { ApiConfig } from "../../config.js";

export type AuthTelemetryDriver = "disabled" | "console";

export interface AuthTelemetryEvent {
  event: string;
  requestId: string;
  severity?: "info" | "warn" | "error";
  outcome?: "success" | "failure" | "blocked";
  reason?: string;
  operation?: string;
  cacheSource?: string;
  cacheStatus?: string;
  rateLimitSource?: string;
  rateLimitCount?: number;
  rateLimitLimit?: number;
  retryAfterSeconds?: number;
  failMode?: string;
  degraded?: boolean;
  signedOut?: boolean;
  userKnown?: boolean;
  ipPresent?: boolean;
  userAgentPresent?: boolean;
}

export interface AuthTelemetrySink {
  emit(event: AuthTelemetryEvent): Promise<void>;
}

export function createAuthTelemetrySink(config: ApiConfig): AuthTelemetrySink {
  if (config.authObservabilityDriver === "console") return new ConsoleAuthTelemetrySink();
  return new NoopAuthTelemetrySink();
}

export class NoopAuthTelemetrySink implements AuthTelemetrySink {
  async emit(): Promise<void> {
    // Intentionally empty. Local tests and prototype runs should not write noisy auth logs by default.
  }
}

export class ConsoleAuthTelemetrySink implements AuthTelemetrySink {
  async emit(event: AuthTelemetryEvent): Promise<void> {
    console.log(JSON.stringify(sanitizeAuthTelemetryEvent(event)));
  }
}

export class MemoryAuthTelemetrySink implements AuthTelemetrySink {
  readonly events: Record<string, unknown>[] = [];

  async emit(event: AuthTelemetryEvent): Promise<void> {
    this.events.push(sanitizeAuthTelemetryEvent(event));
  }
}

export function sanitizeAuthTelemetryEvent(event: AuthTelemetryEvent): Record<string, unknown> {
  return dropUndefined({
    type: "auth_runtime_event",
    schemaVersion: 1,
    service: "yorso-api",
    component: "auth",
    occurredAt: new Date().toISOString(),
    event: event.event,
    severity: event.severity ?? "info",
    outcome: event.outcome,
    reason: event.reason,
    operation: event.operation,
    requestId: event.requestId,
    cacheSource: event.cacheSource,
    cacheStatus: event.cacheStatus,
    rateLimitSource: event.rateLimitSource,
    rateLimitCount: event.rateLimitCount,
    rateLimitLimit: event.rateLimitLimit,
    retryAfterSeconds: event.retryAfterSeconds,
    failMode: event.failMode,
    degraded: event.degraded,
    signedOut: event.signedOut,
    userKnown: event.userKnown,
    ipPresent: event.ipPresent,
    userAgentPresent: event.userAgentPresent,
  });
}

function dropUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
