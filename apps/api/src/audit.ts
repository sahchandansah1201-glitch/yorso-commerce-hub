import { createHash, randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { ApiConfig } from "./config.js";
import type { ApiRequestContext } from "./http.js";

export type AuditOutcome = "success" | "failure" | "blocked";

export interface AuditEvent {
  type: "api_audit_event";
  schemaVersion: 1;
  service: "yorso-api";
  component: "audit";
  occurredAt: string;
  auditId: string;
  requestId: string;
  correlationId: string;
  action: string;
  outcome: AuditOutcome;
  httpMethod?: string;
  route?: string;
  statusCode?: number;
  actorUserHash?: string;
  sessionHash?: string;
  resourceType?: string;
  resourceHash?: string;
  reason?: string;
}

export interface AuditEventInput {
  action: string;
  actorUserId?: string | null;
  httpMethod?: string;
  outcome: AuditOutcome;
  reason?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  route?: string | null;
  sessionId?: string | null;
  statusCode?: number;
}

export interface AuditSink {
  emit(event: AuditEvent): Promise<void>;
}

export class NoopAuditSink implements AuditSink {
  async emit() {
    // Audit can be disabled for local prototype runs.
  }
}

export class ConsoleAuditSink implements AuditSink {
  async emit(event: AuditEvent) {
    console.log(JSON.stringify(event));
  }
}

export class MemoryAuditSink implements AuditSink {
  readonly events: AuditEvent[] = [];

  async emit(event: AuditEvent) {
    this.events.push(event);
  }
}

export function createAuditSink(config: ApiConfig): AuditSink {
  switch (config.auditDriver) {
    case "console":
      return new ConsoleAuditSink();
    case "disabled":
      return new NoopAuditSink();
  }
}

export function buildAuditEvent(context: ApiRequestContext, input: AuditEventInput): AuditEvent {
  const event: AuditEvent = {
    type: "api_audit_event",
    schemaVersion: 1,
    service: "yorso-api",
    component: "audit",
    occurredAt: new Date().toISOString(),
    auditId: `aud_${randomUUID()}`,
    requestId: context.requestId,
    correlationId: context.correlationId,
    action: input.action,
    outcome: input.outcome,
  };

  if (input.httpMethod) event.httpMethod = input.httpMethod.toUpperCase();
  if (input.route) event.route = input.route;
  if (input.statusCode) event.statusCode = input.statusCode;
  if (input.actorUserId) event.actorUserHash = auditHash(input.actorUserId);
  if (input.sessionId) event.sessionHash = auditHash(input.sessionId);
  if (input.resourceType) event.resourceType = input.resourceType;
  if (input.resourceId) event.resourceHash = auditHash(input.resourceId);
  if (input.reason) event.reason = safeReason(input.reason);

  return event;
}

export function emitAuditEvent(sink: AuditSink, event: AuditEvent) {
  void sink.emit(event).catch((error) => {
    console.error(JSON.stringify({
      type: "api_audit_emit_failed",
      schemaVersion: 1,
      service: "yorso-api",
      component: "audit",
      occurredAt: new Date().toISOString(),
      auditId: event.auditId,
      requestId: event.requestId,
      correlationId: event.correlationId,
      action: event.action,
      errorName: error instanceof Error ? error.name : "UnknownError",
    }));
  });
}

export function auditFromRequest(
  sink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  input: Omit<AuditEventInput, "httpMethod">,
) {
  emitAuditEvent(sink, buildAuditEvent(context, {
    ...input,
    httpMethod: request.method,
  }));
}

export function auditHash(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function safeReason(reason: string) {
  return reason
    .replace(/[^\w.:/-]+/g, "_")
    .slice(0, 96);
}
