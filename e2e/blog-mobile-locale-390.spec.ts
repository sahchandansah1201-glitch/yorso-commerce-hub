/**
 * E2E · /blog · мобильное разрешение 390px на RU и ES.
 *
 * Контракт:
 *  1. Нет горизонтального переполнения (scrollWidth === clientWidth).
 *  2. На RU/ES в карточках product_update нет английских teaser-полей:
 *     - enum значения "IMPROVED" / "Improved" / "PRICE ACCESS" / "Price Access"
 *       / "Supplier Profiles"
 *     - английские заголовки "What changed" / "Who benefits"
 *  3. Скриншот сохраняется как артефакт прогона.
 */
import { test, expect } from "@playwright/test";

const FORBIDDEN_ENUMS = [
  "IMPROVED",
  "Improved",
  "PRICE ACCESS",
  "Price Access",
  "Supplier Profiles",
  "What changed",
  "Who benefits",
];

const setLangAndReload = async (
  page: import("@playwright/test").Page,
  lang: "ru" | "es",
) => {
  await page.goto("/");
  await page.evaluate((l) => {
    localStorage.setItem("yorso-lang", l);
  }, lang);
  await page.goto("/blog");
  await page.waitForSelector('[data-testid="blog-list"]', { timeout: 15_000 });
};

const expectNoHorizontalOverflow = async (
  page: import("@playwright/test").Page,
) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
};

const expectNoEnglishTeasers = async (
  page: import("@playwright/test").Page,
) => {
  const list = page.locator('[data-testid="blog-list"]');
  for (const phrase of FORBIDDEN_ENUMS) {
    await expect(
      list.getByText(phrase, { exact: true }),
      `English teaser leak: "${phrase}"`,
    ).toHaveCount(0);
  }
};

test.describe("/blog · mobile 390px · locale teaser hardening", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const lang of ["ru", "es"] as const) {
    test(`${lang.toUpperCase()}: no horizontal overflow + no English product update teasers`, async ({
      page,
    }, testInfo) => {
      await setLangAndReload(page, lang);
      await expectNoHorizontalOverflow(page);
      await expectNoEnglishTeasers(page);

      const shot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`blog-${lang}-390.png`, {
        body: shot,
        contentType: "image/png",
      });
    });
  }
});
