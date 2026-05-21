/**
 * E2E · API-backed admin operations hub.
 *
 * Batch #99 browser guard:
 * - /admin is the operator entry point for runtime, access review and grants;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - non-admin API responses render a role guard;
 * - overview payloads stay sanitized and do not render admin email, session id or connection strings.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_operations_e2e_99";

const overviewPayload = () => ({
  access: {
    grants: { recent: [], summary: { active: 2, expired: 1, total: 3 }, total: 3 },
    review: { recent: [], summary: { approved: 0, open: 2, pending: 1, rejected: 0, revoked: 0, sent: 1 }, total: 4 },
  },
  capacityPlan: {
    backpressureStrategy: "Use explicit refresh and bounded preview rows.",
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
  productionScaleBaseline: { status: "policy_required", targetConcurrentUsers: 10_000 },
  requestId: "00000000-0000-4000-8000-000000000199",
  runtime: {
    diagnostics: {
      capacityPlan: {
        backpressureStrategy: "Use request timeout and audit backpressure.",
        cacheStrategy: "Explicit refresh.",
        databaseStrategy: "No scans.",
        failureMode: "No fallback fabrication.",
        loadTestPlan: "Operator smoke tests.",
        observabilityPlan: "Metrics and audit.",
        readProfile: "Low-frequency admin read.",
        writeProfile: "No writes.",
      },
      diagnostics: {
        checks: [{ action: "Check policy", id: "production_policy", label: "Policy", severity: "critical", status: "pass", summary: "Safe." }],
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

const json = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  });
};

const installAdminSession = async (page: Page) => {
  await page.addInitScript(({ sessionId, userId }) => {
    window.localStorage.setItem("yorso-lang", "en");
    window.sessionStorage.setItem(
      "yorso_buyer_session",
      JSON.stringify({
        displayName: "Admin Operations",
        id: sessionId,
        identifier: "admin@yorso.test",
        method: "email",
        signedInAt: new Date().toISOString(),
        source: "self_hosted",
        userId,
      }),
    );
  }, { sessionId: SESSION_ID, userId: USER_ID });
};

test.describe("Admin operations hub", () => {
  test("loads sanitized overview through self-hosted API headers", async ({ page }) => {
    const requestHeaders: Array<Record<string, string>> = [];
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/operations/overview", async (route) => {
      requestHeaders.push(route.request().headers());
      await json(route, overviewPayload());
    });

    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-operations-page")).toBeVisible();
    await expect(page.getByTestId("admin-operations-overview")).toBeVisible();
    await expect(page.getByTestId("admin-operations-review-card")).toContainText("2");
    await expect(page.getByTestId("admin-operations-grants-card")).toContainText("2");
    await expect(page.getByTestId("admin-operations-runtime-card")).toContainText("pass");
    await expect(page.getByTestId("admin-operations-capacity-plan")).toContainText("Low-frequency admin overview read.");
    await expect(page.getByTestId("admin-operator-nav-overview")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("admin-operator-nav-access-requests")).toHaveAttribute("href", "/admin/access-requests");
    await expect(page.getByTestId("admin-operator-nav-access-grants")).toHaveAttribute("href", "/admin/access-grants");
    await expect(page.getByTestId("admin-operator-nav-runtime")).toHaveAttribute("href", "/admin/runtime");

    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("admin@yorso.test");
    expect(body).not.toContain(SESSION_ID);
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("redis://");
  });

  test("renders admin-role guard from the self-hosted API", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/operations/overview", async (route) => {
      await json(route, {
        error: { code: "admin_role_required", message: "Admin role is required." },
        ok: false,
      }, 403);
    });

    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-operations-forbidden")).toBeVisible();
    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
