/**
 * Anti-flicker при ПЕРЕХОДЕ isSignedIn=false → true посреди асинхронной
 * загрузки страницы /offers.
 *
 * Сценарий, который ловит этот тест:
 *   - анонимный посетитель открыл /offers, recovery-блок виден;
 *   - параллельно идут асинхронные эффекты (analytics, useEffect-цепочки,
 *     отложенные setState из подписок);
 *   - в этот момент происходит signIn() — recovery-блок ОБЯЗАН исчезнуть
 *     синхронно и больше НЕ должен повторно появиться ни на один кадр,
 *     даже если поздние async-эффекты дотриггерят ре-рендер.
 *
 * Любая регрессия, которая на миг возвращает блок (например, локальный
 * стейт в дочернем компоненте, который ре-инициализируется по async-эффекту
 * без чтения свежего isSignedIn), будет поймана MutationObserver-ом.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import Offers from "@/pages/Offers";

const RECOVERY_TESTID = "catalog-recovery-card";
const RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";

const renderOffers = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <MemoryRouter initialEntries={["/offers"]}>
              <Offers />
            </MemoryRouter>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
};

const isRecoveryNode = (node: Node): boolean => {
  if (!(node instanceof HTMLElement)) return false;
  if (node.getAttribute?.("data-testid") === RECOVERY_TESTID) return true;
  if (node.id === RECOVERY_ANCHOR_ID) return true;
  if (
    node.querySelector?.(
      `[data-testid="${RECOVERY_TESTID}"], #${RECOVERY_ANCHOR_ID}`,
    )
  ) {
    return true;
  }
  return false;
};

const drainAsync = async () => {
  // Вычерпываем микрозадачи + один таймерный тик + RAF-эквивалент,
  // чтобы поймать flicker от любых отложенных эффектов.
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 50));
};

describe("/offers · нет flicker при переходе isSignedIn=false → true посреди загрузки", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    buyerSession.__resetForTests();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    buyerSession.__resetForTests();
  });

  it("после signIn() во время async-загрузки recovery-блок не возвращается ни на один кадр", async () => {
    // 1) Стартуем анонимом — блок виден.
    const { queryByTestId, container } = renderOffers();
    expect(queryByTestId(RECOVERY_TESTID)).not.toBeNull();

    // 2) Сразу подписываемся на DOM, чтобы зафиксировать ЛЮБУЮ повторную
    //    вставку recovery-узла после момента signIn.
    const sightingsAfterSignIn: Array<{ at: number }> = [];
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (isRecoveryNode(n)) sightingsAfterSignIn.push({ at: Date.now() });
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    try {
      // 3) Логинимся ПОСРЕДИ lifecycle — до того как все async-эффекты
      //    страницы успели отстреляться.
      act(() => {
        buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
      });

      // Сразу же — блока нет.
      expect(queryByTestId(RECOVERY_TESTID)).toBeNull();
      expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).toBeNull();

      // 4) Прокручиваем все отложенные эффекты, подписки и таймеры.
      await act(async () => {
        await drainAsync();
      });

      // По итогу: блока в DOM нет И MutationObserver не зафиксировал
      // ни одной повторной вставки после signIn.
      expect(queryByTestId(RECOVERY_TESTID)).toBeNull();
      expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).toBeNull();
      expect(
        sightingsAfterSignIn,
        `recovery-блок мигнул ${sightingsAfterSignIn.length} раз после signIn — flicker-регресс`,
      ).toHaveLength(0);
    } finally {
      observer.disconnect();
    }
  });

  it("несколько подряд signIn/signOut/signIn — без flicker в финальном состоянии", async () => {
    const { queryByTestId, container } = renderOffers();
    expect(queryByTestId(RECOVERY_TESTID)).not.toBeNull();

    const sightings: Array<"in" | "out"> = [];
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (isRecoveryNode(n)) sightings.push("in");
        });
        m.removedNodes.forEach((n) => {
          if (isRecoveryNode(n)) sightings.push("out");
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    try {
      // Финальное состояние — авторизован. Любое промежуточное «in» допустимо
      // (sign in → out → in возвращает блок ненадолго), но финал должен
      // строго не показывать блок.
      act(() => buyerSession.signIn({ identifier: "a@b.c", method: "email" }));
      await act(async () => { await drainAsync(); });

      act(() => buyerSession.signOut());
      await act(async () => { await drainAsync(); });

      act(() => buyerSession.signIn({ identifier: "a@b.c", method: "email" }));
      await act(async () => { await drainAsync(); });

      expect(queryByTestId(RECOVERY_TESTID)).toBeNull();
      expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).toBeNull();

      // Контроль валидности теста: observer должен был увидеть и «in»,
      // и «out» — иначе подписка не работает и assert выше пустой.
      expect(sightings).toContain("in");
      expect(sightings).toContain("out");
    } finally {
      observer.disconnect();
    }
  });
});
