import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  AccountRole,
  BuyerQualificationStatus,
  CompanyMedia,
  CompanyProfile,
  CompanyProfileUpdate,
  CompanyPublicationStatus,
  UserProfile,
  UserProfileUpdate,
} from "../../../../../packages/contracts/dist/index.js";
import type { AccountRepository } from "./repository.js";

export interface AccountQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface PostgresAccountRepositoryOptions {
  client?: AccountQueryClient;
}

interface UserRow extends Record<string, unknown> {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_language: "en" | "ru" | "es";
  timezone: string;
  updated_at: Date | string;
}

interface CompanyRow extends Record<string, unknown> {
  id: string;
  legal_name: string;
  trade_name: string;
  account_role: AccountRole;
  country_code: string;
  website: string | null;
  year_founded: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  messenger_handle: string | null;
  description: string | null;
  product_focus: string[] | null;
  certificates: string[] | null;
  payment_terms: string[] | null;
  publication_status: CompanyPublicationStatus;
  buyer_qualification_status: BuyerQualificationStatus;
  logo_object_key: string | null;
  cover_object_key: string | null;
  logo_alt: string | null;
  cover_alt: string | null;
  logo_fit: CompanyMedia["logoFit"] | null;
  cover_focal_x: number | string | null;
  cover_focal_y: number | string | null;
  updated_at: Date | string;
}

const companySelectSql = `
  select
    c.id,
    c.legal_name,
    c.trade_name,
    c.account_role,
    c.country_code,
    c.website,
    c.year_founded,
    c.contact_email,
    c.contact_phone,
    c.messenger_handle,
    c.description,
    c.product_focus,
    c.certificates,
    c.payment_terms,
    c.publication_status,
    c.buyer_qualification_status,
    c.updated_at,
    m.logo_object_key,
    m.cover_object_key,
    m.logo_alt,
    m.cover_alt,
    m.logo_fit,
    m.cover_focal_x,
    m.cover_focal_y
  from yorso_companies c
  left join yorso_company_media m on m.company_id = c.id
  where c.owner_user_id = $1
  limit 1
`;

const ensureIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

const toNumber = (value: number | string | null | undefined, fallback: number) => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function mapUser(row: UserRow): UserProfile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    preferredLanguage: row.preferred_language,
    timezone: row.timezone,
    updatedAt: ensureIso(row.updated_at),
  };
}

function mapCompany(row: CompanyRow): CompanyProfile {
  return {
    id: row.id,
    legalName: row.legal_name,
    tradeName: row.trade_name,
    accountRole: row.account_role,
    countryCode: row.country_code,
    website: row.website,
    yearFounded: row.year_founded,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    messengerHandle: row.messenger_handle,
    description: row.description,
    productFocus: row.product_focus ?? [],
    certificates: row.certificates ?? [],
    paymentTerms: row.payment_terms ?? [],
    publicationStatus: row.publication_status,
    buyerQualificationStatus: row.buyer_qualification_status,
    media: {
      logoObjectKey: row.logo_object_key,
      coverObjectKey: row.cover_object_key,
      logoAlt: row.logo_alt,
      coverAlt: row.cover_alt,
      logoFit: row.logo_fit ?? "contain",
      coverFocalX: toNumber(row.cover_focal_x, 0.5),
      coverFocalY: toNumber(row.cover_focal_y, 0.5),
    },
    updatedAt: ensureIso(row.updated_at),
  };
}

const scalarCompanyColumns: Record<Exclude<keyof CompanyProfileUpdate, "media">, string> = {
  legalName: "legal_name",
  tradeName: "trade_name",
  accountRole: "account_role",
  countryCode: "country_code",
  website: "website",
  yearFounded: "year_founded",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
  messengerHandle: "messenger_handle",
  description: "description",
  productFocus: "product_focus",
  certificates: "certificates",
  paymentTerms: "payment_terms",
  publicationStatus: "publication_status",
  buyerQualificationStatus: "buyer_qualification_status",
};

const mediaColumns: Record<keyof CompanyMedia, string> = {
  logoObjectKey: "logo_object_key",
  coverObjectKey: "cover_object_key",
  logoAlt: "logo_alt",
  coverAlt: "cover_alt",
  logoFit: "logo_fit",
  coverFocalX: "cover_focal_x",
  coverFocalY: "cover_focal_y",
};

