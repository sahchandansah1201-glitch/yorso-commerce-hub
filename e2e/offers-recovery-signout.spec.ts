/**
 * E2E · /offers · sign-out возвращает recovery-блок без перезагрузки.
 *
 * Контракт:
 *   1) Открываем /offers с заранее установленной buyer-сессией —
 *      recovery-блок (`#catalog-anchor-recovery` /
 *      `data-testid="catalog-recovery-card"`) НЕ виден.
 *   2) Выполняем `buyerSession.signOut()` через dynamic import
 *      (это триггерит подписчиков React-контекста, без перезагрузки).
 *   3) Recovery-блок появляется и виден на экране.
 *   4) URL и pathname НЕ изменились — то есть полноценного reload
 *      или редиректа не было.
 *   5) Повторный signIn() снова скрывает блок — реактивный круг замкнут.
 */
import { test, expect, type Page } from "@playwright/test";

const RECOVERY_TESTID = "catalog-recovery-card";
const RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";
const SESSION_KEY = "yorso_buyer_session";

const seedSignedInSession = async (page: Page) => {
  await page.addInitScript(
    ([key]) => {
      const session = {
        id: "b_e2e_signout_scenario",
        identifier: "buyer@example.com",
        method: "email" as const,
        signedInAt: new Date().toISOString(),
        displayName: "buyer",
      };
      try {
        window.sessionStorage.setItem(key, JSON.stringify(session));
        window.sessionStorage.removeItem("yorso_buyer_qualification");
        window.sessionStorage.removeItem("yorso_buyer_qualified");
      } catch {
        /* ignore */
      }
    },
    [SESSION_KEY],
  );
};

const callSession = async (page: Page, action: "signIn" | "signOut") => {
  await page.evaluate(async (which) => {
    const mod = await import("/src/lib/buyer-session.ts");
    if (which === "signIn") {
      mod.buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    } else {
      mod.buyerSession.signOut();
    }
  }, action);
};

test.describe("/offers · sign-out возвращает recovery-блок без reload", () => {
  test("авторизованный → signOut → блок появляется, URL не меняется, повторный signIn снова скрывает", async ({
    page,
  }) => {
    await seedSignedInSession(page);

    // Считаем количество загрузок документа — для проверки «без reload».
    let loadCount = 0;
    page.on("load", () => {
      loadCount += 1;
    });

    await page.goto("/offers", { waitUntil: "domcontentloaded" });

    const recovery = page.getByTestId(RECOVERY_TESTID);
    const anchor = page.locator(`#${RECOVERY_ANCHOR_ID}`);

    // 1) Авторизованный пользователь — блока нет.
    await expect(recovery).toHaveCount(0);
    await expect(anchor).toHaveCount(0);

    const urlBeforeSignOut = page.url();
    const pathBeforeSignOut = new URL(urlBeforeSignOut).pathname;
    const loadsBeforeSignOut = loadCount;

    // 2) signOut() в живой сессии страницы.
    await callSession(page, "signOut");

    // 3) Блок реактивно появляется и виден.
    await expect(recovery).toBeVisible();
    await expect(anchor).toBeVisible();

    // 4) URL и pathname не изменились, новых событий load не было.
    expect(page.url()).toBe(urlBeforeSignOut);
    expect(new URL(page.url()).pathname).toBe(pathBeforeSignOut);
    expect(loadCount).toBe(loadsBeforeSignOut);

    // 5) Реактивный круг замкнут: signIn снова скрывает блок без reload.
    await callSession(page, "signIn");
    await expect(recovery).toHaveCount(0);
    await expect(anchor).toHaveCount(0);
    expect(page.url()).toBe(urlBeforeSignOut);
    expect(loadCount).toBe(loadsBeforeSignOut);
  });
});
