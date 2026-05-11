/**
 * E2E smoke gate for the main public/account surfaces.
 *
 * This is intentionally shallow: it catches blank screens, broken routing and
 * runtime crashes after Codex/Lovable sync without duplicating feature specs.
 */
import { expect, test, type Page } from "@playwright/test";

interface SmokeRoute {
  path: string;
  readySelector: string;
}

const ROUTES: SmokeRoute[] = [
  { path: "/", readySelector: '[data-testid="page-title"]' },
  { path: "/offers", readySelector: '[data-testid="catalog-result-count"]' },
  { path: "/suppliers", readySelector: '[data-testid="supplier-row"]' },
  { path: "/suppliers/sup-no-001", readySelector: '[data-testid="supplier-anon-cta"]' },
  { path: "/blog", readySelector: '[data-testid="blog-list"]' },
  { path: "/for-suppliers", readySelector: "main h1" },
  { path: "/account/personal", readySelector: '[data-testid="account-signin-required"]' },
];

const collectPageErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};

test.describe("core route smoke", () => {
  for (const route of ROUTES) {
    test(`${route.path} renders without runtime page errors`, async ({ page }) => {
      const pageErrors = collectPageErrors(page);

      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator(route.readySelector).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator("body")).not.toContainText(/404|Page not found/i);

      expect(pageErrors).toEqual([]);
    });
  }
});