export class PostgresAccountRepository implements AccountRepository {
  private readonly client: AccountQueryClient;
  private readonly ownsClient: boolean;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: PostgresAccountRepositoryOptions = {}) {
    if (!config.databaseUrl.startsWith("postgres")) {
      throw new Error("PostgresAccountRepository requires a PostgreSQL DATABASE_URL.");
    }

    this.client = options.client ?? new Pool({ connectionString: config.databaseUrl } satisfies PoolConfig);
    this.ownsClient = !options.client;
  }

  async close() {
    if (this.ownsClient) await this.client.end?.();
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await this.client.query<UserRow>(
      `
        select id, first_name, last_name, email, phone, preferred_language, timezone, updated_at
        from yorso_users
        where id = $1
        limit 1
      `,
      [userId],
    );

    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async updateUserProfile(userId: string, update: UserProfileUpdate): Promise<UserProfile> {
    const assignments: string[] = [];
    const values: unknown[] = [];

    const columns: Record<keyof UserProfileUpdate, string> = {
      firstName: "first_name",
      lastName: "last_name",
      email: "email",
      phone: "phone",
      preferredLanguage: "preferred_language",
      timezone: "timezone",
    };

    for (const [field, column] of Object.entries(columns) as Array<[keyof UserProfileUpdate, string]>) {
      if (update[field] === undefined) continue;
      values.push(update[field]);
      assignments.push(`${column} = $${values.length}`);
    }

    if (assignments.length === 0) {
      const current = await this.getUserProfile(userId);
      if (!current) throw new Error("user_not_found");
      return current;
    }

    values.push(userId);

    const result = await this.client.query<UserRow>(
      `
        update yorso_users
        set ${assignments.join(", ")}, updated_at = now()
        where id = $${values.length}
        returning id, first_name, last_name, email, phone, preferred_language, timezone, updated_at
      `,
      values,
    );

    if (!result.rows[0]) throw new Error("user_not_found");
    return mapUser(result.rows[0]);
  }

  async getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
    const result = await this.client.query<CompanyRow>(companySelectSql, [userId]);
    return result.rows[0] ? mapCompany(result.rows[0]) : null;
  }

  async updateCompanyProfile(userId: string, update: CompanyProfileUpdate): Promise<CompanyProfile> {
    const current = await this.getCompanyProfile(userId);
    if (!current) throw new Error("company_not_found");

    await this.updateCompanyScalars(current.id, update);
    await this.upsertCompanyMedia(current, update.media);

    const next = await this.getCompanyProfile(userId);
    if (!next) throw new Error("company_not_found");
    return next;
  }

  private async updateCompanyScalars(companyId: string, update: CompanyProfileUpdate) {
    const assignments: string[] = [];
    const values: unknown[] = [];

    for (const [field, column] of Object.entries(scalarCompanyColumns) as Array<[Exclude<keyof CompanyProfileUpdate, "media">, string]>) {
      if (update[field] === undefined) continue;
      values.push(update[field]);
      assignments.push(`${column} = $${values.length}`);
    }

    if (assignments.length === 0) return;

    values.push(companyId);
    await this.client.query(
      `
        update yorso_companies
        set ${assignments.join(", ")}, updated_at = now()
        where id = $${values.length}
      `,
      values,
    );
  }

  private async upsertCompanyMedia(current: CompanyProfile, mediaUpdate: CompanyProfileUpdate["media"]) {
    if (!mediaUpdate) return;

    const nextMedia: CompanyMedia = {
      ...current.media,
      ...mediaUpdate,
    };

    const columns = Object.values(mediaColumns);
    const values = Object.keys(mediaColumns).map((field) => nextMedia[field as keyof CompanyMedia]);
    const placeholders = values.map((_, index) => `$${index + 2}`);
    const updateAssignments = columns.map((column) => `${column} = excluded.${column}`).join(", ");

    await this.client.query(
      `
        insert into yorso_company_media (company_id, ${columns.join(", ")}, updated_at)
        values ($1, ${placeholders.join(", ")}, now())
        on conflict (company_id) do update
        set ${updateAssignments}, updated_at = now()
      `,
      [current.id, ...values],
    );
  }
}
