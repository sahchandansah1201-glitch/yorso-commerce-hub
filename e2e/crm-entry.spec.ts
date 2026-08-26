import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const screenshotDir = "test-results/crm-entry";
const crmUrl = "http://127.0.0.1:3020/";

const expectStableUi = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
};

const mockCrmAccess = async (page: Page, requestId: string) => {
  await page.route("**/v1/crm/full-ui", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, crmUrl, requestId }),
    });
  });
};

test.beforeAll(async () => {
  await mkdir(screenshotDir, { recursive: true });
});

test.describe("CRM entry", () => {
  test("desktop account menu opens the protected CRM launch page", async ({ page }) => {
    await installBuyerSession(page, { displayName: "Buyer Demo", lang: "en" });
    await mockCrmAccess(page, "req_e2e_desktop");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByTestId("header-account-chip").click();
    const crmLink = page.getByTestId("header-crm-link");
    await expect(crmLink).toHaveAttribute("href", "/crm");
    await crmLink.click();

    await expect(page).toHaveURL(/\/crm$/);
    await expect(page.getByTestId("crm-open-link")).toHaveAttribute("href", crmUrl);
    await expectStableUi(page);
    await page.screenshot({ path: `${screenshotDir}/desktop-crm-ready.png`, fullPage: true });
  });

  test("mobile Russian account panel opens CRM without overflow", async ({ page }) => {
    await installBuyerSession(page, { displayName: "Покупатель", lang: "ru" });
    await mockCrmAccess(page, "req_e2e_mobile");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const menuToggle = page.getByRole("button", { name: "Открыть меню" });
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(menuToggle).toHaveAttribute("aria-controls", "header-mobile-menu");
    const crmLink = page.getByTestId("header-mobile-crm-link");
    await expect(crmLink).toHaveAttribute("href", "/crm");
    await crmLink.click();

    await expect(page).toHaveURL(/\/crm$/);
    await expect(page.getByTestId("crm-open-link")).toHaveAttribute("href", crmUrl);
    await expectStableUi(page);
    await page.screenshot({ path: `${screenshotDir}/mobile-390-crm-ready.png`, fullPage: true });
  });

  test("denied access is distinct from a temporary CRM outage", async ({ page }) => {
    await installBuyerSession(page, { displayName: "Buyer Demo", lang: "en" });
    await page.route("**/v1/crm/full-ui", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "crm_access_denied" }, requestId: "req_denied" }),
      });
    });

    await page.goto("/crm", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("You do not have permission to open CRM.")).toBeVisible();
    await expect(page.getByTestId("crm-retry")).toHaveCount(0);
    await expect(page.getByTestId("crm-signin-again")).toHaveCount(0);
    await expect(page.getByTestId("crm-open-link")).toHaveCount(0);
    await expectStableUi(page);
  });

  test("temporary CRM outage can be retried without leaving the page", async ({ page }) => {
    await installBuyerSession(page, { displayName: "Buyer Demo", lang: "en" });
    let attempts = 0;
    const cacheControlHeaders: Array<string | undefined> = [];
    await page.route("**/v1/crm/full-ui", async (route) => {
      attempts += 1;
      cacheControlHeaders.push(route.request().headers()["cache-control"]);
      await route.fulfill(attempts === 1
        ? {
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: { code: "crm_unavailable" }, requestId: "req_unavailable" }),
          }
        : {
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true, crmUrl, requestId: "req_retry" }),
          });
    });

    await page.goto("/crm", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("crm-retry")).toBeVisible();
    await page.getByTestId("crm-retry").click();
    await expect(page.getByTestId("crm-open-link")).toHaveAttribute("href", crmUrl);
    expect(cacheControlHeaders).toEqual([undefined, "no-cache"]);
    await expectStableUi(page);
    await page.screenshot({ path: `${screenshotDir}/desktop-crm-retry.png`, fullPage: true });
  });

  test("CRM sign-in requires the self-hosted email session", async ({ page }) => {
    await page.goto("/signin?redirect=/crm", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("signin-crm-email-required"))
      .toHaveText("Sign in with email and password to open CRM.");
    await expect(page.getByRole("button", { name: "Phone" })).toBeDisabled();
    await expect(page.locator("#signin-email")).toBeVisible();
    await expectStableUi(page);
  });

  test("stale prototype session asks for sign-in and returns to CRM", async ({ page }) => {
    await installBuyerSession(page, {
      displayName: "Dmitry Maximenko",
      identifier: "dm@yorso.com",
      lang: "ru",
      userId: "",
    });

    await page.goto("/crm", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Сессия YORSO устарела. Войдите снова, чтобы открыть CRM.")).toBeVisible();
    await expect(page.getByTestId("crm-retry")).toHaveCount(0);
    await page.screenshot({ path: `${screenshotDir}/desktop-crm-session-expired.png`, fullPage: true });
    await page.getByTestId("crm-signin-again").click();
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fcrm$/);
  });

  test("Spanish CRM copy remains localized", async ({ page }) => {
    await installBuyerSession(page, { displayName: "Comprador", lang: "es" });
    await mockCrmAccess(page, "req_e2e_es");
    await page.goto("/crm", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "CRM de YORSO" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Abrir CRM/ })).toHaveAttribute("href", crmUrl);
    await expectStableUi(page);
  });

  test("live self-hosted YORSO session opens the running Twenty login", async ({ page, request }) => {
    test.skip(process.env.E2E_CRM_LIVE !== "1", "requires the persistent local-lab runtime");

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/signin?redirect=/crm", { waitUntil: "domcontentloaded" });
    await page.locator("#signin-email").fill("buyer@example.com");
    await page.locator("#signin-password").fill("Password1");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/crm$/);
    const openLink = page.getByTestId("crm-open-link");
    await expect(openLink).toHaveAttribute("href", crmUrl);

    const health = await request.get(`${crmUrl}healthz`);
    expect(health.status()).toBe(200);
    const popupPromise = page.waitForEvent("popup");
    await openLink.click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup).toHaveURL(/^http:\/\/127\.0\.0\.1:3020\/welcome(?:[/?#]|$)/);
    await expect(popup.getByPlaceholder(/email|электронная почта|correo electrónico/i)).toBeVisible();
    await expect(popup.getByRole("button", { name: /continue|продолжить|continuar/i })).toBeVisible();
    await expectStableUi(page);
    await page.screenshot({ path: `${screenshotDir}/live-crm-ready.png`, fullPage: true });
    await popup.screenshot({ path: `${screenshotDir}/live-twenty-login.png`, fullPage: true });
    await popup.close();
  });
});
