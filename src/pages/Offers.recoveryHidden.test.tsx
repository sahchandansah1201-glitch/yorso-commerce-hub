/**
 * /offers · видимость блока «Получите больше от каталога» (catalog_recovery_*).
 *
 * Контракт: нижний онбординг-блок — `<CatalogRecoveryCard />` с
 * якорем `#catalog-anchor-recovery` и `data-testid="catalog-recovery-card"` —
 * показывается ТОЛЬКО незарегистрированным посетителям. При активной
 * buyer-сессии (isSignedIn=true) блок должен быть полностью скрыт —
 * на любой ширине экрана (desktop, tablet, mobile).
 *
 * Тест намеренно проверяет наличие/отсутствие контейнера по testid и id,
 * а НЕ по строкам перевода — иначе любая косметическая правка копирайта
 * ломала бы инвариант видимости.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import Offers from "@/pages/Offers";

const RECOVERY_TESTID = "catalog-recovery-card";
const RECOVERY_ANCHOR_ID = "catalog-anchor-recovery";

const setViewport = (width: number, height = 800) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  // jsdom matchMedia stub — пересобираем, чтобы min-/max-width совпадал с шириной.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const min = /\(min-width:\s*(\d+)px\)/.exec(query);
      const max = /\(max-width:\s*(\d+)px\)/.exec(query);
      let matches = false;
      if (min) matches = width >= Number(min[1]);
      else if (max) matches = width <= Number(max[1]);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    },
  });
  window.dispatchEvent(new Event("resize"));
};

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

const expectRecoveryBlock = (
  result: ReturnType<typeof renderOffers>,
  present: boolean,
) => {
  const byTestId = result.queryByTestId(RECOVERY_TESTID);
  const byAnchor = result.container.querySelector(`#${RECOVERY_ANCHOR_ID}`);

  if (present) {
    expect(byTestId, `ожидался data-testid="${RECOVERY_TESTID}"`).not.toBeNull();
    expect(byAnchor, `ожидался якорь #${RECOVERY_ANCHOR_ID}`).not.toBeNull();
    // Контейнер testid должен быть тем же узлом, что и якорь —
    // защита от рассинхрона между ссылкой TrustProofStrip и реальным DOM.
    expect(byTestId).toBe(byAnchor);
  } else {
    expect(byTestId, `data-testid="${RECOVERY_TESTID}" должен быть скрыт`).toBeNull();
    expect(byAnchor, `якорь #${RECOVERY_ANCHOR_ID} должен быть скрыт`).toBeNull();
  }
};

const VIEWPORTS: Array<{ name: string; width: number }> = [
  { name: "mobile 375", width: 375 },
  { name: "tablet 768", width: 768 },
  { name: "desktop 1280", width: 1280 },
  { name: "desktop 1920", width: 1920 },
];

describe("/offers · catalog_recovery_* скрыт для зарегистрированных пользователей", () => {
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

  for (const vp of VIEWPORTS) {
    it(`анонимный посетитель ВИДИТ recovery-блок · ${vp.name}`, () => {
      setViewport(vp.width);
      const result = renderOffers();
      expectRecoveryBlock(result, true);
    });

    it(`зарегистрированный пользователь НЕ видит recovery-блок · ${vp.name}`, () => {
      setViewport(vp.width);
      buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
      const result = renderOffers();
      expectRecoveryBlock(result, false);
    });
  }

  it("после signOut recovery-блок снова появляется (mobile 375)", () => {
    setViewport(375);
    buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
    const result = renderOffers();
    expectRecoveryBlock(result, false);

    buyerSession.signOut();
    // Перерендер с теми же провайдерами — buyerSession публикует событие,
    // на которое подписан useAccessLevel, поэтому повторный render «с нуля»
    // даёт честную проверку без зависимости от внутреннего ребиндинга.
    cleanup();
    const next = renderOffers();
    expectRecoveryBlock(next, true);
  });
});
