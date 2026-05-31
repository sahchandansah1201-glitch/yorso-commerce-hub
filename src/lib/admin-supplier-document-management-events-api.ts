import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminSupplierDocumentManagementEventAction =
  | "supplier_document.create"
  | "supplier_document.update_metadata"
  | "supplier_document.submit_for_review"
  | "supplier_document.approve"
  | "supplier_document.reject"
  | "supplier_document.expire"
  | "supplier_document.delete";

export type AdminSupplierDocumentManagementEventActorRole = "admin" | "supplier_owner";
export type AdminSupplierDocumentManagementEventStatus = "review" | "approved" | "on_request" | "expired";

export interface AdminSupplierDocumentManagementEventItem {
  action: AdminSupplierDocumentManagementEventAction;
  actorRole: AdminSupplierDocumentManagementEventActorRole;
  actorUserId: string;
  createdAt: string;
  documentId: string;
  id: string;
  nextStatus: AdminSupplierDocumentManagementEventStatus | null;
  previousStatus: AdminSupplierDocumentManagementEventStatus | null;
  reason: string;
  requestId: string;
  supplierId: string;
}

export interface AdminSupplierDocumentManagementEventsListResponse {
  items: AdminSupplierDocumentManagementEventItem[];
  limit: number;
  offset: number;
  ok: true;
  requestId: string;
}

export interface AdminSupplierDocumentManagementEventsQuery {
  action?: AdminSupplierDocumentManagementEventAction | "all";
  actorUserId?: string;
  documentId?: string;
  limit?: number;
  offset?: number;
  supplierId?: string;
}

export interface AdminSupplierDocumentManagementEventsExportQuery extends AdminSupplierDocumentManagementEventsQuery {
  format?: "json" | "csv";
}

export interface AdminSupplierDocumentManagementEventsExportResponse {
  contentType: string;
  filename: string;
  text: string;
}

export interface AdminSupplierDocumentManagementEventsApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminSupplierDocumentManagementEventsApiErrorCode =
  | "admin_supplier_document_management_events_api_disabled"
  | "admin_supplier_document_management_events_session_required"
  | "admin_role_required"
  | "admin_supplier_document_management_events_http_error"
  | "admin_supplier_document_management_events_invalid_response";

export class AdminSupplierDocumentManagementEventsApiError extends Error {
  code: AdminSupplierDocumentManagementEventsApiErrorCode;
  status: number;

  constructor(code: AdminSupplierDocumentManagementEventsApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminSupplierDocumentManagementEventsApiError";
    this.code = code;
    this.status = status;
  }
}

const managementEventsEndpoint = "/v1/admin/supplier-documents/management-events";
const managementEventsExportEndpoint = "/v1/admin/supplier-documents/management-events/export";

