import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  AdminIncidentAcknowledgement,
  AdminIncidentAcknowledgementInput,
  AdminIncidentRepository,
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
  incident_id: string;
  note: string | null;
  status: "acknowledged" | "resolved";
  updated_at: Date | string;
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
        select incident_id, status, note, acknowledged_by_user_id, acknowledged_at, updated_at
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
        select incident_id, status, note, acknowledged_by_user_id, acknowledged_at, updated_at
        from yorso_admin_incident_acknowledgements
        where incident_id = any($1::text[])
      `,
      [incidentIds],
    );
    return new Map(result.rows.map((row) => [row.incident_id, mapAck(row)]));
  }

  async upsertAcknowledgement(input: AdminIncidentAcknowledgementInput) {
    const result = await this.client.query<AdminIncidentAckRow>(
      `
        insert into yorso_admin_incident_acknowledgements (
          incident_id,
          status,
          note,
          acknowledged_by_user_id
        )
        values ($1, $2, $3, $4)
        on conflict (incident_id) do update
        set
          status = excluded.status,
          note = excluded.note,
          acknowledged_by_user_id = excluded.acknowledged_by_user_id,
          updated_at = now()
        returning incident_id, status, note, acknowledged_by_user_id, acknowledged_at, updated_at
      `,
      [input.incidentId, input.status, input.note?.trim() || null, input.acknowledgedByUserId],
    );
    return mapAck(result.rows[0]);
  }
}

const iso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

function mapAck(row: AdminIncidentAckRow): AdminIncidentAcknowledgement {
  return {
    acknowledgedAt: iso(row.acknowledged_at),
    acknowledgedByUserId: row.acknowledged_by_user_id,
    incidentId: row.incident_id,
    note: row.note,
    status: row.status,
    updatedAt: iso(row.updated_at),
  };
}
