import { randomUUID } from "node:crypto";
import {
  supplierDocumentDownloadEventAdminListResponseSchema,
  supplierDocumentDownloadEventAdminQuerySchema,
  supplierDocumentDownloadGrantAdminListResponseSchema,
  supplierDocumentDownloadGrantAdminQuerySchema,
  supplierDocumentDownloadGrantResponseSchema,
  supplierDocumentManagementCreateRequestSchema,
  supplierDocumentManagementCreateResponseSchema,
  supplierDirectoryDetailResponseSchema,
  supplierDirectoryItemSchema,
  supplierDirectoryListResponseSchema,
  supplierDocumentPayloadSchema,
  supplierDirectoryQuerySchema,
  type AccountRole,
  type SupplierDirectoryAccessLevel,
  type SupplierDirectoryItem,
  type SupplierDirectoryRecord,
  type SupplierDocumentDownloadEventStatus,
  type SupplierDocumentDownloadGrantStatus,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierAccessRepository } from "../access/repository.js";
import type { FileService } from "../storage/service.js";
import { evaluateSupplierDocumentManagementPolicy } from "./document-management-policy.js";
import type { SupplierRepository } from "./repository.js";

export class SupplierDirectoryService {
  constructor(
    private readonly repository: SupplierRepository,
    private readonly accessRepository?: SupplierAccessRepository,
    private readonly fileService?: FileService,
  ) {}

  async listSuppliers(
    rawQuery: Record<string, string | undefined>,
    requestId: string,
    viewer: { buyerUserId: string } | null = null,
  ) {
    const query = supplierDirectoryQuerySchema.parse(rawQuery);
    const accessibleSupplierIds = await this.listAccessibleSupplierIds(query.accessLevel, viewer);
    const accessibleSupplierIdSet = new Set(accessibleSupplierIds);
    const { suppliers, total } = await this.repository.listSuppliers(query, {
      privateSearchSupplierIds: query.q ? accessibleSupplierIds : [],
    });
    const shapedSuppliers = suppliers.map((supplier) =>
      shapeSupplierForAccess(supplier, this.resolveListAccessLevel(supplier.id, query.accessLevel, accessibleSupplierIdSet)),
    );

    return supplierDirectoryListResponseSchema.parse({
      ok: true,
      suppliers: shapedSuppliers,
      total,
      accessLevel: query.accessLevel,
      limit: query.limit,
      offset: query.offset,
      requestId,
    });
  }

  async consumeSupplierDocumentDownloadGrant(
    supplierId: string,
    documentId: string,
    grantId: string,
    requestId: string,
    viewer: { buyerUserId: string },
  ) {
    const grant = await this.repository.getDocumentDownloadGrantById(grantId);
    if (!grant || grant.status !== "granted" || !grant.fileAssetId || !grant.expiresAt) {
      await this.recordDocumentDownloadEvent({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        grantId,
        fileAssetId: null,
        status: "grant_not_found",
        reason: "supplier_document_grant_not_found",
        requestId,
      });
      throw new Error("supplier_document_grant_not_found");
    }

    if (grant.buyerUserId !== viewer.buyerUserId || grant.supplierId !== supplierId || grant.documentId !== documentId) {
      await this.recordDocumentDownloadEvent({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        grantId,
        fileAssetId: grant.fileAssetId,
        status: "grant_denied",
        reason: "supplier_document_grant_denied",
        requestId,
      });
      throw new Error("supplier_document_grant_denied");
    }

    if (new Date(grant.expiresAt).getTime() <= Date.now()) {
      await this.recordDocumentDownloadEvent({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        grantId,
        fileAssetId: grant.fileAssetId,
        status: "grant_expired",
        reason: "supplier_document_grant_expired",
        requestId,
      });
      throw new Error("supplier_document_grant_expired");
    }

    const hasAccess = this.accessRepository
      ? await this.accessRepository.hasSupplierAccess({ buyerUserId: viewer.buyerUserId, supplierId })
      : false;
    if (!hasAccess) {
      await this.recordDocumentDownloadEvent({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        grantId,
        fileAssetId: grant.fileAssetId,
        status: "access_denied",
        reason: "supplier_access_required",
        requestId,
      });
      throw new Error("supplier_document_access_required");
    }

    const supplier = await this.repository.getSupplierById(supplierId);
    if (!supplier) throw new Error("supplier_not_found");
    const document = supplier.supplierDocuments.find((item) => item.id === documentId);
    if (!document?.fileAssetId || document.fileAssetId !== grant.fileAssetId || document.status !== "approved") {
      await this.recordDocumentDownloadEvent({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        grantId,
        fileAssetId: grant.fileAssetId,
        status: "document_unavailable",
        reason: "supplier_document_unavailable",
        requestId,
      });
      throw new Error("supplier_document_unavailable");
    }

    if (!this.fileService) throw new Error("supplier_document_file_unavailable");
    let file: Awaited<ReturnType<FileService["getFileByAssetId"]>>;
    try {
      file = await this.fileService.getFileByAssetId(grant.fileAssetId);
    } catch {
      await this.recordDocumentDownloadEvent({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        grantId,
        fileAssetId: grant.fileAssetId,
        status: "file_unavailable",
        reason: "supplier_document_file_unavailable",
        requestId,
      });
      throw new Error("supplier_document_file_unavailable");
    }

    await this.recordDocumentDownloadEvent({
      buyerUserId: viewer.buyerUserId,
      supplierId,
      documentId,
      grantId,
      fileAssetId: grant.fileAssetId,
      status: "downloaded",
      reason: "downloaded",
      requestId,
    });

    return {
      bytes: file.bytes,
      contentType: file.contentType,
      fileName: document.fileName ?? file.asset.originalFileName,
    };
  }

