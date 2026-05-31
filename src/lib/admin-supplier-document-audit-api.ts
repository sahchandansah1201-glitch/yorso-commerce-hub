import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminSupplierDocumentAuditKind = "download_events" | "download_grants";

export type AdminSupplierDocumentDownloadEventStatus =
  | "downloaded"
  | "grant_not_found"
  | "grant_denied"
  | "grant_expired"
  | "access_denied"
  | "document_unavailable"
  | "file_unavailable";

export type AdminSupplierDocumentDownloadGrantStatus =
  | "granted"
  | "access_denied"
  | "document_not_found"
  | "document_unavailable";

export type AdminSupplierDocumentAuditStatus =
  | AdminSupplierDocumentDownloadEventStatus
  | AdminSupplierDocumentDownloadGrantStatus;

export interface AdminSupplierDocumentAuditItem {
  buyerUserId: string;
  createdAt: string;
  documentId: string;
  expiresAt?: string | null;
  grantedAt?: string | null;
  grantId?: string | null;
  id: string;
  reason: string | null;
  requestId: string;
  status: AdminSupplierDocumentAuditStatus;
  supplierId: string;
}

export interface AdminSupplierDocumentAuditListResponse {
  items: AdminSupplierDocumentAuditItem[];
  limit: number;
  offset: number;
  ok: true;
  requestId: string;
}

export interface AdminSupplierDocumentAuditQuery {
  buyerUserId?: string;
  limit?: number;
  offset?: number;
  status?: AdminSupplierDocumentAuditStatus | "all";
  supplierId?: string;
}

export interface AdminSupplierDocumentAuditApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminSupplierDocumentAuditApiErrorCode =
  | "admin_supplier_document_audit_api_disabled"
  | "admin_supplier_document_audit_session_required"
  | "admin_role_required"
  | "admin_supplier_document_audit_http_error"
  | "admin_supplier_document_audit_invalid_response";

export class AdminSupplierDocumentAuditApiError extends Error {
  code: AdminSupplierDocumentAuditApiErrorCode;
  status: number;

  constructor(code: AdminSupplierDocumentAuditApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminSupplierDocumentAuditApiError";
    this.code = code;
    this.status = status;
  }
}

const endpointByKind: Record<AdminSupplierDocumentAuditKind, string> = {
  download_events: "/v1/admin/supplier-documents/download-events",
  download_grants: "/v1/admin/supplier-documents/download-grants",
};

const forbiddenResponseFields = ["fileAssetId", "downloadPath", "objectKey", "storage"];

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const searchParams = (query: AdminSupplierDocumentAuditQuery = {}) => {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (typeof query.offset === "number") params.set("offset", String(query.offset));
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.supplierId?.trim()) params.set("supplierId", query.supplierId.trim());
  if (query.buyerUserId?.trim()) params.set("buyerUserId", query.buyerUserId.trim());
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export function createAdminSupplierDocumentAuditApiClient(options: AdminSupplierDocumentAuditApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAccountApiBaseUrl());
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const session = options.session ?? buyerSession.getSession();
  const userId = options.userId?.trim() || session?.userId?.trim() || "";
  const sessionId = options.sessionId?.trim() || session?.id?.trim() || "";

  const headers = () => {
    const next = new Headers({ accept: "application/json" });
    if (userId) next.set(ACCOUNT_USER_ID_HEADER, userId);
    if (sessionId) next.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
    return next;
  };

  return {
    enabled: Boolean(baseUrl),
    async list(
      kind: AdminSupplierDocumentAuditKind,
      query: AdminSupplierDocumentAuditQuery = {},
    ): Promise<AdminSupplierDocumentAuditListResponse> {
      if (!baseUrl) {
        throw new AdminSupplierDocumentAuditApiError(
          "admin_supplier_document_audit_api_disabled",
          "Self-hosted API URL is not configured.",
        );
      }
      if (!userId || !sessionId) {
        throw new AdminSupplierDocumentAuditApiError(
          "admin_supplier_document_audit_session_required",
          "Self-hosted admin session is required.",
          401,
        );
      }

      const response = await fetchImpl(`${baseUrl}${endpointByKind[kind]}${searchParams(query)}`, {
        headers: headers(),
        method: "GET",
      });
      const body = (await response.json()) as AdminSupplierDocumentAuditListResponse & {
        error?: { code?: string; message?: string };
      };

      if (!response.ok) {
        const code = body.error?.code;
        if (code === "admin_role_required") {
          throw new AdminSupplierDocumentAuditApiError("admin_role_required", "Admin role is required.", response.status);
        }
        if (code === "account_session_required" || code === "account_session_invalid") {
          throw new AdminSupplierDocumentAuditApiError(
            "admin_supplier_document_audit_session_required",
            body.error?.message ?? "Self-hosted admin session is required.",
            response.status,
          );
        }
        throw new AdminSupplierDocumentAuditApiError(
          "admin_supplier_document_audit_http_error",
          body.error?.message ?? `Supplier document audit request failed with ${response.status}.`,
          response.status,
        );
      }

      return assertListShape(body);
    },
  };
}

export const isAdminSupplierDocumentAuditApiConfigured = () => createAdminSupplierDocumentAuditApiClient().enabled;

function assertListShape(response: AdminSupplierDocumentAuditListResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.items) ||
    typeof response.limit !== "number" ||
    typeof response.offset !== "number" ||
    typeof response.requestId !== "string"
  ) {
    throw new AdminSupplierDocumentAuditApiError(
      "admin_supplier_document_audit_invalid_response",
      "Supplier document audit list response failed the self-hosted contract.",
      200,
    );
  }

  const serialized = JSON.stringify(response);
  if (forbiddenResponseFields.some((field) => serialized.includes(field))) {
    throw new AdminSupplierDocumentAuditApiError(
      "admin_supplier_document_audit_invalid_response",
      "Supplier document audit response leaked storage-only fields.",
      200,
    );
  }

  return response;
}
