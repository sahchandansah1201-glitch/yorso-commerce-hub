/**
 * E2E · API-backed admin supplier document management events page.
 *
 * Phase 4R browser guard:
 * - /admin/supplier-document-management-events renders bounded management events from self-hosted API;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - JSON/CSV export controls call the Phase 4Q export endpoint;
 * - browser-facing UI does not render file asset or storage-only fields.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_document_management_events_e2e_4r";

const managementEventsPayload = () => ({
  items: [
    {
      action: "supplier_document.approve",
      actorRole: "admin",
      actorUserId: USER_ID,
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      id: "sdme_e2e_1",
      nextStatus: "approved",
      previousStatus: "review",
      reason: "Approved for buyer visibility",
      requestId: "req_management_e2e_1",
      supplierId: "sup-no-001",
    },
  ],
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000451",
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
        displayName: "Admin Management Events",
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

test.describe("Admin supplier document management events", () => {
  test("loads sanitized management event rows and exports", async ({ page }) => {
    const requestHeaders: Array<Record<string, string>> = [];
    const requestedUrls: string[] = [];
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/supplier-documents/management-events?**", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, managementEventsPayload());
    });
    await page.route("**/__e2e-api/v1/admin/supplier-documents/management-events/export?**", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      if (route.request().url().includes("format=csv")) {
        await route.fulfill({
          body: "id,createdAt,action\nsdme_e2e_1,2026-05-31T08:00:00.000Z,supplier_document.approve\n",
          contentType: "text/csv",
        });
        return;
      }
      await json(route, managementEventsPayload());
    });

    await page.goto("/admin/supplier-document-management-events", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-document-management-events-page")).toBeVisible();
    await expect(page.getByTestId("admin-document-management-events-rows")).toContainText("sdme_e2e_1");
    await expect(page.getByTestId("admin-document-management-events-rows")).toContainText("review → approved");
    await expect(page.getByTestId("admin-operator-nav-document-management-events")).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByTestId("admin-document-management-events-export-json").click();
    await expect(page.getByTestId("admin-document-management-events-export-status")).toContainText(
      "Management event export ready",
    );
    await page.getByTestId("admin-document-management-events-export-csv").click();

    expect(requestedUrls.some((url) => url.includes("/v1/admin/supplier-documents/management-events?limit=50&offset=0"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/management-events/export") && url.includes("format=json"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/management-events/export") && url.includes("format=csv"))).toBe(true);
    expect(requestHeaders.every((headers) => headers["x-yorso-user-id"] === USER_ID)).toBe(true);
    expect(requestHeaders.every((headers) => headers["x-yorso-session-id"] === SESSION_ID)).toBe(true);

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("fileAssetId");
    expect(body).not.toContain("downloadPath");
    expect(body).not.toContain("objectKey");
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain(SESSION_ID);

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(horizontalOverflow).toBe(false);
  });

  test("renders localized admin role guard from the self-hosted API", async ({ page }) => {
    await installAdminSession(page, "ru");
    await page.route("**/__e2e-api/v1/admin/supplier-documents/management-events?**", async (route) => {
      await json(route, {
        error: { code: "admin_role_required", message: "Admin role is required." },
        ok: false,
      }, 403);
    });

    await page.goto("/admin/supplier-document-management-events", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-document-management-events-forbidden")).toBeVisible();
    await expect(page.getByText("Нужна роль администратора")).toBeVisible();
    await expect(page.getByText("Admin role required")).toHaveCount(0);
  });
});
