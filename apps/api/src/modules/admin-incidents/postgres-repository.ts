import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  AdminIncidentAcknowledgement,
  AdminIncidentAcknowledgementInput,
  AdminIncidentRepository,
  AdminIncidentWorkflowEvent,
  AdminIncidentWorkflowEventInput,
  AdminIncidentWorkflowStateInput,
} from "./repository.js";

export interface AdminIncidentQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface AdminIncidentAckRow extends Record<string, unknown> {
  acknowledged_at: Date | string;
  acknowledged_by_user_id: string;
  assigned_at: Date | string | null;
  assigned_to_user_id: string | null;
  escalated_at: Date | string | null;
  escalation_level: "none" | "lead" | "engineering" | "executive";
  incident_id: string;
  note: string | null;
  resolved_at: Date | string | null;
  status: "acknowledged" | "resolved";
  updated_at: Date | string;
}

interface AdminIncidentEventRow extends Record<string, unknown> {
  actor_user_id: string;
  assigned_to_user_id: string | null;
  escalation_level: "none" | "lead" | "engineering" | "executive" | null;
  event_id: string;
  event_type: "created" | "acknowledged" | "assigned" | "commented" | "escalated" | "resolved";
  incident_id: string;
  note: string | null;
  occurred_at: Date | string;
  status: "open" | "acknowledged" | "resolved" | null;
}

