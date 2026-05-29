import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import type { AdminRuntimeDiagnostics, AdminRuntimeStatus } from "@/lib/admin-runtime-api";
import AdminRuntimeStatusPage from "./AdminRuntimeStatus";

const statusPayload = (patch: Partial<AdminRuntimeStatus> = {}): AdminRuntimeStatus => ({
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000394",
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
    hostedBaasProductionBackend: false,
    secretsIncluded: false,
  },
  ...patch,
});

const diagnosticsPayload = (patch: Partial<AdminRuntimeDiagnostics> = {}): AdminRuntimeDiagnostics => ({
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000695",
  generatedAt: "2026-05-20T10:00:00.000Z",
  selfHostedBackend: true,
  productionScaleBaseline: {
    targetConcurrentUsers: 10_000,
    status: "policy_required",
  },
  diagnostics: {
    checks: [
      {
        action: "Keep hosted BaaS disabled for production runtime.",
        id: "production_policy",
        label: "Self-hosted production policy",
        severity: "critical",
        status: "pass",
        summary: "Production policy flags are safe.",
      },
      {
        action: "Use Redis with fail-closed behavior before production traffic.",
        id: "auth_rate_limit",
        label: "Auth rate limit runtime",
        severity: "critical",
        status: "pass",
        summary: "Auth rate limit runtime is production-aligned.",
      },
    ],
    failCount: 0,
    overallStatus: "pass",
    passCount: 2,
    productionReady: true,
    warnCount: 0,
  },
  capacityPlan: {
    backpressureStrategy: "Reuse request timeout and audit backpressure.",
    cacheStrategy: "Use explicit refresh only.",
    databaseStrategy: "Diagnostics does not scan business tables.",
    failureMode: "Do not fabricate fallback diagnostics.",
    loadTestPlan: "Include endpoint in operator smoke tests.",
    observabilityPlan: "Emit metrics and audit events without secrets.",
    readProfile: "Low-frequency admin read path.",
    writeProfile: "No writes.",
  },
  productionPolicy: {
    hostedBaasProductionBackend: false,
    secretsIncluded: false,
  },
  ...patch,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/runtime"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <AdminRuntimeStatusPage />
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Runtime",
    id: "session-admin-runtime-page",
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: "00000000-0000-4000-8000-000000000094",
  });

describe("AdminRuntimeStatus page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("yorso-lang", "en");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    buyerSession.__resetForTests();
  });

  it("shows explicit disabled state when self-hosted API is not configured", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    signInAdmin();

    renderPage();

    expect(screen.getByTestId("admin-runtime-disabled")).toBeInTheDocument();
    expect(screen.getByText("Self-hosted API is not connected")).toBeInTheDocument();
  });

  it("shows sign-in requirement when there is no self-hosted session", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");

    renderPage();

    const gate = screen.getByTestId("admin-runtime-session-required");
    expect(gate).toBeInTheDocument();
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("renders sanitized production runtime status for admins", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) =>
      new Response(JSON.stringify(String(input).endsWith("/diagnostics") ? diagnosticsPayload() : statusPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-runtime-status");
    expect(screen.getByTestId("admin-runtime-scale")).toHaveTextContent("10,000 concurrent users");
    expect(screen.getByTestId("admin-runtime-no-secrets")).toHaveTextContent("Yes");
    expect(screen.getByTestId("admin-runtime-policy")).toHaveTextContent("Hosted BaaS production backend");
    expect(screen.getByTestId("admin-runtime-policy")).toHaveTextContent("No");
    expect(screen.getByTestId("admin-runtime-auth")).toHaveTextContent("redis");
    expect(screen.getByTestId("admin-runtime-auth")).toHaveTextContent("closed");
    expect(screen.getByTestId("admin-runtime-guardrails")).toHaveTextContent("15,000 ms");
    expect(screen.getByTestId("admin-runtime-diagnostics")).toHaveTextContent("Runtime diagnostics");
    expect(screen.getByTestId("admin-runtime-diagnostics-overall")).toHaveTextContent("pass");
    expect(screen.getByTestId("admin-runtime-capacity-plan")).toHaveTextContent("Low-frequency admin read path.");
    expect(screen.getByTestId("admin-runtime-capacity-plan")).toHaveTextContent("No writes.");

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain("admin@yorso.test");
    expect(bodyText).not.toContain("session-admin-runtime-page");
    expect(bodyText).not.toContain("postgres://");
  });

  it("keeps RU copy consistent on access failures", async () => {
    localStorage.setItem("yorso-lang", "ru");
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
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-runtime-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
