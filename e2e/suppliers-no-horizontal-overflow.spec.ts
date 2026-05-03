/**
 * E2E · /suppliers · no horizontal overflow at 390px.
 *
 * Контракт: при мобильной ширине 390px страница /suppliers не должна
 * иметь горизонтального скролла — document.documentElement.scrollWidth
 * должен быть равен document.documentElement.clientWidth.
 */
import { test, expect } from "@playwright/test";

test.describe("/suppliers · mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow at 390px", async ({ page }) => {
    await page.goto("/suppliers");
    // Wait for at least one supplier row to render.
    await page.waitForSelector('[data-testid="supplier-row"]', { timeout: 10_000 });

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBe(clientWidth);
  });

  test("no horizontal overflow at 390px after selecting a supplier", async ({ page }) => {
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
