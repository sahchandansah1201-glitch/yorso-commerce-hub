import { randomUUID } from "node:crypto";
import type {
  AccountFileAsset,
  AccountFilePurpose,
  CompanyDocument,
  CompanyDocumentCreate,
} from "../../../../../packages/contracts/dist/index.js";

export interface FileAssetCreateInput {
  ownerUserId: string;
  companyId: string | null;
  purpose: AccountFilePurpose;
  objectKey: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  storageDriver: AccountFileAsset["storageDriver"];
}

export interface CompanyDocumentCreateInput {
  companyId: string;
  fileAssetId: string;
  title: string;
  documentType: CompanyDocumentCreate["documentType"];
  visibility: CompanyDocumentCreate["visibility"];
  expiresAt: string | null;
}

export interface CompanyDocumentWithFileAssetCreateInput {
  fileAsset: FileAssetCreateInput;
  document: Omit<CompanyDocumentCreateInput, "fileAssetId">;
}

export interface FileRepository {
  createFileAsset(input: FileAssetCreateInput): Promise<AccountFileAsset>;
  createCompanyDocumentWithFileAsset(input: CompanyDocumentWithFileAssetCreateInput): Promise<CompanyDocument>;
  deleteFileAssetForUser(userId: string, assetId: string): Promise<AccountFileAsset | null>;
  getFileAssetForUser(userId: string, assetId: string): Promise<AccountFileAsset | null>;
  getFileAssetByObjectKeyForUser(userId: string, objectKey: string): Promise<AccountFileAsset | null>;
  createCompanyDocument(input: CompanyDocumentCreateInput): Promise<CompanyDocument>;
  listCompanyDocuments(companyId: string): Promise<CompanyDocument[]>;
}

export class MemoryFileRepository implements FileRepository {
  private readonly assets = new Map<string, AccountFileAsset & { ownerUserId: string }>();
  private readonly documents = new Map<string, CompanyDocument>();

  async createFileAsset(input: FileAssetCreateInput): Promise<AccountFileAsset> {
    const asset: AccountFileAsset & { ownerUserId: string } = {
      id: randomUUID(),
      companyId: input.companyId,
      purpose: input.purpose,
      objectKey: input.objectKey,
      originalFileName: input.originalFileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      checksumSha256: input.checksumSha256,
      storageDriver: input.storageDriver,
      createdAt: new Date().toISOString(),
      ownerUserId: input.ownerUserId,
    };
    this.assets.set(asset.id, asset);
    return stripOwner(asset);
  }

  async createCompanyDocumentWithFileAsset(input: CompanyDocumentWithFileAssetCreateInput): Promise<CompanyDocument> {
    const asset = await this.createFileAsset(input.fileAsset);
    try {
      return await this.createCompanyDocument({
        ...input.document,
        fileAssetId: asset.id,
      });
    } catch (error) {
      this.assets.delete(asset.id);
      throw error;
    }
  }

  async deleteFileAssetForUser(userId: string, assetId: string): Promise<AccountFileAsset | null> {
    const asset = this.assets.get(assetId);
    if (!asset || asset.ownerUserId !== userId) return null;
    if ([...this.documents.values()].some((document) => document.fileAssetId === assetId)) {
      throw new Error("file_asset_in_use");
    }
    this.assets.delete(assetId);
    return stripOwner(asset);
  }

  async getFileAssetForUser(userId: string, assetId: string): Promise<AccountFileAsset | null> {
    const asset = this.assets.get(assetId);
    if (!asset || asset.ownerUserId !== userId) return null;
    return stripOwner(asset);
  }

  async getFileAssetByObjectKeyForUser(userId: string, objectKey: string): Promise<AccountFileAsset | null> {
    const asset = [...this.assets.values()].find(
      (item) => item.ownerUserId === userId && item.objectKey === objectKey,
    );
    return asset ? stripOwner(asset) : null;
  }

  async createCompanyDocument(input: CompanyDocumentCreateInput): Promise<CompanyDocument> {
    const asset = [...this.assets.values()].find((item) => item.id === input.fileAssetId);
    if (!asset || asset.companyId !== input.companyId) throw new Error("file_asset_not_found");

    const now = new Date().toISOString();
    const document: CompanyDocument = {
      id: randomUUID(),
      companyId: input.companyId,
      fileAssetId: input.fileAssetId,
      title: input.title,
      documentType: input.documentType,
      visibility: input.visibility,
      status: "uploaded",
      fileName: asset.originalFileName,
      contentType: asset.contentType,
      sizeBytes: asset.sizeBytes,
      checksumSha256: asset.checksumSha256,
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(document.id, document);
    return document;
  }

  async listCompanyDocuments(companyId: string): Promise<CompanyDocument[]> {
    return [...this.documents.values()].filter((document) => document.companyId === companyId);
  }
}

const stripOwner = (asset: AccountFileAsset & { ownerUserId: string }): AccountFileAsset => {
  const { ownerUserId: _ownerUserId, ...publicAsset } = asset;
  void _ownerUserId;
  return publicAsset;
};
