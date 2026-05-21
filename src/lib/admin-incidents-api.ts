import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentSeverity = "critical" | "high" | "medium" | "low";
export type AdminIncidentSource = "runtime" | "audit" | "access" | "security" | "policy";
export type AdminIncidentStatus = "open" | "acknowledged" | "resolved";

export interface AdminIncident {
  acknowledgedAt: string | null;
  acknowledgedByUserHash: string | null;
  count: number;
  description: string;
  evidence: Array<{ label: string; value: string }>;
  firstSeenAt: string;
  id: string;
  lastSeenAt: string;
  note: string | null;
  recommendedActions: string[];
  relatedAuditIds: string[];
  route: string | null;
  severity: AdminIncidentSeverity;
  source: AdminIncidentSource;
  status: AdminIncidentStatus;
  title: string;
}

export interface AdminIncidentSummary {
  acknowledged: number;
  critical: number;
  high: number;
  open: number;
  resolved: number;
  total: number;
}

export interface AdminIncidentListResponse {
  incidents: AdminIncident[];
  limit: number;
  offset: number;
  ok: true;
  requestId: string;
  summary: AdminIncidentSummary;
}

export interface AdminIncidentQuery {
  limit?: number;
  offset?: number;
  severity?: AdminIncidentSeverity | "all";
  source?: AdminIncidentSource | "all";
  status?: AdminIncidentStatus | "all";
}

export interface AdminIncidentAcknowledgeInput {
  note?: string;
  status?: Extract<AdminIncidentStatus, "acknowledged" | "resolved">;
}

export interface AdminIncidentAcknowledgeResponse {
  incident: AdminIncident;
  ok: true;
  requestId: string;
}

export interface AdminIncidentsApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminIncidentsApiErrorCode =
  | "admin_incidents_api_disabled"
  | "admin_incidents_session_required"
  | "admin_role_required"
  | "admin_incidents_http_error"
  | "admin_incidents_invalid_response";

export class AdminIncidentsApiError extends Error {
  code: AdminIncidentsApiErrorCode;
  status: number;

  constructor(code: AdminIncidentsApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminIncidentsApiError";
    this.code = code;
    this.status = status;
  }
}

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const queryString = (query: AdminIncidentQuery = {}) => {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  if (query.severity && query.severity !== "all") params.set("severity", query.severity);
  if (query.source && query.source !== "all") params.set("source", query.source);
  if (query.status && query.status !== "all") params.set("status", query.status);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export function createAdminIncidentsApiClient(options: AdminIncidentsApiClientOptions = {}) {
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

  const assertSession = () => {
    if (!baseUrl) {
      throw new AdminIncidentsApiError(
        "admin_incidents_api_disabled",
        "Self-hosted API URL is not configured.",
      );
    }
    if (!userId || !sessionId) {
      throw new AdminIncidentsApiError(
        "admin_incidents_session_required",
        "Self-hosted admin session is required.",
        401,
      );
    }
  };

  return {
    enabled: Boolean(baseUrl),
    async acknowledge(incidentId: string, input: AdminIncidentAcknowledgeInput = {}) {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/acknowledge`, {
        body: JSON.stringify(input),
        headers: headers(true),
        method: "POST",
      });
      const body = await readJson(response) as AdminIncidentAcknowledgeResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertAcknowledgeShape(body);
    },
    async list(query: AdminIncidentQuery = {}): Promise<AdminIncidentListResponse> {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents${queryString(query)}`, {
        headers: headers(),
        method: "GET",
      });
      const body = await readJson(response) as AdminIncidentListResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertListShape(body);
    },
  };
}

export const isAdminIncidentsApiConfigured = () => createAdminIncidentsApiClient().enabled;

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function mapError(body: { error?: { code?: string; message?: string } }, status: number) {
  const code = body.error?.code;
  if (code === "admin_role_required") {
    return new AdminIncidentsApiError("admin_role_required", "Admin role is required.", status);
  }
  if (code === "account_session_required" || code === "account_session_invalid") {
    return new AdminIncidentsApiError(
      "admin_incidents_session_required",
      body.error?.message ?? "Self-hosted admin session is required.",
      status,
    );
  }
  return new AdminIncidentsApiError(
    "admin_incidents_http_error",
    body.error?.message ?? `Admin incidents request failed with ${status}.`,
    status,
  );
}

function assertListShape(response: AdminIncidentListResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.incidents) ||
    typeof response.limit !== "number" ||
    typeof response.offset !== "number" ||
    typeof response.summary?.open !== "number" ||
    typeof response.summary?.critical !== "number"
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incidents list response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}

function assertAcknowledgeShape(response: AdminIncidentAcknowledgeResponse) {
  if (response?.ok !== true || !response.incident?.id || !response.incident?.acknowledgedAt) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident acknowledgement response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}
