import { Pool, type PoolConfig, type QueryResult } from "pg";
import type { ApiConfig } from "../../config.js";
import type {
  AccountFileAsset,
  AccountFilePurpose,
  CompanyDocument,
  CompanyDocumentStatus,
  CompanyDocumentType,
  CompanyDocumentVisibility,
} from "../../../../../packages/contracts/dist/index.js";
import type {
  CompanyDocumentCreateInput,
  CompanyDocumentWithFileAssetCreateInput,
  FileAssetCreateInput,
  FileRepository,
} from "./repository.js";

interface FileQueryClient {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<Pick<QueryResult<Row>, "rows">>;
  end?(): Promise<void>;
}

interface PostgresFileRepositoryOptions {
  client?: FileQueryClient;
}

interface FileAssetRow extends Record<string, unknown> {
  id: string;
  company_id: string | null;
  purpose: AccountFilePurpose;
  object_key: string;
  original_file_name: string;
  content_type: string;
  size_bytes: number;
  checksum_sha256: string;
  storage_driver: AccountFileAsset["storageDriver"];
  created_at: Date | string;
}

interface CompanyDocumentRow extends Record<string, unknown> {
  id: string;
  company_id: string;
  file_asset_id: string;
  title: string;
  document_type: CompanyDocumentType;
  visibility: CompanyDocumentVisibility;
  status: CompanyDocumentStatus;
  original_file_name: string;
  content_type: string;
  size_bytes: number;
  checksum_sha256: string;
  expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

const ensureIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());
const ensureDate = (value: Date | string | null) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
};

const mapAsset = (row: FileAssetRow): AccountFileAsset => ({
  id: row.id,
  companyId: row.company_id,
  purpose: row.purpose,
  objectKey: row.object_key,
  originalFileName: row.original_file_name,
  contentType: row.content_type,
  sizeBytes: row.size_bytes,
  checksumSha256: row.checksum_sha256,
  storageDriver: row.storage_driver,
  createdAt: ensureIso(row.created_at),
});

const mapDocument = (row: CompanyDocumentRow): CompanyDocument => ({
  id: row.id,
  companyId: row.company_id,
  fileAssetId: row.file_asset_id,
  title: row.title,
  documentType: row.document_type,
  visibility: row.visibility,
  status: row.status,
  fileName: row.original_file_name,
  contentType: row.content_type,
  sizeBytes: row.size_bytes,
  checksumSha256: row.checksum_sha256,
  expiresAt: ensureDate(row.expires_at),
  createdAt: ensureIso(row.created_at),
  updatedAt: ensureIso(row.updated_at),
});

const assetSelect = `
  select id, company_id, purpose, object_key, original_file_name, content_type,
    size_bytes, checksum_sha256, storage_driver, created_at
  from yorso_file_assets
`;

const documentSelect = `
  select
    d.id,
    d.company_id,
    d.file_asset_id,
    d.title,
    d.document_type,
    d.visibility,
    d.status,
    d.expires_at,
    d.created_at,
    d.updated_at,
    a.original_file_name,
    a.content_type,
    a.size_bytes,
    a.checksum_sha256
  from yorso_company_documents d
  join yorso_file_assets a on a.id = d.file_asset_id
`;

export class PostgresFileRepository implements FileRepository {
  private readonly client: FileQueryClient;
  private readonly ownsClient: boolean;

  constructor(config: Pick<ApiConfig, "databaseUrl">, options: PostgresFileRepositoryOptions = {}) {
    if (!config.databaseUrl.startsWith("postgres")) {
      throw new Error("PostgresFileRepository requires a PostgreSQL DATABASE_URL.");
    }
    this.client = options.client ?? new Pool({ connectionString: config.databaseUrl } satisfies PoolConfig);
    this.ownsClient = !options.client;
  }

  async close() {
    if (this.ownsClient) await this.client.end?.();
  }

  async createFileAsset(input: FileAssetCreateInput): Promise<AccountFileAsset> {
    const result = await this.client.query<FileAssetRow>(
      `
        insert into yorso_file_assets (
          owner_user_id, company_id, purpose, object_key, original_file_name,
          content_type, size_bytes, checksum_sha256, storage_driver, created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
        returning id, company_id, purpose, object_key, original_file_name, content_type,
          size_bytes, checksum_sha256, storage_driver, created_at
      `,
      [
        input.ownerUserId,
        input.companyId,
        input.purpose,
        input.objectKey,
        input.originalFileName,
        input.contentType,
        input.sizeBytes,
        input.checksumSha256,
        input.storageDriver,
      ],
    );

    return mapAsset(result.rows[0]);
  }

