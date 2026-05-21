import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminOperationsApiError,
  createAdminOperationsApiClient,
  isAdminOperationsApiConfigured,
  type AdminOperationsOverview,
} from "@/lib/admin-operations-api";

const overviewPayload = (patch: Partial<AdminOperationsOverview> = {}): AdminOperationsOverview => ({
  access: {
    grants: {
      recent: [],
      summary: { active: 2, expired: 1, total: 3 },
      total: 3,
    },
    review: {
      recent: [],
      summary: { approved: 4, open: 2, pending: 1, rejected: 0, revoked: 0, sent: 1 },
      total: 6,
    },
  },
  capacityPlan: {
    backpressureStrategy: "Explicit refresh and bounded preview rows.",
    cacheStrategy: "No browser auto polling.",
    databaseStrategy: "Use indexed access queries.",
    failureMode: "Do not fabricate fallback data.",
    loadTestPlan: "Include in admin smoke.",
    observabilityPlan: "Audit and metrics without secrets.",
    readProfile: "Low-frequency admin overview read.",
    writeProfile: "No writes.",
  },
  generatedAt: "2026-05-20T10:00:00.000Z",
  ok: true,
  operatorLinks: [
    { description: "Overview", href: "/admin", id: "overview", label: "Operations" },
    { description: "Runtime", href: "/admin/runtime", id: "runtime", label: "Runtime" },
    { description: "Requests", href: "/admin/access-requests", id: "access_requests", label: "Requests" },
    { description: "Grants", href: "/admin/access-grants", id: "access_grants", label: "Grants" },
  ],
  productionPolicy: {
    hostedBaasProductionBackend: false,
    prototypeSupabaseConfigured: false,
    secretsIncluded: false,
    supabaseProductionBackend: false,
  },
  productionScaleBaseline: {
    status: "policy_required",
    targetConcurrentUsers: 10_000,
  },
  requestId: "00000000-0000-4000-8000-000000000199",
  runtime: {
    diagnostics: {
      capacityPlan: {
        backpressureStrategy: "Use guardrails.",
        cacheStrategy: "Explicit refresh.",
        databaseStrategy: "No business table scans.",
        failureMode: "No fallback fabrication.",
        loadTestPlan: "Operator smoke tests.",
        observabilityPlan: "Metrics and audit.",
        readProfile: "Low-frequency admin read.",
        writeProfile: "No writes.",
      },
      diagnostics: {
        checks: [
          {
            action: "Keep hosted BaaS disabled.",
            id: "production_policy",
            label: "Self-hosted policy",
            severity: "critical",
            status: "pass",
            summary: "Safe.",
          },
        ],
        failCount: 0,
        overallStatus: "pass",
        passCount: 1,
        productionReady: true,
        warnCount: 0,
      },
      generatedAt: "2026-05-20T10:00:00.000Z",
      ok: true,
      productionPolicy: {
        hostedBaasProductionBackend: false,
        prototypeSupabaseConfigured: false,
        secretsIncluded: false,
        supabaseProductionBackend: false,
      },
      productionScaleBaseline: {
        status: "policy_required",
        targetConcurrentUsers: 10_000,
      },
      requestId: "00000000-0000-4000-8000-000000000299",
      selfHostedBackend: true,
    },
    status: {
      adminAudit: { auditMaxInFlight: 2_000, exportMaxWindowDays: 31, retentionDays: 365 },
      auth: {
        rateLimitDriver: "redis",
        rateLimitFailMode: "closed",
        sessionCacheDriver: "redis",
        sessionCacheFailMode: "closed",
        sessionCacheTtlMs: 300_000,
        signInFailureWindowMs: 900_000,
        signInMaxFailedAttempts: 5,
      },
      lifecycle: {
        activeRequests: 0,
        drainSignalPresent: false,
        drainStarted: false,
        draining: false,
        shutdownDrainDelayMs: 5_000,
        shutdownGraceTimeoutMs: 30_000,
      },
      ok: true,
      productionPolicy: {
        hostedBaasProductionBackend: false,
        prototypeSupabaseConfigured: false,
        secretsIncluded: false,
        supabaseProductionBackend: false,
      },
      productionScaleBaseline: {
        status: "policy_required",
        targetConcurrentUsers: 10_000,
      },
      requestGuardrails: {
        headersTimeoutMs: 10_000,
        jsonBodyMaxBytes: 65_536,
        keepAliveTimeoutMs: 5_000,
        maxHeaderBytes: 16_384,
        maxUploadBytes: 10_485_760,
        requestBodyIdleTimeoutMs: 5_000,
        requestTimeoutMs: 15_000,
      },
      requestId: "00000000-0000-4000-8000-000000000399",
      runtime: {
        accountRepository: "postgres",
        auditDriver: "postgres",
        authObservabilityDriver: "console",
        errorObservabilityDriver: "console",
        metricsDriver: "prometheus",
        nodeEnv: "production",
        requestObservabilityDriver: "console",
        storageDriver: "local",
      },
      selfHostedBackend: true,
    },
  },
  selfHostedBackend: true,
  ...patch,
});

describe("admin-operations-api", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("stays disabled when VITE_YORSO_API_URL is empty", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    expect(isAdminOperationsApiConfigured()).toBe(false);
    expect(createAdminOperationsApiClient().enabled).toBe(false);
  });

  it("requires a self-hosted session before calling the backend", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createAdminOperationsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
    });

    await expect(client.overview()).rejects.toMatchObject({
      code: "admin_operations_session_required",
      status: 401,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("loads overview with self-hosted session headers", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify(overviewPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createAdminOperationsApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-operations",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(client.overview()).resolves.toMatchObject({
      access: {
        grants: { summary: { active: 2 } },
        review: { summary: { open: 2 } },
      },
      productionPolicy: {
        hostedBaasProductionBackend: false,
        secretsIncluded: false,
        supabaseProductionBackend: false,
      },
      productionScaleBaseline: { targetConcurrentUsers: 10_000 },
      selfHostedBackend: true,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.yorso.test/v1/admin/operations/overview",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
    const firstCall = fetchImpl.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    const headers = firstCall[1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000099");
    expect(headers.get("x-yorso-session-id")).toBe("session-admin-operations");
  });

  it("maps admin role and invalid response failures", async () => {
    const forbiddenClient = createAdminOperationsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: "admin_role_required" } }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-operations",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(forbiddenClient.overview()).rejects.toMatchObject({
      code: "admin_role_required",
      status: 403,
    });

    const invalidClient = createAdminOperationsApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: vi.fn(async () =>
        new Response(JSON.stringify({ ok: true, selfHostedBackend: false }), {
          headers: { "content-type": "application/json" },
        }),
      ) as unknown as typeof fetch,
      sessionId: "session-admin-operations",
      userId: "00000000-0000-4000-8000-000000000099",
    });

    await expect(invalidClient.overview()).rejects.toBeInstanceOf(AdminOperationsApiError);
    await expect(invalidClient.overview()).rejects.toMatchObject({
      code: "admin_operations_invalid_response",
    });
  });
});
