/**
 * E2E · /offers · CTA semantics.
 *
 * Contract:
 * - locked catalog account and related-request CTAs are links, not nested
 *   link/button controls;
 * - buyer access gating and mobile overflow stay intact.
 */
import { expect, test } from "@playwright/test";

test.describe("/offers · CTA semantics", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders locked buyer CTAs as links without nested interactive controls", async ({ page }) => {
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

    await page.goto("/offers", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("catalog-result-count")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("catalog-value-strip").getByRole("link", { name: /Create account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Respond/i }).first()).toBeVisible();
    await expect(page.getByTestId("catalog-row-price-block").first()).toHaveAttribute(
      "data-access-level",
      "anonymous_locked",
    );

    await expect
      .poll(async () => page.evaluate(() => document.querySelectorAll("a button, button a").length))
      .toBe(0);

    const overflow = await page.evaluate(
      () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });
});
