/**
 * End-to-end проверка: пользователь меняет язык в реальном переключателе
 * `Header` и затем переходит между страницами **через клики по реальным
 * ссылкам интерфейса** (а не через программный `navigate`).
 *
 * Цепочка кликов:
 *   1.  /         — рендерится `Header` с переключателем языка.
 *                   navigator.language = en-US, localStorage пуст → автодетект en.
 *   2.  Клик по «🇷🇺 Русский» в Header → язык = ru, localStorage["yorso-lang"]="ru".
 *   3.  Клик по CTA «Register» в Header → переход на /register.
 *       Проверка: язык всё ещё ru, RegistrationLayout рендерит русский текст.
 *   4.  Клик по реальной ссылке «Sign in» в RegistrationLayout → /signin.
 *       Проверка: язык ru, SignIn рендерит русские заголовки.
 *   5.  Клик по «← Back» на SignIn → /.
 *       Клик по «View all offers» (Link to="/offers") в LiveOffers → /offers.
 *       Проверка: язык ru, Offers рендерит русский `offersPage_title`.
 *
 * На каждом шаге утверждается:
 *   - context lang === "ru"
 *   - localStorage["yorso-lang"] === "ru"
 *   - на странице есть локализованный русский текст и нет тех же ключей на en/es.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import RegisterChoose from "@/pages/register/RegisterChoose";
import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", { value: list ?? [primary], configurable: true });
};

const LangProbe = ({ onReady }: { onReady: (lang: Language) => void }) => {
  const { lang } = useLanguage();
  onReady(lang);
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (onLang: (l: Language) => void) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <LangProbe onReady={onLang} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<RegisterChoose />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/offers" element={<Offers />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

/**
 * Кликает по элементу, в котором есть данный текст. Для надёжности ищет
 * элемент `tag` (по умолчанию любой), у которого textContent.trim() === text
 * ИЛИ начинается с text (для случаев типа "Уже есть аккаунт? Войти", где
 * перевод реально совпадает только подстрокой). Бросает осмысленную ошибку,
 * если ничего не нашлось.
 */
const clickByText = (text: string, tag = "*") => {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(tag));
  const target = nodes.find((n) => {
    const t = (n.textContent ?? "").trim();
    if (!t) return false;
    if (t === text) return true;
    if (t.startsWith(text) && t.length - text.length < 40) return true;
    if (t.includes(text) && t.length < 80) return true;
    return false;
  });
  if (!target) throw new Error(`clickByText: no element matched "${text}"`);
  fireEvent.click(target);
  return target;
};

const otherLangs = (current: Language): Language[] =>
  (["en", "ru", "es"] as Language[]).filter((l) => l !== current);

const expectRuOnPage = (key: keyof typeof translations.ru) => {
  const ruText = translations.ru[key];
  const body = document.body.textContent ?? "";
  expect(body).toContain(ruText);
  for (const other of otherLangs("ru")) {
    const otherText = translations[other][key];
    if (otherText && otherText !== ruText) {
      expect(body).not.toContain(otherText);
    }
  }
};

describe("E2E: language switch on /register persists across click-driven navigation", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("switches lang to ru on / via Header, then click-navigates / → /register → /signin → / → /offers — ru is preserved", () => {
    let currentLang: Language = "en";
    renderApp((l) => (currentLang = l));

    // 1) Стартовый автодетект — en.
    expect(currentLang).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // 2) Открываем dropdown переключателя языка в Header и кликаем «Русский».
    //    В Header это <button> с "🇬🇧 EN" и шевроном; внутри dropdown — пункт "🇷🇺 Русский".
    act(() => {
      clickByText("EN", "button"); // открывает dropdown
    });
    act(() => {
      clickByText(translations.ru ? "Русский" : "Russian", "button");
    });
    expect(currentLang).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    // 3) Header CTA "Register free" → теперь по-русски (`nav_registerFree`).
    //    Кликаем по нему как по реальной ссылке.
    act(() => {
      clickByText(translations.ru.nav_registerFree, "button");
    });

    // На /register
    expect(currentLang).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    // RegisterChoose содержит переведённый подзаголовок reg_chooseSubtitle.
    expectRuOnPage("reg_chooseSubtitle");
    // И ссылка "Войти" из RegistrationLayout — на русском.
    const signInText = translations.ru.reg_signIn;
    expect(document.body.textContent ?? "").toContain(signInText);

    // 4) Клик по ссылке "Войти" в RegistrationLayout → /signin.
    act(() => {
      clickByText(signInText, "a");
    });

    expect(currentLang).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuOnPage("signin_title");

    // 5a) "← Назад" → /.
    act(() => {
      clickByText(translations.ru.signin_back, "button");
    });
    expect(currentLang).toBe("ru");

    // 5b) С главной идём на /offers через CTA "Смотреть все предложения" в LiveOffers.
    //    Используем реальный текст перевода `offers_viewAll`.
    act(() => {
      clickByText(translations.ru.offers_viewAll, "a");
    });

    expect(currentLang).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuOnPage("offersPage_title");
  });
});
