/**
 * После последовательности переключений ru → en → ru, выполняемых вперемешку
 * с переходами по 14 public-маршрутам, document.title и
 * <meta name="description"> всегда должны соответствовать ТЕКУЩЕЙ локали:
 *
 *   - В фазе ru: title === translations.ru.meta_siteTitle,
 *                description === translations.ru.meta_siteDescription,
 *                и они НЕ равны английским значениям.
 *   - В фазе en: title === translations.en.meta_siteTitle,
 *                description === translations.en.meta_siteDescription,
 *                и они НЕ равны русским значениям.
 *   - При обратном переключении на ru английские значения не должны "залипнуть".
 *
 * Тест проходит по всем 14 public-маршрутам в каждой фазе (ru, en, ru).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import DocumentMetaSync from "@/i18n/DocumentMetaSync";
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
            <DocumentMetaSync />
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

const getDescription = () =>
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.getAttribute("content") ?? "";

const assertMatchesLocale = (lang: Language, path: string, phase: string) => {
  const expectedTitle = translations[lang].meta_siteTitle;
  const expectedDesc = translations[lang].meta_siteDescription;
  const otherLang: Language = lang === "ru" ? "en" : "ru";

  expect(document.title, `[${phase}] title не для ${lang} на ${path}`).toBe(expectedTitle);
  expect(getDescription(), `[${phase}] description не для ${lang} на ${path}`).toBe(expectedDesc);

  expect(document.title, `[${phase}] title залипший от ${otherLang} на ${path}`).not.toBe(
    translations[otherLang].meta_siteTitle,
  );
  expect(
    getDescription(),
    `[${phase}] description залипший от ${otherLang} на ${path}`,
  ).not.toBe(translations[otherLang].meta_siteDescription);

  // <html lang> идёт в паре с title/description.
  expect(document.documentElement.getAttribute("lang"), `[${phase}] html[lang] на ${path}`).toBe(
    lang,
  );
  expect(localStorage.getItem(STORAGE_KEY), `[${phase}] storage на ${path}`).toBe(lang);
};

describe("title/description всегда совпадают с текущей локалью при ru→en→ru + навигации", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");
  const originalHtmlLang = document.documentElement.getAttribute("lang");
  const originalTitle = document.title;
  const originalDescTag = document.querySelector('meta[name="description"]');
  const originalDesc = originalDescTag?.getAttribute("content") ?? null;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    // Сбрасываем lang/title между тестами, чтобы видеть реальные изменения.
    document.documentElement.setAttribute("lang", "en");
    document.title = "Lovable App";
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    if (originalHtmlLang !== null) {
      document.documentElement.setAttribute("lang", originalHtmlLang);
    }
    document.title = originalTitle;
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (desc && originalDesc !== null) desc.setAttribute("content", originalDesc);
  });

  it("Фазы ru → en → ru: на каждом public-маршруте title/description совпадают с текущей локалью", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    // Фаза 1: ru.
    act(() => api.setLang("ru"));
    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));
      assertMatchesLocale("ru", path, "phase=ru#1");
    }

    // Фаза 2: en. После переключения сразу проверяем на текущем маршруте,
    // затем — на каждом из остальных.
    act(() => api.setLang("en"));
    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));
      assertMatchesLocale("en", path, "phase=en");
    }

    // Фаза 3: возврат на ru. Английские значения не должны "залипнуть".
    act(() => api.setLang("ru"));
    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));
      assertMatchesLocale("ru", path, "phase=ru#2");
    }
  });

  it("Переключение языка БЕЗ навигации обновляет title/description немедленно (ru→en→ru на каждом маршруте)", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    // На каждом маршруте проигрываем ru → en → ru на месте.
    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      act(() => api.setLang("ru"));
      assertMatchesLocale("ru", path, "inplace ru#1");

      act(() => api.setLang("en"));
      assertMatchesLocale("en", path, "inplace en");

      act(() => api.setLang("ru"));
      assertMatchesLocale("ru", path, "inplace ru#2");
    }
  });

  it("Чередование смены языка и перехода на следующий маршрут не оставляет рассинхрона", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    // Стартуем с ru.
    act(() => api.setLang("ru"));

    // Чередуем lang ↔ navigate, инвертируя локаль на каждом шаге.
    let current: Language = "ru";
    for (let i = 0; i < PUBLIC_ROUTES.length; i++) {
      const path = PUBLIC_ROUTES[i];
      act(() => api.navigateTo(path));
      assertMatchesLocale(current, path, `interleave step=${i} before-toggle`);

      const next: Language = current === "ru" ? "en" : "ru";
      act(() => api.setLang(next));
      assertMatchesLocale(next, path, `interleave step=${i} after-toggle`);
      current = next;
    }

    // Финальный возврат на ru — на текущем маршруте title/description ru.
    act(() => api.setLang("ru"));
    const lastPath = PUBLIC_ROUTES[PUBLIC_ROUTES.length - 1];
    assertMatchesLocale("ru", lastPath, "interleave final ru");
  });
});
