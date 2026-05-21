import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminAuditOutcome = "success" | "failure" | "blocked";
export type AdminAuditStatusClass = "2xx" | "3xx" | "4xx" | "5xx";

export interface AdminAuditEvent {
  action: string;
  actorUserHash: string | null;
  auditId: string;
  correlationId: string;
  httpMethod: string | null;
  occurredAt: string;
  outcome: AdminAuditOutcome;
  reason: string | null;
  requestId: string;
  resourceHash: string | null;
  resourceType: string | null;
  route: string | null;
  sessionHash: string | null;
  statusCode: number | null;
}

export interface AdminAuditListResponse {
  events: AdminAuditEvent[];
  limit: number;
  nextCursor: string | null;
  ok: true;
  requestId: string;
}

export interface AdminAuditQuery {
  limit?: number;
  outcome?: AdminAuditOutcome | "all";
  route?: string;
  statusClass?: AdminAuditStatusClass | "all";
}

export interface AdminAuditApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminAuditApiErrorCode =
  | "admin_audit_api_disabled"
  | "admin_audit_session_required"
  | "admin_role_required"
  | "admin_audit_http_error"
  | "admin_audit_invalid_response";

export class AdminAuditApiError extends Error {
  code: AdminAuditApiErrorCode;
  status: number;

  constructor(code: AdminAuditApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminAuditApiError";
    this.code = code;
    this.status = status;
  }
}

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const searchParams = (query: AdminAuditQuery = {}) => {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (query.outcome && query.outcome !== "all") params.set("outcome", query.outcome);
  if (query.route?.trim()) params.set("route", query.route.trim());
  if (query.statusClass && query.statusClass !== "all") params.set("statusClass", query.statusClass);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export function createAdminAuditApiClient(options: AdminAuditApiClientOptions = {}) {
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
    exportUrl(query: AdminAuditQuery = {}, format: "csv" | "jsonl" = "csv") {
      if (!baseUrl) return "";
      const params = new URLSearchParams();
      params.set("format", format);
      params.set("limit", String(query.limit ?? 1000));
      if (query.outcome && query.outcome !== "all") params.set("outcome", query.outcome);
      if (query.route?.trim()) params.set("route", query.route.trim());
      if (query.statusClass && query.statusClass !== "all") params.set("statusClass", query.statusClass);
      return `${baseUrl}/v1/admin/audit-events/export?${params.toString()}`;
    },
    async list(query: AdminAuditQuery = {}): Promise<AdminAuditListResponse> {
      if (!baseUrl) {
        throw new AdminAuditApiError("admin_audit_api_disabled", "Self-hosted API URL is not configured.");
      }
      if (!userId || !sessionId) {
        throw new AdminAuditApiError("admin_audit_session_required", "Self-hosted admin session is required.", 401);
      }

      const response = await fetchImpl(`${baseUrl}/v1/admin/audit-events${searchParams(query)}`, {
        headers: headers(),
        method: "GET",
      });
      const body = (await response.json()) as AdminAuditListResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) {
        const code = body.error?.code;
        if (code === "admin_role_required") {
          throw new AdminAuditApiError("admin_role_required", "Admin role is required.", response.status);
        }
        if (code === "account_session_required" || code === "account_session_invalid") {
          throw new AdminAuditApiError(
            "admin_audit_session_required",
            body.error?.message ?? "Self-hosted admin session is required.",
            response.status,
          );
        }
        throw new AdminAuditApiError(
          "admin_audit_http_error",
          body.error?.message ?? `Admin audit request failed with ${response.status}.`,
          response.status,
        );
      }
      return assertListShape(body);
    },
  };
}

export const isAdminAuditApiConfigured = () => createAdminAuditApiClient().enabled;

function assertListShape(response: AdminAuditListResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.events) ||
    typeof response.limit !== "number" ||
    !("nextCursor" in response)
  ) {
    throw new AdminAuditApiError(
      "admin_audit_invalid_response",
      "Admin audit list response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}
