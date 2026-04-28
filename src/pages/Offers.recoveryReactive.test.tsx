/**
 * Интеграционный тест: переход isSignedIn=false → true БЕЗ перезагрузки.
 *
 * Контракт: при вызове buyerSession.signIn() во время живой сессии
 * страницы /offers — recovery-блок (`#catalog-anchor-recovery` /
 * `data-testid="catalog-recovery-card"`) должен исчезнуть из DOM
 * без размонтирования и повторного render() страницы.
 *
 * BuyerSessionProvider подписан на buyerSession.subscribe, который
 * публикует обновления синхронно — поэтому достаточно обернуть
 * мутацию в act() и проверить DOM после неё.
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

describe("/offers · recovery-блок реактивно скрывается при signIn без перезагрузки", () => {
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

  it("анонимный → signIn() → блок исчезает (без unmount/rerender)", () => {
    const result = renderOffers();
    const { queryByTestId, container } = result;

    // 1) Стартовое состояние — анонимный посетитель видит блок.
    expect(queryByTestId(RECOVERY_TESTID)).not.toBeNull();
    expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).not.toBeNull();

    // 2) Логинимся, не размонтируя дерево. BuyerSessionProvider
    //    подписан на buyerSession.subscribe → useAccessLevel → CatalogRecoveryGate.
    act(() => {
      buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    });

    // 3) Блок должен пропасть синхронно, без повторного render().
    expect(queryByTestId(RECOVERY_TESTID)).toBeNull();
    expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).toBeNull();
  });

  it("signIn → signOut возвращает блок обратно (без unmount/rerender)", () => {
    const { queryByTestId, container } = renderOffers();

    act(() => {
      buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    });
    expect(queryByTestId(RECOVERY_TESTID)).toBeNull();

    act(() => {
      buyerSession.signOut();
    });
    expect(queryByTestId(RECOVERY_TESTID)).not.toBeNull();
    expect(container.querySelector(`#${RECOVERY_ANCHOR_ID}`)).not.toBeNull();
  });
});
