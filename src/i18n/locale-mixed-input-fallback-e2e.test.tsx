/**
 * E2E-проверка фолбэка языка при «грязном» вводе.
 *
 * Сценарии:
 *  1. navigator.language = "ru-RU", localStorage пуст → автодетект ru,
 *     UI на главной/в Header/в каталоге рендерится по-русски, ни один
 *     ключевой EN/ES-перевод тех же ключей не утекает в DOM.
 *  2. navigator.language = "RFQ" (короткий латинский «акроним», часто
 *     встречается у B2B-пользователей с настроенной деловой локалью) →
 *     `detectLanguage` обязан удержать ru как preferred-фолбэк, и UI
 *     остаётся русским.
 *  3. navigator.language = "" / "  " / "123" (пустой/мусорный сигнал) →
 *     UI остаётся русским (правило проекта: подсказки по умолчанию RU).
 *  4. navigator.language = "ru-RU,en-US" со смешанной строкой
 *     («RFQ по треске MSC») как saved-черновик не должен ломать ru.
 *
 * Каждый кейс монтирует реальное дерево (LanguageProvider + Header +
 * страница каталога), читает текущий lang из контекста и сверяет, что
 * на странице есть русский перевод ключевых строк и нет конкурирующих
 * EN/ES-вариантов тех же ключей.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";
import { detectLanguage, resolveHintLanguage } from "@/i18n/detectLanguage";

import Index from "@/pages/Index";
import Offers from "@/pages/Offers";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? (primary ? [primary] : []),
    configurable: true,
  });
};

const LangProbe = ({ onReady }: { onReady: (lang: Language) => void }) => {
  const { lang } = useLanguage();
  onReady(lang);
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (path: string, onLang: (l: Language) => void) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <LangProbe onReady={onLang} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/offers" element={<Offers />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const otherLangs = (current: Language): Language[] =>
  (["en", "ru", "es"] as Language[]).filter((l) => l !== current);

const expectRuKeyInDom = (key: keyof typeof translations.ru) => {
  const ruText = translations.ru[key];
  const body = document.body.textContent ?? "";
  expect(body, `ожидался RU перевод ключа ${String(key)} в DOM`).toContain(ruText);
  for (const other of otherLangs("ru")) {
    const otherText = translations[other][key];
    if (otherText && otherText !== ruText) {
      expect(
        body,
        `в DOM не должно быть ${other.toUpperCase()} перевода ключа ${String(key)}`,
      ).not.toContain(otherText);
    }
  }
};

describe("E2E: смешанный/мусорный ввод языка → UI остаётся на русском", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("navigator=ru-RU → ru в context и в DOM на /", () => {
    setBrowserLanguages("ru-RU", ["ru-RU", "ru"]);
    let currentLang: Language = "en";
    renderApp("/", (l) => (currentLang = l));

    expect(currentLang).toBe("ru");
    expectRuKeyInDom("nav_registerFree");
  });

  it("navigator='RFQ' (короткий латинский акроним) → preferred-ru сохраняется", () => {
    // sanity: детектор тоже считает это RU при preferred=ru
    expect(detectLanguage("RFQ", "ru")).toBe("ru");
    expect(resolveHintLanguage({ text: "RFQ" })).toBe("ru");

    setBrowserLanguages("RFQ", ["RFQ"]);
    let currentLang: Language = "en";
    renderApp("/", (l) => (currentLang = l));

    expect(currentLang).toBe("ru");
    expectRuKeyInDom("nav_registerFree");
  });

  it.each([
    ["пустая строка", ""],
    ["пробелы", "   "],
    ["цифры", "123"],
    ["пунктуация", "—,.!"],
  ])("navigator='%s' (%s) → ru-фолбэк, UI на русском", (_label, value) => {
    expect(detectLanguage(value)).toBe("ru");

    setBrowserLanguages(value, value ? [value] : []);
    let currentLang: Language = "en";
    renderApp("/", (l) => (currentLang = l));

    expect(currentLang).toBe("ru");
    expectRuKeyInDom("nav_registerFree");
  });

  it("смешанный saved-черновик 'RFQ по треске MSC' → ru, кириллица доминирует", () => {
    // Симулируем кейс «пользователь раньше что-то ввёл, потом
    // открывает приложение»: navigator EN, но сам черновик — RU.
    setBrowserLanguages("en-US", ["en-US", "en"]);
    expect(detectLanguage("RFQ по треске MSC")).toBe("ru");
    expect(resolveHintLanguage({ text: "RFQ по треске MSC" })).toBe("ru");

    // Если saved уже зафиксирован как ru — Provider обязан его уважать
    // несмотря на en-US в navigator (это и есть «фолбэк остался ru
    // после смешанного ввода»).
    localStorage.setItem(STORAGE_KEY, "ru");

    let currentLang: Language = "en";
    renderApp("/offers", (l) => (currentLang = l));

    expect(currentLang).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuKeyInDom("offersPage_title");
  });
});
