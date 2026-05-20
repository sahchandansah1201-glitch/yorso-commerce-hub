import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuyerSession } from "@/lib/buyer-session";
import type { AdminRuntimeDiagnostics, AdminRuntimeStatus } from "@/lib/admin-runtime-api";
import { useAdminRuntimeStatus } from "@/lib/use-admin-runtime-status";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-runtime-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000094",
};

const statusPayload: AdminRuntimeStatus = {
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000294",
  selfHostedBackend: true,
  productionScaleBaseline: {
    targetConcurrentUsers: 10_000,
    status: "policy_required",
  },
  runtime: {
    nodeEnv: "production",
    accountRepository: "postgres",
    storageDriver: "local",
    metricsDriver: "prometheus",
    requestObservabilityDriver: "console",
    errorObservabilityDriver: "console",
    authObservabilityDriver: "console",
    auditDriver: "postgres",
  },
  auth: {
    rateLimitDriver: "redis",
    rateLimitFailMode: "closed",
    signInFailureWindowMs: 900_000,
    signInMaxFailedAttempts: 5,
    sessionCacheDriver: "redis",
    sessionCacheFailMode: "closed",
    sessionCacheTtlMs: 300_000,
  },
  requestGuardrails: {
    requestTimeoutMs: 15_000,
    requestBodyIdleTimeoutMs: 5_000,
    headersTimeoutMs: 10_000,
    keepAliveTimeoutMs: 5_000,
    maxHeaderBytes: 16_384,
    jsonBodyMaxBytes: 65_536,
    maxUploadBytes: 10_485_760,
  },
  adminAudit: {
    exportMaxWindowDays: 31,
    retentionDays: 365,
    auditMaxInFlight: 2_000,
  },
  lifecycle: {
    draining: false,
    activeRequests: 0,
    drainSignalPresent: false,
    drainStarted: false,
    shutdownDrainDelayMs: 5_000,
    shutdownGraceTimeoutMs: 30_000,
  },
  productionPolicy: {
    supabaseProductionBackend: false,
    hostedBaasProductionBackend: false,
    prototypeSupabaseConfigured: false,
    secretsIncluded: false,
  },
};

const diagnosticsPayload: AdminRuntimeDiagnostics = {
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000595",
  generatedAt: "2026-05-20T10:00:00.000Z",
  selfHostedBackend: true,
  productionScaleBaseline: {
    targetConcurrentUsers: 10_000,
    status: "policy_required",
  },
  diagnostics: {
    checks: [
      {
        action: "Keep hosted BaaS disabled for production.",
        id: "production_policy",
        label: "Self-hosted production policy",
        severity: "critical",
        status: "pass",
        summary: "Production policy is clean.",
      },
    ],
    failCount: 0,
    overallStatus: "pass",
    passCount: 1,
    productionReady: true,
    warnCount: 0,
  },
  capacityPlan: {
    backpressureStrategy: "Use guardrails.",
    cacheStrategy: "Use explicit refresh.",
    databaseStrategy: "Use indexed paths.",
    failureMode: "No fallback fabrication.",
    loadTestPlan: "Run operator smoke tests.",
    observabilityPlan: "Emit metrics.",
    readProfile: "Low-frequency admin read.",
    writeProfile: "No writes.",
  },
  productionPolicy: {
    supabaseProductionBackend: false,
    hostedBaasProductionBackend: false,
    prototypeSupabaseConfigured: false,
    secretsIncluded: false,
  },
};

describe("useAdminRuntimeStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled state without VITE_YORSO_API_URL", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminRuntimeStatus(adminSession));

    expect(result.current.status).toBe("disabled");
  });

  it("loads runtime status and supports explicit refresh", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) =>
      new Response(JSON.stringify(String(input).endsWith("/diagnostics") ? diagnosticsPayload : statusPayload), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() => useAdminRuntimeStatus(adminSession));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.productionScaleBaseline.targetConcurrentUsers).toBe(10_000);
    expect(result.current.diagnostics?.diagnostics.productionReady).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(4));
  });

  it("maps 403 responses to forbidden state", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({
          ok: false,
          error: { code: "admin_role_required", message: "Admin role is required." },
        }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ),
    );

    const { result } = renderHook(() => useAdminRuntimeStatus(adminSession));

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
  });
});
