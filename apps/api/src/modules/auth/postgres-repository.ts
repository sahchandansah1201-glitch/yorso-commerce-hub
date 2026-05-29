import { randomBytes } from "node:crypto";
import { Pool, type PoolConfig, type QueryResult } from "pg";
import type {
  AdminUserRole,
  AuthRegisterDetails,
  AuthRegisterMarkets,
  AuthRegisterOnboarding,
  AuthRegisterPhoneRequest,
  AuthRegisterStart,
  AuthSession,
} from "../../../../../packages/contracts/dist/index.js";
import type { ApiConfig } from "../../config.js";
import type {
  AuthRepository,
  RegistrationCompleteResult,
  RegistrationDeliveryOutboxEntry,
  RegistrationDraftDeliveryResult,
  RegistrationDraft,
  AuthSecurityEventCountQuery,
  AuthSecurityEventInput,
  AuthUser,
  RegistrationDeliveryFailureInput,
  RegistrationDeliveryJob,
  RegistrationDeliveryLeaseInput,
} from "./repository.js";
import {
  createRegistrationVerificationCodeCodec,
  type RegistrationVerificationCodeCodec,
} from "./verification-code.js";

export interface AuthQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface PostgresAuthRepositoryOptions {
  codeCodec?: RegistrationVerificationCodeCodec;
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

interface RegistrationDraftRow extends Record<string, unknown> {
  categories: string[];
  certifications: string[];
  company_name: string | null;
  country: string | null;
  country_code: string | null;
  email: string;
  email_code_attempt_count: number;
  email_code_expires_at: Date | string;
  email_code_secret: string;
  email_verified_at: Date | string | null;
  expires_at: Date | string;
  full_name: string | null;
  id: string;
  password_secret: string | null;
  phone: string | null;
  phone_code_attempt_count: number;
  phone_code_expires_at: Date | string | null;
  phone_code_requests: number;
  phone_code_secret: string | null;
  phone_verified_at: Date | string | null;
  role: "buyer" | "supplier";
  target_countries: string[];
  vat_tin: string | null;
  volume: string;
}

interface RegistrationCompleteRow extends Record<string, unknown> {
  company: string;
  country: string;
  display_name: string;
  email: string;
  expires_at: Date | string;
  full_name: string;
  issued_at: Date | string;
  role: "buyer" | "supplier";
  session_id: string;
  user_id: string;
}

interface RegistrationDeliveryOutboxRow extends Record<string, unknown> {
  delivery_attempt_count: number;
  delivery_available_at: Date | string;
  delivery_channel: "email" | "sms" | "whatsapp";
  delivery_created_at: Date | string;
  delivery_destination_preview: string;
  delivery_draft_id: string;
  delivery_id: string;
  delivery_locked_at: Date | string | null;
  delivery_locked_by: string | null;
  delivery_max_attempts: number;
  delivery_purpose: "email_verification" | "phone_verification";
  delivery_status: "queued" | "leased" | "sent" | "failed" | "cancelled";
  delivery_template_key: string;
  delivery_updated_at: Date | string;
}

type RegistrationDraftDeliveryRow = RegistrationDraftRow & RegistrationDeliveryOutboxRow;

interface RegistrationDeliveryJobRow extends RegistrationDeliveryOutboxRow {
  delivery_destination: string | null;
  delivery_verification_code_sealed: string | null;
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

function mapDraft(row: RegistrationDraftRow): RegistrationDraft {
  return {
    categories: row.categories ?? [],
    certifications: row.certifications ?? [],
    companyName: row.company_name,
    country: row.country,
    countryCode: row.country_code,
    email: row.email,
    emailCodeAttemptCount: row.email_code_attempt_count,
    emailCodeExpiresAt: ensureIso(row.email_code_expires_at),
    emailCodeSecret: row.email_code_secret,
    emailVerifiedAt: row.email_verified_at ? ensureIso(row.email_verified_at) : null,
    expiresAt: ensureIso(row.expires_at),
    fullName: row.full_name,
    id: row.id,
    passwordSecret: row.password_secret,
    phone: row.phone,
    phoneCodeAttemptCount: row.phone_code_attempt_count,
    phoneCodeExpiresAt: row.phone_code_expires_at ? ensureIso(row.phone_code_expires_at) : null,
    phoneCodeRequests: row.phone_code_requests,
    phoneCodeSecret: row.phone_code_secret,
    phoneVerifiedAt: row.phone_verified_at ? ensureIso(row.phone_verified_at) : null,
    role: row.role,
    targetCountries: row.target_countries ?? [],
    vatTin: row.vat_tin,
    volume: row.volume,
  };
}

function mapDelivery(row: RegistrationDeliveryOutboxRow): RegistrationDeliveryOutboxEntry {
  return {
    attemptCount: row.delivery_attempt_count,
    availableAt: ensureIso(row.delivery_available_at),
    channel: row.delivery_channel,
    createdAt: ensureIso(row.delivery_created_at),
    destinationPreview: row.delivery_destination_preview,
    draftId: row.delivery_draft_id,
    id: row.delivery_id,
    lockedAt: row.delivery_locked_at ? ensureIso(row.delivery_locked_at) : null,
    lockedBy: row.delivery_locked_by,
    maxAttempts: row.delivery_max_attempts,
    purpose: row.delivery_purpose,
    status: row.delivery_status,
    templateKey: row.delivery_template_key,
    updatedAt: ensureIso(row.delivery_updated_at),
  };
}

function mapDeliveryJob(row: RegistrationDeliveryJobRow, codeCodec: RegistrationVerificationCodeCodec): RegistrationDeliveryJob | null {
  if (!row.delivery_destination) return null;
  if (!row.delivery_verification_code_sealed) return null;
  return {
    ...mapDelivery(row),
    destination: row.delivery_destination,
    verificationCode: codeCodec.open(row.delivery_verification_code_sealed),
  };
}

const deliveryReturningSql = `
  id::text as delivery_id,
  draft_id as delivery_draft_id,
  purpose as delivery_purpose,
  channel as delivery_channel,
  status as delivery_status,
  destination_preview as delivery_destination_preview,
  template_key as delivery_template_key,
  attempt_count as delivery_attempt_count,
  max_attempts as delivery_max_attempts,
  available_at as delivery_available_at,
  locked_at as delivery_locked_at,
  locked_by as delivery_locked_by,
  created_at as delivery_created_at,
  updated_at as delivery_updated_at
`;

function mapDraftDelivery(row: RegistrationDraftDeliveryRow): RegistrationDraftDeliveryResult {
  return {
    delivery: mapDelivery(row),
    draft: mapDraft(row),
  };
}

const draftReturningSql = draftReturningSqlFrom();

function draftReturningSqlFrom(alias = "") {
  const prefix = alias ? `${alias}.` : "";
  return `
    ${prefix}id,
    ${prefix}email::text as email,
    ${prefix}role,
    ${prefix}email_code_secret,
    ${prefix}email_code_expires_at,
    ${prefix}email_code_attempt_count,
    ${prefix}email_verified_at,
    ${prefix}phone,
    ${prefix}phone_code_secret,
    ${prefix}phone_code_expires_at,
    ${prefix}phone_code_attempt_count,
    ${prefix}phone_code_requests,
    ${prefix}phone_verified_at,
    ${prefix}full_name,
    ${prefix}company_name,
    ${prefix}country,
    ${prefix}country_code,
    ${prefix}vat_tin,
    ${prefix}password_secret,
    ${prefix}categories,
    ${prefix}certifications,
    ${prefix}target_countries,
    ${prefix}volume,
    ${prefix}expires_at
  `;
}

export class PostgresAuthRepository implements AuthRepository {
  private readonly client: AuthQueryClient;
  private readonly codeCodec: RegistrationVerificationCodeCodec;

