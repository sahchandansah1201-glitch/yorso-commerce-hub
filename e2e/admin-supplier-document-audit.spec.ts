/**
 * E2E · API-backed admin supplier document audit page.
 *
 * Phase 4K browser guard:
 * - /admin/supplier-document-audit renders bounded grant audit from self-hosted API;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - browser-facing UI does not render file asset or storage-only fields.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_document_audit_e2e_4k";

const grantPayload = () => ({
  items: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      expiresAt: "2026-05-31T08:15:00.000Z",
      grantedAt: "2026-05-31T08:00:00.000Z",
      id: "sdg_e2e_1",
      reason: "granted",
      requestId: "req_grant_e2e_1",
      status: "granted",
      supplierId: "sup-no-001",
    },
  ],
  limit: 25,
  offset: 0,
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

const installAdminSession = async (page: Page, lang = "en") => {
  await page.addInitScript(({ sessionId, userId, language }) => {
    window.localStorage.setItem("yorso-lang", language);
    window.sessionStorage.setItem(
      "yorso_buyer_session",
      JSON.stringify({
        displayName: "Admin Documents",
        id: sessionId,
        identifier: "admin@yorso.test",
        method: "email",
        signedInAt: new Date().toISOString(),
        source: "self_hosted",
        userId,
      }),
    );
  }, { language: lang, sessionId: SESSION_ID, userId: USER_ID });
};

test.describe("Admin supplier document audit", () => {
  test("loads sanitized grant audit rows", async ({ page }) => {
    const requestHeaders: Array<Record<string, string>> = [];
    const requestedUrls: string[] = [];
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/supplier-documents/download-grants?**", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, grantPayload());
    });

    await page.goto("/admin/supplier-document-audit", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-document-audit-page")).toBeVisible();
    await expect(page.getByTestId("admin-document-audit-rows")).toContainText("sdg_e2e_1");
    await expect(page.getByTestId("admin-operator-nav-document-audit")).toHaveAttribute("aria-current", "page");
    expect(requestedUrls[0]).toContain("/v1/admin/supplier-documents/download-grants?limit=25&offset=0");
    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("fileAssetId");
    expect(body).not.toContain("downloadPath");
    expect(body).not.toContain("objectKey");
    expect(body).not.toContain("postgres://");
  });

  test("renders localized admin role guard from the self-hosted API", async ({ page }) => {
    await installAdminSession(page, "ru");
    await page.route("**/__e2e-api/v1/admin/supplier-documents/download-grants?**", async (route) => {
      await json(route, {
        error: { code: "admin_role_required", message: "Admin role is required." },
        ok: false,
      }, 403);
    });

    await page.goto("/admin/supplier-document-audit", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-document-audit-forbidden")).toBeVisible();
    await expect(page.getByText("Нужна роль администратора")).toBeVisible();
    await expect(page.getByText("Admin role required")).toHaveCount(0);
  });
});
