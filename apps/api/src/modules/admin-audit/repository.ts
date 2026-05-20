import type {
  AdminAuditEvent,
  AdminAuditExportQuery,
  AdminAuditQuery,
} from "../../../../../packages/contracts/dist/index.js";

export interface AdminAuditPage {
  events: AdminAuditEvent[];
  nextCursor: string | null;
}

export interface AdminAuditRepository {
  listAuditEvents(query: AdminAuditQuery | AdminAuditExportQuery): Promise<AdminAuditPage>;
}

export class MemoryAdminAuditRepository implements AdminAuditRepository {
  constructor(private readonly events: AdminAuditEvent[] = []) {}

  async listAuditEvents(query: AdminAuditQuery | AdminAuditExportQuery): Promise<AdminAuditPage> {
    const filtered = this.events
      .filter((event) => matchesEvent(event, query))
      .sort(compareAuditEventsDesc);
    const start = query.cursor ? decodeAuditCursor(query.cursor, filtered) : 0;
    const page = filtered.slice(start, start + query.limit + 1);
    const events = page.slice(0, query.limit);
    const hasNextPage = page.length > query.limit;
    return {
      events,
      nextCursor: hasNextPage && events.length ? encodeAuditCursor(events[events.length - 1]) : null,
    };
  }
}

export function encodeAuditCursor(event: Pick<AdminAuditEvent, "auditId" | "occurredAt">) {
  return Buffer.from(JSON.stringify({
    auditId: event.auditId,
    occurredAt: event.occurredAt,
  })).toString("base64url");
}

export function decodeAuditCursorValue(cursor: string): Pick<AdminAuditEvent, "auditId" | "occurredAt"> {
  const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<AdminAuditEvent>;
  if (!parsed.auditId || !parsed.occurredAt) {
    throw new Error("invalid_audit_cursor");
  }
  return {
    auditId: parsed.auditId,
    occurredAt: parsed.occurredAt,
  };
}

function decodeAuditCursor(cursor: string, events: AdminAuditEvent[]) {
  const decoded = decodeAuditCursorValue(cursor);
  const index = events.findIndex(
    (event) => event.auditId === decoded.auditId && event.occurredAt === decoded.occurredAt,
  );
  return index >= 0 ? index + 1 : 0;
}

function matchesEvent(event: AdminAuditEvent, query: AdminAuditQuery | AdminAuditExportQuery) {
  if (query.action && event.action !== query.action) return false;
  if (query.actorUserHash && event.actorUserHash !== query.actorUserHash) return false;
  if (query.correlationId && event.correlationId !== query.correlationId) return false;
  if (query.outcome && event.outcome !== query.outcome) return false;
  if (query.resourceHash && event.resourceHash !== query.resourceHash) return false;
  if (query.resourceType && event.resourceType !== query.resourceType) return false;
  if (query.from && event.occurredAt < query.from) return false;
  if (query.to && event.occurredAt > query.to) return false;
  return true;
}

function compareAuditEventsDesc(left: AdminAuditEvent, right: AdminAuditEvent) {
  const byTime = right.occurredAt.localeCompare(left.occurredAt);
  return byTime || right.auditId.localeCompare(left.auditId);
}