  async getSupplierById(
    id: string,
    rawQuery: Record<string, string | undefined>,
    requestId: string,
    viewer: { buyerUserId: string } | null = null,
  ) {
    const query = supplierDirectoryQuerySchema.pick({ accessLevel: true }).parse(rawQuery);
    const supplier = await this.repository.getSupplierById(id);
    if (!supplier) throw new Error("supplier_not_found");
    const accessLevel = await this.resolveDetailAccessLevel(supplier.id, query.accessLevel, viewer);

    return supplierDirectoryDetailResponseSchema.parse({
      ok: true,
      supplier: shapeSupplierForAccess(supplier, accessLevel),
      accessLevel,
      requestId,
    });
  }

  async createSupplierDocumentDownloadGrant(
    supplierId: string,
    documentId: string,
    requestId: string,
    viewer: { buyerUserId: string },
  ) {
    const supplier = await this.repository.getSupplierById(supplierId);
    if (!supplier) throw new Error("supplier_not_found");

    const hasAccess = this.accessRepository
      ? await this.accessRepository.hasSupplierAccess({ buyerUserId: viewer.buyerUserId, supplierId })
      : false;
    if (!hasAccess) {
      await this.recordDocumentGrantAttempt({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        fileAssetId: null,
        status: "access_denied",
        reason: "supplier_access_required",
        requestId,
        downloadPath: null,
        grantedAt: null,
        expiresAt: null,
      });
      throw new Error("supplier_document_access_required");
    }

    const document = supplier.supplierDocuments.find((item) => item.id === documentId);
    if (!document) {
      await this.recordDocumentGrantAttempt({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        fileAssetId: null,
        status: "document_not_found",
        reason: "supplier_document_not_found",
        requestId,
        downloadPath: null,
        grantedAt: null,
        expiresAt: null,
      });
      throw new Error("supplier_document_not_found");
    }

    if (!document.fileAssetId || !document.fileName || document.status !== "approved") {
      await this.recordDocumentGrantAttempt({
        buyerUserId: viewer.buyerUserId,
        supplierId,
        documentId,
        fileAssetId: document.fileAssetId,
        status: "document_unavailable",
        reason: "supplier_document_unavailable",
        requestId,
        downloadPath: null,
        grantedAt: null,
        expiresAt: null,
      });
      throw new Error("supplier_document_unavailable");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60_000);
    const grantId = `sdg_${randomUUID()}`;
    const downloadPath = `/v1/suppliers/${encodeURIComponent(supplierId)}/documents/${encodeURIComponent(documentId)}/download?grantId=${encodeURIComponent(grantId)}`;
    const responseGrant = {
      id: grantId,
      supplierId,
      documentId,
      fileName: document.fileName,
      downloadPath,
      grantedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.recordDocumentGrantAttempt({
      id: responseGrant.id,
      buyerUserId: viewer.buyerUserId,
      supplierId,
      documentId,
      fileAssetId: document.fileAssetId,
      status: "granted",
      reason: "granted",
      requestId,
      downloadPath,
      grantedAt: responseGrant.grantedAt,
      expiresAt: responseGrant.expiresAt,
    });

    return supplierDocumentDownloadGrantResponseSchema.parse({
      ok: true,
      grant: responseGrant,
      requestId,
    });
  }

  async createSupplierDocumentForOwner(
    supplierId: string,
    payload: unknown,
    requestId: string,
    owner: { userId: string; companyId: string; accountRole: AccountRole },
  ) {
    if (owner.accountRole !== "supplier" && owner.accountRole !== "both") {
      throw new Error("supplier_document_owner_required");
    }
    if (!this.fileService) throw new Error("supplier_document_file_unavailable");

    const create = supplierDocumentManagementCreateRequestSchema.parse(payload);
    const supplier = await this.repository.getSupplierById(supplierId);
    if (!supplier) throw new Error("supplier_not_found");
    if (supplier.supplierDocuments.some((document) => document.fileAssetId === create.fileUploadId)) {
      throw new Error("supplier_document_conflict");
    }

    const policy = evaluateSupplierDocumentManagementPolicy({
      actorRole: "supplier_owner",
      action: "create",
      currentStatus: null,
    });
    if (!policy.allowed || policy.nextStatus !== "review") throw new Error(policy.reason);

    const fileAsset = await this.fileService.getFileAssetForUser(owner.userId, create.fileUploadId);
    if (fileAsset.companyId !== owner.companyId) {
      throw new Error("supplier_document_file_unavailable");
    }
    if (!allowedSupplierDocumentFilePurposes.has(fileAsset.purpose)) {
      throw new Error("supplier_document_file_unavailable");
    }
    if (fileAsset.originalFileName !== create.fileName) {
      throw new Error("supplier_document_file_name_mismatch");
    }

    const now = new Date().toISOString();
    const document = supplierDocumentPayloadSchema.parse({
      id: `sdoc_${randomUUID()}`,
      title: create.title,
      documentType: create.documentType,
      status: policy.nextStatus,
      issuedAt: create.issuedAt ?? null,
      expiresAt: create.expiresAt ?? null,
      fileName: fileAsset.originalFileName,
      fileAssetId: fileAsset.id,
    });
    const auditEvent = {
      action: policy.auditAction,
      actorRole: "supplier_owner" as const,
      supplierId,
      documentId: document.id,
      previousStatus: null,
      nextStatus: policy.nextStatus,
      reason: "supplier_owner_created_review_document",
      requestId,
      createdAt: now,
    };

    const record = await this.repository.createSupplierDocumentForOwner({
      supplierId,
      ownerCompanyId: owner.companyId,
      actorUserId: owner.userId,
      document,
      auditEvent,
    });
    if (!record) throw new Error("supplier_document_owner_required");

    return supplierDocumentManagementCreateResponseSchema.parse({
      ok: true,
      document: redactSupplierDocumentManagementItem(record.document),
      audit: record.auditEvent,
      requestId,
    });
  }

  async listAdminDocumentDownloadEvents(rawQuery: Record<string, string | undefined>, requestId: string) {
    const query = supplierDocumentDownloadEventAdminQuerySchema.parse(rawQuery);
    const events = await this.repository.listDocumentDownloadEvents(query);

    return supplierDocumentDownloadEventAdminListResponseSchema.parse({
      ok: true,
      items: events.map((event) => ({
        id: event.id,
        buyerUserId: event.buyerUserId,
        supplierId: event.supplierId,
        documentId: event.documentId,
        grantId: event.grantId,
        status: event.status,
        reason: event.reason,
        requestId: event.requestId,
        createdAt: event.createdAt,
      })),
      limit: query.limit,
      offset: query.offset,
      requestId,
    });
  }

  async listAdminDocumentDownloadGrants(rawQuery: Record<string, string | undefined>, requestId: string) {
    const query = supplierDocumentDownloadGrantAdminQuerySchema.parse(rawQuery);
    const grants = await this.repository.listDocumentDownloadGrants(query);

    return supplierDocumentDownloadGrantAdminListResponseSchema.parse({
      ok: true,
      items: grants.map((grant) => ({
        id: grant.id,
        buyerUserId: grant.buyerUserId,
        supplierId: grant.supplierId,
        documentId: grant.documentId,
        status: grant.status,
        reason: grant.reason,
        requestId: grant.requestId,
        grantedAt: grant.grantedAt,
        expiresAt: grant.expiresAt,
        createdAt: grant.createdAt,
      })),
      limit: query.limit,
      offset: query.offset,
      requestId,
    });
  }

  private async listAccessibleSupplierIds(
    requested: SupplierDirectoryAccessLevel,
    viewer: { buyerUserId: string } | null,
  ): Promise<string[]> {
    if (requested !== "qualified_unlocked") return [];
    if (!viewer || !this.accessRepository) return [];
    return this.accessRepository.listAccessibleSupplierIds({ buyerUserId: viewer.buyerUserId });
  }

  private resolveListAccessLevel(
    supplierId: string,
    requested: SupplierDirectoryAccessLevel,
    accessibleSupplierIds: ReadonlySet<string>,
  ): SupplierDirectoryAccessLevel {
    if (requested !== "qualified_unlocked") return requested;
    return accessibleSupplierIds.has(supplierId) ? "qualified_unlocked" : "registered_locked";
  }

  private async resolveDetailAccessLevel(
    supplierId: string,
    requested: SupplierDirectoryAccessLevel,
    viewer: { buyerUserId: string } | null,
  ): Promise<SupplierDirectoryAccessLevel> {
    if (requested !== "qualified_unlocked") return requested;
    if (!viewer || !this.accessRepository) return "registered_locked";

    const hasAccess = await this.accessRepository.hasSupplierAccess({
      buyerUserId: viewer.buyerUserId,
      supplierId,
    });
    return hasAccess ? "qualified_unlocked" : "registered_locked";
  }

  private async recordDocumentGrantAttempt(input: {
    id?: string;
    buyerUserId: string;
    supplierId: string;
    documentId: string;
    fileAssetId: string | null;
    status: SupplierDocumentDownloadGrantStatus;
    reason: string;
    requestId: string;
    downloadPath: string | null;
    grantedAt: string | null;
    expiresAt: string | null;
  }) {
    const { id, ...record } = input;
    await this.repository.recordDocumentDownloadGrant({
      id: id ?? `sdga_${randomUUID()}`,
      ...record,
    });
  }

  private async recordDocumentDownloadEvent(input: {
    buyerUserId: string;
    supplierId: string;
    documentId: string;
    grantId: string | null;
    fileAssetId: string | null;
    status: SupplierDocumentDownloadEventStatus;
    reason: string;
    requestId: string;
  }) {
    await this.repository.recordDocumentDownloadEvent({
      id: `sdde_${randomUUID()}`,
      ...input,
    });
  }
}

const allowedSupplierDocumentFilePurposes = new Set(["company_document", "supplier_certificate", "supplier_trade_document"]);

const redactSupplierDocumentManagementItem = (document: {
  id: string;
  title: string;
  documentType: string;
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
  fileName: string | null;
}) => ({
  id: document.id,
  title: document.title,
  documentType: document.documentType,
  status: document.status,
  issuedAt: document.issuedAt,
  expiresAt: document.expiresAt,
  fileName: document.fileName,
});

export function shapeSupplierForAccess(
  supplier: SupplierDirectoryRecord,
  accessLevel: SupplierDirectoryAccessLevel,
): SupplierDirectoryItem {
  const unlocked = accessLevel === "qualified_unlocked";

  return supplierDirectoryItemSchema.parse({
    ...supplier,
    companyName: unlocked ? supplier.companyName : null,
    about: unlocked ? supplier.about : null,
    activeOffersCount: unlocked ? supplier.activeOffersCount : null,
    deliveryCountries: unlocked
      ? supplier.deliveryCountries
      : supplier.deliveryCountries.slice(0, 3),
    deliveryCountriesTotal: unlocked ? supplier.deliveryCountriesTotal : null,
    totalProductsCount: unlocked ? supplier.totalProductsCount : null,
    legalDetails: unlocked ? supplier.legalDetails : null,
    supplierDocuments: unlocked ? supplier.supplierDocuments : null,
    website: unlocked ? supplier.website : null,
    whatsapp: unlocked ? supplier.whatsapp : null,
    productCatalogPreview: unlocked
      ? supplier.productCatalogPreview
      : supplier.productCatalogPreview.slice(0, 3),
    accessLevel,
  });
}
