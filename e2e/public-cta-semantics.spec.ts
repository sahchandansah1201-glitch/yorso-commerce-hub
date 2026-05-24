/**
 * E2E · public CTA semantics.
 *
 * Contract:
 * - homepage landing offer links and view-all CTA are single anchors;
 * - shared info/legal back CTA is a single anchor;
 * - checked public routes keep the mobile overflow guard.
 */
import { expect, test, type Page } from "@playwright/test";

const infoRoutes = [
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
];

const expectNoNestedControls = async (page: Page) => {
  await expect
    .poll(async () => page.evaluate(() => document.querySelectorAll("a button, button a, a a, button button").length))
    .toBe(0);
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

test.describe("public routes · CTA semantics", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("yorso-lang", "en");
      } catch {
        /* ignore */
      }
    });
  });

  test("homepage keeps landing CTAs single-target on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Verified Suppliers/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View all offers/i })).toHaveAttribute("href", "/offers");

    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("homepage desktop view-all CTA is a direct link", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const viewAllLinks = page.getByRole("link", { name: /View all offers/i });
    await expect(viewAllLinks.first()).toBeVisible();
    await expect(viewAllLinks.first()).toHaveAttribute("href", "/offers");

    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  for (const route of infoRoutes) {
    test(`${route} shared back CTA is a direct link on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("link", { name: /Back to homepage/i })).toHaveAttribute("href", "/");

      await expectNoNestedControls(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
