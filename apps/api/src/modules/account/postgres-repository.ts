import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  AccountBranchesUpdate,
  AccountRole,
  AccountMetaRegionsUpdate,
  AccountNotificationsUpdate,
  AccountProductsUpdate,
  BranchType,
  BuyerQualificationStatus,
  CompanyBranch,
  CompanyBranchCreate,
  CompanyBranchUpdate,
  CompanyMedia,
  CompanyProduct,
  CompanyProductCreate,
  CompanyProductUpdate,
  CompanyProfile,
  CompanyProfileUpdate,
  CompanyPublicationStatus,
  MetaRegion,
  MetaRegionCreate,
  MetaRegionLogisticsReason,
  MetaRegionUpdate,
  MetaRegionUsedFor,
  NotificationChannel,
  NotificationEvent,
  NotificationFrequency,
  NotificationPreference,
  NotificationPreferenceCreate,
  NotificationPreferenceUpdate,
  ProductRole,
  ProductState,
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

interface BranchRow extends Record<string, unknown> {
  id: string;
  name: string;
  type: BranchType;
  country: string;
  region: string;
  city: string;
  address_line: string;
  default_incoterms: string;
  port_or_pickup_point: string;
  notes: string;
}

interface ProductRow extends Record<string, unknown> {
  id: string;
  commercial_name: string;
  latin_name: string;
  category: string;
  state: ProductState;
  format: string;
  role: ProductRole;
  monthly_volume: string;
  certificates: string[] | null;
  target_countries: string[] | null;
}

interface MetaRegionRow extends Record<string, unknown> {
  id: string;
  name: string;
  countries: string[] | null;
  logistics_reason: MetaRegionLogisticsReason;
  default_currency: string;
  notes: string;
  used_for: MetaRegionUsedFor[] | null;
}

interface NotificationRow extends Record<string, unknown> {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
  events: NotificationEvent[] | null;
  frequency: NotificationFrequency;
}

interface AccountVersionRow extends Record<string, unknown> {
  account_version: Date | string;
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

function mapBranch(row: BranchRow): CompanyBranch {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    country: row.country,
    region: row.region,
    city: row.city,
    addressLine: row.address_line,
    defaultIncoterms: row.default_incoterms,
    portOrPickupPoint: row.port_or_pickup_point,
    notes: row.notes,
  };
}

function mapProduct(row: ProductRow): CompanyProduct {
  return {
    id: row.id,
    commercialName: row.commercial_name,
    latinName: row.latin_name,
    category: row.category,
    state: row.state,
    format: row.format,
    role: row.role,
    monthlyVolume: row.monthly_volume,
    certificates: row.certificates ?? [],
    targetCountries: row.target_countries ?? [],
  };
}

function mapMetaRegion(row: MetaRegionRow): MetaRegion {
  return {
    id: row.id,
    name: row.name,
    countries: row.countries ?? [],
    logisticsReason: row.logistics_reason,
    defaultCurrency: row.default_currency.trim(),
    notes: row.notes,
    usedFor: row.used_for ?? [],
  };
}