  async createCompanyDocumentWithFileAsset(input: CompanyDocumentWithFileAssetCreateInput): Promise<CompanyDocument> {
    const result = await this.client.query<CompanyDocumentRow>(
      `
        with inserted_asset as (
          insert into yorso_file_assets (
            owner_user_id, company_id, purpose, object_key, original_file_name,
            content_type, size_bytes, checksum_sha256, storage_driver, created_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
          returning id, company_id, original_file_name, content_type, size_bytes, checksum_sha256
        ),
        inserted_document as (
          insert into yorso_company_documents (
            company_id, file_asset_id, title, document_type, visibility, status, expires_at, created_at, updated_at
          )
          select $10, inserted_asset.id, $11, $12, $13, 'uploaded', $14, now(), now()
          from inserted_asset
          returning id, company_id, file_asset_id, title, document_type, visibility, status, expires_at, created_at, updated_at
        )
        select
          d.id,
          d.company_id,
          d.file_asset_id,
          d.title,
          d.document_type,
          d.visibility,
          d.status,
          d.expires_at,
          d.created_at,
          d.updated_at,
          a.original_file_name,
          a.content_type,
          a.size_bytes,
          a.checksum_sha256
        from inserted_document d
        join inserted_asset a on a.id = d.file_asset_id
      `,
      [
        input.fileAsset.ownerUserId,
        input.fileAsset.companyId,
        input.fileAsset.purpose,
        input.fileAsset.objectKey,
        input.fileAsset.originalFileName,
        input.fileAsset.contentType,
        input.fileAsset.sizeBytes,
        input.fileAsset.checksumSha256,
        input.fileAsset.storageDriver,
        input.document.companyId,
        input.document.title,
        input.document.documentType,
        input.document.visibility,
        input.document.expiresAt,
      ],
    );

    if (!result.rows[0]) throw new Error("company_document_not_created");
    return mapDocument(result.rows[0]);
  }

  async deleteFileAssetForUser(userId: string, assetId: string): Promise<AccountFileAsset | null> {
    const result = await this.client.query<FileAssetRow>(
      `
        delete from yorso_file_assets
        where id = $1 and owner_user_id = $2
        returning id, company_id, purpose, object_key, original_file_name, content_type,
          size_bytes, checksum_sha256, storage_driver, created_at
      `,
      [assetId, userId],
    );
    return result.rows[0] ? mapAsset(result.rows[0]) : null;
  }

  async getFileAssetForUser(userId: string, assetId: string): Promise<AccountFileAsset | null> {
    const result = await this.client.query<FileAssetRow>(
      `${assetSelect} where id = $1 and owner_user_id = $2 limit 1`,
      [assetId, userId],
    );
    return result.rows[0] ? mapAsset(result.rows[0]) : null;
  }

  async getFileAssetByObjectKeyForUser(userId: string, objectKey: string): Promise<AccountFileAsset | null> {
    const result = await this.client.query<FileAssetRow>(
      `${assetSelect} where object_key = $1 and owner_user_id = $2 limit 1`,
      [objectKey, userId],
    );
    return result.rows[0] ? mapAsset(result.rows[0]) : null;
  }

  async getFileAssetById(assetId: string): Promise<AccountFileAsset | null> {
    const result = await this.client.query<FileAssetRow>(
      `${assetSelect} where id = $1 limit 1`,
      [assetId],
    );
    return result.rows[0] ? mapAsset(result.rows[0]) : null;
  }

  async createCompanyDocument(input: CompanyDocumentCreateInput): Promise<CompanyDocument> {
    const result = await this.client.query<CompanyDocumentRow>(
      `
        with inserted as (
          insert into yorso_company_documents (
            company_id, file_asset_id, title, document_type, visibility, status, expires_at, created_at, updated_at
          )
          values ($1, $2, $3, $4, $5, 'uploaded', $6, now(), now())
          returning id
        )
        ${documentSelect}
        join inserted i on i.id = d.id
      `,
      [
        input.companyId,
        input.fileAssetId,
        input.title,
        input.documentType,
        input.visibility,
        input.expiresAt,
      ],
    );

    if (!result.rows[0]) throw new Error("company_document_not_created");
    return mapDocument(result.rows[0]);
  }

  async listCompanyDocuments(companyId: string): Promise<CompanyDocument[]> {
    const result = await this.client.query<CompanyDocumentRow>(
      `${documentSelect} where d.company_id = $1 order by d.created_at desc, d.title asc`,
      [companyId],
    );
    return result.rows.map(mapDocument);
  }
}
