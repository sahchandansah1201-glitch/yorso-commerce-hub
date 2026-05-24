/**
 * E2E · /offers · trust proof strip anchors.
 *
 * Contract:
 * - proof-strip buttons must move buyers to visible evidence;
 * - mobile must not dead-end on the desktop-only intelligence column;
 * - document readiness proof should land on offer evidence, not the filter bar.
 */
import { expect, test } from "@playwright/test";

test.describe("/offers · trust proof anchors", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("yorso-lang", "en");
        window.sessionStorage.removeItem("yorso_buyer_session");
        window.sessionStorage.removeItem("yorso_buyer_qualification");
        window.sessionStorage.removeItem("yorso_buyer_qualified");
      } catch {
        /* ignore */
      }
    });
  });

  test("procurement intelligence proof falls back to visible offer evidence on mobile", async ({ page }) => {
    await page.goto("/offers", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("catalog-trust-proof-strip")).toBeVisible();
    await expect(page.getByTestId("catalog-offer-row").first()).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("catalog-trust-proof-signals").click();

    await expect.poll(async () => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(500);
    await expect(page.getByTestId("catalog-offer-row").first()).toBeInViewport({ ratio: 0.2 });
    await expect(page.getByTestId("catalog-row-trend-analytics-toggle").first()).toBeVisible();
  });

  test("document-readiness proof lands on offer cards that expose document status", async ({ page }) => {
    await page.goto("/offers", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("catalog-trust-proof-strip")).toBeVisible();
    await expect(page.getByTestId("catalog-offer-row").first()).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("catalog-trust-proof-documents").click();

    await expect.poll(async () => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(500);
    await expect(page.getByTestId("catalog-offer-row").first()).toBeInViewport({ ratio: 0.2 });
    await expect(page.locator("body")).toContainText(/Docs ready|Docs pending/);
  });
});
