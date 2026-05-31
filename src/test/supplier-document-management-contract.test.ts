import { describe, expect, it } from "vitest";
import {
  supplierDocumentManagementAuditEventSchema,
  supplierDocumentManagementCreateRequestSchema,
  supplierDocumentManagementUpdateRequestSchema,
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
});
