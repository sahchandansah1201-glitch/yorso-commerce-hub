/**
 * E2E · /offers · anti-flicker recovery-блока в реальном Chromium.
 *
 * Контракт:
 *   Между моментом смены состояния `isSignedIn=false → true` и
 *   завершением всех асинхронных эффектов страницы /offers
 *   recovery-блок (`#catalog-anchor-recovery` /
 *   `data-testid="catalog-recovery-card"`) НЕ должен попадать в DOM
 *   ни на один кадр.
 *
 * Реализация:
 *   В странице ставится MutationObserver на document.body ДО
 *   вызова signIn(). Все последующие добавления узлов с recovery-id
 *   копятся в `window.__recoveryFlickerSightings`. После signIn ждём
 *   networkidle + дополнительный таймер и проверяем, что счётчик = 0.
 *
 *   Контрольный сценарий (смоук) гарантирует, что observer вообще
 *   умеет ловить вставки — иначе главный assert был бы пустым.
 */
import { test, expect, type Page } from "@playwright/test";

const RECOVERY_TESTID = "catalog-recovery-card";
const RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";
const SESSION_KEY = "yorso_buyer_session";

declare global {
  interface Window {
    __recoveryFlickerSightings?: number;
    __recoveryFlickerObserver?: MutationObserver;
  }
}

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

const installFlickerObserver = async (page: Page) => {
  await page.evaluate(
    ({ testId, anchorId }) => {
      window.__recoveryFlickerSightings = 0;
      const isRecoveryNode = (node: Node): boolean => {
        if (!(node instanceof HTMLElement)) return false;
        if (node.getAttribute?.("data-testid") === testId) return true;
        if (node.id === anchorId) return true;
        return Boolean(
          node.querySelector?.(`[data-testid="${testId}"], #${anchorId}`),
        );
      };
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((n) => {
            if (isRecoveryNode(n)) {
              window.__recoveryFlickerSightings =
                (window.__recoveryFlickerSightings ?? 0) + 1;
            }
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      window.__recoveryFlickerObserver = observer;
    },
    { testId: RECOVERY_TESTID, anchorId: RECOVERY_ANCHOR_ID },
  );
};

const readSightings = (page: Page) =>
  page.evaluate(() => window.__recoveryFlickerSightings ?? 0);

const stopFlickerObserver = async (page: Page) => {
  await page.evaluate(() => {
    window.__recoveryFlickerObserver?.disconnect();
    delete window.__recoveryFlickerObserver;
  });
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

test.describe("/offers · anti-flicker recovery-блока (реальный Chromium)", () => {
  test("после signIn посреди async-загрузки блок ни разу не появляется в DOM", async ({
    page,
  }) => {
    await seedAnonymous(page);
    await page.goto("/offers", { waitUntil: "domcontentloaded" });

    const recovery = page.getByTestId(RECOVERY_TESTID);
    const anchor = page.locator(`#${RECOVERY_ANCHOR_ID}`);

    // Дождёмся, что блок реально присутствует в DOM (анонимное состояние).
    await expect(recovery).toBeVisible();

    // Ставим observer ДО signIn — фиксируем только пост-signIn вставки.
    await installFlickerObserver(page);

    // Сбрасываем счётчик ровно перед signIn, чтобы не учитывать
    // возможные initial-вставки (их и не должно быть, но честнее).
    await page.evaluate(() => {
      window.__recoveryFlickerSightings = 0;
    });

    // signIn посреди жизни страницы — без reload.
    await callSession(page, "signIn");

    // Ждём, пока завершатся все async-цепочки: микрозадачи, networkidle,
    // дополнительный таймер на ловлю «поздних» эффектов.
    await expect(recovery).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Финальные ассерты: блока нет И observer не зафиксировал ни одной
    // вставки recovery-узла после момента signIn.
    await expect(recovery).toHaveCount(0);
    await expect(anchor).toHaveCount(0);

    const sightings = await readSightings(page);
    expect(
      sightings,
      `recovery-блок мигнул ${sightings} раз между signIn и завершением загрузки — flicker-регресс`,
    ).toBe(0);

    await stopFlickerObserver(page);
  });

  test("контроль: observer корректно ловит вставку при signOut (анти-ложный assert)", async ({
    page,
  }) => {
    // Стартуем из авторизованного состояния, где блока нет.
    await page.addInitScript(
      ([key]) => {
        const session = {
          id: "b_e2e_flicker_control",
          identifier: "buyer@example.com",
          method: "email" as const,
          signedInAt: new Date().toISOString(),
          displayName: "buyer",
        };
        try {
          window.sessionStorage.setItem(key, JSON.stringify(session));
        } catch {
          /* ignore */
        }
      },
      [SESSION_KEY],
    );

    await page.goto("/offers", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId(RECOVERY_TESTID)).toHaveCount(0);

    await installFlickerObserver(page);
    await page.evaluate(() => {
      window.__recoveryFlickerSightings = 0;
    });

    // signOut обязан вернуть блок — observer должен это увидеть.
    await callSession(page, "signOut");
    await expect(page.getByTestId(RECOVERY_TESTID)).toBeVisible();

    const sightings = await readSightings(page);
    expect(
      sightings,
      "observer не зафиксировал вставку — главный anti-flicker тест был бы ложно-зелёным",
    ).toBeGreaterThan(0);

    await stopFlickerObserver(page);
  });
});
