/**
 * E2E · API-backed admin runtime status UI.
 *
 * Batch #94 browser guard:
 * - /admin/runtime uses the self-hosted admin runtime API adapter;
 * - requests carry x-yorso-user-id and x-yorso-session-id from yorso_buyer_session;
 * - the UI displays production baseline, runtime drivers and guardrails;
 * - forbidden sessions get an admin-role state;
 * - raw emails, session ids and connection strings are not rendered.
 *
 * Run through `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`
 * so Playwright can intercept `__e2e-api/v1/*` without a real backend.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000094";
const SESSION_ID = "session_admin_runtime_e2e_94";

const runtimeStatus = () => ({
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000494",
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
        displayName: "Admin Runtime",
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

test.describe("Admin runtime status UI", () => {
  test("loads sanitized runtime status through self-hosted API headers", async ({ page }) => {
    const requestHeaders: Record<string, string>[] = [];
    let requestCount = 0;
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.replace(/^\/__e2e-api/, "");
      if (path === "/v1/admin/runtime/status" && request.method() === "GET") {
        requestCount += 1;
        requestHeaders.push(request.headers());
        await json(route, runtimeStatus());
        return;
      }
      await json(route, { ok: false, error: { code: "e2e_unhandled", message: path } }, 404);
    });

    await page.goto("/admin/runtime", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-runtime-page")).toBeVisible();
    await expect(page.getByTestId("admin-runtime-scale")).toContainText("10,000 concurrent users");
    await expect(page.getByTestId("admin-runtime-auth")).toContainText("redis");
    await expect(page.getByTestId("admin-runtime-auth")).toContainText("closed");
    await expect(page.getByTestId("admin-runtime-drivers")).toContainText("postgres");
    await expect(page.getByTestId("admin-runtime-guardrails")).toContainText("15,000 ms");
    await expect(page.getByTestId("admin-runtime-policy")).toContainText("Supabase production backend");
    await expect(page.getByTestId("admin-runtime-no-secrets")).toContainText("Yes");

    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("admin@yorso.test");
    expect(bodyText).not.toContain(SESSION_ID);
    expect(bodyText).not.toContain("postgres://");
    expect(bodyText).not.toContain("redis://");

    await page.getByTestId("admin-runtime-refresh").click();
    await expect.poll(() => requestCount).toBe(2);
  });

  test("renders admin-role guard when backend returns 403", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/runtime/status", async (route) => {
      await json(route, {
        ok: false,
        error: {
          code: "admin_role_required",
          message: "Admin role is required.",
        },
      }, 403);
    });

    await page.goto("/admin/runtime", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-runtime-forbidden")).toBeVisible();
    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
