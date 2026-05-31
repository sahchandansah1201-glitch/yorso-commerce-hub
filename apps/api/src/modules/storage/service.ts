import { createHash, randomUUID } from "node:crypto";
import type {
  AccountFileAsset,
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
import { getDemoSupplierDocumentFileByAssetId } from "../../fixtures/supplier-document-assets.js";
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
    const { input, bytes } = this.prepareFileAsset(params);

    await this.objectStorage.putObject(input.objectKey, bytes, { contentType: input.contentType });

    try {
      const asset = await this.repository.createFileAsset(input);
      return accountFileAssetSchema.parse(asset);
    } catch (error) {
      await this.objectStorage.deleteObject(input.objectKey).catch(() => undefined);
      throw error;
    }
  }

  async createCompanyDocument(params: {
    userId: string;
    companyId: string;
    payload: CompanyDocumentCreate;
  }) {
    const { input, bytes } = this.prepareFileAsset({
      userId: params.userId,
      companyId: params.companyId,
      purpose: "company_document",
      upload: params.payload.file,
    });

    await this.objectStorage.putObject(input.objectKey, bytes, { contentType: input.contentType });

    try {
      return await this.repository.createCompanyDocumentWithFileAsset({
        fileAsset: input,
        document: {
          companyId: params.companyId,
          title: params.payload.title,
          documentType: params.payload.documentType,
          visibility: params.payload.visibility,
          expiresAt: params.payload.expiresAt ?? null,
        },
      });
    } catch (error) {
      await this.objectStorage.deleteObject(input.objectKey).catch(() => undefined);
      throw error;
    }
  }

  async deleteAccountFile(params: { userId: string; assetId: string }) {
    const asset = await this.repository.deleteFileAssetForUser(params.userId, params.assetId);
    if (!asset) return null;
    await this.objectStorage.deleteObject(asset.objectKey);
    return accountFileAssetSchema.parse(asset);
  }

  async listCompanyDocuments(companyId: string) {
    return accountCompanyDocumentsSchema.parse(await this.repository.listCompanyDocuments(companyId));
  }

  async getFileAssetForUser(userId: string, assetId: string) {
    const asset = await this.repository.getFileAssetForUser(userId, assetId);
    if (!asset) throw new Error("file_asset_not_found");
    return accountFileAssetSchema.parse(asset);
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

  async getFileByObjectKeyForUser(userId: string, objectKey: string) {
    const asset = await this.repository.getFileAssetByObjectKeyForUser(userId, objectKey);
    if (!asset) throw new Error("file_asset_not_found");
    const object = await this.objectStorage.getObject(asset.objectKey);
    return {
      asset,
      bytes: object.bytes,
      contentType: object.contentType || asset.contentType,
    };
  }

  async getFileByAssetId(assetId: string) {
    const asset = await this.repository.getFileAssetById(assetId);
    if (!asset) throw new Error("file_asset_not_found");
    const object = await this.readObjectForAsset(asset);
    return {
      asset,
      bytes: object.bytes,
      contentType: object.contentType || asset.contentType,
    };
  }

  private async readObjectForAsset(asset: AccountFileAsset) {
    try {
      return await this.objectStorage.getObject(asset.objectKey);
    } catch (error) {
      const demoSupplierDocument = getDemoSupplierDocumentFileByAssetId(asset.id);
      if (!demoSupplierDocument || demoSupplierDocument.asset.objectKey !== asset.objectKey) throw error;

      await this.objectStorage.putObject(asset.objectKey, demoSupplierDocument.bytes, {
        contentType: demoSupplierDocument.asset.contentType,
      });
      return this.objectStorage.getObject(asset.objectKey);
    }
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

  private prepareFileAsset(params: {
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

    return {
      bytes,
      input: {
        ownerUserId: params.userId,
        companyId: params.companyId,
        purpose: params.purpose,
        objectKey,
        originalFileName: upload.fileName,
        contentType: upload.contentType,
        sizeBytes: bytes.byteLength,
        checksumSha256,
        storageDriver: this.options.storageDriver,
      },
    };
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
