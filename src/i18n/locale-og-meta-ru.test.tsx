/**
 * Open Graph метаданные синхронизируются с активной локалью:
 *   - <meta property="og:title">       === translations[lang].meta_siteTitle
 *   - <meta property="og:description"> === translations[lang].meta_siteDescription
 *   - <meta property="og:locale">      === { en: en_US, ru: ru_RU, es: es_ES }[lang]
 *
 * Сценарии:
 *   1) После setLang('ru') OG-теги становятся русскими.
 *   2) При переходах по public-маршрутам OG-теги остаются русскими и не сбрасываются на en.
 *   3) Прямой вход с предустановленной ru-локалью сразу даёт ru-OG.
 *   4) Английские значения OG не просачиваются.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import RegisterChoose from "@/pages/register/RegisterChoose";
import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Cookies from "@/pages/Cookies";
import GDPR from "@/pages/GDPR";
import AntiFraud from "@/pages/AntiFraud";
import Careers from "@/pages/Careers";
import Press from "@/pages/Press";
import Partners from "@/pages/Partners";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? [primary],
    configurable: true,
  });
};

type Api = { setLang: (l: Language) => void; navigateTo: (p: string) => void };

const Probe = ({ onReady }: { onReady: (api: Api) => void }) => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  onReady({ setLang, navigateTo: (p) => navigate(p) });
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (onReady: (api: Api) => void, initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <Probe onReady={onReady} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<RegisterChoose />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/gdpr" element={<GDPR />} />
              <Route path="/anti-fraud" element={<AntiFraud />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/press" element={<Press />} />
              <Route path="/partners" element={<Partners />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const PUBLIC_ROUTES = [
  "/",
  "/register",
  "/signin",
  "/offers",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/gdpr",
  "/anti-fraud",
  "/careers",
  "/press",
  "/partners",
];

const getMetaContent = (selector: string): string =>
  document.querySelector<HTMLMetaElement>(selector)?.getAttribute("content") ?? "";

const ogTitle = () => getMetaContent('meta[property="og:title"]');
const ogDesc = () => getMetaContent('meta[property="og:description"]');
const ogLocale = () => getMetaContent('meta[property="og:locale"]');

describe("Open Graph метаданные: синхронизация с локалью и устойчивость к переходам", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    // Сбрасываем потенциально остаточные OG-теги от других тестов.
    document.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    document.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove());
  });

  it("После setLang('ru') og:title/description/locale становятся русскими", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    expect(ogTitle()).toBe(translations.ru.meta_siteTitle);
    expect(ogDesc()).toBe(translations.ru.meta_siteDescription);
    expect(ogLocale()).toBe("ru_RU");

    // Английские значения не должны просочиться.
    expect(ogTitle()).not.toBe(translations.en.meta_siteTitle);
    expect(ogDesc()).not.toBe(translations.en.meta_siteDescription);
    expect(ogLocale()).not.toBe("en_US");
  });

  it("На каждом public-маршруте после setLang('ru') OG-теги сохраняются и не сбрасываются на en", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");

      expect(ogTitle(), `og:title не русский на ${path}`).toBe(translations.ru.meta_siteTitle);
      expect(ogDesc(), `og:description не русский на ${path}`).toBe(
        translations.ru.meta_siteDescription,
      );
      expect(ogLocale(), `og:locale не ru_RU на ${path}`).toBe("ru_RU");

      expect(ogTitle(), `og:title переключился на en на ${path}`).not.toBe(
        translations.en.meta_siteTitle,
      );
      expect(ogDesc(), `og:description переключился на en на ${path}`).not.toBe(
        translations.en.meta_siteDescription,
      );
      expect(ogLocale(), `og:locale переключился на en_US на ${path}`).not.toBe("en_US");
    }
  });

  it("Прямой вход на public-маршрут с предустановленной ru-локалью сразу даёт ru-OG", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/about");

    expect(ogTitle()).toBe(translations.ru.meta_siteTitle);
    expect(ogDesc()).toBe(translations.ru.meta_siteDescription);
    expect(ogLocale()).toBe("ru_RU");

    act(() => api.navigateTo("/contact"));
    expect(ogTitle()).toBe(translations.ru.meta_siteTitle);
    expect(ogDesc()).toBe(translations.ru.meta_siteDescription);
    expect(ogLocale()).toBe("ru_RU");
  });

  it("Переключение ru → en → ru корректно обновляет OG-теги в обе стороны", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    expect(ogLocale()).toBe("ru_RU");
    expect(ogTitle()).toBe(translations.ru.meta_siteTitle);

    act(() => api.setLang("en"));
    expect(ogLocale()).toBe("en_US");
    expect(ogTitle()).toBe(translations.en.meta_siteTitle);
    expect(ogDesc()).toBe(translations.en.meta_siteDescription);

    act(() => api.setLang("ru"));
    expect(ogLocale()).toBe("ru_RU");
    expect(ogTitle()).toBe(translations.ru.meta_siteTitle);
    expect(ogDesc()).toBe(translations.ru.meta_siteDescription);
  });
});
