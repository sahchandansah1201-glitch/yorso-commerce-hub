import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  OfferCatalogQuery,
  OfferCatalogRecord,
  OfferCatalogSupplierInfo,
  OfferCommercialTerms,
  OfferDeliveryBasisOption,
  OfferFormat,
  OfferGalleryImage,
  OfferProductSpecs,
  OfferRelatedArticle,
  OfferVolumeBreak,
} from "../../../../../packages/contracts/dist/index.js";
import {
  normalizeOfferCatalogId,
  type OfferCatalogRepository,
  type OfferCatalogRepositoryListOptions,
} from "./repository.js";

export interface OfferQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface PostgresOfferCatalogRepositoryOptions {
  client?: OfferQueryClient;
}

interface OfferRow extends Record<string, unknown> {
  id: string;
  product_name: string;
  species: string;
  latin_name: string;
  category: string;
  origin: string;
  origin_code: string;
  origin_flag: string;
  format: OfferFormat;
  cut_type: string;
  packaging: string;
  certifications: string[] | null;
  image: string;
  images: string[] | null;
  gallery: OfferGalleryImage[] | null;
  photo_source_label: string;
  sample_available: boolean;
  inspection_available: boolean;
  traceability: string | null;
  freshness: string;
  moq_label: string;
  moq_value: number | null;
  moq_unit: string | null;
  price_range_label: string;
  price_unit: string;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  supplier: OfferCatalogSupplierInfo;
  specs: OfferProductSpecs;
  commercial: OfferCommercialTerms;
  delivery_basis_options: OfferDeliveryBasisOption[] | null;
  related_articles: OfferRelatedArticle[] | null;
  volume_breaks: OfferVolumeBreak[] | null;
  updated_at: Date | string;
}

const ensureIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

function mapOffer(row: OfferRow): OfferCatalogRecord {
  return {
    id: row.id,
    productName: row.product_name,
    species: row.species,
    latinName: row.latin_name,
    category: row.category,
    origin: row.origin,
    originCode: row.origin_code,
    originFlag: row.origin_flag,
    format: row.format,
    cutType: row.cut_type,
    packaging: row.packaging,
    certifications: row.certifications ?? [],
    image: row.image,
    images: row.images ?? [],
    gallery: row.gallery ?? [],
    photoSourceLabel: row.photo_source_label,
    sampleAvailable: row.sample_available,
    inspectionAvailable: row.inspection_available,
    traceability: row.traceability,
    freshness: row.freshness,
    moqLabel: row.moq_label,
    moqValue: row.moq_value == null ? null : Number(row.moq_value),
    moqUnit: row.moq_unit,
    priceRangeLabel: row.price_range_label,
    priceUnit: row.price_unit,
    priceMin: row.price_min == null ? null : Number(row.price_min),
    priceMax: row.price_max == null ? null : Number(row.price_max),
    currency: row.currency,
    supplier: row.supplier,
    specs: row.specs,
    commercial: row.commercial,
    deliveryBasisOptions: row.delivery_basis_options ?? [],
    relatedArticles: row.related_articles ?? [],
    volumeBreaks: row.volume_breaks ?? [],
    updatedAt: ensureIso(row.updated_at),
  };
}

function whereClause(query: OfferCatalogQuery, options: OfferCatalogRepositoryListOptions = {}) {
  const params: unknown[] = [];
  const where = ["publication_status = 'published'"];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (query.category) where.push(`category ilike ${add(`%${query.category}%`)}`);
  if (query.species) where.push(`species ilike ${add(`%${query.species}%`)}`);
  if (query.originCode) where.push(`origin_code = ${add(query.originCode.toUpperCase())}`);
  if (query.supplierCountryCode) where.push(`supplier_country_code = ${add(query.supplierCountryCode.toUpperCase())}`);
  if (query.format) where.push(`format = ${add(query.format)}`);
  if (query.certification) where.push(`certifications_search ilike ${add(`%${query.certification}%`)}`);
  if (query.q) {
    const needle = add(`%${query.q}%`);
    const privateSearchSupplierIds = options.privateSearchSupplierIds ?? [];
    if (privateSearchSupplierIds.length > 0) {
      const privateIds = add(privateSearchSupplierIds);
      where.push(`(public_search_text ilike ${needle} or (supplier_directory_id = any(${privateIds}::text[]) and private_search_text ilike ${needle}))`);
    } else {
      where.push(`public_search_text ilike ${needle}`);
    }
  }

  return { sql: where.join(" and "), params };
}

function orderByClause(query: OfferCatalogQuery) {
  const direction = query.sortDirection === "asc" ? "asc" : "desc";

  switch (query.sortBy) {
    case "category":
      return `category ${direction}, product_name ${direction}, id asc`;
    case "origin":
      return `origin_code ${direction}, origin ${direction}, product_name ${direction}, id asc`;
    case "moq":
      return `moq_value ${direction} nulls last, id asc`;
    case "updated_at":
    default:
      return `updated_at ${direction}, id asc`;
  }
}

export class PostgresOfferCatalogRepository implements OfferCatalogRepository {
  private readonly client: OfferQueryClient;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: PostgresOfferCatalogRepositoryOptions = {}) {
    this.client = options.client ?? new Pool({ connectionString: config.databaseUrl } satisfies PoolConfig);
  }

  async listOffers(query: OfferCatalogQuery, options: OfferCatalogRepositoryListOptions = {}) {
    const where = whereClause(query, options);
    const orderBy = orderByClause(query);
    const limitParam = where.params.length + 1;
    const offsetParam = where.params.length + 2;
    const result = await this.client.query<OfferRow & { total_count: number }>(
      `
        select *, count(*) over()::int as total_count
        from yorso_offers_catalog
        where ${where.sql}
        order by ${orderBy}
        limit $${limitParam}
        offset $${offsetParam}
      `,
      [...where.params, query.limit, query.offset],
    );

    return {
      offers: result.rows.map(mapOffer),
      total: Number(result.rows[0]?.total_count ?? 0),
    };
  }

  async getOfferById(id: string) {
    const normalizedId = normalizeOfferCatalogId(id);
    const result = await this.client.query<OfferRow>(
      `
        select *
        from yorso_offers_catalog
        where (id = $1 or id = $2) and publication_status = 'published'
        limit 1
      `,
      [id, normalizedId],
    );

    return result.rows[0] ? mapOffer(result.rows[0]) : null;
  }
}
