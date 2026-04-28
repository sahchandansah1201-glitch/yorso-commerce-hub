/**
 * E2E · /offers · клик по «Аналитике» в карточке панели закупок
 *
 * Что проверяем:
 *   1. На странице есть как минимум одна карточка с триггером аналитики.
 *      В desktop/tablet ряду используется `catalog-row-analytics-toggle`
 *      (пиктограмма BarChart3 + подпись «Аналитика»). На мобильной
 *      карточке роль триггера выполняет индикатор тренда
 *      `catalog-row-trend-analytics-toggle`. Тест работает с тем,
 *      который реально присутствует в текущем viewport.
 *   2. По умолчанию встроенная аналитическая панель свёрнута
 *      (`aria-expanded="false"`, тело панели `catalog-row-analytics-body`
 *      не отображается).
 *   3. После клика панель раскрывается БЕЗ перезагрузки страницы
 *      (URL и pageId сохраняются), `aria-expanded="true"`, тело
 *      `catalog-row-analytics-body` видно.
 *   4. Раскрытая панель содержит данные именно по выбранному офферу:
 *      присутствует хотя бы один из контентных блоков
 *      (`catalog-row-price-trend`, `catalog-row-market-signals`,
 *      `catalog-row-news`) с непустым текстом.
 *   5. Повторный клик сворачивает панель.
 *
 * Контракт SPA-навигации проверяем через стабильный pageId,
 * который не должен пересоздаваться при простом раскрытии аккордеона.
 */
import { test, expect, type Page, type Locator } from "@playwright/test";

const seedAnonymous = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
    } catch {
      /* ignore */
    }
  });
};

const stampPageId = async (page: Page) => {
  await page.evaluate(() => {
    (window as unknown as { __yorsoPageId?: string }).__yorsoPageId = String(
      Date.now() + Math.random(),
    );
  });
};

const readPageId = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __yorsoPageId?: string }).__yorsoPageId,
  );

/**
 * Возвращает первый доступный триггер аналитики в карточке панели
 * закупок: для tablet/desktop — BarChart3-кнопку, для мобильного —
 * индикатор тренда. Тест умышленно не задаёт viewport, чтобы работать
 * на дефолтной конфигурации Playwright проекта.
 */
const findFirstAnalyticsTrigger = async (
  page: Page,
): Promise<{ trigger: Locator; kind: "row" | "trend" }> => {
  const rowToggle = page.getByTestId("catalog-row-analytics-toggle").first();
  if (await rowToggle.count()) {
    return { trigger: rowToggle, kind: "row" };
  }
  const trendToggle = page
    .getByTestId("catalog-row-trend-analytics-toggle")
    .first();
  return { trigger: trendToggle, kind: "trend" };
};

test.describe("/offers · аналитика в карточке панели закупок", () => {
  test("клик по «Аналитике» раскрывает встроенную панель с данными по офферу без перезагрузки", async ({
    page,
  }) => {
    await seedAnonymous(page);
    await page.goto("/offers", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await stampPageId(page);
    const initialPageId = await readPageId(page);
    const initialUrl = page.url();

    const { trigger } = await findFirstAnalyticsTrigger(page);
    await expect(trigger).toBeVisible();

    // По умолчанию панель свёрнута.
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await page.getByTestId("catalog-row-analytics-body").count()).toBe(
      0,
    );

    // Раскрываем панель.
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const body = page.getByTestId("catalog-row-analytics-body").first();
    await expect(body).toBeVisible();

    // Контент панели — данные именно по выбранному офферу: присутствует
    // хотя бы один контентный блок с непустым текстом.
    const trendBlock = body.getByTestId("catalog-row-price-trend");
    const signalsBlock = body.getByTestId("catalog-row-market-signals");
    const newsBlock = body.getByTestId("catalog-row-news");

    const counts = {
      trend: await trendBlock.count(),
      signals: await signalsBlock.count(),
      news: await newsBlock.count(),
    };
    expect(
      counts.trend + counts.signals + counts.news,
      "В развёрнутой аналитике должен быть хотя бы один блок офферного контента",
    ).toBeGreaterThan(0);

    const bodyText = (await body.innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(0);

    // Перезагрузки страницы не было: URL и pageId сохранены.
    expect(page.url()).toBe(initialUrl);
    expect(await readPageId(page)).toBe(initialPageId);

    // Повторный клик сворачивает панель.
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(body).toBeHidden();

    // Снова без reload.
    expect(page.url()).toBe(initialUrl);
    expect(await readPageId(page)).toBe(initialPageId);
  });
});
