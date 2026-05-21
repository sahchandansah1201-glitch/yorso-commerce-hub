/**
 * E2E · API-backed admin audit page.
 *
 * Batch #100 browser guard:
 * - /admin/audit renders bounded audit events from self-hosted API;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - route filter updates the backend query;
 * - emails, raw session ids and connection strings are not rendered.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_audit_e2e_100";

const auditPayload = () => ({
  events: [
    {
      action: "admin.operations.overview.read",
      actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
      auditId: "aud_e2e_audit_1",
      correlationId: "corr_e2e_audit_1",
      httpMethod: "GET",
      occurredAt: "2026-05-20T10:00:00.000Z",
      outcome: "success",
      reason: null,
      requestId: "req_e2e_audit_1",
      resourceHash: null,
      resourceType: "admin_operations_overview",
      route: "/v1/admin/operations/overview",
      sessionHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
      statusCode: 200,
    },
    {
      action: "admin.audit.blocked",
      actorUserHash: "sha256:cccccccccccccccccccccccc",
      auditId: "aud_e2e_audit_2",
      correlationId: "corr_e2e_audit_2",
      httpMethod: "GET",
      occurredAt: "2026-05-20T09:59:00.000Z",
      outcome: "blocked",
      reason: "admin_role_required",
      requestId: "req_e2e_audit_2",
      resourceHash: null,
      resourceType: "admin_audit",
      route: "/v1/admin/audit-events",
      sessionHash: null,
      statusCode: 403,
    },
  ],
  limit: 25,
  nextCursor: null,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000401",
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
        displayName: "Admin Audit",
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

test.describe("Admin audit trail", () => {
  test("loads sanitized audit events and forwards filters", async ({ page }) => {
    const requestHeaders: Array<Record<string, string>> = [];
    const requestedUrls: string[] = [];
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/audit-events?**", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, auditPayload());
    });

    await page.goto("/admin/audit", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-audit-page")).toBeVisible();
    await expect(page.getByTestId("admin-audit-events")).toContainText("admin.operations.overview.read");
    await expect(page.getByTestId("admin-operator-nav-audit")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("admin-audit-export-csv")).toHaveAttribute(
      "href",
      "http://127.0.0.1:4173/__e2e-api/v1/admin/audit-events/export?format=csv&limit=1000",
    );

    await page.getByTestId("admin-audit-route-filter").fill("/v1/admin/audit-events");
    await expect.poll(() => requestedUrls.length).toBeGreaterThanOrEqual(2);
    expect(requestedUrls[requestedUrls.length - 1]).toContain("route=%2Fv1%2Fadmin%2Faudit-events");
    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("admin@yorso.test");
    expect(body).not.toContain(SESSION_ID);
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("redis://");
  });

  test("renders admin role guard from the self-hosted API", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/audit-events?**", async (route) => {
      await json(route, {
        error: { code: "admin_role_required", message: "Admin role is required." },
        ok: false,
      }, 403);
    });

    await page.goto("/admin/audit", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-audit-forbidden")).toBeVisible();
    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
