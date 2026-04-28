/**
 * E2E · /offers · recovery-блок «Получите больше от каталога».
 *
 * Контракт:
 *   1) Анонимный посетитель ВИДИТ блок (`#catalog-anchor-recovery` /
 *      `data-testid="catalog-recovery-card"`).
 *   2) После signIn() в той же сессии браузера блок исчезает БЕЗ reload.
 *   3) После signOut() блок снова появляется БЕЗ reload.
 *
 * signIn/signOut вызываются через dynamic import модуля
 * `@/lib/buyer-session`, который Vite dev-server раздаёт по адресу
 * `/src/lib/buyer-session.ts`. Это даёт реактивный сценарий
 * (через подписчиков), а не ручную мутацию sessionStorage.
 */
import { test, expect, type Page } from "@playwright/test";

const RECOVERY_TESTID = "catalog-recovery-card";
const RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";

const gotoOffersAsAnonymous = async (page: Page) => {
  // Гарантируем чистое анонимное состояние перед загрузкой страницы.
  await page.addInitScript(() => {
    try {
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/offers", { waitUntil: "domcontentloaded" });
};

const callSession = async (page: Page, action: "signIn" | "signOut") => {
  // Вызываем модуль напрямую — это триггерит подписчиков и обновляет UI без reload.
  await page.evaluate(async (which) => {
    const mod = await import("/src/lib/buyer-session.ts");
    if (which === "signIn") {
      mod.buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    } else {
      mod.buyerSession.signOut();
    }
  }, action);
};

test.describe("/offers · recovery-блок переключается без перезагрузки", () => {
  test("анонимный → signIn скрывает блок, signOut возвращает", async ({ page }) => {
    await gotoOffersAsAnonymous(page);

    const recovery = page.getByTestId(RECOVERY_TESTID);
    const anchor = page.locator(`#${RECOVERY_ANCHOR_ID}`);

    // 1) Анонимный посетитель видит блок.
    await expect(recovery).toBeVisible();
    await expect(anchor).toBeVisible();

    // Зафиксируем URL, чтобы убедиться: reload не происходил.
    const urlBefore = page.url();

    // 2) signIn() в той же сессии — блок должен исчезнуть.
    await callSession(page, "signIn");
    await expect(recovery).toHaveCount(0);
    await expect(anchor).toHaveCount(0);
    expect(page.url()).toBe(urlBefore);

    // 3) signOut() — блок снова виден.
    await callSession(page, "signOut");
    await expect(recovery).toBeVisible();
    await expect(anchor).toBeVisible();
    expect(page.url()).toBe(urlBefore);
  });

  test("сессия установлена ДО загрузки → блок не появляется ни на один кадр", async ({ page }) => {
    // Заранее заливаем валидную buyer-сессию в sessionStorage перед navigation.
    await page.addInitScript(() => {
      const session = {
        id: "b_e2e_preexisting",
        identifier: "buyer@example.com",
        method: "email" as const,
        signedInAt: new Date().toISOString(),
        displayName: "buyer",
      };
      try {
        window.sessionStorage.setItem("yorso_buyer_session", JSON.stringify(session));
      } catch {
        /* ignore */
      }
    });

    await page.goto("/offers", { waitUntil: "domcontentloaded" });

    // Блок не должен появиться ни сейчас, ни после networkidle.
    await expect(page.getByTestId(RECOVERY_TESTID)).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId(RECOVERY_TESTID)).toHaveCount(0);
    await expect(page.locator(`#${RECOVERY_ANCHOR_ID}`)).toHaveCount(0);
  });
});