export class PostgresAdminIncidentRepository implements AdminIncidentRepository {
  private readonly client: AdminIncidentQueryClient;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: { client?: AdminIncidentQueryClient } = {}) {
    this.client = options.client ?? new Pool({
      connectionString: config.databaseUrl,
      max: 5,
      application_name: "yorso-api-admin-incidents",
    } satisfies PoolConfig);
  }

  async getAcknowledgement(incidentId: string) {
    const result = await this.client.query<AdminIncidentAckRow>(
      `
        select
          incident_id,
          status,
          note,
          acknowledged_by_user_id,
          acknowledged_at,
          assigned_to_user_id,
          assigned_at,
          escalation_level,
          escalated_at,
          resolved_at,
          updated_at
        from yorso_admin_incident_acknowledgements
        where incident_id = $1
      `,
      [incidentId],
    );
    return result.rows[0] ? mapAck(result.rows[0]) : null;
  }

  async listAcknowledgements(incidentIds: string[]) {
    if (incidentIds.length === 0) return new Map();
    const result = await this.client.query<AdminIncidentAckRow>(
      `
        select
          incident_id,
          status,
          note,
          acknowledged_by_user_id,
          acknowledged_at,
          assigned_to_user_id,
          assigned_at,
          escalation_level,
          escalated_at,
          resolved_at,
          updated_at
        from yorso_admin_incident_acknowledgements
        where incident_id = any($1::text[])
      `,
      [incidentIds],
    );
    return new Map(result.rows.map((row) => [row.incident_id, mapAck(row)]));
  }

  async listEvents(incidentIds: string[]) {
    if (incidentIds.length === 0) return new Map();
    const result = await this.client.query<AdminIncidentEventRow>(
      `
        select
          event_id,
          incident_id,
          event_type,
          actor_user_id,
          assigned_to_user_id,
          escalation_level,
          status,
          note,
          occurred_at
        from yorso_admin_incident_events
        where incident_id = any($1::text[])
        order by incident_id asc, occurred_at asc, event_id asc
      `,
      [incidentIds],
    );
    const output = new Map<string, AdminIncidentWorkflowEvent[]>();
    for (const row of result.rows) {
      const event = mapEvent(row);
      const current = output.get(event.incidentId) ?? [];
      current.push(event);
      output.set(event.incidentId, current);
    }
    return output;
  }

  async upsertAcknowledgement(input: AdminIncidentAcknowledgementInput) {
    return this.upsertWorkflowState(input);
  }

  async upsertWorkflowState(input: AdminIncidentWorkflowStateInput) {
    const result = await this.client.query<AdminIncidentAckRow>(
      `
        insert into yorso_admin_incident_acknowledgements (
          incident_id,
          status,
          note,
          acknowledged_by_user_id,
          assigned_to_user_id,
          assigned_at,
          escalation_level,
          escalated_at,
          resolved_at
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          case when $5::uuid is null then null else now() end,
          $6,
          case when $6::text = 'none' then null else now() end,
          case when $2::text = 'resolved' then now() else null end
        )
        on conflict (incident_id) do update
        set
          status = excluded.status,
          note = coalesce(excluded.note, yorso_admin_incident_acknowledgements.note),
          acknowledged_by_user_id = excluded.acknowledged_by_user_id,
          assigned_to_user_id = coalesce(
            excluded.assigned_to_user_id,
            yorso_admin_incident_acknowledgements.assigned_to_user_id
          ),
          assigned_at = coalesce(excluded.assigned_at, yorso_admin_incident_acknowledgements.assigned_at),
          escalation_level = case
            when excluded.escalation_level <> 'none' then excluded.escalation_level
            else yorso_admin_incident_acknowledgements.escalation_level
          end,
          escalated_at = coalesce(excluded.escalated_at, yorso_admin_incident_acknowledgements.escalated_at),
          resolved_at = case
            when excluded.status = 'resolved' then coalesce(yorso_admin_incident_acknowledgements.resolved_at, now())
            else yorso_admin_incident_acknowledgements.resolved_at
          end,
          updated_at = now()
        returning
          incident_id,
          status,
          note,
          acknowledged_by_user_id,
          acknowledged_at,
          assigned_to_user_id,
          assigned_at,
          escalation_level,
          escalated_at,
          resolved_at,
          updated_at
      `,
      [
        input.incidentId,
        input.status,
        input.note?.trim() || null,
        input.acknowledgedByUserId,
        input.assignedToUserId ?? null,
        input.escalationLevel ?? "none",
      ],
    );
    return mapAck(result.rows[0]);
  }

  async appendEvent(input: AdminIncidentWorkflowEventInput) {
    const result = await this.client.query<AdminIncidentEventRow>(
      `
        insert into yorso_admin_incident_events (
          incident_id,
          event_type,
          actor_user_id,
          assigned_to_user_id,
          escalation_level,
          status,
          note
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning
          event_id,
          incident_id,
          event_type,
          actor_user_id,
          assigned_to_user_id,
          escalation_level,
          status,
          note,
          occurred_at
      `,
      [
        input.incidentId,
        input.type,
        input.actorUserId,
        input.assignedToUserId ?? null,
        input.escalationLevel ?? null,
        input.status ?? null,
        input.note?.trim() || null,
      ],
    );
    return mapEvent(result.rows[0]);
  }
}

const iso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());
const nullableIso = (value: Date | string | null) => (value ? iso(value) : null);

function mapAck(row: AdminIncidentAckRow): AdminIncidentAcknowledgement {
  return {
    acknowledgedAt: iso(row.acknowledged_at),
    acknowledgedByUserId: row.acknowledged_by_user_id,
    assignedAt: nullableIso(row.assigned_at),
    assignedToUserId: row.assigned_to_user_id,
    escalatedAt: nullableIso(row.escalated_at),
    escalationLevel: row.escalation_level,
    incidentId: row.incident_id,
    note: row.note,
    resolvedAt: nullableIso(row.resolved_at),
    status: row.status,
    updatedAt: iso(row.updated_at),
  };
}

function mapEvent(row: AdminIncidentEventRow): AdminIncidentWorkflowEvent {
  return {
    actorUserId: row.actor_user_id,
    assignedToUserId: row.assigned_to_user_id,
    escalationLevel: row.escalation_level,
    eventId: row.event_id,
    incidentId: row.incident_id,
    note: row.note,
    occurredAt: iso(row.occurred_at),
    status: row.status,
    type: row.event_type,
  };
}