  constructor(config: Pick<ApiConfig, "databaseUrl" | "registrationVerificationCodeSecret">, options: PostgresAuthRepositoryOptions = {}) {
    this.client =
      options.client ??
      new Pool({
        connectionString: config.databaseUrl,
        max: 5,
        application_name: "yorso-api-auth",
      } satisfies PoolConfig);
    this.codeCodec = options.codeCodec ?? createRegistrationVerificationCodeCodec(config.registrationVerificationCodeSecret);
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

  async startRegistrationDraft(
    input: AuthRegisterStart & {
      delivery: Parameters<AuthRepository["startRegistrationDraft"]>[0]["delivery"];
      emailCodeExpiresAt: Date;
      emailCodeSecret: string;
      expiresAt: Date;
    },
  ) {
    const sessionId = createSessionId();
    const result = await this.client.query<RegistrationDraftDeliveryRow>(
      `
        with inserted_draft as (
          insert into yorso_registration_drafts (
            id,
            email,
            role,
            email_code_secret,
            email_code_expires_at,
            expires_at
          )
          values ($1, $2::citext, $3, $4, $5, $6)
          returning *
        ),
        inserted_delivery as (
          insert into yorso_registration_delivery_outbox (
            draft_id,
            purpose,
            channel,
            destination_hash,
            destination_preview,
            template_key,
            verification_code_sealed,
            request_id
          )
          select
            inserted_draft.id,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13::uuid
          from inserted_draft
          returning ${deliveryReturningSql}
        )
        select
          ${draftReturningSqlFrom("inserted_draft")},
          inserted_delivery.*
        from inserted_draft
        cross join inserted_delivery
      `,
      [
        sessionId,
        input.email.toLowerCase(),
        input.role,
        input.emailCodeSecret,
        input.emailCodeExpiresAt.toISOString(),
        input.expiresAt.toISOString(),
        input.delivery.purpose,
        input.delivery.channel,
        input.delivery.destinationHash,
        input.delivery.destinationPreview,
        input.delivery.templateKey,
        this.codeCodec.seal(input.delivery.verificationCode),
        input.delivery.requestId,
      ],
    );
    return mapDraftDelivery(result.rows[0]);
  }

  async getRegistrationDraft(sessionId: string): Promise<RegistrationDraft | null> {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        select ${draftReturningSql}
        from yorso_registration_drafts
        where id = $1
          and completed_at is null
          and expires_at > now()
        limit 1
      `,
      [sessionId],
    );
    return result.rows[0] ? mapDraft(result.rows[0]) : null;
  }

  async markRegistrationEmailVerified(sessionId: string) {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        update yorso_registration_drafts
        set email_verified_at = now(),
            updated_at = now()
        where id = $1
          and completed_at is null
          and expires_at > now()
        returning ${draftReturningSql}
      `,
      [sessionId],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraft(result.rows[0]);
  }

  async recordRegistrationEmailCodeAttempt(sessionId: string) {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        update yorso_registration_drafts
        set email_code_attempt_count = email_code_attempt_count + 1,
            updated_at = now()
        where id = $1
          and completed_at is null
          and expires_at > now()
        returning ${draftReturningSql}
      `,
      [sessionId],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraft(result.rows[0]);
  }

  async updateRegistrationDetails(
    sessionId: string,
    input: AuthRegisterDetails & { countryCode: string; passwordSecret: string },
  ) {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        update yorso_registration_drafts
        set full_name = $2,
            company_name = $3,
            country = $4,
            country_code = $5,
            vat_tin = $6,
            password_secret = $7,
            updated_at = now()
        where id = $1
          and completed_at is null
          and expires_at > now()
        returning ${draftReturningSql}
      `,
      [sessionId, input.fullName, input.company, input.country, input.countryCode, input.vatTin, input.passwordSecret],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraft(result.rows[0]);
  }

  async recordRegistrationPhoneRequest(
    sessionId: string,
    input: AuthRegisterPhoneRequest & {
      delivery: Parameters<AuthRepository["recordRegistrationPhoneRequest"]>[1]["delivery"];
      phoneCodeExpiresAt: Date;
      phoneCodeSecret: string;
    },
  ) {
    const result = await this.client.query<RegistrationDraftDeliveryRow>(
      `
        with updated_draft as (
          update yorso_registration_drafts
          set phone = $2,
              phone_code_secret = $3,
              phone_code_expires_at = $4,
              phone_code_attempt_count = 0,
              phone_code_requests = phone_code_requests + 1,
              phone_verified_at = null,
              updated_at = now()
          where id = $1
            and completed_at is null
            and expires_at > now()
            and phone_code_requests < 5
          returning *
        ),
        inserted_delivery as (
          insert into yorso_registration_delivery_outbox (
            draft_id,
            purpose,
            channel,
            destination_hash,
            destination_preview,
            template_key,
            verification_code_sealed,
            request_id
          )
          select
            updated_draft.id,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11::uuid
          from updated_draft
          returning ${deliveryReturningSql}
        )
        select
          ${draftReturningSqlFrom("updated_draft")},
          inserted_delivery.*
        from updated_draft
        cross join inserted_delivery
      `,
      [
        sessionId,
        input.phone,
        input.phoneCodeSecret,
        input.phoneCodeExpiresAt.toISOString(),
        input.delivery.purpose,
        input.delivery.channel,
        input.delivery.destinationHash,
        input.delivery.destinationPreview,
        input.delivery.templateKey,
        this.codeCodec.seal(input.delivery.verificationCode),
        input.delivery.requestId,
      ],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraftDelivery(result.rows[0]);
  }

  async markRegistrationPhoneVerified(sessionId: string, phone: string) {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        update yorso_registration_drafts
        set phone = $2,
            phone_verified_at = now(),
            updated_at = now()
        where id = $1
          and completed_at is null
          and expires_at > now()
        returning ${draftReturningSql}
      `,
      [sessionId, phone],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraft(result.rows[0]);
  }

  async recordRegistrationPhoneCodeAttempt(sessionId: string) {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        update yorso_registration_drafts
        set phone_code_attempt_count = phone_code_attempt_count + 1,
            updated_at = now()
        where id = $1
          and completed_at is null
          and expires_at > now()
        returning ${draftReturningSql}
      `,
      [sessionId],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraft(result.rows[0]);
  }

  async updateRegistrationOnboarding(sessionId: string, input: AuthRegisterOnboarding) {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        update yorso_registration_drafts
        set categories = $2::text[],
            certifications = $3::text[],
            volume = $4,
            updated_at = now()
        where id = $1
          and completed_at is null
          and expires_at > now()
        returning ${draftReturningSql}
      `,
      [sessionId, input.categories, input.certifications, input.volume],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraft(result.rows[0]);
  }

  async updateRegistrationMarkets(sessionId: string, input: AuthRegisterMarkets) {
    const result = await this.client.query<RegistrationDraftRow>(
      `
        update yorso_registration_drafts
        set target_countries = $2::text[],
            updated_at = now()
        where id = $1
          and completed_at is null
          and expires_at > now()
        returning ${draftReturningSql}
      `,
      [sessionId, input.countries],
    );
    if (!result.rows[0]) throw new Error("registration_session_invalid");
    return mapDraft(result.rows[0]);
  }

  async completeRegistration(sessionId: string, ttlMs: number): Promise<RegistrationCompleteResult> {
    const authSessionId = createSessionId();
    const result = await this.client.query<RegistrationCompleteRow>(
      `
        with draft as (
          update yorso_registration_drafts
          set completed_at = now(),
              updated_at = now()
          where id = $1
            and completed_at is null
            and expires_at > now()
            and email_verified_at is not null
            and phone_verified_at is not null
            and full_name is not null
            and company_name is not null
            and country is not null
            and country_code is not null
            and vat_tin is not null
            and password_secret is not null
          returning *
        ),
        name_parts as (
          select
            draft.*,
            coalesce(nullif(split_part(trim(draft.full_name), ' ', 1), ''), 'YORSO') as first_name,
            coalesce(nullif(trim(regexp_replace(trim(draft.full_name), '^\\S+\\s*', '')), ''), '-') as last_name
          from draft
        ),
        inserted_user as (
          insert into yorso_users (
            first_name,
            last_name,
            email,
            phone,
            preferred_language,
            timezone
          )
          select
            first_name,
            last_name,
            email,
            phone,
            'en',
            'UTC'
          from name_parts
          returning id, email::text as email, first_name, last_name
        ),
        inserted_credentials as (
          insert into yorso_auth_credentials (user_id, password_secret)
          select inserted_user.id, name_parts.password_secret
          from inserted_user
          cross join name_parts
          returning user_id
        ),
        inserted_company as (
          insert into yorso_companies (
            owner_user_id,
            legal_name,
            trade_name,
            account_role,
            country_code,
            contact_email,
            contact_phone,
            messenger_handle,
            product_focus,
            certificates,
            payment_terms
          )
          select
            inserted_user.id,
            name_parts.company_name,
            name_parts.company_name,
            name_parts.role::yorso_account_role,
            name_parts.country_code,
            name_parts.email,
            name_parts.phone,
            name_parts.phone,
            name_parts.categories,
            name_parts.certifications,
            '{}'::text[]
          from inserted_user
          cross join name_parts
          returning id, legal_name
        ),
        inserted_media as (
          insert into yorso_company_media (company_id)
          select id from inserted_company
          returning company_id
        ),
        inserted_roles as (
          insert into yorso_user_roles (user_id, role)
          select inserted_user.id, role
          from inserted_user
          cross join name_parts
          union all
          select inserted_user.id, 'company_admin'
          from inserted_user
          on conflict do nothing
          returning user_id
        ),
        inserted_notifications as (
          insert into yorso_notification_preferences (
            id,
            user_id,
            channel,
            enabled,
            events,
            frequency,
            position
          )
          select
            notification.id,
            inserted_user.id,
            notification.channel::yorso_notification_channel,
            true,
            notification.events::yorso_notification_event[],
            'instant'::yorso_notification_frequency,
            notification.position
          from inserted_user
          cross join (
            values
              ('n_email', 'email', array['price_access_approved', 'rfq_response', 'document_readiness']::text[], 0),
              ('n_in_app', 'in_app', array['price_access_approved', 'new_matching_product', 'document_readiness']::text[], 1)
          ) as notification(id, channel, events, position)
          returning user_id
        ),
        inserted_meta_region as (
          insert into yorso_company_meta_regions (
            id,
            company_id,
            name,
            countries,
            logistics_reason,
            default_currency,
            notes,
            used_for
          )
          select
            'mr_target_markets',
            inserted_company.id,
            'Target markets',
            name_parts.target_countries,
            'manual'::yorso_meta_region_logistics_reason,
            'USD',
            name_parts.volume,
            array['supplier_matching']::yorso_meta_region_used_for[]
          from inserted_company
          cross join name_parts
          where cardinality(name_parts.target_countries) > 0
          returning company_id
        ),
        inserted_session as (
          insert into yorso_auth_sessions (id, user_id, expires_at)
          select $2, inserted_user.id, now() + ($3::bigint * interval '1 millisecond')
          from inserted_user
          returning id, user_id, issued_at, expires_at
        ),
        marked_draft as (
          update yorso_registration_drafts
          set completed_user_id = inserted_user.id
          from inserted_user
          where yorso_registration_drafts.id = $1
          returning yorso_registration_drafts.id
        )
        select
          inserted_user.id as user_id,
          inserted_user.email,
          trim(inserted_user.first_name || ' ' || inserted_user.last_name) as display_name,
          inserted_session.id as session_id,
          inserted_session.issued_at,
          inserted_session.expires_at,
          name_parts.full_name,
          name_parts.company_name as company,
          name_parts.country,
          name_parts.role
        from inserted_user
        join inserted_session on inserted_session.user_id = inserted_user.id
        cross join name_parts
      `,
      [sessionId, authSessionId, ttlMs],
    );

    const row = result.rows[0];
    if (!row) throw new Error("registration_completion_precondition_failed");
    return {
      profile: {
        company: row.company,
        country: row.country,
        fullName: row.full_name,
        role: row.role,
      },
      session: {
        id: row.session_id,
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        issuedAt: ensureIso(row.issued_at),
        expiresAt: ensureIso(row.expires_at),
      },
      userId: row.user_id,
    };
  }

  async leaseRegistrationDeliveryJobs(input: RegistrationDeliveryLeaseInput): Promise<RegistrationDeliveryJob[]> {
    const result = await this.client.query<RegistrationDeliveryJobRow>(
      `
        with candidates as (
          select outbox.id
          from yorso_registration_delivery_outbox outbox
          join yorso_registration_drafts draft on draft.id = outbox.draft_id
          where outbox.status in ('queued', 'leased')
            and outbox.available_at <= now()
            and outbox.attempt_count < outbox.max_attempts
            and draft.completed_at is null
            and draft.expires_at > now()
            and outbox.channel in ('email', 'sms', 'whatsapp')
            and (
              (outbox.purpose = 'email_verification' and draft.email is not null)
              or
              (outbox.purpose = 'phone_verification' and draft.phone is not null)
            )
            and outbox.verification_code_sealed is not null
          order by outbox.available_at asc, outbox.created_at asc
          limit $1
          for update of outbox skip locked
        ),
        leased as (
          update yorso_registration_delivery_outbox outbox
          set status = 'leased',
              available_at = now() + ($3::bigint * interval '1 millisecond'),
              locked_at = now(),
              locked_by = $2,
              updated_at = now()
          from candidates
          where outbox.id = candidates.id
          returning ${deliveryReturningSql}
        )
        select
          leased.*,
          case
            when leased.delivery_purpose = 'email_verification' then draft.email::text
            else draft.phone
          end as delivery_destination,
          outbox.verification_code_sealed as delivery_verification_code_sealed
        from leased
        join yorso_registration_delivery_outbox outbox on outbox.id::text = leased.delivery_id
        join yorso_registration_drafts draft on draft.id = leased.delivery_draft_id
      `,
      [input.limit, input.workerId, input.leaseMs],
    );
    return result.rows.flatMap((row) => {
      const job = mapDeliveryJob(row, this.codeCodec);
      return job ? [job] : [];
    });
  }

  async markRegistrationDeliverySent(deliveryId: string): Promise<RegistrationDeliveryOutboxEntry | null> {
    const result = await this.client.query<RegistrationDeliveryOutboxRow>(
      `
        update yorso_registration_delivery_outbox
        set status = 'sent',
            locked_at = null,
            locked_by = null,
            last_error = null,
            updated_at = now()
        where id = $1::uuid
          and status = 'leased'
        returning ${deliveryReturningSql}
      `,
      [deliveryId],
    );
    return result.rows[0] ? mapDelivery(result.rows[0]) : null;
  }

  async markRegistrationDeliveryFailed(
    deliveryId: string,
    input: RegistrationDeliveryFailureInput,
  ): Promise<RegistrationDeliveryOutboxEntry | null> {
    const result = await this.client.query<RegistrationDeliveryOutboxRow>(
      `
        update yorso_registration_delivery_outbox
        set attempt_count = attempt_count + 1,
            status = case
              when attempt_count + 1 >= max_attempts then 'failed'
              else 'queued'
            end,
            available_at = case
              when attempt_count + 1 >= max_attempts then available_at
              else now() + ($2::bigint * interval '1 millisecond')
            end,
            locked_at = null,
            locked_by = null,
            last_error = left($3, 500),
            updated_at = now()
        where id = $1::uuid
          and status = 'leased'
        returning ${deliveryReturningSql}
      `,
      [deliveryId, input.retryAfterMs, input.error],
    );
    return result.rows[0] ? mapDelivery(result.rows[0]) : null;
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

  async hasRole(userId: string, role: AdminUserRole): Promise<boolean> {
    const result = await this.client.query<{ exists: boolean }>(
      `
        select exists(
          select 1
          from yorso_user_roles
          where user_id = $1
            and role = $2
        ) as exists
      `,
      [userId, role],
    );
    return result.rows[0]?.exists ?? false;
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
