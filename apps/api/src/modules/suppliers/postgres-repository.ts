import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  SupplierCatalogPreviewItem,
  SupplierCertificationBadge,
  SupplierDeliveryCountry,
  SupplierDirectoryQuery,
  SupplierDirectoryRecord,
  SupplierDocumentDownloadEventAdminQuery,
  SupplierDocumentDownloadGrantAdminQuery,
  SupplierDocumentPayload,
  SupplierFaqItem,
  SupplierLegalDetails,
  SupplierLogisticsFacts,
  SupplierProductFocus,
  SupplierProductionFacts,
  SupplierShipmentCase,
  SupplierType,
} from "../../../../../packages/contracts/dist/index.js";
import type {
  SupplierDocumentDownloadEventInput,
  SupplierDocumentDownloadEventRecord,
  SupplierDocumentDownloadGrantAuditInput,
  SupplierDocumentDownloadGrantAuditRecord,
  SupplierDocumentManagementCreateInput,
  SupplierDocumentManagementDeleteInput,
  SupplierDocumentManagementDecisionInput,
  SupplierDocumentManagementUpdateInput,
  SupplierRepository,
  SupplierRepositoryListOptions,
} from "./repository.js";

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

interface SupplierDocumentDownloadGrantAuditRow extends SupplierDocumentDownloadGrantAuditRecord, Record<string, unknown> {}
interface SupplierDocumentDownloadEventRow extends SupplierDocumentDownloadEventRecord, Record<string, unknown> {}
interface SupplierDocumentManagementCreateRow extends Record<string, unknown> {
  document: SupplierDocumentPayload;
  action: SupplierDocumentManagementCreateInput["auditEvent"]["action"];
  actorRole: SupplierDocumentManagementCreateInput["auditEvent"]["actorRole"];
  supplierId: string;
  documentId: string;
  previousStatus: SupplierDocumentManagementCreateInput["auditEvent"]["previousStatus"];
  nextStatus: SupplierDocumentManagementCreateInput["auditEvent"]["nextStatus"];
  reason: string;
  requestId: string;
  createdAt: Date | string;
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

function mapDocumentDownloadEvent(row: SupplierDocumentDownloadEventRow): SupplierDocumentDownloadEventRecord {
  return {
    id: row.id,
    buyerUserId: row.buyerUserId,
    supplierId: row.supplierId,
    documentId: row.documentId,
    grantId: row.grantId,
    fileAssetId: row.fileAssetId,
    status: row.status,
    reason: row.reason,
    requestId: row.requestId,
    createdAt: ensureIso(row.createdAt),
  };
}

function mapDocumentDownloadGrant(row: SupplierDocumentDownloadGrantAuditRow): SupplierDocumentDownloadGrantAuditRecord {
  return {
    id: row.id,
    buyerUserId: row.buyerUserId,
    supplierId: row.supplierId,
    documentId: row.documentId,
    fileAssetId: row.fileAssetId,
    status: row.status,
    reason: row.reason,
    requestId: row.requestId,
    downloadPath: row.downloadPath,
    grantedAt: row.grantedAt ? ensureIso(row.grantedAt) : null,
    expiresAt: row.expiresAt ? ensureIso(row.expiresAt) : null,
    createdAt: ensureIso(row.createdAt),
  };
}

function mapDocumentManagementCreate(row: SupplierDocumentManagementCreateRow) {
  return {
    document: row.document,
    auditEvent: {
      action: row.action,
      actorRole: row.actorRole,
      supplierId: row.supplierId,
      documentId: row.documentId,
      previousStatus: row.previousStatus,
      nextStatus: row.nextStatus,
      reason: row.reason,
      requestId: row.requestId,
      createdAt: ensureIso(row.createdAt),
    },
  };
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

  async hasSupplierOwnerCompany(input: { supplierId: string; ownerCompanyId: string }) {
    const result = await this.client.query<{ exists: boolean }>(
      `
        select exists (
          select 1
          from yorso_suppliers_directory
          where id = $1
            and company_id = $2::uuid
            and publication_status in ('draft', 'published')
        ) as "exists"
      `,
      [input.supplierId, input.ownerCompanyId],
    );

    return Boolean(result.rows[0]?.exists);
  }

  async createSupplierDocumentForOwner(input: SupplierDocumentManagementCreateInput) {
    const result = await this.client.query<SupplierDocumentManagementCreateRow>(
      `
        with updated_supplier as (
          update yorso_suppliers_directory
          set
            supplier_documents = supplier_documents || $4::jsonb,
            document_readiness = case
              when document_readiness = 'on_request' then 'partial'
              else document_readiness
            end,
            updated_at = now()
          where id = $1
            and company_id = $2::uuid
            and publication_status in ('draft', 'published')
            and not exists (
              select 1
              from jsonb_array_elements(supplier_documents) as document
              where document->>'id' = $3
            )
          returning ($5::jsonb) as document
        ),
        inserted_audit as (
          insert into yorso_supplier_document_management_events (
            action,
            actor_role,
            actor_user_id,
            supplier_id,
            document_id,
            previous_status,
            next_status,
            reason,
            request_id,
            created_at
          )
          select
            $6,
            $7,
            $8::uuid,
            $1,
            $3,
            $9,
            $10,
            $11,
            $12,
            $13::timestamptz
          from updated_supplier
          returning
            action,
            actor_role as "actorRole",
            supplier_id as "supplierId",
            document_id as "documentId",
            previous_status as "previousStatus",
            next_status as "nextStatus",
            reason,
            request_id as "requestId",
            created_at as "createdAt"
        )
        select
          updated_supplier.document as "document",
          inserted_audit.action,
          inserted_audit."actorRole",
          inserted_audit."supplierId",
          inserted_audit."documentId",
          inserted_audit."previousStatus",
          inserted_audit."nextStatus",
          inserted_audit.reason,
          inserted_audit."requestId",
          inserted_audit."createdAt"
        from updated_supplier
        join inserted_audit on true
      `,
      [
        input.supplierId,
        input.ownerCompanyId,
        input.document.id,
        JSON.stringify([input.document]),
        JSON.stringify(input.document),
        input.auditEvent.action,
        input.auditEvent.actorRole,
        input.actorUserId,
        input.auditEvent.previousStatus,
        input.auditEvent.nextStatus,
        input.auditEvent.reason,
        input.auditEvent.requestId,
        input.auditEvent.createdAt,
      ],
    );

    return result.rows[0] ? mapDocumentManagementCreate(result.rows[0]) : null;
  }

  async decideSupplierDocumentAsAdmin(input: SupplierDocumentManagementDecisionInput) {
    const result = await this.client.query<SupplierDocumentManagementCreateRow>(
      `
        with target_document as (
          select
            supplier.id as supplier_id,
            (document.ordinality - 1)::int as document_index,
            document.value as previous_document
          from yorso_suppliers_directory supplier
          cross join lateral jsonb_array_elements(supplier.supplier_documents) with ordinality as document(value, ordinality)
          where supplier.id = $1
            and supplier.publication_status in ('draft', 'published')
            and document.value->>'id' = $2
            and document.value->>'status' = $3
          limit 1
        ),
        updated_supplier as (
          update yorso_suppliers_directory supplier
          set
            supplier_documents = jsonb_set(
              supplier.supplier_documents,
              array[target_document.document_index::text, 'status'],
              to_jsonb($4::text),
              false
            ),
            updated_at = now()
          from target_document
          where supplier.id = target_document.supplier_id
          returning jsonb_set(
            target_document.previous_document,
            '{status}',
            to_jsonb($4::text),
            false
          ) as document
        ),
        inserted_audit as (
          insert into yorso_supplier_document_management_events (
            action,
            actor_role,
            actor_user_id,
            supplier_id,
            document_id,
            previous_status,
            next_status,
            reason,
            request_id,
            created_at
          )
          select
            $5,
            $6,
            $7::uuid,
            $1,
            $2,
            $8,
            $9,
            $10,
            $11,
            $12::timestamptz
          from updated_supplier
          returning
            action,
            actor_role as "actorRole",
            supplier_id as "supplierId",
            document_id as "documentId",
            previous_status as "previousStatus",
            next_status as "nextStatus",
            reason,
            request_id as "requestId",
            created_at as "createdAt"
        )
        select
          updated_supplier.document as "document",
          inserted_audit.action,
          inserted_audit."actorRole",
          inserted_audit."supplierId",
          inserted_audit."documentId",
          inserted_audit."previousStatus",
          inserted_audit."nextStatus",
          inserted_audit.reason,
          inserted_audit."requestId",
          inserted_audit."createdAt"
        from updated_supplier
        join inserted_audit on true
      `,
      [
        input.supplierId,
        input.documentId,
        input.currentStatus,
        input.nextStatus,
        input.auditEvent.action,
        input.auditEvent.actorRole,
        input.actorUserId,
        input.auditEvent.previousStatus,
        input.auditEvent.nextStatus,
        input.auditEvent.reason,
        input.auditEvent.requestId,
        input.auditEvent.createdAt,
      ],
    );

    return result.rows[0] ? mapDocumentManagementCreate(result.rows[0]) : null;
  }

  async updateSupplierDocumentForOwner(input: SupplierDocumentManagementUpdateInput) {
    const result = await this.client.query<SupplierDocumentManagementCreateRow>(
      `
        with target_document as (
          select
            supplier.id as supplier_id,
            (document.ordinality - 1)::int as document_index
          from yorso_suppliers_directory supplier
          cross join lateral jsonb_array_elements(supplier.supplier_documents) with ordinality as document(value, ordinality)
          where supplier.id = $1
            and supplier.company_id = $2::uuid
            and supplier.publication_status in ('draft', 'published')
            and document.value->>'id' = $3
            and document.value->>'status' = $4
          limit 1
        ),
        updated_supplier as (
          update yorso_suppliers_directory supplier
          set
            supplier_documents = jsonb_set(
              supplier.supplier_documents,
              array[target_document.document_index::text],
              $5::jsonb,
              false
            ),
            updated_at = now()
          from target_document
          where supplier.id = target_document.supplier_id
          returning ($5::jsonb) as document
        ),
        inserted_audit as (
          insert into yorso_supplier_document_management_events (
            action,
            actor_role,
            actor_user_id,
            supplier_id,
            document_id,
            previous_status,
            next_status,
            reason,
            request_id,
            created_at
          )
          select
            $6,
            $7,
            $8::uuid,
            $1,
            $3,
            $9,
            $10,
            $11,
            $12,
            $13::timestamptz
          from updated_supplier
          returning
            action,
            actor_role as "actorRole",
            supplier_id as "supplierId",
            document_id as "documentId",
            previous_status as "previousStatus",
            next_status as "nextStatus",
            reason,
            request_id as "requestId",
            created_at as "createdAt"
        )
        select
          updated_supplier.document as "document",
          inserted_audit.action,
          inserted_audit."actorRole",
          inserted_audit."supplierId",
          inserted_audit."documentId",
          inserted_audit."previousStatus",
          inserted_audit."nextStatus",
          inserted_audit.reason,
          inserted_audit."requestId",
          inserted_audit."createdAt"
        from updated_supplier
        join inserted_audit on true
      `,
      [
        input.supplierId,
        input.ownerCompanyId,
        input.documentId,
        input.currentStatus,
        JSON.stringify(input.document),
        input.auditEvent.action,
        input.auditEvent.actorRole,
        input.actorUserId,
        input.auditEvent.previousStatus,
        input.auditEvent.nextStatus,
        input.auditEvent.reason,
        input.auditEvent.requestId,
        input.auditEvent.createdAt,
      ],
    );

    return result.rows[0] ? mapDocumentManagementCreate(result.rows[0]) : null;
  }

  async deleteSupplierDocumentForOwner(input: SupplierDocumentManagementDeleteInput) {
    const result = await this.client.query<SupplierDocumentManagementCreateRow>(
      `
        with target_document as (
          select
            supplier.id as supplier_id,
            (document.ordinality - 1)::int as document_index,
            document.value as previous_document
          from yorso_suppliers_directory supplier
          cross join lateral jsonb_array_elements(supplier.supplier_documents) with ordinality as document(value, ordinality)
          where supplier.id = $1
            and supplier.company_id = $2::uuid
            and supplier.publication_status in ('draft', 'published')
            and document.value->>'id' = $3
            and document.value->>'status' = $4
          limit 1
        ),
        updated_supplier as (
          update yorso_suppliers_directory supplier
          set
            supplier_documents = coalesce((
              select jsonb_agg(remaining.value order by remaining.ordinality)
              from jsonb_array_elements(supplier.supplier_documents) with ordinality as remaining(value, ordinality)
              where remaining.ordinality <> target_document.document_index + 1
            ), '[]'::jsonb),
            updated_at = now()
          from target_document
          where supplier.id = target_document.supplier_id
          returning target_document.previous_document as document
        ),
        inserted_audit as (
          insert into yorso_supplier_document_management_events (
            action,
            actor_role,
            actor_user_id,
            supplier_id,
            document_id,
            previous_status,
            next_status,
            reason,
            request_id,
            created_at
          )
          select
            $5,
            $6,
            $7::uuid,
            $1,
            $3,
            $8,
            $9,
            $10,
            $11,
            $12::timestamptz
          from updated_supplier
          returning
            action,
            actor_role as "actorRole",
            supplier_id as "supplierId",
            document_id as "documentId",
            previous_status as "previousStatus",
            next_status as "nextStatus",
            reason,
            request_id as "requestId",
            created_at as "createdAt"
        )
        select
          updated_supplier.document as "document",
          inserted_audit.action,
          inserted_audit."actorRole",
          inserted_audit."supplierId",
          inserted_audit."documentId",
          inserted_audit."previousStatus",
          inserted_audit."nextStatus",
          inserted_audit.reason,
          inserted_audit."requestId",
          inserted_audit."createdAt"
        from updated_supplier
        join inserted_audit on true
      `,
      [
        input.supplierId,
        input.ownerCompanyId,
        input.documentId,
        input.currentStatus,
        input.auditEvent.action,
        input.auditEvent.actorRole,
        input.actorUserId,
        input.auditEvent.previousStatus,
        input.auditEvent.nextStatus,
        input.auditEvent.reason,
        input.auditEvent.requestId,
        input.auditEvent.createdAt,
      ],
    );

    return result.rows[0] ? mapDocumentManagementCreate(result.rows[0]) : null;
  }

  async getDocumentDownloadGrantById(id: string) {
    const result = await this.client.query<SupplierDocumentDownloadGrantAuditRow>(
      `
        select
          id,
          buyer_user_id as "buyerUserId",
          supplier_id as "supplierId",
          document_id as "documentId",
          file_asset_id as "fileAssetId",
          status,
          reason,
          request_id as "requestId",
          download_path as "downloadPath",
          granted_at as "grantedAt",
          expires_at as "expiresAt",
          created_at as "createdAt"
        from yorso_supplier_document_download_grants
        where id = $1
        limit 1
      `,
      [id],
    );

    return result.rows[0] ? mapDocumentDownloadGrant(result.rows[0]) : null;
  }

  async recordDocumentDownloadGrant(input: SupplierDocumentDownloadGrantAuditInput) {
    const result = await this.client.query<SupplierDocumentDownloadGrantAuditRow>(
      `
        insert into yorso_supplier_document_download_grants (
          id,
          buyer_user_id,
          supplier_id,
          document_id,
          file_asset_id,
          status,
          reason,
          request_id,
          download_path,
          granted_at,
          expires_at
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10::timestamptz,
          $11::timestamptz
        )
        returning
          id,
          buyer_user_id as "buyerUserId",
          supplier_id as "supplierId",
          document_id as "documentId",
          file_asset_id as "fileAssetId",
          status,
          reason,
          request_id as "requestId",
          download_path as "downloadPath",
          granted_at as "grantedAt",
          expires_at as "expiresAt",
          created_at as "createdAt"
      `,
      [
        input.id,
        input.buyerUserId,
        input.supplierId,
        input.documentId,
        input.fileAssetId,
        input.status,
        input.reason,
        input.requestId,
        input.downloadPath,
        input.grantedAt,
        input.expiresAt,
      ],
    );

    return mapDocumentDownloadGrant(result.rows[0]);
  }

  async listDocumentDownloadGrants(input: SupplierDocumentDownloadGrantAdminQuery) {
    const params: unknown[] = [];
    const where: string[] = [];
    const add = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };

    if (input.status) where.push(`status = ${add(input.status)}`);
    if (input.supplierId) where.push(`supplier_id = ${add(input.supplierId)}`);
    if (input.buyerUserId) where.push(`buyer_user_id = ${add(input.buyerUserId)}`);

    const limitParam = add(input.limit);
    const offsetParam = add(input.offset);
    const whereSql = where.length ? `where ${where.join(" and ")}` : "";
    const result = await this.client.query<SupplierDocumentDownloadGrantAuditRow>(
      `
        select
          id,
          buyer_user_id as "buyerUserId",
          supplier_id as "supplierId",
          document_id as "documentId",
          file_asset_id as "fileAssetId",
          status,
          reason,
          request_id as "requestId",
          download_path as "downloadPath",
          granted_at as "grantedAt",
          expires_at as "expiresAt",
          created_at as "createdAt"
        from yorso_supplier_document_download_grants
        ${whereSql}
        order by created_at desc, id asc
        limit ${limitParam}
        offset ${offsetParam}
      `,
      params,
    );

    return result.rows.map(mapDocumentDownloadGrant);
  }

