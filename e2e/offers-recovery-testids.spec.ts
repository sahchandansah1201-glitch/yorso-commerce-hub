/**
 * E2E · /offers · recovery-блок проверяется ТОЛЬКО через стабильные testid.
 *
 * Тест проверяет, что весь recovery-контракт можно удержать без привязки
 * к классам, тегам или строкам перевода:
 *   - корневой контейнер;
 *   - заголовок и описание;
 *   - обе CTA-кнопки и их href;
 *   - группа CTA как контейнер обеих ссылок.
 *
 * Любое изменение `CATALOG_RECOVERY_TEST_IDS` обязано быть зеркально
 * отражено и здесь — это защита от молчаливого drift'а селекторов.
 */
import { test, expect, type Page } from "@playwright/test";

// Дублируем константы, чтобы spec не зависел от runtime сборки src/.
// Источник правды — `src/components/catalog/catalog-recovery-testids.ts`;
// при изменении testid в коде эти строки нужно обновлять синхронно.
const TID = {
  card: "catalog-recovery-card",
  title: "catalog-recovery-title",
  body: "catalog-recovery-body",
  ctaGroup: "catalog-recovery-cta-group",
  ctaSignup: "catalog-recovery-cta-signup",
  ctaSignin: "catalog-recovery-cta-signin",
} as const;
const ANCHOR_ID = "catalog-anchor-recovery";

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

test.describe("/offers · recovery-блок адресуется через стабильные testid", () => {
  test("все ключевые узлы recovery-блока доступны по testid", async ({ page }) => {
    await seedAnonymous(page);
    await page.goto("/offers", { waitUntil: "domcontentloaded" });

    const card = page.getByTestId(TID.card);
    const anchor = page.locator(`#${ANCHOR_ID}`);
    const title = page.getByTestId(TID.title);
    const body = page.getByTestId(TID.body);
    const ctaGroup = page.getByTestId(TID.ctaGroup);
    const signup = page.getByTestId(TID.ctaSignup);
    const signin = page.getByTestId(TID.ctaSignin);

    // Контейнер и якорь — один и тот же узел.
    await expect(card).toBeVisible();
    await expect(anchor).toBeVisible();
    expect(await card.evaluate((el) => el.id)).toBe(ANCHOR_ID);

    // Текстовые узлы и группа CTA присутствуют ровно по одному разу.
    await expect(title).toBeVisible();
    await expect(body).toBeVisible();
    await expect(ctaGroup).toBeVisible();
    await expect(title).toHaveCount(1);
    await expect(body).toHaveCount(1);
    await expect(ctaGroup).toHaveCount(1);

    // CTA-ссылки ведут в правильные роуты — без проверки текста кнопки.
    await expect(signup).toBeVisible();
    await expect(signin).toBeVisible();
    await expect(signup).toHaveAttribute("href", "/register");
    await expect(signin).toHaveAttribute("href", "/signin");

    // CTA вложены в группу — тест на структурный контракт без классов.
    const signupInGroup = ctaGroup.getByTestId(TID.ctaSignup);
    const signinInGroup = ctaGroup.getByTestId(TID.ctaSignin);
    await expect(signupInGroup).toHaveCount(1);
    await expect(signinInGroup).toHaveCount(1);
  });
});
