import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminAccessReviewStatus =
  | "sent"
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

export type AdminAccessReviewStatusFilter =
  | "open"
  | "all"
  | AdminAccessReviewStatus;

export interface AdminAccessReviewItem {
  request: {
    id: string;
    buyerUserId: string;
    supplierId: string;
    status: AdminAccessReviewStatus;
    intent: "exact_price";
    message: string;
    createdAt: string;
    updatedAt: string;
    decidedAt: string | null;
    decidedByUserId: string | null;
  };
  buyer: {
    userId: string;
    displayName: string | null;
    companyName: string | null;
    accountRole: "buyer" | "supplier" | "both" | null;
    countryCode: string | null;
  };
  supplier: {
    supplierId: string;
    maskedName: string | null;
    companyName: string | null;
    country: string | null;
    city: string | null;
    verificationLevel: "documents_reviewed" | "basic" | "unverified" | null;
  };
  ageHours: number;
  decisionSla: "fresh" | "due_today" | "overdue";
}

export interface AdminAccessReviewSummary {
  sent: number;
  pending: number;
  approved: number;
  rejected: number;
  revoked: number;
  open: number;
}

export interface AdminAccessReviewListResponse {
  ok: true;
  items: AdminAccessReviewItem[];
  limit: number;
  offset: number;
  total: number;
  summary: AdminAccessReviewSummary;
  requestId: string;
}

export interface AdminAccessReviewDecisionResponse {
  ok: true;
  request: AdminAccessReviewItem["request"];
  grants: Array<{
    id: string;
    buyerUserId: string;
    supplierId: string;
    scope: "supplier_identity" | "offer_price";
    offerId: string | null;
    grantedByUserId: string | null;
    grantedAt: string;
    expiresAt: string | null;
  }>;
  notification: {
    id: string;
    buyerUserId: string;
    supplierId: string;
    type: "price_access_approved";
    title: string;
    body: string;
    status: "unread" | "read";
    createdAt: string;
    readAt: string | null;
  } | null;
  requestId: string;
}

export interface AdminAccessReviewQuery {
  q?: string;
  status?: AdminAccessReviewStatusFilter;
  limit?: number;
  offset?: number;
}

export interface AdminAccessReviewApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminAccessReviewApiErrorCode =
  | "admin_access_review_api_disabled"
  | "admin_access_review_session_required"
  | "admin_role_required"
  | "admin_access_review_http_error"
  | "admin_access_review_invalid_response";

export class AdminAccessReviewApiError extends Error {
  code: AdminAccessReviewApiErrorCode;
  status: number;

  constructor(code: AdminAccessReviewApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminAccessReviewApiError";
    this.code = code;
    this.status = status;
  }
}

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const searchParams = (query: AdminAccessReviewQuery) => {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export function createAdminAccessReviewApiClient(options: AdminAccessReviewApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAccountApiBaseUrl());
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const session = options.session ?? buyerSession.getSession();
  const userId = options.userId?.trim() || session?.userId?.trim() || "";
  const sessionId = options.sessionId?.trim() || session?.id?.trim() || "";

  const headers = (contentType = false) => {
    const next = new Headers({ accept: "application/json" });
    if (contentType) next.set("content-type", "application/json");
    if (userId) next.set(ACCOUNT_USER_ID_HEADER, userId);
    if (sessionId) next.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
    return next;
  };

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    if (!baseUrl) {
      throw new AdminAccessReviewApiError(
        "admin_access_review_api_disabled",
        "Self-hosted API URL is not configured.",
      );
    }
    if (!userId || !sessionId) {
      throw new AdminAccessReviewApiError(
        "admin_access_review_session_required",
        "Self-hosted admin session is required.",
        401,
      );
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: headers(Boolean(init?.body)),
    });
    const body = (await response.json()) as T & { error?: { code?: string; message?: string } };
    if (!response.ok) {
      const code = body.error?.code;
      if (code === "admin_role_required") {
        throw new AdminAccessReviewApiError("admin_role_required", "Admin role is required.", response.status);
      }
      if (code === "account_session_required" || code === "account_session_invalid") {
        throw new AdminAccessReviewApiError(
          "admin_access_review_session_required",
          body.error?.message ?? "Self-hosted admin session is required.",
          response.status,
        );
      }
      throw new AdminAccessReviewApiError(
        "admin_access_review_http_error",
        body.error?.message ?? `Admin access review request failed with ${response.status}.`,
        response.status,
      );
    }
    return body;
  };

  return {
    enabled: Boolean(baseUrl),
    async list(query: AdminAccessReviewQuery = {}) {
      return assertListShape(
        await request<AdminAccessReviewListResponse>(`/v1/admin/access-requests${searchParams(query)}`),
      );
    },
    async decide(requestId: string, status: "pending" | "approved" | "rejected" | "revoked") {
      return assertDecisionShape(
        await request<AdminAccessReviewDecisionResponse>(
          `/v1/admin/access-requests/${encodeURIComponent(requestId)}/decision`,
          {
            method: "POST",
            body: JSON.stringify({ status }),
          },
        ),
      );
    },
  };
}

export const isAdminAccessReviewApiConfigured = () =>
  createAdminAccessReviewApiClient().enabled;

function assertListShape(response: AdminAccessReviewListResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.items) ||
    typeof response.total !== "number" ||
    typeof response.summary?.open !== "number"
  ) {
    throw new AdminAccessReviewApiError(
      "admin_access_review_invalid_response",
      "Admin access review list response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}

function assertDecisionShape(response: AdminAccessReviewDecisionResponse) {
  if (
    response?.ok !== true ||
    typeof response.request?.id !== "string" ||
    !["pending", "approved", "rejected", "revoked", "sent"].includes(response.request.status)
  ) {
    throw new AdminAccessReviewApiError(
      "admin_access_review_invalid_response",
      "Admin access review decision response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}
