import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/offers",
  "/offers/1",
  "/suppliers",
  "/suppliers/sup-no-001",
  "/how-it-works",
  "/for-suppliers",
  "/signin",
  "/reset-password",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/gdpr",
  "/anti-fraud",
  "/careers",
  "/press",
  "/partners",
  "/blog",
  "/blog/atlantic-salmon-q1-price-pressure",
] as const;

const VIEWPORTS = [
  { name: "mobile390", width: 390, height: 844 },
  { name: "desktop1024", width: 1024, height: 768 },
] as const;

test.describe("public skip-to-main target", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("yorso-language", "en");
      localStorage.removeItem("yorso-buyer-session");
    });
  });

  for (const viewport of VIEWPORTS) {
    test.describe(viewport.name, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const route of PUBLIC_ROUTES) {
        test(`${route} exposes one #main target and one skip link`, async ({ page }) => {
          await page.goto(route);

          await expect(page.locator("main#main")).toHaveCount(1);
          await expect(page.getByRole("link", { name: "Skip to main content" })).toHaveCount(1);
          await expect(page.locator("main:not(#main)")).toHaveCount(0);

          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
        });
      }
    });
  }

  test("skip link moves keyboard focus to #main without changing the route", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(page.locator("main#main")).toBeFocused();
    await expect(page).toHaveURL(/#main$/);
  });
});
