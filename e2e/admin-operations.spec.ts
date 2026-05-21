/**
 * E2E · API-backed admin operations hub.
 *
 * Batch #99 browser guard:
 * - /admin is the operator entry point for runtime, access review and grants;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - non-admin API responses render a role guard;
 * - overview payloads stay sanitized and do not render admin email, session id or connection strings.
 *
 * Batch #100 browser guard:
 * - /admin renders audit summary, readiness and operator actions;
 * - the audit action links to /admin/audit;
 * - recent audit rows stay bounded and sanitized.
 *
 * Batch #101 browser guard:
 * - /admin includes incident summary, incident readiness and a link to /admin/incidents;
 * - incident feed remains bounded and sanitized.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_operations_e2e_99";

const overviewPayload = () => ({
  access: {
    grants: { recent: [], summary: { active: 2, expired: 1, total: 3 }, total: 3 },
    review: { recent: [], summary: { approved: 0, open: 2, pending: 1, rejected: 0, revoked: 0, sent: 1 }, total: 4 },
  },
  incidents: {
    recent: [
      {
        acknowledgedAt: null,
        acknowledgedByUserHash: null,
        count: 2,
        description: "Admin audit blocks need operator review.",
        evidence: [{ label: "Audit events", value: "2 blocked admin attempts" }],
        firstSeenAt: "2026-05-20T09:50:00.000Z",
        id: "audit:admin-blocked:v1-admin-audit-events",
        lastSeenAt: "2026-05-20T10:00:00.000Z",
        note: null,
        recommendedActions: ["Review admin roles."],
        relatedAuditIds: ["aud_e2e_2"],
        route: "/v1/admin/audit-events",
        severity: "high",
        source: "audit",
        status: "open",
        title: "Admin route blocked",
      },
    ],
    summary: { acknowledged: 0, critical: 0, high: 1, open: 1, resolved: 0, total: 1 },
  },
  audit: {
    recent: [
      {
        action: "admin.operations.overview.read",
        actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
        auditId: "aud_e2e_1",
        correlationId: "corr_e2e_1",
        httpMethod: "GET",
        occurredAt: "2026-05-20T10:00:00.000Z",
        outcome: "success",
        reason: null,
        requestId: "req_e2e_1",
        resourceHash: null,
        resourceType: "admin_operations_overview",
        route: "/v1/admin/operations/overview",
        sessionHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
        statusCode: 200,
      },
      {
        action: "admin.audit.blocked",
        actorUserHash: "sha256:cccccccccccccccccccccccc",
        auditId: "aud_e2e_2",
        correlationId: "corr_e2e_2",
        httpMethod: "GET",
        occurredAt: "2026-05-20T09:59:00.000Z",
        outcome: "blocked",
        reason: "admin_role_required",
        requestId: "req_e2e_2",
        resourceHash: null,
        resourceType: "admin_audit",
        route: "/v1/admin/audit-events",
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
  operatorActions: [
    { description: "Review queue", href: "/admin/access-requests", id: "review_requests", label: "Review access queue", priority: "primary" },
    { description: "Inspect grants", href: "/admin/access-grants", id: "inspect_grants", label: "Inspect active grants", priority: "primary" },
    { description: "Inspect runtime", href: "/admin/runtime", id: "inspect_runtime", label: "Inspect runtime", priority: "secondary" },
    { description: "Inspect audit", href: "/admin/audit", id: "inspect_audit", label: "Inspect audit trail", priority: "primary" },
    { description: "Export audit", href: "/v1/admin/audit-events/export?format=csv&limit=1000", id: "export_audit", label: "Export audit CSV", priority: "secondary" },
    { description: "Triage incidents", href: "/admin/incidents", id: "inspect_incidents", label: "Triage incidents", priority: "primary" },
  ],
  operatorLinks: [
    { description: "Overview", href: "/admin", id: "overview", label: "Operations" },
    { description: "Runtime", href: "/admin/runtime", id: "runtime", label: "Runtime" },
    { description: "Requests", href: "/admin/access-requests", id: "access_requests", label: "Requests" },
    { description: "Grants", href: "/admin/access-grants", id: "access_grants", label: "Grants" },
    { description: "Audit", href: "/admin/audit", id: "audit", label: "Audit" },
    { description: "Incidents", href: "/admin/incidents", id: "incidents", label: "Incidents" },
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
        action: "Triage open incidents.",
        detail: "1 open incident.",
        id: "incidents",
        label: "Incident queue",
        route: "/admin/incidents",
        status: "warn",
      },
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
    await expect(page.getByTestId("admin-operations-audit-card")).toContainText("1");
    await expect(page.getByTestId("admin-operations-incidents-card")).toContainText("1");
    await expect(page.getByTestId("admin-operations-readiness")).toContainText("Audit activity");
    await expect(page.getByTestId("admin-operations-incident-feed")).toContainText("Admin route blocked");
    await expect(page.getByTestId("admin-operations-actions")).toContainText("Inspect audit trail");
    await expect(page.getByTestId("admin-operations-actions")).toContainText("Triage incidents");
    await expect(page.getByTestId("admin-operations-audit-feed")).toContainText("admin.operations.overview.read");
    await expect(page.getByTestId("admin-operations-capacity-plan")).toContainText("Low-frequency admin overview read.");
    await expect(page.getByTestId("admin-operator-nav-overview")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("admin-operator-nav-access-requests")).toHaveAttribute("href", "/admin/access-requests");
    await expect(page.getByTestId("admin-operator-nav-access-grants")).toHaveAttribute("href", "/admin/access-grants");
    await expect(page.getByTestId("admin-operator-nav-runtime")).toHaveAttribute("href", "/admin/runtime");
    await expect(page.getByTestId("admin-operator-nav-audit")).toHaveAttribute("href", "/admin/audit");
    await expect(page.getByTestId("admin-operator-nav-incidents")).toHaveAttribute("href", "/admin/incidents");

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
