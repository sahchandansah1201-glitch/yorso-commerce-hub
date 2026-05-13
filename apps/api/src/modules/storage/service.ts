import { createHash, randomUUID } from "node:crypto";
import type {
  AccountFilePurpose,
  AccountFileUploadPayload,
  CompanyDocumentCreate,
  CompanyMediaUpload,
} from "../../../../../packages/contracts/dist/index.js";
import {
  accountCompanyDocumentsSchema,
  accountFileAssetSchema,
  accountFileUploadPayloadSchema,
  companyDocumentCreateSchema,
  companyMediaUploadSchema,
} from "../../../../../packages/contracts/dist/index.js";
import type { ObjectStorage } from "./object-storage.js";
import type { FileRepository } from "./repository.js";

export interface FileServiceOptions {
  maxUploadBytes: number;
  storageDriver: "local";
}

export class FileService {
  readonly maxUploadBytes: number;
  readonly maxJsonBodyBytes: number;

  constructor(
    private readonly repository: FileRepository,
    private readonly objectStorage: ObjectStorage,
    private readonly options: FileServiceOptions,
  ) {
    this.maxUploadBytes = options.maxUploadBytes;
    this.maxJsonBodyBytes = Math.ceil(options.maxUploadBytes * 1.4) + 4096;
  }

  parseMediaUpload(payload: unknown): CompanyMediaUpload {
    return this.assertUploadSize(companyMediaUploadSchema.parse(payload));
  }

  parseDocumentCreate(payload: unknown): CompanyDocumentCreate {
    const parsed = companyDocumentCreateSchema.parse(payload);
    this.assertUploadSize(parsed.file);
    return parsed;
  }

  async storeAccountFile(params: {
    userId: string;
    companyId: string | null;
    purpose: AccountFilePurpose;
    upload: AccountFileUploadPayload;
  }) {
    const upload = this.assertUploadSize(accountFileUploadPayloadSchema.parse(params.upload));
    const bytes = this.decodeBase64(upload);
    const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
    const objectKey = buildObjectKey({
      userId: params.userId,
      companyId: params.companyId,
      purpose: params.purpose,
      fileName: upload.fileName,
    });

    await this.objectStorage.putObject(objectKey, bytes, { contentType: upload.contentType });

    const asset = await this.repository.createFileAsset({
      ownerUserId: params.userId,
      companyId: params.companyId,
      purpose: params.purpose,
      objectKey,
      originalFileName: upload.fileName,
      contentType: upload.contentType,
      sizeBytes: bytes.byteLength,
      checksumSha256,
      storageDriver: this.options.storageDriver,
    });

    return accountFileAssetSchema.parse(asset);
  }

  async createCompanyDocument(params: {
    userId: string;
    companyId: string;
    payload: CompanyDocumentCreate;
  }) {
    const asset = await this.storeAccountFile({
      userId: params.userId,
      companyId: params.companyId,
      purpose: "company_document",
      upload: params.payload.file,
    });
    const document = await this.repository.createCompanyDocument({
      companyId: params.companyId,
      fileAssetId: asset.id,
      title: params.payload.title,
      documentType: params.payload.documentType,
      visibility: params.payload.visibility,
      expiresAt: params.payload.expiresAt ?? null,
    });
    return document;
  }

  async listCompanyDocuments(companyId: string) {
    return accountCompanyDocumentsSchema.parse(await this.repository.listCompanyDocuments(companyId));
  }

  async getFileForUser(userId: string, assetId: string) {
    const asset = await this.repository.getFileAssetForUser(userId, assetId);
    if (!asset) throw new Error("file_asset_not_found");
    const object = await this.objectStorage.getObject(asset.objectKey);
    return {
      asset,
      bytes: object.bytes,
      contentType: object.contentType || asset.contentType,
    };
  }

  private decodeBase64(upload: AccountFileUploadPayload) {
    const bytes = Buffer.from(upload.contentBase64, "base64");
    if (bytes.byteLength !== upload.sizeBytes) {
      throw new Error("upload_size_mismatch");
    }
    if (bytes.byteLength > this.maxUploadBytes) {
      throw new Error("upload_too_large");
    }
    return bytes;
  }

  private assertUploadSize<T extends AccountFileUploadPayload>(upload: T): T {
    if (upload.sizeBytes > this.maxUploadBytes) {
      throw new Error("upload_too_large");
    }
    return upload;
  }
}

const safeFileName = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";

function buildObjectKey(input: {
  userId: string;
  companyId: string | null;
  purpose: AccountFilePurpose;
  fileName: string;
}) {
  const owner = input.companyId ? `companies/${input.companyId}` : `users/${input.userId}`;
  return `${owner}/${input.purpose}/${randomUUID()}-${safeFileName(input.fileName)}`;
}