function mapNotification(row: NotificationRow): NotificationPreference {
  return {
    id: row.id,
    channel: row.channel,
    enabled: row.enabled,
    events: row.events ?? [],
    frequency: row.frequency,
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

function createWorkspaceItem<T extends { id: string }, C extends Omit<T, "id">>(
  items: T[],
  itemId: string,
  create: C,
): T {
  if (items.some((item) => item.id === itemId)) throw new Error("workspace_item_conflict");
  return { id: itemId, ...create } as unknown as T;
}

function updateWorkspaceItem<T extends { id: string }, U extends Partial<Omit<T, "id">>>(
  items: T[],
  itemId: string,
  update: U,
): T {
  const current = items.find((item) => item.id === itemId);
  if (!current) throw new Error("workspace_item_not_found");
  return { ...current, ...update };
}

function deleteWorkspaceItem<T extends { id: string }>(items: T[], itemId: string): T {
  const current = items.find((item) => item.id === itemId);
  if (!current) throw new Error("workspace_item_not_found");
  return current;
}

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

  async getAccountVersion(userId: string): Promise<string> {
    const result = await this.client.query<AccountVersionRow>(
      `
        with account_company as (
          select id
          from yorso_companies
          where owner_user_id = $1
          limit 1
        ),
        versions as (
          select updated_at from yorso_users where id = $1
          union all
          select updated_at from yorso_companies where owner_user_id = $1
          union all
          select m.updated_at
          from yorso_company_media m
          join account_company c on c.id = m.company_id
          union all
          select a.created_at
          from yorso_file_assets a
          join account_company c on c.id = a.company_id
          union all
          select d.updated_at
          from yorso_company_documents d
          join account_company c on c.id = d.company_id
          union all
          select b.updated_at
          from yorso_company_branches b
          join account_company c on c.id = b.company_id
          union all
          select p.updated_at
          from yorso_company_products p
          join account_company c on c.id = p.company_id
          union all
          select r.updated_at
          from yorso_company_meta_regions r
          join account_company c on c.id = r.company_id
          union all
          select n.updated_at
          from yorso_notification_preferences n
          where n.user_id = $1
        )
        select coalesce(max(updated_at), now()) as account_version
        from versions
      `,
      [userId],
    );

    return ensureIso(result.rows[0]?.account_version ?? new Date());
  }

  async touchAccountVersion(userId: string): Promise<void> {
    const companyId = await this.getCompanyIdForUser(userId);
    await this.touchCompany(companyId);
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

  async getBranches(userId: string): Promise<CompanyBranch[]> {
    const result = await this.client.query<BranchRow>(
      `
        select b.id, b.name, b.type, b.country, b.region, b.city, b.address_line,
          b.default_incoterms, b.port_or_pickup_point, b.notes
        from yorso_company_branches b
        join yorso_companies c on c.id = b.company_id
        where c.owner_user_id = $1
        order by b.position asc, b.name asc
      `,
      [userId],
    );
    return result.rows.map(mapBranch);
  }

  async replaceBranches(userId: string, branches: AccountBranchesUpdate): Promise<CompanyBranch[]> {
    const companyId = await this.getCompanyIdForUser(userId);
    const result = await this.client.query<BranchRow>(
      `
        with input as (
          select *
          from jsonb_to_recordset($2::jsonb) as item(
            id text,
            name text,
            type yorso_branch_type,
            country text,
            region text,
            city text,
            address_line text,
            default_incoterms text,
            port_or_pickup_point text,
            notes text,
            position integer
          )
        ),
        deleted as (
          delete from yorso_company_branches where company_id = $1
        ),
        touched as (
          update yorso_companies set updated_at = now() where id = $1
        )
        insert into yorso_company_branches (
          id, company_id, name, type, country, region, city, address_line,
          default_incoterms, port_or_pickup_point, notes, position, updated_at
        )
        select
          input.id,
          $1,
          input.name,
          input.type,
          input.country,
          input.region,
          input.city,
          input.address_line,
          input.default_incoterms,
          input.port_or_pickup_point,
          input.notes,
          input.position,
          now()
        from input
        order by input.position asc
        returning id, name, type, country, region, city, address_line,
          default_incoterms, port_or_pickup_point, notes
      `,
      [
        companyId,
        JSON.stringify(branches.map((branch, index) => ({
          id: branch.id,
          name: branch.name,
          type: branch.type,
          country: branch.country,
          region: branch.region,
          city: branch.city,
          address_line: branch.addressLine,
          default_incoterms: branch.defaultIncoterms,
          port_or_pickup_point: branch.portOrPickupPoint,
          notes: branch.notes,
          position: index,
        }))),
      ],
    );

    return result.rows.map(mapBranch);
  }

  async createBranch(userId: string, itemId: string, branch: CompanyBranchCreate): Promise<CompanyBranch> {
    const items = await this.getBranches(userId);
    const created = createWorkspaceItem(items, itemId, branch);
    await this.replaceBranches(userId, [...items, created]);
    return created;
  }

  async updateBranch(userId: string, itemId: string, update: CompanyBranchUpdate): Promise<CompanyBranch> {
    const items = await this.getBranches(userId);
    const updated = updateWorkspaceItem(items, itemId, update);
    await this.replaceBranches(userId, items.map((item) => (item.id === itemId ? updated : item)));
    return updated;
  }

  async deleteBranch(userId: string, itemId: string): Promise<CompanyBranch> {
    const items = await this.getBranches(userId);
    const deleted = deleteWorkspaceItem(items, itemId);
    await this.replaceBranches(userId, items.filter((item) => item.id !== itemId));
    return deleted;
  }

  async getProducts(userId: string): Promise<CompanyProduct[]> {
    const result = await this.client.query<ProductRow>(
      `
        select p.id, p.commercial_name, p.latin_name, p.category, p.state, p.format,
          p.role, p.monthly_volume, p.certificates, p.target_countries
        from yorso_company_products p
        join yorso_companies c on c.id = p.company_id
        where c.owner_user_id = $1
        order by p.position asc, p.commercial_name asc
      `,
      [userId],
    );
    return result.rows.map(mapProduct);
  }

  async replaceProducts(userId: string, products: AccountProductsUpdate): Promise<CompanyProduct[]> {
    const companyId = await this.getCompanyIdForUser(userId);
    const result = await this.client.query<ProductRow>(
      `
        with input as (
          select *
          from jsonb_to_recordset($2::jsonb) as item(
            id text,
            commercial_name text,
            latin_name text,
            category text,
            state yorso_product_state,
            format text,
            role yorso_product_role,
            monthly_volume text,
            certificates text[],
            target_countries text[],
            position integer
          )
        ),
        deleted as (
          delete from yorso_company_products where company_id = $1
        ),
        touched as (
          update yorso_companies set updated_at = now() where id = $1
        )
        insert into yorso_company_products (
          id, company_id, commercial_name, latin_name, category, state, format,
          role, monthly_volume, certificates, target_countries, position, updated_at
        )
        select
          input.id,
          $1,
          input.commercial_name,
          input.latin_name,
          input.category,
          input.state,
          input.format,
          input.role,
          input.monthly_volume,
          input.certificates,
          input.target_countries,
          input.position,
          now()
        from input
        order by input.position asc
        returning id, commercial_name, latin_name, category, state, format,
          role, monthly_volume, certificates, target_countries
      `,
      [
        companyId,
        JSON.stringify(products.map((product, index) => ({
          id: product.id,
          commercial_name: product.commercialName,
          latin_name: product.latinName,
          category: product.category,
          state: product.state,
          format: product.format,
          role: product.role,
          monthly_volume: product.monthlyVolume,
          certificates: product.certificates,
          target_countries: product.targetCountries,
          position: index,
        }))),
      ],
    );

    return result.rows.map(mapProduct);
  }

  async createProduct(userId: string, itemId: string, product: CompanyProductCreate): Promise<CompanyProduct> {
    const items = await this.getProducts(userId);
    const created = createWorkspaceItem(items, itemId, product);
    await this.replaceProducts(userId, [...items, created]);
    return created;
  }

  async updateProduct(userId: string, itemId: string, update: CompanyProductUpdate): Promise<CompanyProduct> {
    const items = await this.getProducts(userId);
    const updated = updateWorkspaceItem(items, itemId, update);
    await this.replaceProducts(userId, items.map((item) => (item.id === itemId ? updated : item)));
    return updated;
  }

  async deleteProduct(userId: string, itemId: string): Promise<CompanyProduct> {
    const items = await this.getProducts(userId);
    const deleted = deleteWorkspaceItem(items, itemId);
    await this.replaceProducts(userId, items.filter((item) => item.id !== itemId));
    return deleted;
  }

  async getMetaRegions(userId: string): Promise<MetaRegion[]> {
    const result = await this.client.query<MetaRegionRow>(
      `
        select m.id, m.name, m.countries, m.logistics_reason, m.default_currency, m.notes, m.used_for
        from yorso_company_meta_regions m
        join yorso_companies c on c.id = m.company_id
        where c.owner_user_id = $1
        order by m.position asc, m.name asc
      `,
      [userId],
    );
    return result.rows.map(mapMetaRegion);
  }

  async replaceMetaRegions(userId: string, metaRegions: AccountMetaRegionsUpdate): Promise<MetaRegion[]> {
    const companyId = await this.getCompanyIdForUser(userId);
    const result = await this.client.query<MetaRegionRow>(
      `
        with input as (
          select *
          from jsonb_to_recordset($2::jsonb) as item(
            id text,
            name text,
            countries text[],
            logistics_reason yorso_meta_region_logistics_reason,
            default_currency text,
            notes text,
            used_for yorso_meta_region_used_for[],
            position integer
          )
        ),
        deleted as (
          delete from yorso_company_meta_regions where company_id = $1
        ),
        touched as (
          update yorso_companies set updated_at = now() where id = $1
        )
        insert into yorso_company_meta_regions (
          id, company_id, name, countries, logistics_reason, default_currency,
          notes, used_for, position, updated_at
        )
        select
          input.id,
          $1,
          input.name,
          input.countries,
          input.logistics_reason,
          input.default_currency,
          input.notes,
          input.used_for,
          input.position,
          now()
        from input
        order by input.position asc
        returning id, name, countries, logistics_reason, default_currency, notes, used_for
      `,
      [
        companyId,
        JSON.stringify(metaRegions.map((metaRegion, index) => ({
          id: metaRegion.id,
          name: metaRegion.name,
          countries: metaRegion.countries,
          logistics_reason: metaRegion.logisticsReason,
          default_currency: metaRegion.defaultCurrency,
          notes: metaRegion.notes,
          used_for: metaRegion.usedFor,
          position: index,
        }))),
      ],
    );

    return result.rows.map(mapMetaRegion);
  }

  async createMetaRegion(userId: string, itemId: string, metaRegion: MetaRegionCreate): Promise<MetaRegion> {
    const items = await this.getMetaRegions(userId);
    const created = createWorkspaceItem(items, itemId, metaRegion);
    await this.replaceMetaRegions(userId, [...items, created]);
    return created;
  }

  async updateMetaRegion(userId: string, itemId: string, update: MetaRegionUpdate): Promise<MetaRegion> {
    const items = await this.getMetaRegions(userId);
    const updated = updateWorkspaceItem(items, itemId, update);
    await this.replaceMetaRegions(userId, items.map((item) => (item.id === itemId ? updated : item)));
    return updated;
  }

  async deleteMetaRegion(userId: string, itemId: string): Promise<MetaRegion> {
    const items = await this.getMetaRegions(userId);
    const deleted = deleteWorkspaceItem(items, itemId);
    await this.replaceMetaRegions(userId, items.filter((item) => item.id !== itemId));
    return deleted;
  }

  async getNotifications(userId: string): Promise<NotificationPreference[]> {
    const result = await this.client.query<NotificationRow>(
      `
        select id, channel, enabled, events, frequency
        from yorso_notification_preferences
        where user_id = $1
        order by position asc, channel asc
      `,
      [userId],
    );
    return result.rows.map(mapNotification);
  }

  async replaceNotifications(userId: string, notifications: AccountNotificationsUpdate): Promise<NotificationPreference[]> {
    const result = await this.client.query<NotificationRow>(
      `
        with input as (
          select *
          from jsonb_to_recordset($2::jsonb) as item(
            id text,
            channel yorso_notification_channel,
            enabled boolean,
            events yorso_notification_event[],
            frequency yorso_notification_frequency,
            position integer
          )
        ),
        deleted as (
          delete from yorso_notification_preferences where user_id = $1
        ),
        touched as (
          update yorso_users set updated_at = now() where id = $1
        )
        insert into yorso_notification_preferences (
          id, user_id, channel, enabled, events, frequency, position, updated_at
        )
        select
          input.id,
          $1,
          input.channel,
          input.enabled,
          input.events,
          input.frequency,
          input.position,
          now()
        from input
        order by input.position asc
        returning id, channel, enabled, events, frequency
      `,
      [
        userId,
        JSON.stringify(notifications.map((notification, index) => ({
          id: notification.id,
          channel: notification.channel,
          enabled: notification.enabled,
          events: notification.events,
          frequency: notification.frequency,
          position: index,
        }))),
      ],
    );

    return result.rows.map(mapNotification);
  }

  async createNotification(
    userId: string,
    itemId: string,
    notification: NotificationPreferenceCreate,
  ): Promise<NotificationPreference> {
    const items = await this.getNotifications(userId);
    const created = createWorkspaceItem(items, itemId, notification);
    await this.replaceNotifications(userId, [...items, created]);
    return created;
  }

  async updateNotification(
    userId: string,
    itemId: string,
    update: NotificationPreferenceUpdate,
  ): Promise<NotificationPreference> {
    const items = await this.getNotifications(userId);
    const updated = updateWorkspaceItem(items, itemId, update);
    await this.replaceNotifications(userId, items.map((item) => (item.id === itemId ? updated : item)));
    return updated;
  }

  async deleteNotification(userId: string, itemId: string): Promise<NotificationPreference> {
    const items = await this.getNotifications(userId);
    const deleted = deleteWorkspaceItem(items, itemId);
    await this.replaceNotifications(userId, items.filter((item) => item.id !== itemId));
    return deleted;
  }

  private async getCompanyIdForUser(userId: string): Promise<string> {
    const company = await this.getCompanyProfile(userId);
    if (!company) throw new Error("company_not_found");
    return company.id;
  }

  private async touchCompany(companyId: string) {
    await this.client.query("update yorso_companies set updated_at = now() where id = $1", [companyId]);
  }

  private async touchUser(userId: string) {
    await this.client.query("update yorso_users set updated_at = now() where id = $1", [userId]);
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
