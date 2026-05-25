import { expect, test, type Page } from "@playwright/test";

const BLOG_ROUTES = ["/blog", "/blog/atlantic-salmon-q1-price-pressure"] as const;

const expectNoHorizontalOverflow = async (page: Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
};

const expectMobileTargets = async (page: Page) => {
  const targets = page.locator("[data-blog-mobile-target]");
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `target ${i} should have a bounding box`).not.toBeNull();
    expect(Math.round(box?.width ?? 0), `target ${i} width`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.height ?? 0), `target ${i} height`).toBeGreaterThanOrEqual(44);
  }
};

test.describe("blog mobile tap targets", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("yorso-language", "en");
      localStorage.removeItem("yorso-buyer-session");
    });
  });

  for (const route of BLOG_ROUTES) {
    test(`${route} exposes mobile-safe insight controls`, async ({ page }) => {
      await page.goto(route);

      if (route !== "/blog") {
        await page.waitForSelector('[data-testid="blog-article"]', { timeout: 15_000 });
        const toc = page.locator('[data-testid="blog-toc-mobile"]');
        await toc.locator("summary").click();
      } else {
        await page.waitForSelector('[data-testid="blog-list"]', { timeout: 15_000 });
      }

      await expectMobileTargets(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
