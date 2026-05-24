/**
 * E2E · /for-suppliers · CTA semantics.
 *
 * Contract:
 * - supplier CTAs are links, not nested link/button controls;
 * - primary supplier and secondary buyer-request CTAs remain visible on mobile;
 * - the page keeps the mobile overflow guard.
 */
import { expect, test } from "@playwright/test";

test.describe("/for-suppliers · CTA semantics", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders supplier CTAs as links without nested interactive controls", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("yorso-lang", "en");
      } catch {
        /* ignore */
      }
    });

    await page.goto("/for-suppliers", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("link", { name: /Register as supplier/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /See buyer requests/i }).first()).toBeVisible();

    await expect
      .poll(async () => page.evaluate(() => document.querySelectorAll("a button, button a").length))
      .toBe(0);

    const overflow = await page.evaluate(
      () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });
});
