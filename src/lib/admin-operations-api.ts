import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import type { AdminAuditEvent } from "@/lib/admin-audit-api";
import type { AdminAccessGrantItem, AdminAccessGrantSummary } from "@/lib/admin-access-grants-api";
import type { AdminAccessReviewItem, AdminAccessReviewSummary } from "@/lib/admin-access-review-api";
import type { AdminRuntimeDiagnostics, AdminRuntimeStatus } from "@/lib/admin-runtime-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export interface AdminOperationsLink {
  description: string;
  href: string;
  id: "overview" | "runtime" | "access_requests" | "access_grants" | "audit";
  label: string;
}

export interface AdminOperationsCapacityPlan {
  backpressureStrategy: string;
  cacheStrategy: string;
  databaseStrategy: string;
  failureMode: string;
  loadTestPlan: string;
  observabilityPlan: string;
  readProfile: string;
  writeProfile: string;
}

export interface AdminOperationsAction {
  description: string;
  href: string;
  id: "review_requests" | "inspect_grants" | "inspect_runtime" | "inspect_audit" | "export_audit" | "run_retention";
  label: string;
  priority: "primary" | "secondary" | "danger";
}

export interface AdminOperationsReadinessItem {
  action: string;
  detail: string;
  id: "runtime" | "audit" | "access_review" | "access_grants" | "scale_baseline" | "security";
  label: string;
  route: string | null;
  status: "pass" | "warn" | "fail";
}

export interface AdminOperationsOverview {
  access: {
    grants: {
      recent: AdminAccessGrantItem[];
      summary: AdminAccessGrantSummary;
      total: number;
    };
    review: {
      recent: AdminAccessReviewItem[];
      summary: AdminAccessReviewSummary;
      total: number;
    };
  };
  audit: {
    recent: AdminAuditEvent[];
    summary: {
      blocked: number;
      failure: number;
      sampleSize: number;
      statusClasses: Partial<Record<"2xx" | "3xx" | "4xx" | "5xx", number>>;
      success: number;
    };
  };
  capacityPlan: AdminOperationsCapacityPlan;
  generatedAt: string;
  ok: true;
  operatorActions: AdminOperationsAction[];
  operatorLinks: AdminOperationsLink[];
  productionPolicy: AdminRuntimeStatus["productionPolicy"];
  productionScaleBaseline: AdminRuntimeStatus["productionScaleBaseline"];
  readiness: {
    fail: number;
    items: AdminOperationsReadinessItem[];
    pass: number;
    status: "pass" | "warn" | "fail";
    warn: number;
  };
  requestId: string;
  runtime: {
    diagnostics: AdminRuntimeDiagnostics;
    status: AdminRuntimeStatus;
  };
  selfHostedBackend: true;
}

export interface AdminOperationsApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminOperationsApiErrorCode =
  | "admin_operations_api_disabled"
  | "admin_operations_session_required"
  | "admin_role_required"
  | "admin_operations_http_error"
  | "admin_operations_invalid_response";

export class AdminOperationsApiError extends Error {
  code: AdminOperationsApiErrorCode;
  status: number;

  constructor(code: AdminOperationsApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminOperationsApiError";
    this.code = code;
    this.status = status;
  }
}

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

export const getConfiguredAdminOperationsApiBaseUrl = () =>
  normalizeBaseUrl(getConfiguredAccountApiBaseUrl());

export const isAdminOperationsApiConfigured = () => Boolean(getConfiguredAdminOperationsApiBaseUrl());

export function createAdminOperationsApiClient(options: AdminOperationsApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAdminOperationsApiBaseUrl());
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
    async overview(): Promise<AdminOperationsOverview> {
      if (!baseUrl) {
        throw new AdminOperationsApiError(
          "admin_operations_api_disabled",
          "Self-hosted API URL is not configured.",
        );
      }
      if (!userId || !sessionId) {
        throw new AdminOperationsApiError(
          "admin_operations_session_required",
          "Self-hosted admin session is required.",
          401,
        );
      }

      const response = await fetchImpl(`${baseUrl}/v1/admin/operations/overview`, {
        headers: headers(),
        method: "GET",
      });
      const body = (await response.json()) as AdminOperationsOverview & { error?: { code?: string; message?: string } };
      if (!response.ok) {
        const code = body.error?.code;
        if (code === "admin_role_required") {
          throw new AdminOperationsApiError("admin_role_required", "Admin role is required.", response.status);
        }
        if (code === "account_session_required" || code === "account_session_invalid") {
          throw new AdminOperationsApiError(
            "admin_operations_session_required",
            body.error?.message ?? "Self-hosted admin session is required.",
            response.status,
          );
        }
        throw new AdminOperationsApiError(
          "admin_operations_http_error",
          body.error?.message ?? `Admin operations request failed with ${response.status}.`,
          response.status,
        );
      }
      return assertOverviewShape(body);
    },
  };
}

function assertOverviewShape(response: AdminOperationsOverview) {
  if (
    response?.ok !== true ||
    response.selfHostedBackend !== true ||
    response.productionScaleBaseline?.targetConcurrentUsers !== 10_000 ||
    response.productionPolicy?.supabaseProductionBackend !== false ||
    response.productionPolicy?.hostedBaasProductionBackend !== false ||
    response.productionPolicy?.secretsIncluded !== false ||
    response.runtime?.status?.ok !== true ||
    response.runtime?.diagnostics?.ok !== true ||
    typeof response.access?.review?.summary?.open !== "number" ||
    typeof response.access?.grants?.summary?.active !== "number" ||
    typeof response.audit?.summary?.sampleSize !== "number" ||
    !Array.isArray(response.audit?.recent) ||
    !Array.isArray(response.operatorActions) ||
    !Array.isArray(response.readiness?.items) ||
    !Array.isArray(response.operatorLinks)
  ) {
    throw new AdminOperationsApiError(
      "admin_operations_invalid_response",
      "Admin operations overview response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}
