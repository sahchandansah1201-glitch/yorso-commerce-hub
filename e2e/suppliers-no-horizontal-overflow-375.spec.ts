/**
 * E2E · /suppliers · no horizontal overflow at 375px (iPhone SE / mini).
 *
 * Контракт: при ширине 375px страница /suppliers не должна иметь
 * горизонтального скролла —
 * document.documentElement.scrollWidth === document.documentElement.clientWidth.
 */
import { test, expect } from "@playwright/test";

test.describe("/suppliers · mobile layout @ 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await page.goto("/suppliers");
    await page.waitForSelector('[data-testid="supplier-row"]', { timeout: 10_000 });

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBe(clientWidth);
  });

  test("no horizontal overflow at 375px after selecting a supplier", async ({ page }) => {
    await page.goto("/suppliers");
    const firstRow = page.locator('[data-testid="supplier-row"]').first();
    await firstRow.waitFor({ timeout: 10_000 });
    await firstRow.click();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBe(clientWidth);
  });
});
