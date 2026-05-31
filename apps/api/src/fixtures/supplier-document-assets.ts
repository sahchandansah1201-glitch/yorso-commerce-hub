import { createHash } from "node:crypto";
import type { AccountFileAsset } from "../../../../packages/contracts/dist/index.js";

interface DemoSupplierDocumentFile {
  documentId: string;
  asset: AccountFileAsset;
  bytes: Buffer;
}

const systemOwnerCompanyId = "00000000-0000-4000-8000-00000000f000";
const createdAt = "2026-05-31T00:00:00.000Z";

const uuidSuffixes: Record<string, string> = {
  "sup-no-001-health-certificate": "f001",
  "sup-no-001-origin-certificate": "f002",
  "sup-no-001-analysis-certificate": "f003",
  "sup-cn-002-health-certificate": "f004",
  "sup-cn-002-origin-certificate": "f005",
  "sup-cn-002-analysis-certificate": "f006",
  "sup-ec-003-health-certificate": "f007",
  "sup-ec-003-origin-certificate": "f008",
  "sup-ec-003-analysis-certificate": "f009",
  "sup-id-004-health-certificate": "f010",
  "sup-id-004-origin-certificate": "f011",
  "sup-id-004-analysis-certificate": "f012",
};

const documentTypeById = (documentId: string) =>
  documentId.includes("origin")
    ? "origin-certificate"
    : documentId.includes("analysis")
      ? "analysis-certificate"
      : "health-certificate";

const fileNameForDocumentId = (documentId: string) =>
  documentId.includes("origin")
    ? `${documentId.replace("-origin-certificate", "")}-certificate-of-origin.pdf`
    : documentId.includes("analysis")
      ? `${documentId.replace("-analysis-certificate", "")}-certificate-of-analysis.pdf`
      : `${documentId}.pdf`;

const buildDemoSupplierDocument = (documentId: string): DemoSupplierDocumentFile => {
  const fileName = fileNameForDocumentId(documentId);
  const bytes = Buffer.from(`YORSO demo supplier document: ${fileName}\n`, "utf8");

  return {
    documentId,
    bytes,
    asset: {
      id: `00000000-0000-4000-8000-00000000${uuidSuffixes[documentId]}`,
      companyId: systemOwnerCompanyId,
      purpose: "supplier_certificate",
      objectKey: `suppliers/${documentId}/${documentTypeById(documentId)}.pdf`,
      originalFileName: fileName,
      contentType: "application/pdf",
      sizeBytes: bytes.byteLength,
      checksumSha256: createHash("sha256").update(bytes).digest("hex"),
      storageDriver: "local",
      createdAt,
    },
  };
};

export const demoSupplierDocumentFiles: readonly DemoSupplierDocumentFile[] = Object.keys(uuidSuffixes).map(
  buildDemoSupplierDocument,
);

const byDocumentId = new Map(demoSupplierDocumentFiles.map((item) => [item.documentId, item]));
const byAssetId = new Map(demoSupplierDocumentFiles.map((item) => [item.asset.id, item]));

export const getDemoSupplierDocumentFileAssetId = (documentId: string) =>
  byDocumentId.get(documentId)?.asset.id ?? null;

export const getDemoSupplierDocumentFileByAssetId = (assetId: string) =>
  byAssetId.get(assetId) ?? null;
