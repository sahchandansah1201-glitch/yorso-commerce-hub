import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminRuntimeApiError,
  createAdminRuntimeApiClient,
  isAdminRuntimeApiConfigured,
  type AdminRuntimeStatus,
} from "@/lib/admin-runtime-api";

const statusPayload = (patch: Partial<AdminRuntimeStatus> = {}): AdminRuntimeStatus => ({
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000194",
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
  ...patch,
});

describe("admin-runtime-api", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("stays disabled when VITE_YORSO_API_URL is empty", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    expect(isAdminRuntimeApiConfigured()).toBe(false);
    expect(createAdminRuntimeApiClient().enabled).toBe(false);
  });

  it("requires a self-hosted session id and user id before calling the backend", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createAdminRuntimeApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl,
    });

    await expect(client.status()).rejects.toMatchObject({
      code: "admin_runtime_session_required",
      status: 401,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("loads sanitized runtime status with self-hosted session headers", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, _init) =>
      new Response(JSON.stringify(statusPayload()), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createAdminRuntimeApiClient({
      baseUrl: "https://api.yorso.test/",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-94",
      userId: "00000000-0000-4000-8000-000000000094",
    });

    await expect(client.status()).resolves.toMatchObject({
      selfHostedBackend: true,
      productionScaleBaseline: { targetConcurrentUsers: 10_000 },
      productionPolicy: {
        supabaseProductionBackend: false,
        hostedBaasProductionBackend: false,
        secretsIncluded: false,
      },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.yorso.test/v1/admin/runtime/status",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const firstCall = fetchImpl.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    const headers = firstCall[1]?.headers as Headers;
    expect(headers.get("x-yorso-user-id")).toBe("00000000-0000-4000-8000-000000000094");
    expect(headers.get("x-yorso-session-id")).toBe("session-admin-94");
  });

  it("maps admin role failures to admin_role_required", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({
        ok: false,
        error: { code: "admin_role_required", message: "Admin role is required." },
      }), {
        headers: { "content-type": "application/json" },
        status: 403,
      }),
    );
    const client = createAdminRuntimeApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-buyer-94",
      userId: "00000000-0000-4000-8000-000000000001",
    });

    await expect(client.status()).rejects.toMatchObject({
      code: "admin_role_required",
      status: 403,
    });
  });

  it("rejects responses that violate the production policy shape", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({
        ...statusPayload(),
        productionScaleBaseline: { targetConcurrentUsers: 1_000, status: "policy_required" },
      }), {
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );
    const client = createAdminRuntimeApiClient({
      baseUrl: "https://api.yorso.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sessionId: "session-admin-94",
      userId: "00000000-0000-4000-8000-000000000094",
    });

    await expect(client.status()).rejects.toBeInstanceOf(AdminRuntimeApiError);
    await expect(client.status()).rejects.toMatchObject({
      code: "admin_runtime_invalid_response",
    });
  });
});