const forbiddenResponseFields = [
  "downloadPath",
  "downloadUrl",
  "fileAssetId",
  "objectKey",
  "storage",
  "storageKey",
];

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const searchParams = (query: AdminSupplierDocumentManagementEventsQuery = {}) => {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (typeof query.offset === "number") params.set("offset", String(query.offset));
  if (query.action && query.action !== "all") params.set("action", query.action);
  if (query.supplierId?.trim()) params.set("supplierId", query.supplierId.trim());
  if (query.documentId?.trim()) params.set("documentId", query.documentId.trim());
  if (query.actorUserId?.trim()) params.set("actorUserId", query.actorUserId.trim());
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

const exportSearchParams = (query: AdminSupplierDocumentManagementEventsExportQuery = {}) => {
  const params = new URLSearchParams(searchParams(query).replace(/^\?/, ""));
  params.set("format", query.format ?? "json");
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export function createAdminSupplierDocumentManagementEventsApiClient(
  options: AdminSupplierDocumentManagementEventsApiClientOptions = {},
) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAccountApiBaseUrl());
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const session = options.session ?? buyerSession.getSession();
  const userId = options.userId?.trim() || session?.userId?.trim() || "";
  const sessionId = options.sessionId?.trim() || session?.id?.trim() || "";

  const headers = (accept = "application/json") => {
    const next = new Headers({ accept });
    if (userId) next.set(ACCOUNT_USER_ID_HEADER, userId);
    if (sessionId) next.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
    return next;
  };

  const assertEnabledSession = () => {
    if (!baseUrl) {
      throw new AdminSupplierDocumentManagementEventsApiError(
        "admin_supplier_document_management_events_api_disabled",
        "Self-hosted API URL is not configured.",
      );
    }
    if (!userId || !sessionId) {
      throw new AdminSupplierDocumentManagementEventsApiError(
        "admin_supplier_document_management_events_session_required",
        "Self-hosted admin session is required.",
        401,
      );
    }
  };

  return {
    enabled: Boolean(baseUrl),
    async exportEvents(
      query: AdminSupplierDocumentManagementEventsExportQuery = {},
    ): Promise<AdminSupplierDocumentManagementEventsExportResponse> {
      assertEnabledSession();
      const format = query.format ?? "json";
      const response = await fetchImpl(`${baseUrl}${managementEventsExportEndpoint}${exportSearchParams(query)}`, {
        headers: headers(format === "csv" ? "text/csv" : "application/json"),
        method: "GET",
      });

      const text = await response.text();
      if (!response.ok) {
        handleHttpTextError(text, response.status);
      }
      assertNoForbiddenFields(text);

      return {
        contentType: response.headers.get("content-type")?.split(";")[0] ?? (format === "csv" ? "text/csv" : "application/json"),
        filename: `supplier-document-management-events.${format}`,
        text,
      };
    },
    async list(
      query: AdminSupplierDocumentManagementEventsQuery = {},
    ): Promise<AdminSupplierDocumentManagementEventsListResponse> {
      assertEnabledSession();

      const response = await fetchImpl(`${baseUrl}${managementEventsEndpoint}${searchParams(query)}`, {
        headers: headers(),
        method: "GET",
      });
      const body = (await response.json()) as AdminSupplierDocumentManagementEventsListResponse & {
        error?: { code?: string; message?: string };
      };

      if (!response.ok) {
        handleJsonError(body, response.status);
      }

      return assertListShape(body);
    },
  };
}

export const isAdminSupplierDocumentManagementEventsApiConfigured = () =>
  createAdminSupplierDocumentManagementEventsApiClient().enabled;

function handleJsonError(body: { error?: { code?: string; message?: string } }, status: number): never {
  const code = body.error?.code;
  if (code === "admin_role_required") {
    throw new AdminSupplierDocumentManagementEventsApiError("admin_role_required", "Admin role is required.", status);
  }
  if (code === "account_session_required" || code === "account_session_invalid") {
    throw new AdminSupplierDocumentManagementEventsApiError(
      "admin_supplier_document_management_events_session_required",
      body.error?.message ?? "Self-hosted admin session is required.",
      status,
    );
  }
  throw new AdminSupplierDocumentManagementEventsApiError(
    "admin_supplier_document_management_events_http_error",
    body.error?.message ?? `Supplier document management events request failed with ${status}.`,
    status,
  );
}

function handleHttpTextError(text: string, status: number): never {
  try {
    handleJsonError(JSON.parse(text) as { error?: { code?: string; message?: string } }, status);
  } catch (error) {
    if (error instanceof AdminSupplierDocumentManagementEventsApiError) throw error;
    throw new AdminSupplierDocumentManagementEventsApiError(
      "admin_supplier_document_management_events_http_error",
      `Supplier document management events export failed with ${status}.`,
      status,
    );
  }
}

function assertListShape(response: AdminSupplierDocumentManagementEventsListResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.items) ||
    typeof response.limit !== "number" ||
    typeof response.offset !== "number" ||
    typeof response.requestId !== "string"
  ) {
    throw new AdminSupplierDocumentManagementEventsApiError(
      "admin_supplier_document_management_events_invalid_response",
      "Supplier document management event list response failed the self-hosted contract.",
      200,
    );
  }

  assertNoForbiddenFields(JSON.stringify(response));
  return response;
}

function assertNoForbiddenFields(serialized: string) {
  if (forbiddenResponseFields.some((field) => serialized.includes(field))) {
    throw new AdminSupplierDocumentManagementEventsApiError(
      "admin_supplier_document_management_events_invalid_response",
      "Supplier document management events response leaked storage-only fields.",
      200,
    );
  }
}
