import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  SupplierAccessDecision,
  SupplierAccessEventType,
  SupplierAccessGrant,
  SupplierAccessGrantScope,
  SupplierAccessNotification,
  SupplierAccessRequest,
  SupplierAccessStatus,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierAccessRepository } from "./repository.js";

export interface SupplierAccessQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface PostgresSupplierAccessRepositoryOptions {
  client?: SupplierAccessQueryClient;
}

interface AccessRequestRow extends Record<string, unknown> {
  id: string;
  buyer_user_id: string;
  supplier_id: string;
  status: SupplierAccessStatus;
  intent: "exact_price";
  message: string;
  created_at: Date | string;
  updated_at: Date | string;
  decided_at: Date | string | null;
  decided_by_user_id: string | null;
}

interface AccessGrantRow extends Record<string, unknown> {
  id: string;
  buyer_user_id: string;
  supplier_id: string;
  scope: SupplierAccessGrantScope;
  offer_id: string | null;
  granted_by_user_id: string | null;
  granted_at: Date | string;
  expires_at: Date | string | null;
}

interface AccessNotificationRow extends Record<string, unknown> {
  id: string;
  buyer_user_id: string;
  supplier_id: string;
  type: "price_access_approved";
  title: string;
  body: string;
  status: "unread" | "read";
  created_at: Date | string;
  read_at: Date | string | null;
}

const ensureIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());
const ensureIsoNullable = (value: Date | string | null) => (value == null ? null : ensureIso(value));

const mapRequest = (row: AccessRequestRow): SupplierAccessRequest => ({
  id: row.id,
  buyerUserId: row.buyer_user_id,
  supplierId: row.supplier_id,
  status: row.status,
  intent: row.intent,
  message: row.message,
  createdAt: ensureIso(row.created_at),
  updatedAt: ensureIso(row.updated_at),
  decidedAt: ensureIsoNullable(row.decided_at),
  decidedByUserId: row.decided_by_user_id,
});

const mapGrant = (row: AccessGrantRow): SupplierAccessGrant => ({
  id: row.id,
  buyerUserId: row.buyer_user_id,
  supplierId: row.supplier_id,
  scope: row.scope,
  offerId: row.offer_id,
  grantedByUserId: row.granted_by_user_id,
  grantedAt: ensureIso(row.granted_at),
  expiresAt: ensureIsoNullable(row.expires_at),
});

const mapNotification = (row: AccessNotificationRow): SupplierAccessNotification => ({
  id: row.id,
  buyerUserId: row.buyer_user_id,
  supplierId: row.supplier_id,
  type: row.type,
  title: row.title,
  body: row.body,
  status: row.status,
  createdAt: ensureIso(row.created_at),
  readAt: ensureIsoNullable(row.read_at),
});

const eventTypeForStatus = (status: SupplierAccessStatus): SupplierAccessEventType => {
  if (status === "pending") return "supplier_access_pending";
  if (status === "approved") return "supplier_access_approved";
  if (status === "rejected") return "supplier_access_rejected";
  if (status === "revoked") return "supplier_access_revoked";
  return "supplier_access_requested";
};

