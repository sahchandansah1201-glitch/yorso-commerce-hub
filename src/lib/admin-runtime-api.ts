import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminRuntimeDriver =
  | "audit_log"
  | "console"
  | "disabled"
  | "local"
  | "memory"
  | "postgres"
  | "prometheus"
  | "redis";

export interface AdminRuntimeStatus {
  ok: true;
  requestId: string;
  selfHostedBackend: true;
  productionScaleBaseline: {
    targetConcurrentUsers: 10_000;
    status: "policy_required";
  };
  runtime: {
    nodeEnv: "development" | "test" | "production";
    accountRepository: "memory" | "postgres";
    storageDriver: "local";
    metricsDriver: "disabled" | "prometheus";
    requestObservabilityDriver: "disabled" | "console";
    errorObservabilityDriver: "disabled" | "console";
    authObservabilityDriver: "disabled" | "console";
    auditDriver: "disabled" | "console" | "postgres";
  };
  auth: {
    rateLimitDriver: "audit_log" | "memory" | "redis";
    rateLimitFailMode: "open" | "closed";
    signInFailureWindowMs: number;
    signInMaxFailedAttempts: number;
    sessionCacheDriver: "disabled" | "memory" | "redis";
    sessionCacheFailMode: "open" | "closed";
    sessionCacheTtlMs: number;
  };
  requestGuardrails: {
    requestTimeoutMs: number;
    requestBodyIdleTimeoutMs: number;
    headersTimeoutMs: number;
    keepAliveTimeoutMs: number;
    maxHeaderBytes: number;
    jsonBodyMaxBytes: number;
    maxUploadBytes: number;
  };
  adminAudit: {
    exportMaxWindowDays: number;
    retentionDays: number;
    auditMaxInFlight: number;
  };
  lifecycle: {
    draining: boolean;
    activeRequests: number;
    drainSignalPresent: boolean;
    drainStarted: boolean;
    shutdownDrainDelayMs: number;
    shutdownGraceTimeoutMs: number;
  };
  productionPolicy: {
    supabaseProductionBackend: false;
    hostedBaasProductionBackend: false;
    prototypeSupabaseConfigured: boolean;
    secretsIncluded: false;
  };
}

export type AdminRuntimeDiagnosticStatus = "pass" | "warn" | "fail";

export type AdminRuntimeDiagnosticSeverity = "info" | "warning" | "critical";

export interface AdminRuntimeDiagnosticCheck {
  action: string;
  id:
    | "production_policy"
    | "capacity_baseline"
    | "auth_rate_limit"
    | "session_cache"
    | "observability"
    | "audit_durability"
    | "request_guardrails"
    | "lifecycle_drain";
  label: string;
  severity: AdminRuntimeDiagnosticSeverity;
  status: AdminRuntimeDiagnosticStatus;
  summary: string;
}

export interface AdminRuntimeDiagnostics {
  ok: true;
  requestId: string;
  generatedAt: string;
  selfHostedBackend: true;
  productionScaleBaseline: {
    targetConcurrentUsers: 10_000;
    status: "policy_required";
  };
  diagnostics: {
    overallStatus: AdminRuntimeDiagnosticStatus;
    productionReady: boolean;
    passCount: number;
    warnCount: number;
    failCount: number;
    checks: AdminRuntimeDiagnosticCheck[];
  };
  capacityPlan: {
    readProfile: string;
    writeProfile: string;
    cacheStrategy: string;
    backpressureStrategy: string;
    databaseStrategy: string;
    failureMode: string;
    observabilityPlan: string;
    loadTestPlan: string;
  };
  productionPolicy: AdminRuntimeStatus["productionPolicy"];
}

type AdminRuntimeStatusResponse = AdminRuntimeStatus;
type AdminRuntimeDiagnosticsResponse = AdminRuntimeDiagnostics;

export interface AdminRuntimeApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminRuntimeApiErrorCode =
  | "admin_runtime_api_disabled"
  | "admin_runtime_session_required"
  | "admin_role_required"
  | "admin_runtime_http_error"
  | "admin_runtime_invalid_response";

export class AdminRuntimeApiError extends Error {
  code: AdminRuntimeApiErrorCode;
  status: number;

  constructor(code: AdminRuntimeApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminRuntimeApiError";
    this.code = code;
    this.status = status;
  }
}

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

