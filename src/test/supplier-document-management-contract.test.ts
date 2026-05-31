import { describe, expect, it } from "vitest";
import {
  supplierDocumentManagementAuditEventSchema,
  supplierDocumentManagementCreateRequestSchema,
  supplierDocumentManagementCreateResponseSchema,
  supplierDocumentManagementDecisionRequestSchema,
  supplierDocumentManagementDecisionResponseSchema,
  supplierDocumentManagementDeleteResponseSchema,
  supplierDocumentManagementLifecycleRequestSchema,
  supplierDocumentManagementUpdateRequestSchema,
  supplierDocumentManagementUpdateResponseSchema,
} from "../../packages/contracts/src";

describe("supplier document management contracts", () => {
  it("accepts bounded owner/admin document metadata without storage internals", () => {
    expect(
      supplierDocumentManagementCreateRequestSchema.parse({
        title: "Health certificate 2026",
        documentType: "health_certificate",
        issuedAt: "2026-05-01",
        expiresAt: "2027-05-01",
        fileUploadId: "upload_supplier_doc_2026_001",
        fileName: "health-certificate-2026.pdf",
      }),
    ).toMatchObject({
      documentType: "health_certificate",
      fileUploadId: "upload_supplier_doc_2026_001",
    });

    expect(
      supplierDocumentManagementUpdateRequestSchema.parse({
        title: "Updated origin certificate",
        expiresAt: "2027-08-01",
      }),
    ).toMatchObject({
      title: "Updated origin certificate",
      expiresAt: "2027-08-01",
    });
  });

  it("rejects browser-supplied file assets, storage keys and direct download paths", () => {
    for (const forbiddenField of ["fileAssetId", "objectKey", "storageKey", "downloadPath", "downloadUrl"]) {
      expect(() =>
        supplierDocumentManagementCreateRequestSchema.parse({
          title: "Origin certificate",
          documentType: "origin_certificate",
          fileUploadId: "upload_supplier_doc_2026_002",
          fileName: "origin-certificate.pdf",
          [forbiddenField]: "browser-controlled-storage-value",
        }),
      ).toThrow();
    }
  });

  it("requires immutable audit metadata for each management decision", () => {
    expect(
      supplierDocumentManagementDecisionRequestSchema.parse({
        decision: "approve",
        reason: "verified_against_registry",
      }),
    ).toEqual({
      decision: "approve",
      reason: "verified_against_registry",
    });
    expect(() =>
      supplierDocumentManagementDecisionRequestSchema.parse({
        decision: "expire",
      }),
    ).toThrow();

    const event = supplierDocumentManagementAuditEventSchema.parse({
      action: "supplier_document.approve",
      actorRole: "admin",
      supplierId: "sup-no-001",
      documentId: "doc-health-2026",
      previousStatus: "review",
      nextStatus: "approved",
      reason: "document_verified",
      requestId: "00000000-0000-4000-8000-000000000412",
      createdAt: "2026-05-31T10:00:00.000Z",
    });

    expect(event).toMatchObject({
      action: "supplier_document.approve",
      nextStatus: "approved",
    });
  });

  it("accepts only admin lifecycle expire/delete actions", () => {
    expect(
      supplierDocumentManagementLifecycleRequestSchema.parse({
        action: "expire",
        reason: "certificate_expired",
      }),
    ).toEqual({
      action: "expire",
      reason: "certificate_expired",
    });
    expect(
      supplierDocumentManagementLifecycleRequestSchema.parse({
        action: "delete",
      }),
    ).toEqual({
      action: "delete",
    });
    expect(() =>
      supplierDocumentManagementLifecycleRequestSchema.parse({
        action: "approve",
      }),
    ).toThrow();
  });

  it("returns sanitized owner create responses without backend file storage identifiers", () => {
    const response = supplierDocumentManagementCreateResponseSchema.parse({
      ok: true,
      document: {
        id: "sdoc_review_1",
        title: "Factory audit report",
        documentType: "audit_report",
        status: "review",
        issuedAt: "2026-05-31",
        expiresAt: "2027-05-31",
        fileName: "factory-audit.pdf",
      },
      audit: {
        action: "supplier_document.create",
        actorRole: "supplier_owner",
        supplierId: "sup-no-001",
        documentId: "sdoc_review_1",
        previousStatus: null,
        nextStatus: "review",
        reason: "supplier_owner_created_review_document",
        requestId: "req-owner-create",
        createdAt: "2026-05-31T09:00:00.000Z",
      },
      requestId: "req-owner-create",
    });

    expect(response.document).toMatchObject({
      id: "sdoc_review_1",
      status: "review",
    });
    expect(JSON.stringify(response)).not.toContain("fileAssetId");
    expect(JSON.stringify(response)).not.toContain("objectKey");
    expect(() =>
      supplierDocumentManagementCreateResponseSchema.parse({
        ...response,
        document: {
          ...response.document,
          fileAssetId: "backend-file-asset",
        },
      }),
    ).toThrow();
  });

  it("returns sanitized admin decision responses without backend file storage identifiers", () => {
    const response = supplierDocumentManagementDecisionResponseSchema.parse({
      ok: true,
      document: {
        id: "sdoc_review_1",
        title: "Factory audit report",
        documentType: "audit_report",
        status: "approved",
        issuedAt: "2026-05-31",
        expiresAt: "2027-05-31",
        fileName: "factory-audit.pdf",
      },
      audit: {
        action: "supplier_document.approve",
        actorRole: "admin",
        supplierId: "sup-no-001",
        documentId: "sdoc_review_1",
        previousStatus: "review",
        nextStatus: "approved",
        reason: "verified_against_registry",
        requestId: "req-admin-decision",
        createdAt: "2026-05-31T10:00:00.000Z",
      },
      requestId: "req-admin-decision",
    });

    expect(response.document).toMatchObject({
      id: "sdoc_review_1",
      status: "approved",
    });
    expect(JSON.stringify(response)).not.toContain("fileAssetId");
    expect(JSON.stringify(response)).not.toContain("downloadPath");
    expect(() =>
      supplierDocumentManagementDecisionResponseSchema.parse({
        ...response,
        document: {
          ...response.document,
          fileAssetId: "backend-file-asset",
        },
      }),
    ).toThrow();
  });

  it("returns sanitized owner update and delete responses without backend file storage identifiers", () => {
    const updated = supplierDocumentManagementUpdateResponseSchema.parse({
      ok: true,
      document: {
        id: "sdoc_review_1",
        title: "Updated factory audit",
        documentType: "analysis_certificate",
        status: "review",
        issuedAt: null,
        expiresAt: "2027-06-30",
        fileName: "factory-audit.pdf",
      },
      audit: {
        action: "supplier_document.update_metadata",
        actorRole: "supplier_owner",
        supplierId: "sup-no-001",
        documentId: "sdoc_review_1",
        previousStatus: "review",
        nextStatus: "review",
        reason: "supplier_owner_updated_document_metadata",
        requestId: "req-owner-update",
        createdAt: "2026-05-31T11:00:00.000Z",
      },
      requestId: "req-owner-update",
    });
    const deleted = supplierDocumentManagementDeleteResponseSchema.parse({
      ok: true,
      document: {
        id: "sdoc_on_request_1",
        title: "Rejected factory audit",
        documentType: "audit_report",
        status: "on_request",
        issuedAt: "2026-05-31",
        expiresAt: "2027-05-31",
        fileName: "factory-audit.pdf",
      },
      audit: {
        action: "supplier_document.delete",
        actorRole: "supplier_owner",
        supplierId: "sup-no-001",
        documentId: "sdoc_on_request_1",
        previousStatus: "on_request",
        nextStatus: null,
        reason: "supplier_owner_deleted_document",
        requestId: "req-owner-delete",
        createdAt: "2026-05-31T11:05:00.000Z",
      },
      requestId: "req-owner-delete",
    });

    expect(updated.document).toMatchObject({
      id: "sdoc_review_1",
      status: "review",
    });
    expect(deleted.audit).toMatchObject({
      action: "supplier_document.delete",
      nextStatus: null,
    });
    expect(`${JSON.stringify(updated)}\n${JSON.stringify(deleted)}`).not.toContain("fileAssetId");
    expect(() =>
      supplierDocumentManagementUpdateResponseSchema.parse({
        ...updated,
        document: {
          ...updated.document,
          fileAssetId: "backend-file-asset",
        },
      }),
    ).toThrow();
    expect(() =>
      supplierDocumentManagementDeleteResponseSchema.parse({
        ...deleted,
        document: {
          ...deleted.document,
          downloadPath: "/internal/storage/path",
        },
      }),
    ).toThrow();
  });
});
