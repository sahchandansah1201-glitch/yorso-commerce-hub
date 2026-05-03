/**
 * E2E · /suppliers · no horizontal overflow at 390px.
 *
 * Контракт: при мобильной ширине 390px страница /suppliers не должна
 * иметь горизонтального скролла — document.documentElement.scrollWidth
 * должен быть равен document.documentElement.clientWidth.
 */
import { test, expect, type Page } from "@playwright/test";

/**
 * Ждём, что список поставщиков полностью отрисован и стабилен:
 *   - networkidle (никаких новых запросов в течение 500мс),
 *   - в DOM есть хотя бы одна карточка `[data-testid="supplier-row"]`,
 *   - количество карточек не меняется в течение двух тиков RAF.
 *
 * Это снижает флейки при клике по поставщику, потому что список не
 * перерасчитывается под курсором (фильтр / i18n / мок-данные).
 */
const waitForSuppliersReady = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('[data-testid="supplier-row"]', { state: "visible", timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const rows = document.querySelectorAll('[data-testid="supplier-row"]');
      return rows.length > 0;
    },
    { timeout: 10_000 },
  );
  // Стабилизация: количество карточек не меняется два кадра подряд.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let prev = document.querySelectorAll('[data-testid="supplier-row"]').length;
        requestAnimationFrame(() => {
          const next = document.querySelectorAll('[data-testid="supplier-row"]').length;
          if (next === prev) requestAnimationFrame(() => resolve());
          else {
            prev = next;
            requestAnimationFrame(() => resolve());
          }
        });
      }),
  );
};

test.describe("/suppliers · mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow at 390px", async ({ page }) => {
    await page.goto("/suppliers");
    await waitForSuppliersReady(page);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBe(clientWidth);
  });

  test("no horizontal overflow at 390px after selecting a supplier", async ({ page }) => {
    await page.goto("/suppliers");
    await waitForSuppliersReady(page);

    const firstRow = page.locator('[data-testid="supplier-row"]').first();
    await firstRow.scrollIntoViewIfNeeded();
    await firstRow.click();
    // Дать панели выбранного поставщика отрисоваться.
    await page.waitForLoadState("networkidle");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBe(clientWidth);
  });
});
