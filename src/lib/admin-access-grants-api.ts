import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminAccessGrantStatusFilter = "active" | "expired" | "all";
export type AdminAccessGrantScope = "supplier_identity" | "offer_price";

export interface AdminAccessGrantItem {
  id: string;
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
  supplierId: string;
  buyerUserId: string;
  scopes: AdminAccessGrantScope[];
  grants: Array<{
    id: string;
    buyerUserId: string;
    supplierId: string;
    scope: AdminAccessGrantScope;
    offerId: string | null;
    grantedByUserId: string | null;
    grantedAt: string;
    expiresAt: string | null;
  }>;
  request: {
    id: string;
    buyerUserId: string;
    supplierId: string;
    status: "sent" | "pending" | "approved" | "rejected" | "revoked";
    intent: "exact_price";
    message: string;
    createdAt: string;
    updatedAt: string;
    decidedAt: string | null;
    decidedByUserId: string | null;
  } | null;
  grantedAt: string;
  expiresAt: string | null;
  grantedByUserId: string | null;
  ageHours: number;
  isActive: boolean;
}

export interface AdminAccessGrantSummary {
  active: number;
  expired: number;
  total: number;
}

export interface AdminAccessGrantListResponse {
  ok: true;
  items: AdminAccessGrantItem[];
  limit: number;
  offset: number;
  total: number;
  summary: AdminAccessGrantSummary;
  requestId: string;
}

export interface AdminAccessGrantRevokeResponse {
  ok: true;
  revokedGrants: AdminAccessGrantItem["grants"];
  request: AdminAccessGrantItem["request"];
  accessGranted: false;
  requestId: string;
}

export interface AdminAccessGrantQuery {
  q?: string;
  status?: AdminAccessGrantStatusFilter;
  limit?: number;
  offset?: number;
}

export interface AdminAccessGrantsApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminAccessGrantsApiErrorCode =
  | "admin_access_grants_api_disabled"
  | "admin_access_grants_session_required"
  | "admin_role_required"
  | "admin_access_grants_http_error"
  | "admin_access_grants_invalid_response";

export class AdminAccessGrantsApiError extends Error {
  code: AdminAccessGrantsApiErrorCode;
  status: number;

  constructor(code: AdminAccessGrantsApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminAccessGrantsApiError";
    this.code = code;
    this.status = status;
  }
}

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const searchParams = (query: AdminAccessGrantQuery) => {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export function createAdminAccessGrantsApiClient(options: AdminAccessGrantsApiClientOptions = {}) {
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
      throw new AdminAccessGrantsApiError(
        "admin_access_grants_api_disabled",
        "Self-hosted API URL is not configured.",
      );
    }
    if (!userId || !sessionId) {
      throw new AdminAccessGrantsApiError(
        "admin_access_grants_session_required",
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
        throw new AdminAccessGrantsApiError("admin_role_required", "Admin role is required.", response.status);
      }
      if (code === "account_session_required" || code === "account_session_invalid") {
        throw new AdminAccessGrantsApiError(
          "admin_access_grants_session_required",
          body.error?.message ?? "Self-hosted admin session is required.",
          response.status,
        );
      }
      throw new AdminAccessGrantsApiError(
        "admin_access_grants_http_error",
        body.error?.message ?? `Admin access grants request failed with ${response.status}.`,
        response.status,
      );
    }
    return body;
  };

  return {
    enabled: Boolean(baseUrl),
    async list(query: AdminAccessGrantQuery = {}) {
      return assertListShape(
        await request<AdminAccessGrantListResponse>(`/v1/admin/access-grants${searchParams(query)}`),
      );
    },
    async revoke(grantId: string, reason?: string) {
      return assertRevokeShape(
        await request<AdminAccessGrantRevokeResponse>(
          `/v1/admin/access-grants/${encodeURIComponent(grantId)}/revoke`,
          {
            method: "POST",
            body: JSON.stringify({ reason }),
          },
        ),
      );
    },
  };
}

export const isAdminAccessGrantsApiConfigured = () =>
  createAdminAccessGrantsApiClient().enabled;

function assertListShape(response: AdminAccessGrantListResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.items) ||
    typeof response.total !== "number" ||
    typeof response.summary?.active !== "number"
  ) {
    throw new AdminAccessGrantsApiError(
      "admin_access_grants_invalid_response",
      "Admin access grants list response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}

function assertRevokeShape(response: AdminAccessGrantRevokeResponse) {
  if (
    response?.ok !== true ||
    response.accessGranted !== false ||
    !Array.isArray(response.revokedGrants)
  ) {
    throw new AdminAccessGrantsApiError(
      "admin_access_grants_invalid_response",
      "Admin access grant revoke response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}
