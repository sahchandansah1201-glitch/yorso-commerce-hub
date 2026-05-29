/**
 * После переключения языка на ru пользователь успешно проходит sign-in
 * на /signin (мок-API), и приложение редиректит его на пост-логин страницу.
 *
 * В этом проекте отдельной /profile нет — после успешного входа
 * `SignIn.handleEmailSubmit` делает `navigate("/offers")`, поэтому
 * /offers выступает «эквивалентом аккаунт-страницы» по задаче пользователя.
 *
 * Утверждается, что:
 *   1. До submit: lang = ru (после `setLang("ru")`), localStorage["yorso-lang"] = "ru".
 *   2. Submit с валидными мок-кредами (taken@yorso.test ничего не значит для
 *      signIn — нужен любой email + пароль "Password1") вызывает редирект
 *      на /offers.
 *   3. После редиректа:
 *        - lang всё ещё "ru"
 *        - localStorage["yorso-lang"] === "ru"
 *        - страница /offers рендерит русский заголовок (`catalog_pageTitle`)
 *          и НЕ рендерит en/es-варианты этого ключа
 *        - locked-buyer contract stays localized: exact prices remain locked
 *          and the visible price/unit copy is Russian.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { translations, type Language } from "@/i18n/translations";

import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";

const STORAGE_KEY = "yorso-lang";

const norm = (s: string) => s.replace(/\u00a0|\u202f/g, " ");

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", { value: list ?? [primary], configurable: true });
};

const ExposeSetter = ({ onReady }: { onReady: (s: (l: Language) => void) => void }) => {
  const { setLang } = useLanguage();
  onReady(setLang);
  return null;
};

const LangProbe = () => {
  const { lang } = useLanguage();
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (onReady: (s: (l: Language) => void) => void) =>
  render(
    <MemoryRouter initialEntries={["/signin?redirect=/offers"]}>
      <LanguageProvider>
        <ExposeSetter onReady={onReady} />
        <LangProbe />
        <TooltipProvider>
          <BuyerSessionProvider>
            <RegistrationProvider>
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/offers" element={<Offers />} />
              </Routes>
              <Sonner />
            </RegistrationProvider>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const otherLangs = (current: Language): Language[] =>
  (["en", "ru", "es"] as Language[]).filter((l) => l !== current);

describe("ru locale survives sign-in and post-login navigation", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    vi.stubEnv("VITE_YORSO_API_URL", "");
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    vi.unstubAllEnvs();
  });

  it("setLang('ru') → submit valid creds on /signin → redirect to /offers, lang stays ru", async () => {
    let setLang!: (l: Language) => void;
    renderApp((s) => (setLang = s));

    // 1) Стартовый автодетект — en. Переключаем на ru.
    act(() => setLang("ru"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    // На /signin метка кнопки и заголовок уже на русском.
    expect(document.body.textContent ?? "").toContain(translations.ru.signin_title);

    // 2) Заполняем форму валидными мок-кредами. По api-contracts:
    //    `signIn` принимает любой email; пароль должен быть ровно "Password1".
    const emailInput = document.querySelector<HTMLInputElement>('input[type="email"]');
    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]');
    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    fireEvent.change(emailInput!, { target: { value: "buyer@yorso.test" } });
    fireEvent.change(passwordInput!, { target: { value: "Password1" } });

    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    // 3) Дожидаемся редиректа на /offers — заголовок каталога ещё на русском.
    await waitFor(
      () => {
        expect(document.body.textContent ?? "").toContain(translations.ru.catalog_pageTitle);
      },
      { timeout: 5000 },
    );

    // 4) Локаль НЕ сбросилась.
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    // 5) En/Es-варианты ключа отсутствуют на странице.
    const body = document.body.textContent ?? "";
    for (const other of otherLangs("ru")) {
      const otherTitle = translations[other].catalog_pageTitle;
      if (otherTitle && otherTitle !== translations.ru.catalog_pageTitle) {
        expect(body).not.toContain(otherTitle);
      }
    }

    // 6) После sign-in buyer ещё registered_locked: точная цена скрыта,
    //    но locked-price copy и единица измерения локализованы на русский.
    const prices = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="catalog-row-price"]'),
    )
      .map((n) => norm(n.textContent ?? ""))
      .filter(Boolean);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices.some((price) => price.includes("Точная цена скрыта"))).toBe(true);
    expect(prices.join(" ")).not.toContain("$8.50");

    // 7) Локализованная единица измерения тоже на русском.
    const unit = norm(
      document.querySelector('[data-testid="catalog-row-price-block"] button[aria-label]')?.textContent ?? "",
    );
    expect(unit).toBe(translations.ru.offers_priceUnit_perKg);
  });

  it("Failed sign-in does NOT navigate, lang stays ru on /signin", async () => {
    let setLang!: (l: Language) => void;
    renderApp((s) => (setLang = s));

    act(() => setLang("ru"));

    const emailInput = document.querySelector<HTMLInputElement>('input[type="email"]');
    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]');
    fireEvent.change(emailInput!, { target: { value: "buyer@yorso.test" } });
    // Неверный пароль → INVALID_CREDENTIALS, без редиректа.
    fireEvent.change(passwordInput!, { target: { value: "WrongPass123" } });
    fireEvent.submit(document.querySelector("form")!);

    // Дожидаемся появления toast c русским заголовком (`signin_couldNotSignIn`
    // или эквивалент). Достаточно убедиться, что мы НЕ ушли на /offers и lang ru.
    await waitFor(
      () => {
        // Должны остаться на /signin: заголовок SignIn виден.
        expect(document.body.textContent ?? "").toContain(translations.ru.signin_title);
      },
      { timeout: 5000 },
    );

    // /offers НЕ загрузился.
    expect(document.body.textContent ?? "").not.toContain(translations.ru.catalog_pageTitle);
    // Локаль ru.
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
  });
});
