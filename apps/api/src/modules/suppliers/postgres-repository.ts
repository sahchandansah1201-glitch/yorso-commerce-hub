import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  SupplierCatalogPreviewItem,
  SupplierCertificationBadge,
  SupplierDeliveryCountry,
  SupplierDirectoryQuery,
  SupplierDirectoryRecord,
  SupplierProductFocus,
  SupplierType,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierRepository } from "./repository.js";

export interface SupplierQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface PostgresSupplierRepositoryOptions {
  client?: SupplierQueryClient;
}

interface SupplierRow extends Record<string, unknown> {
  id: string;
  company_name: string;
  masked_name: string;
  country: string;
  country_code: string;
  city: string;
  supplier_type: SupplierType;
  in_business_since_year: number;
  product_focus: SupplierProductFocus[] | null;
  certifications: string[] | null;
  certification_badges: SupplierCertificationBadge[] | null;
  active_offers_count: number;
  short_description: string;
  about: string;
  response_signal: SupplierDirectoryRecord["responseSignal"];
  document_readiness: SupplierDirectoryRecord["documentReadiness"];
  verification_level: SupplierDirectoryRecord["verificationLevel"];
  hero_image: string;
  logo_image: string | null;
  delivery_countries: SupplierDeliveryCountry[] | null;
  delivery_countries_total: number;
  total_products_count: number;
  product_catalog_preview: SupplierCatalogPreviewItem[] | null;
  website: string | null;
  whatsapp: string | null;
  updated_at: Date | string;
}

const ensureIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

function mapSupplier(row: SupplierRow): SupplierDirectoryRecord {
  return {
    id: row.id,
    companyName: row.company_name,
    maskedName: row.masked_name,
    country: row.country,
    countryCode: row.country_code,
    city: row.city,
    supplierType: row.supplier_type,
    inBusinessSinceYear: Number(row.in_business_since_year),
    productFocus: row.product_focus ?? [],
    certifications: row.certifications ?? [],
    certificationBadges: row.certification_badges ?? [],
    activeOffersCount: Number(row.active_offers_count),
    shortDescription: row.short_description,
    about: row.about,
    responseSignal: row.response_signal,
    documentReadiness: row.document_readiness,
    verificationLevel: row.verification_level,
    heroImage: row.hero_image,
    logoImage: row.logo_image,
    deliveryCountries: row.delivery_countries ?? [],
    deliveryCountriesTotal: Number(row.delivery_countries_total),
    totalProductsCount: Number(row.total_products_count),
    productCatalogPreview: row.product_catalog_preview ?? [],
    website: row.website,
    whatsapp: row.whatsapp,
    updatedAt: ensureIso(row.updated_at),
  };
}

function whereClause(query: SupplierDirectoryQuery) {
  const params: unknown[] = [];
  const where = ["publication_status = 'published'"];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (query.countryCode) where.push(`country_code = ${add(query.countryCode.toUpperCase())}`);
  if (query.supplierType) where.push(`supplier_type = ${add(query.supplierType)}`);
  if (query.certification) where.push(`certifications_search ilike ${add(`%${query.certification}%`)}`);
  if (query.species) where.push(`product_focus_search ilike ${add(`%${query.species}%`)}`);
  if (query.q) {
    const needle = add(`%${query.q}%`);
    const searchColumn = query.accessLevel === "qualified_unlocked" ? "private_search_text" : "public_search_text";
    where.push(`${searchColumn} ilike ${needle}`);
  }

  return { sql: where.join(" and "), params };
}

export class PostgresSupplierRepository implements SupplierRepository {
  private readonly client: SupplierQueryClient;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: PostgresSupplierRepositoryOptions = {}) {
    this.client = options.client ?? new Pool({ connectionString: config.databaseUrl } satisfies PoolConfig);
  }

  async listSuppliers(query: SupplierDirectoryQuery) {
    const where = whereClause(query);
    const limitParam = where.params.length + 1;
    const offsetParam = where.params.length + 2;
    const result = await this.client.query<SupplierRow & { total_count: number }>(
      `
        select *, count(*) over()::int as total_count
        from yorso_suppliers_directory
        where ${where.sql}
        order by updated_at desc, id asc
        limit $${limitParam}
        offset $${offsetParam}
      `,
      [...where.params, query.limit, query.offset],
    );

    return {
      suppliers: result.rows.map(mapSupplier),
      total: Number(result.rows[0]?.total_count ?? 0),
    };
  }

  async getSupplierById(id: string) {
    const result = await this.client.query<SupplierRow>(
      `
        select *
        from yorso_suppliers_directory
        where id = $1 and publication_status = 'published'
        limit 1
      `,
      [id],
    );

    return result.rows[0] ? mapSupplier(result.rows[0]) : null;
  }
}
