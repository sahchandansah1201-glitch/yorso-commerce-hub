import { Pool, type PoolConfig, type QueryResult } from "pg";
import type {
  AdminAuditEvent,
  AdminAuditExportQuery,
  AdminAuditQuery,
} from "../../../../../packages/contracts/dist/index.js";
import type { ApiConfig } from "../../config.js";
import { decodeAuditCursorValue, encodeAuditCursor, type AdminAuditPage, type AdminAuditRepository } from "./repository.js";

export interface AdminAuditQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface AdminAuditEventRow extends Record<string, unknown> {
  audit_id: string;
  occurred_at: Date | string;
  request_id: string;
  correlation_id: string;
  action: string;
  outcome: AdminAuditEvent["outcome"];
  http_method: string | null;
  route: string | null;
  status_code: number | null;
  actor_user_hash: string | null;
  session_hash: string | null;
  resource_type: string | null;
  resource_hash: string | null;
  reason: string | null;
}

function mapAuditEvent(row: AdminAuditEventRow): AdminAuditEvent {
  return {
    auditId: row.audit_id,
    occurredAt: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : new Date(row.occurred_at).toISOString(),
    requestId: row.request_id,
    correlationId: row.correlation_id,
    action: row.action,
    outcome: row.outcome,
    httpMethod: row.http_method,
    route: row.route,
    statusCode: row.status_code,
    actorUserHash: row.actor_user_hash,
    sessionHash: row.session_hash,
    resourceType: row.resource_type,
    resourceHash: row.resource_hash,
    reason: row.reason,
  };
}

export class PostgresAdminAuditRepository implements AdminAuditRepository {
  private readonly client: AdminAuditQueryClient;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: { client?: AdminAuditQueryClient } = {}) {
    this.client =
      options.client ??
      new Pool({
        connectionString: config.databaseUrl,
        max: 5,
        application_name: "yorso-api-admin-audit",
      } satisfies PoolConfig);
  }

  async listAuditEvents(query: AdminAuditQuery | AdminAuditExportQuery): Promise<AdminAuditPage> {
    const { where, params } = buildWhereClause(query);
    const result = await this.client.query<AdminAuditEventRow>(
      `
        select
          audit_id,
          occurred_at,
          request_id,
          correlation_id,
          action,
          outcome,
          http_method,
          route,
          status_code,
          actor_user_hash,
          session_hash,
          resource_type,
          resource_hash,
          reason
        from yorso_api_audit_events
        ${where}
        order by occurred_at desc, audit_id desc
        limit $${params.length + 1}
      `,
      [...params, query.limit + 1],
    );
    const page = result.rows.map(mapAuditEvent);
    const events = page.slice(0, query.limit);
    const hasNextPage = page.length > query.limit;
    return {
      events,
      nextCursor: hasNextPage && events.length ? encodeAuditCursor(events[events.length - 1]) : null,
    };
  }

  async countAuditEventsBefore(cutoff: string): Promise<number> {
    const result = await this.client.query<{ total: string | number }>(
      `
        select count(*)::bigint as total
        from yorso_api_audit_events
        where occurred_at < $1
      `,
      [cutoff],
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async purgeAuditEventsBefore(cutoff: string, options: { batchSize: number; maxBatches: number }) {
    let deletedCount = 0;
    let batchesRun = 0;
    for (let batch = 0; batch < options.maxBatches; batch += 1) {
      const result = await this.client.query<{ deleted_count: string | number }>(
        "select yorso_purge_api_audit_events_batch($1, $2) as deleted_count",
        [cutoff, options.batchSize],
      );
      const batchDeleted = Number(result.rows[0]?.deleted_count ?? 0);
      if (batchDeleted <= 0) break;
      deletedCount += batchDeleted;
      batchesRun += 1;
      if (batchDeleted < options.batchSize) break;
    }
    return { batchesRun, deletedCount };
  }
}

function buildWhereClause(query: AdminAuditQuery | AdminAuditExportQuery) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const push = (clause: string, value: unknown) => {
    params.push(value);
    clauses.push(clause.replace("?", `$${params.length}`));
  };

  if (query.action) push("action = ?", query.action);
  if (query.actorUserHash) push("actor_user_hash = ?", query.actorUserHash);
  if (query.correlationId) push("correlation_id = ?", query.correlationId);
  if (query.outcome) push("outcome = ?", query.outcome);
  if (query.resourceHash) push("resource_hash = ?", query.resourceHash);
  if (query.resourceType) push("resource_type = ?", query.resourceType);
  if (query.route) push("route = ?", query.route);
  if (query.statusCode) push("status_code = ?", query.statusCode);
  if (query.statusClass) {
    const statusClassStart = Number(query.statusClass[0]) * 100;
    params.push(statusClassStart, statusClassStart + 99);
    clauses.push(`status_code between $${params.length - 1} and $${params.length}`);
  }
  if (query.from) push("occurred_at >= ?", query.from);
  if (query.to) push("occurred_at <= ?", query.to);
  if (query.cursor) {
    const cursor = decodeAuditCursorValue(query.cursor);
    params.push(cursor.occurredAt, cursor.occurredAt, cursor.auditId);
    clauses.push(`(occurred_at < $${params.length - 2} or (occurred_at = $${params.length - 1} and audit_id < $${params.length}))`);
  }

  return {
    params,
    where: clauses.length ? `where ${clauses.join(" and ")}` : "",
  };
}
