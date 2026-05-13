import type { AccountFileUploadPayload, CompanyDocument } from "@/lib/account-api";

export const ACCOUNT_DOCUMENTS_STORAGE_KEY = "yorso_account_documents_v1";

const safeRead = (): CompanyDocument[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNT_DOCUMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompanyDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWrite = (documents: CompanyDocument[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNT_DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
};

export const listLocalCompanyDocuments = () => safeRead();

export const resetLocalCompanyDocuments = () => safeWrite([]);

const pseudoChecksum = (file: AccountFileUploadPayload) => {
  const source = `${file.fileName}:${file.contentBase64}:${file.sizeBytes}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").repeat(8).slice(0, 64);
};

export const createLocalCompanyDocument = (payload: {
  companyId: string;
  title: string;
  documentType: CompanyDocument["documentType"];
  visibility: CompanyDocument["visibility"];
  expiresAt?: string | null;
  file: AccountFileUploadPayload;
}) => {
  const now = new Date().toISOString();
  const document: CompanyDocument = {
    id: `local_doc_${Date.now().toString(36)}`,
    companyId: payload.companyId,
    fileAssetId: `local_asset_${Date.now().toString(36)}`,
    title: payload.title,
    documentType: payload.documentType,
    visibility: payload.visibility,
    status: "uploaded",
    fileName: payload.file.fileName,
    contentType: payload.file.contentType,
    sizeBytes: payload.file.sizeBytes,
    checksumSha256: pseudoChecksum(payload.file),
    expiresAt: payload.expiresAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const next = [document, ...safeRead()];
  safeWrite(next);
  return document;
};