export class PostgresSupplierAccessRepository implements SupplierAccessRepository {
  private readonly client: SupplierAccessQueryClient;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: PostgresSupplierAccessRepositoryOptions = {}) {
    this.client = options.client ?? new Pool({ connectionString: config.databaseUrl } satisfies PoolConfig);
  }

  async getRequest(input: { buyerUserId: string; supplierId: string }) {
    const result = await this.client.query<AccessRequestRow>(
      `
        select *
        from yorso_supplier_access_requests
        where buyer_user_id = $1 and supplier_id = $2
        limit 1
      `,
      [input.buyerUserId, input.supplierId],
    );
    return result.rows[0] ? mapRequest(result.rows[0]) : null;
  }

  async createOrReuseRequest(input: { buyerUserId: string; supplierId: string; message?: string }) {
    const existing = await this.getRequest(input);
    if (existing) return existing;

    const result = await this.client.query<AccessRequestRow>(
      `
        insert into yorso_supplier_access_requests (buyer_user_id, supplier_id, status, intent, message)
        values ($1, $2, 'sent', 'exact_price', $3)
        on conflict (buyer_user_id, supplier_id) do update
          set updated_at = yorso_supplier_access_requests.updated_at
        returning *
      `,
      [input.buyerUserId, input.supplierId, input.message ?? ""],
    );
    const request = mapRequest(result.rows[0]);
    await this.insertEvent(request, "supplier_access_requested", input.buyerUserId);
    return request;
  }

  async decideRequest(input: {
    requestId: string;
    actorUserId: string;
    decision: SupplierAccessDecision;
  }) {
    const result = await this.client.query<AccessRequestRow>(
      `
        update yorso_supplier_access_requests
        set status = $2,
            message = coalesce($3, message),
            decided_at = now(),
            decided_by_user_id = $4,
            updated_at = now()
        where id = $1
        returning *
      `,
      [input.requestId, input.decision.status, input.decision.message ?? null, input.actorUserId],
    );
    if (!result.rows[0]) throw new Error("supplier_access_request_not_found");

    const request = mapRequest(result.rows[0]);
    await this.insertEvent(request, eventTypeForStatus(request.status), input.actorUserId);

    const grants = request.status === "approved" ? await this.upsertApprovalGrants(request, input.actorUserId) : [];
    const notification = request.status === "approved" ? await this.createApprovalNotification(request) : null;

    return { request, grants, notification };
  }

  async hasSupplierAccess(input: { buyerUserId: string; supplierId: string }) {
    const result = await this.client.query<{ exists: boolean }>(
      `
        select exists (
          select 1
          from yorso_access_grants
          where buyer_user_id = $1
            and supplier_id = $2
            and scope = 'supplier_identity'
            and (expires_at is null or expires_at > now())
        ) as exists
      `,
      [input.buyerUserId, input.supplierId],
    );
    return Boolean(result.rows[0]?.exists);
  }

  async listAccessibleSupplierIds(input: { buyerUserId: string }) {
    const result = await this.client.query<{ supplier_id: string }>(
      `
        select distinct supplier_id
        from yorso_access_grants
        where buyer_user_id = $1
          and scope = 'supplier_identity'
          and (expires_at is null or expires_at > now())
        order by supplier_id asc
      `,
      [input.buyerUserId],
    );
    return result.rows.map((row) => row.supplier_id);
  }

  async listNotifications(input: { buyerUserId: string; limit: number; offset: number }) {
    const result = await this.client.query<AccessNotificationRow>(
      `
        select *
        from yorso_access_notifications
        where buyer_user_id = $1
        order by created_at desc, id asc
        limit $2
        offset $3
      `,
      [input.buyerUserId, input.limit, input.offset],
    );
    return result.rows.map(mapNotification);
  }

  private async insertEvent(
    request: SupplierAccessRequest,
    eventType: SupplierAccessEventType,
    actorUserId: string | null,
  ) {
    await this.client.query(
      `
        insert into yorso_access_events (buyer_user_id, supplier_id, request_id, event_type, actor_user_id, metadata)
        values ($1, $2, $3, $4, $5, '{}'::jsonb)
      `,
      [request.buyerUserId, request.supplierId, request.id, eventType, actorUserId],
    );
  }

  private async upsertApprovalGrants(request: SupplierAccessRequest, actorUserId: string) {
    const result = await this.client.query<AccessGrantRow>(
      `
        insert into yorso_access_grants (buyer_user_id, supplier_id, scope, offer_id, granted_by_user_id)
        values
          ($1, $2, 'supplier_identity', null, $3),
          ($1, $2, 'offer_price', null, $3)
        on conflict (buyer_user_id, supplier_id, scope, offer_id_key) do update
          set granted_by_user_id = excluded.granted_by_user_id,
              granted_at = now(),
              expires_at = null
        returning *
      `,
      [request.buyerUserId, request.supplierId, actorUserId],
    );
    return result.rows.map(mapGrant);
  }

  private async createApprovalNotification(request: SupplierAccessRequest) {
    const result = await this.client.query<AccessNotificationRow>(
      `
        insert into yorso_access_notifications (buyer_user_id, supplier_id, type, title, body)
        values (
          $1,
          $2,
          'price_access_approved',
          'Price access approved',
          'The supplier approved your request. Exact prices and supplier details are now available.'
        )
        returning *
      `,
      [request.buyerUserId, request.supplierId],
    );
    const notification = mapNotification(result.rows[0]);
    await this.client.query(
      `
        insert into yorso_access_events (buyer_user_id, supplier_id, request_id, event_type, actor_user_id, metadata)
        values ($1, $2, $3, 'notification_created', null, $4)
      `,
      [
        request.buyerUserId,
        request.supplierId,
        request.id,
        JSON.stringify({ notificationId: notification.id }),
      ],
    );
    return notification;
  }
}