  async recordDocumentDownloadEvent(input: SupplierDocumentDownloadEventInput) {
    const result = await this.client.query<SupplierDocumentDownloadEventRow>(
      `
        insert into yorso_supplier_document_download_events (
          id,
          buyer_user_id,
          supplier_id,
          document_id,
          grant_id,
          file_asset_id,
          status,
          reason,
          request_id
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        returning
          id,
          buyer_user_id as "buyerUserId",
          supplier_id as "supplierId",
          document_id as "documentId",
          grant_id as "grantId",
          file_asset_id as "fileAssetId",
          status,
          reason,
          request_id as "requestId",
          created_at as "createdAt"
      `,
      [
        input.id,
        input.buyerUserId,
        input.supplierId,
        input.documentId,
        input.grantId,
        input.fileAssetId,
        input.status,
        input.reason,
        input.requestId,
      ],
    );

    return mapDocumentDownloadEvent(result.rows[0]);
  }

  async listDocumentDownloadEvents(input: SupplierDocumentDownloadEventAdminQuery) {
    const params: unknown[] = [];
    const where: string[] = [];
    const add = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };

    if (input.status) where.push(`status = ${add(input.status)}`);
    if (input.supplierId) where.push(`supplier_id = ${add(input.supplierId)}`);
    if (input.buyerUserId) where.push(`buyer_user_id = ${add(input.buyerUserId)}`);

    const limitParam = add(input.limit);
    const offsetParam = add(input.offset);
    const whereSql = where.length ? `where ${where.join(" and ")}` : "";
    const result = await this.client.query<SupplierDocumentDownloadEventRow>(
      `
        select
          id,
          buyer_user_id as "buyerUserId",
          supplier_id as "supplierId",
          document_id as "documentId",
          grant_id as "grantId",
          file_asset_id as "fileAssetId",
          status,
          reason,
          request_id as "requestId",
          created_at as "createdAt"
        from yorso_supplier_document_download_events
        ${whereSql}
        order by created_at desc, id asc
        limit ${limitParam}
        offset ${offsetParam}
      `,
      params,
    );

    return result.rows.map(mapDocumentDownloadEvent);
  }
}
