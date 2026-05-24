/**
 * E2E · /how-it-works → /offers#request.
 *
 * Contract:
 * - buyer CTAs that promise supplier access land on a real request anchor;
 * - /offers URL normalization must preserve hash anchors;
 * - the access/request value strip is visible after cross-route navigation.
 */
import { expect, test, type Page } from "@playwright/test";

const installPublicStorage = async (page: Page) => {
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
};

const expectRequestLanding = async (page: Page) => {
  await expect(page.locator("#request")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("catalog-value-strip")).toBeInViewport({ ratio: 0.5 });
  await expect.poll(async () => page.evaluate(() => window.location.hash)).toBe("#request");
};

test.describe("/how-it-works · request access anchor", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await installPublicStorage(page);
  });

  test("hero request CTA lands on the /offers request access strip", async ({ page }) => {
    await page.goto("/how-it-works", { waitUntil: "domcontentloaded" });

    await page.getByRole("link", { name: /Request access to a supplier/i }).first().click();

    await expect(page).toHaveURL(/\/offers#request$/);
    await expectRequestLanding(page);
  });

  test("direct /offers#request entry preserves hash through catalog URL normalization", async ({ page }) => {
    await page.goto("/offers#request", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/offers#request$/);
    await expectRequestLanding(page);
  });
});
