import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  SupplierCatalogPreviewItem,
  SupplierCertificationBadge,
  SupplierDeliveryCountry,
  SupplierDirectoryQuery,
  SupplierDirectoryRecord,
  SupplierDocumentPayload,
  SupplierFaqItem,
  SupplierLegalDetails,
  SupplierLogisticsFacts,
  SupplierProductFocus,
  SupplierProductionFacts,
  SupplierShipmentCase,
  SupplierType,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierRepository, SupplierRepositoryListOptions } from "./repository.js";

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
  production_facts: SupplierProductionFacts | null;
  logistics_facts: SupplierLogisticsFacts | null;
  shipment_cases: SupplierShipmentCase[] | null;
  profile_faq_items: SupplierFaqItem[] | null;
  legal_details: SupplierLegalDetails | null;
  supplier_documents: SupplierDocumentPayload[] | null;
  website: string | null;
  whatsapp: string | null;
  updated_at: Date | string;
}

const ensureIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());
const emptyProductionFacts = (): SupplierProductionFacts => ({
  dailyTons: 0,
  lines: 0,
  coldStorageT: 0,
  blastFreezerT: 0,
  staff: 0,
});
const emptyLogisticsFacts = (): SupplierLogisticsFacts => ({
  incoterms: ["FCA"],
  transitDaysMin: 0,
  transitDaysMax: 0,
  minBatchTons: 0,
  containers: ["TBC"],
  tempRange: "TBC",
});

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
    productionFacts: row.production_facts ?? emptyProductionFacts(),
    logisticsFacts: row.logistics_facts ?? emptyLogisticsFacts(),
    shipmentCases: row.shipment_cases ?? [],
    faqItems: row.profile_faq_items ?? [],
    legalDetails: row.legal_details ?? null,
    supplierDocuments: row.supplier_documents ?? [],
    website: row.website,
    whatsapp: row.whatsapp,
    updatedAt: ensureIso(row.updated_at),
  };
}

function whereClause(query: SupplierDirectoryQuery, options: SupplierRepositoryListOptions = {}) {
  const params: unknown[] = [];
  const where = ["publication_status = 'published'"];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (query.countryCode) where.push(`country_code = ${add(query.countryCode.toUpperCase())}`);
  if (query.supplierType) where.push(`supplier_type = ${add(query.supplierType)}`);
  if (query.verificationLevel) where.push(`verification_level = ${add(query.verificationLevel)}`);
  if (query.certification) where.push(`certifications_search ilike ${add(`%${query.certification}%`)}`);
  if (query.species) where.push(`product_focus_search ilike ${add(`%${query.species}%`)}`);
  if (query.q) {
    const needle = add(`%${query.q}%`);
    const privateSearchSupplierIds = options.privateSearchSupplierIds ?? [];
    if (privateSearchSupplierIds.length > 0) {
      const privateIds = add(privateSearchSupplierIds);
      where.push(`(public_search_text ilike ${needle} or (id = any(${privateIds}::text[]) and private_search_text ilike ${needle}))`);
    } else {
      where.push(`public_search_text ilike ${needle}`);
    }
  }

  return { sql: where.join(" and "), params };
}

function orderByClause(query: SupplierDirectoryQuery) {
  const direction = query.sortDirection === "asc" ? "asc" : "desc";

  if (query.sortBy === "country") {
    return `country_code ${direction}, city ${direction}, id asc`;
  }

  if (query.sortBy === "verification") {
    return `
      case verification_level
        when 'documents_reviewed' then 0
        when 'basic' then 1
        else 2
      end ${direction},
      updated_at desc,
      id asc
    `;
  }

  if (query.sortBy === "response") {
    return `
      case response_signal
        when 'fast' then 0
        when 'normal' then 1
        else 2
      end ${direction},
      updated_at desc,
      id asc
    `;
  }

  return `updated_at ${direction}, id asc`;
}

export class PostgresSupplierRepository implements SupplierRepository {
  private readonly client: SupplierQueryClient;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: PostgresSupplierRepositoryOptions = {}) {
    this.client = options.client ?? new Pool({ connectionString: config.databaseUrl } satisfies PoolConfig);
  }

  async listSuppliers(query: SupplierDirectoryQuery, options: SupplierRepositoryListOptions = {}) {
    const where = whereClause(query, options);
    const limitParam = where.params.length + 1;
    const offsetParam = where.params.length + 2;
    const orderBy = orderByClause(query);
    const result = await this.client.query<SupplierRow & { total_count: number }>(
      `
        select *, count(*) over()::int as total_count
        from yorso_suppliers_directory
        where ${where.sql}
        order by ${orderBy}
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
