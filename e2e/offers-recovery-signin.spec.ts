/**
 * E2E · /offers · sign-in скрывает recovery-блок без перезагрузки.
 *
 * Контракт:
 *   1) Открываем /offers анонимом — recovery-блок
 *      (`#catalog-anchor-recovery` / `data-testid="catalog-recovery-card"`)
 *      виден.
 *   2) Выполняем `buyerSession.signIn()` через dynamic import — это
 *      триггерит подписчиков React-контекста, без перезагрузки страницы.
 *   3) Recovery-блок исчезает из DOM.
 *   4) URL и pathname НЕ изменились, событий `load` страницы больше
 *      не было — то есть полноценного reload или редиректа не произошло.
 */
import { test, expect, type Page } from "@playwright/test";

const RECOVERY_TESTID = "catalog-recovery-card";
const RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";
const SESSION_KEY = "yorso_buyer_session";

const seedAnonymous = async (page: Page) => {
  await page.addInitScript(
    ([key]) => {
      try {
        window.sessionStorage.removeItem(key);
        window.sessionStorage.removeItem("yorso_buyer_qualification");
        window.sessionStorage.removeItem("yorso_buyer_qualified");
      } catch {
        /* ignore */
      }
    },
    [SESSION_KEY],
  );
};

const callSignIn = async (page: Page) => {
  await page.evaluate(async () => {
    const mod = await import("/src/lib/buyer-session.ts");
    mod.buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
  });
};

test.describe("/offers · sign-in скрывает recovery-блок без reload", () => {
  test("анонимный → signIn → блок скрыт, URL и счётчик load не меняются", async ({ page }) => {
    await seedAnonymous(page);

    let loadCount = 0;
    page.on("load", () => {
      loadCount += 1;
    });

    await page.goto("/offers", { waitUntil: "domcontentloaded" });

    const recovery = page.getByTestId(RECOVERY_TESTID);
    const anchor = page.locator(`#${RECOVERY_ANCHOR_ID}`);

    // 1) Анонимный посетитель видит блок.
    await expect(recovery).toBeVisible();
    await expect(anchor).toBeVisible();

    const urlBefore = page.url();
    const pathBefore = new URL(urlBefore).pathname;
    const loadsBefore = loadCount;

    // 2) signIn() в живой сессии страницы.
    await callSignIn(page);

    // 3) Блок исчезает реактивно.
    await expect(recovery).toHaveCount(0);
    await expect(anchor).toHaveCount(0);

    // 4) Без reload: URL/pathname не изменились, новых событий load не было.
    expect(page.url()).toBe(urlBefore);
    expect(new URL(page.url()).pathname).toBe(pathBefore);
    expect(loadCount).toBe(loadsBefore);

    // Дополнительная защита: после короткого ожидания блок так и не вернулся
    // (ловит регрессии с поздними async-эффектами, переинициализирующими стейт).
    await page.waitForTimeout(300);
    await expect(recovery).toHaveCount(0);
    await expect(anchor).toHaveCount(0);
  });
});
