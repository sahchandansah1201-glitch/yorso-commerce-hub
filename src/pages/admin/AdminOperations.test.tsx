import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import type { AdminOperationsOverview } from "@/lib/admin-operations-api";
import AdminOperations from "./AdminOperations";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-operations-page";

const overviewPayload = (): AdminOperationsOverview => ({
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
  audit: {
    recent: [
      {
        action: "admin.operations.overview.read",
        actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
        auditId: "aud_ops_1",
        correlationId: "corr_ops_1",
        httpMethod: "GET",
        occurredAt: "2026-05-20T10:00:00.000Z",
        outcome: "success",
        reason: null,
        requestId: "req_ops_1",
        resourceHash: null,
        resourceType: "admin_operations_overview",
        route: "/v1/admin/operations/overview",
        sessionHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
        statusCode: 200,
      },
      {
        action: "admin.access.review.blocked",
        actorUserHash: "sha256:cccccccccccccccccccccccc",
        auditId: "aud_ops_2",
        correlationId: "corr_ops_2",
        httpMethod: "GET",
        occurredAt: "2026-05-20T09:58:00.000Z",
        outcome: "blocked",
        reason: "admin_role_required",
        requestId: "req_ops_2",
        resourceHash: null,
        resourceType: "admin_access_review",
        route: "/v1/admin/access-requests",
        sessionHash: null,
        statusCode: 403,
      },
    ],
    summary: {
      blocked: 1,
      failure: 0,
      sampleSize: 2,
      statusClasses: { "2xx": 1, "4xx": 1 },
      success: 1,
    },
  },
  capacityPlan: {
    backpressureStrategy: "Use explicit refresh, bounded previews and request guardrails.",
    cacheStrategy: "No browser auto polling.",
    databaseStrategy: "Use indexed admin access paths.",
    failureMode: "No fallback fabrication.",
    loadTestPlan: "Run operator smoke tests.",
    observabilityPlan: "Emit audit and metrics without secrets.",
    readProfile: "Low-frequency admin overview read.",
    writeProfile: "No writes.",
  },
  generatedAt: "2026-05-20T10:00:00.000Z",
  ok: true,
  operatorActions: [
    { description: "Review queue", href: "/admin/access-requests", id: "review_requests", label: "Review access queue", priority: "primary" },
    { description: "Inspect grants", href: "/admin/access-grants", id: "inspect_grants", label: "Inspect active grants", priority: "primary" },
    { description: "Inspect runtime", href: "/admin/runtime", id: "inspect_runtime", label: "Inspect runtime", priority: "secondary" },
    { description: "Inspect audit", href: "/admin/audit", id: "inspect_audit", label: "Inspect audit trail", priority: "primary" },
    { description: "Export audit", href: "/v1/admin/audit-events/export?format=csv&limit=1000", id: "export_audit", label: "Export audit CSV", priority: "secondary" },
  ],
  operatorLinks: [
    { description: "Overview", href: "/admin", id: "overview", label: "Operations" },
    { description: "Runtime", href: "/admin/runtime", id: "runtime", label: "Runtime" },
    { description: "Requests", href: "/admin/access-requests", id: "access_requests", label: "Requests" },
    { description: "Grants", href: "/admin/access-grants", id: "access_grants", label: "Grants" },
    { description: "Audit", href: "/admin/audit", id: "audit", label: "Audit" },
  ],
  productionPolicy: {
    hostedBaasProductionBackend: false,
    prototypeSupabaseConfigured: false,
    secretsIncluded: false,
    supabaseProductionBackend: false,
  },
  productionScaleBaseline: { status: "policy_required", targetConcurrentUsers: 10_000 },
  readiness: {
    fail: 0,
    items: [
      {
        action: "Open runtime diagnostics.",
        detail: "Runtime diagnostics report pass.",
        id: "runtime",
        label: "Runtime diagnostics",
        route: "/admin/runtime",
        status: "pass",
      },
      {
        action: "Inspect recent audit events.",
        detail: "Recent audit sample has no failed backend actions.",
        id: "audit",
        label: "Audit activity",
        route: "/admin/audit",
        status: "warn",
      },
      {
        action: "Process open access requests.",
        detail: "2 open supplier access requests.",
        id: "access_review",
        label: "Access review queue",
        route: "/admin/access-requests",
        status: "pass",
      },
      {
        action: "Review active grants.",
        detail: "3 active grants.",
        id: "access_grants",
        label: "Grant hygiene",
        route: "/admin/access-grants",
        status: "pass",
      },
      {
        action: "Keep production capacity policy visible.",
        detail: "Target baseline remains 10,000 concurrent users.",
        id: "scale_baseline",
        label: "Scale baseline",
        route: null,
        status: "pass",
      },
      {
        action: "Keep hosted BaaS out of production runtime.",
        detail: "Self-hosted production policy is enforced.",
        id: "security",
        label: "Self-hosted policy",
        route: null,
        status: "pass",
      },
    ],
    pass: 5,
    status: "warn",
    warn: 1,
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
      productionScaleBaseline: { status: "policy_required", targetConcurrentUsers: 10_000 },
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
      productionScaleBaseline: { status: "policy_required", targetConcurrentUsers: 10_000 },
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
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <AdminOperations />
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Operations",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminOperations page", () => {
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

  it("shows disabled and session-required states explicitly", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    signInAdmin();

    const { unmount } = renderPage();
    expect(screen.getByTestId("admin-operations-disabled")).toHaveTextContent("Self-hosted API is not connected");
    expect(screen.getByTestId("admin-operator-nav-overview")).toHaveAttribute("aria-current", "page");
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    const gate = screen.getByTestId("admin-operations-session-required");
    expect(gate).toHaveTextContent("Self-hosted session required");
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("renders sanitized operator overview for admins", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(overviewPayload()), {
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-operations-overview");
    expect(screen.getByTestId("admin-operations-review-card")).toHaveTextContent("2");
    expect(screen.getByTestId("admin-operations-grants-card")).toHaveTextContent("2");
    expect(screen.getByTestId("admin-operations-runtime-card")).toHaveTextContent("pass");
    expect(screen.getByTestId("admin-operations-baseline-card")).toHaveTextContent("10,000");
    expect(screen.getByTestId("admin-operations-audit-card")).toHaveTextContent("1");
    expect(screen.getByTestId("admin-operations-readiness")).toHaveTextContent("Audit activity");
    expect(screen.getByTestId("admin-operations-actions")).toHaveTextContent("Inspect audit trail");
    expect(screen.getByTestId("admin-operations-audit-feed")).toHaveTextContent("admin.operations.overview.read");
    expect(screen.getByTestId("admin-operations-capacity-plan")).toHaveTextContent("Low-frequency admin overview read.");
    expect(screen.getByTestId("admin-operator-nav-access-requests")).toHaveAttribute("href", "/admin/access-requests");
    expect(screen.getByTestId("admin-operator-nav-access-grants")).toHaveAttribute("href", "/admin/access-grants");
    expect(screen.getByTestId("admin-operator-nav-runtime")).toHaveAttribute("href", "/admin/runtime");
    expect(screen.getByTestId("admin-operator-nav-audit")).toHaveAttribute("href", "/admin/audit");

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain("admin@yorso.test");
    expect(bodyText).not.toContain(adminSessionId);
    expect(bodyText).not.toContain("postgres://");
    expect(bodyText).not.toContain("redis://");
  });

  it("keeps RU copy localized for forbidden sessions", async () => {
    localStorage.setItem("yorso-lang", "ru");
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({
          error: { code: "admin_role_required", message: "Admin role is required." },
        }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ),
    );
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-operations-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
