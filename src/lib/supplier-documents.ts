import type { MockSupplier } from "@/data/mockSuppliers";

export type SupplierDocumentType =
  | "health_certificate"
  | "origin_certificate"
  | "analysis_certificate"
  | "packing_list"
  | "bill_of_lading"
  | "halal_kosher"
  | "audit_report"
  | "other";

export type SupplierDocumentStatus = "approved" | "review" | "expired" | "on_request";

export interface SupplierDocumentPayload {
  id: string;
  title: string;
  documentType: SupplierDocumentType;
  status: SupplierDocumentStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  fileName: string | null;
  fileAssetId: string | null;
}

export const redactSupplierDocumentFileAssets = (
  documents: SupplierDocumentPayload[] | null | undefined,
): SupplierDocumentPayload[] | null => {
  if (!documents) return null;
  return documents.map((document) => ({
    ...document,
    fileAssetId: null,
  }));
};

const doc = (
  supplierId: string,
  suffix: string,
  title: string,
  documentType: SupplierDocumentType,
  status: SupplierDocumentStatus,
  issuedAt: string | null,
  expiresAt: string | null,
): SupplierDocumentPayload => ({
  id: `${supplierId}-${suffix}`,
  title,
  documentType,
  status,
  issuedAt,
  expiresAt,
  fileName: `${supplierId}-${suffix}.pdf`,
  fileAssetId: `file_${supplierId}_${suffix}`,
});

export const localPreviewSupplierDocuments = (
  supplier: Pick<MockSupplier, "id">,
): SupplierDocumentPayload[] => [
  doc(
    supplier.id,
    "health-certificate",
    "Health certificate",
    "health_certificate",
    "approved",
    "2026-02-10",
    "2027-02-10",
  ),
  doc(
    supplier.id,
    "certificate-of-origin",
    "Certificate of origin",
    "origin_certificate",
    "approved",
    "2026-02-12",
    null,
  ),
  doc(
    supplier.id,
    "certificate-of-analysis",
    "Certificate of analysis",
    "analysis_certificate",
    "review",
    "2026-02-08",
    null,
  ),
];