export const getConfiguredAdminRuntimeApiBaseUrl = () =>
  normalizeBaseUrl(getConfiguredAccountApiBaseUrl());

export const isAdminRuntimeApiConfigured = () => Boolean(getConfiguredAdminRuntimeApiBaseUrl());

const readErrorCode = async (response: Response): Promise<string | null> => {
  try {
    const body = (await response.clone().json()) as { error?: { code?: string } };
    return body.error?.code ?? null;
  } catch {
    return null;
  }
};

const assertStatusShape = (status: AdminRuntimeStatusResponse): AdminRuntimeStatus => {
  if (
    status?.ok !== true ||
    status.selfHostedBackend !== true ||
    status.productionScaleBaseline?.targetConcurrentUsers !== 10_000 ||
    status.productionPolicy?.supabaseProductionBackend !== false ||
    status.productionPolicy?.hostedBaasProductionBackend !== false ||
    status.productionPolicy?.secretsIncluded !== false
  ) {
    throw new AdminRuntimeApiError(
      "admin_runtime_invalid_response",
      "Admin runtime status response failed the self-hosted production policy contract.",
      200,
    );
  }
  return status;
};

const assertDiagnosticsShape = (diagnostics: AdminRuntimeDiagnosticsResponse): AdminRuntimeDiagnostics => {
  if (
    diagnostics?.ok !== true ||
    diagnostics.selfHostedBackend !== true ||
    diagnostics.productionScaleBaseline?.targetConcurrentUsers !== 10_000 ||
    diagnostics.productionPolicy?.supabaseProductionBackend !== false ||
    diagnostics.productionPolicy?.hostedBaasProductionBackend !== false ||
    diagnostics.productionPolicy?.secretsIncluded !== false ||
    !Array.isArray(diagnostics.diagnostics?.checks) ||
    diagnostics.diagnostics.checks.length === 0
  ) {
    throw new AdminRuntimeApiError(
      "admin_runtime_invalid_response",
      "Admin runtime diagnostics response failed the self-hosted production policy contract.",
      200,
    );
  }
  return diagnostics;
};

export function createAdminRuntimeApiClient(options: AdminRuntimeApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAdminRuntimeApiBaseUrl());
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
    async status(): Promise<AdminRuntimeStatus> {
      const response = await requestAdminRuntime({
        baseUrl,
        fetchImpl,
        hasSession: Boolean(userId && sessionId),
        headers: headers(),
        pathName: "/v1/admin/runtime/status",
      });
      return assertStatusShape((await response.json()) as AdminRuntimeStatusResponse);
    },
    async diagnostics(): Promise<AdminRuntimeDiagnostics> {
      const response = await requestAdminRuntime({
        baseUrl,
        fetchImpl,
        hasSession: Boolean(userId && sessionId),
        headers: headers(),
        pathName: "/v1/admin/runtime/diagnostics",
      });
      return assertDiagnosticsShape((await response.json()) as AdminRuntimeDiagnosticsResponse);
    },
  };
}

async function requestAdminRuntime(options: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  hasSession: boolean;
  headers: Headers;
  pathName: "/v1/admin/runtime/status" | "/v1/admin/runtime/diagnostics";
}) {
  if (!options.baseUrl) {
    throw new AdminRuntimeApiError(
      "admin_runtime_api_disabled",
      "Self-hosted API URL is not configured.",
    );
  }
  if (!options.hasSession) {
    throw new AdminRuntimeApiError(
      "admin_runtime_session_required",
      "A self-hosted signed-in session is required.",
      401,
    );
  }

  const response = await options.fetchImpl(`${options.baseUrl}${options.pathName}`, {
    headers: options.headers,
    method: "GET",
  });

  if (!response.ok) {
    const responseCode = await readErrorCode(response);
    if (response.status === 403 && responseCode === "admin_role_required") {
      throw new AdminRuntimeApiError(
        "admin_role_required",
        "Admin role is required.",
        response.status,
      );
    }
    if (response.status === 401) {
      throw new AdminRuntimeApiError(
        "admin_runtime_session_required",
        "A valid self-hosted session is required.",
        response.status,
      );
    }
    throw new AdminRuntimeApiError(
      "admin_runtime_http_error",
      `Admin runtime request failed with HTTP ${response.status}.`,
      response.status,
    );
  }

  return response;
}
