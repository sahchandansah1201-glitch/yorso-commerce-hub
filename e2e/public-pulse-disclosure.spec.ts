/**
 * E2E · public pulse estimate disclosure.
 *
 * Guards the Pulse trust layer against live-looking activity signals that hide
 * their estimate status from mobile buyers.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";

const installEnglishLocale = async (page: Page) => {
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

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  expect(overflow).toBe(0);
};

const expectNoNestedControls = async (page: Page) => {
  await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
};

const expectPulseBadgesDiscloseEstimates = async (page: Page) => {
  const badges = page.getByTestId("pulse-badge");
  const count = await badges.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const badge = badges.nth(i);
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/estimate/i);
    await expect(badge).toHaveAttribute("aria-label", /estimate/i);
    await expect(badge).toHaveAttribute("title", "estimate");
  }
};

test.describe("public pulse estimate disclosure", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await installEnglishLocale(page);
  });

  test("homepage offer pulse badges visibly disclose estimates on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("market-activity-stats")).toBeVisible({ timeout: 15_000 });

    await expectPulseBadgesDiscloseEstimates(page);
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("offer detail market pulse keeps visible estimate copy and reduced-motion guard", async ({ page }) => {
    await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
    const marketPulse = page.getByTestId("offer-market-pulse");
    await expect(marketPulse).toBeVisible({ timeout: 15_000 });
    await expect(marketPulse).toContainText(/Estimate from platform activity, not live market data/i);

    const ping = marketPulse.locator(".animate-ping").first();
    await expect(ping).toHaveClass(/motion-reduce:animate-none/);
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });
});
