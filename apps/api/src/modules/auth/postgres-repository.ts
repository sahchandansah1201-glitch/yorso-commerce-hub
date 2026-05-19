import { randomBytes } from "node:crypto";
import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { AuthSession } from "../../../../../packages/contracts/dist/index.js";
import type { ApiConfig } from "../../config.js";
import type {
  AuthRepository,
  AuthSecurityEventCountQuery,
  AuthSecurityEventInput,
  AuthUser,
} from "./repository.js";

export interface AuthQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface PostgresAuthRepositoryOptions {
  client?: AuthQueryClient;
}

interface AuthUserRow extends Record<string, unknown> {
  id: string;
  email: string;
  display_name: string;
  password_secret: string;
}

interface AuthSessionRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  issued_at: Date | string;
  expires_at: Date | string;
}

const createSessionId = () => randomBytes(32).toString("hex");
const ensureIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

function mapUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordSecret: row.password_secret,
  };
}

function mapSession(row: AuthSessionRow): AuthSession {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    issuedAt: ensureIso(row.issued_at),
    expiresAt: ensureIso(row.expires_at),
  };
}

export class PostgresAuthRepository implements AuthRepository {
  private readonly client: AuthQueryClient;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: PostgresAuthRepositoryOptions = {}) {
    this.client =
      options.client ??
      new Pool({
        connectionString: config.databaseUrl,
        max: 5,
        application_name: "yorso-api-auth",
      } satisfies PoolConfig);
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const result = await this.client.query<AuthUserRow>(
      `
        select
          u.id,
          u.email::text as email,
          trim(u.first_name || ' ' || u.last_name) as display_name,
          c.password_secret
        from yorso_users u
        join yorso_auth_credentials c on c.user_id = u.id
        where u.email = $1::citext
          and c.disabled_at is null
        limit 1
      `,
      [email.toLowerCase()],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async createSession(
    user: Pick<AuthUser, "id" | "email" | "displayName">,
    ttlMs: number,
  ): Promise<AuthSession> {
    const sessionId = createSessionId();
    const result = await this.client.query<AuthSessionRow>(
      `
        insert into yorso_auth_sessions (id, user_id, expires_at)
        values ($1, $2, now() + ($3::bigint * interval '1 millisecond'))
        returning
          id,
          user_id,
          $4::text as email,
          $5::text as display_name,
          issued_at,
          expires_at
      `,
      [sessionId, user.id, ttlMs, user.email.toLowerCase(), user.displayName],
    );
    return mapSession(result.rows[0]);
  }

  async getSession(sessionId: string): Promise<AuthSession | null> {
    const result = await this.client.query<AuthSessionRow>(
      `
        update yorso_auth_sessions s
        set last_seen_at = now()
        from yorso_users u
        where s.user_id = u.id
          and s.id = $1
          and s.revoked_at is null
          and s.expires_at > now()
        returning
          s.id,
          s.user_id,
          u.email::text as email,
          trim(u.first_name || ' ' || u.last_name) as display_name,
          s.issued_at,
          s.expires_at
      `,
      [sessionId],
    );
    return result.rows[0] ? mapSession(result.rows[0]) : null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await this.client.query<{ id: string }>(
      `
        update yorso_auth_sessions
        set revoked_at = now()
        where id = $1
          and revoked_at is null
        returning id
      `,
      [sessionId],
    );
    return result.rows.length > 0;
  }

  async recordSecurityEvent(event: AuthSecurityEventInput): Promise<void> {
    await this.client.query(
      `
        insert into yorso_auth_security_events (
          event_type,
          user_id,
          email,
          session_id,
          request_id,
          metadata
        )
        values ($1::yorso_auth_security_event_type, $2, $3::citext, $4, $5, $6::jsonb)
      `,
      [
        event.eventType,
        event.userId ?? null,
        event.email?.toLowerCase() ?? null,
        event.sessionId ?? null,
        event.requestId,
        JSON.stringify(event.metadata ?? {}),
      ],
    );
  }

  async countRecentSecurityEvents(query: AuthSecurityEventCountQuery): Promise<number> {
    const result = await this.client.query<{ count: string }>(
      `
        select count(*)::text as count
        from yorso_auth_security_events
        where event_type = $1::yorso_auth_security_event_type
          and ($2::citext is null or email = $2::citext)
          and occurred_at >= $3
      `,
      [query.eventType, query.email?.toLowerCase() ?? null, query.since.toISOString()],
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}
