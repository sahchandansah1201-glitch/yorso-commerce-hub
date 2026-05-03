/**
 * E2E · /suppliers · no horizontal overflow when resizing 390px → 360px.
 *
 * Контракт: при ресайзе viewport с 390px на 360px (например, поворот / узкий
 * Android) на странице /suppliers не должно появляться горизонтального скролла:
 * document.documentElement.scrollWidth === document.documentElement.clientWidth.
 */
import { test, expect } from "@playwright/test";

test.describe("/suppliers · no horizontal overflow on resize 390 → 360", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const measure = (page: import("@playwright/test").Page) =>
    page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

  test("no overflow before and after resize 390 → 360", async ({ page }) => {
    await page.goto("/suppliers");
    await page.waitForSelector('[data-testid="supplier-row"]', { timeout: 10_000 });

    const before = await measure(page);
    expect(before.scrollWidth, "overflow at 390px").toBe(before.clientWidth);

    await page.setViewportSize({ width: 360, height: 800 });
    // Дать раскладке стабилизироваться.
    await page.waitForTimeout(150);

    const after = await measure(page);
    expect(after.scrollWidth, "overflow after resize to 360px").toBe(after.clientWidth);
  });

  test("no overflow on resize 390 → 360 with a supplier selected", async ({ page }) => {
    await page.goto("/suppliers");
    const firstRow = page.locator('[data-testid="supplier-row"]').first();
    await firstRow.waitFor({ timeout: 10_000 });
    await firstRow.click();

    const before = await measure(page);
    expect(before.scrollWidth, "overflow at 390px (selected)").toBe(before.clientWidth);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(150);

    const after = await measure(page);
    expect(after.scrollWidth, "overflow after resize to 360px (selected)").toBe(after.clientWidth);
  });
});
