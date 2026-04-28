/**
 * /offers · видимость блока «Получите больше от каталога» (catalog_recovery_*).
 *
 * Контракт: нижний онбординг-блок с заголовком `catalog_recovery_title`
 * и кнопками `catalog_recovery_signup` / `catalog_recovery_signin`
 * показывается ТОЛЬКО незарегистрированным посетителям. При активной
 * buyer-сессии (isSignedIn=true) блок должен быть полностью скрыт —
 * на любой ширине экрана (desktop, tablet, mobile).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import Offers from "@/pages/Offers";
import { translations } from "@/i18n/translations";

const recoveryTitle = translations.en.catalog_recovery_title;
const recoverySignup = translations.en.catalog_recovery_signup;
const recoverySignin = translations.en.catalog_recovery_signin;

const setViewport = (width: number, height = 800) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  // jsdom matchMedia stub — пересобираем, чтобы min-width совпадал с шириной.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const m = /\(min-width:\s*(\d+)px\)/.exec(query);
      const max = /\(max-width:\s*(\d+)px\)/.exec(query);
      let matches = false;
      if (m) matches = width >= Number(m[1]);
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

const expectRecoveryBlock = (container: HTMLElement, present: boolean) => {
  const anchor = container.querySelector("#catalog-anchor-recovery");
  if (present) {
    expect(anchor, "ожидался блок #catalog-anchor-recovery").not.toBeNull();
    const scope = within(anchor as HTMLElement);
    expect(scope.getByText(recoveryTitle)).toBeInTheDocument();
    expect(scope.getByText(recoverySignup)).toBeInTheDocument();
    expect(scope.getByText(recoverySignin)).toBeInTheDocument();
  } else {
    expect(anchor, "блок #catalog-anchor-recovery должен быть скрыт").toBeNull();
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
      const { container } = renderOffers();
      expectRecoveryBlock(container, true);
    });

    it(`зарегистрированный пользователь НЕ видит recovery-блок · ${vp.name}`, () => {
      setViewport(vp.width);
      buyerSession.signIn({ identifier: "buyer@example.com", method: "email" });
      const { container } = renderOffers();
      expectRecoveryBlock(container, false);
    });
  }
});
