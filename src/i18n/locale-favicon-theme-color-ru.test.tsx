/**
 * favicon (<link rel="icon">) и theme-color (<meta name="theme-color">) — это
 * глобальные брендовые/визуальные метаданные, не зависящие от локали и маршрута.
 * Они должны:
 *   1) Присутствовать в DOM при ru-локали.
 *   2) Не сбрасываться, не дублироваться и не менять href/content при переходах
 *      по public-маршрутам.
 *   3) Не реагировать на смену языка (en ↔ ru ↔ es).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import DocumentMetaSync from "@/i18n/DocumentMetaSync";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import type { Language } from "@/i18n/translations";

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

// Должно совпадать с index.html.
const EXPECTED_FAVICON_HREF = "/favicon.ico";
const EXPECTED_FAVICON_TYPE = "image/x-icon";
const EXPECTED_THEME_COLOR = "#0B1F3A";

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

const seedHeadFromIndexHtml = () => {
  // jsdom не подгружает index.html — воспроизводим его head-теги вручную,
  // чтобы тест отражал прод-разметку.
  document.querySelectorAll('link[rel="icon"], meta[name="theme-color"]').forEach((el) => el.remove());

  const icon = document.createElement("link");
  icon.setAttribute("rel", "icon");
  icon.setAttribute("href", EXPECTED_FAVICON_HREF);
  icon.setAttribute("type", EXPECTED_FAVICON_TYPE);
  icon.setAttribute("data-testid", "favicon");
  document.head.appendChild(icon);

  const theme = document.createElement("meta");
  theme.setAttribute("name", "theme-color");
  theme.setAttribute("content", EXPECTED_THEME_COLOR);
  theme.setAttribute("data-testid", "theme-color");
  document.head.appendChild(theme);
};

const queryFavicons = () =>
  Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'));
const queryThemeColors = () =>
  Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));

describe("Favicon и theme-color: стабильны при ru-локали и переходах по public-маршрутам", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    seedHeadFromIndexHtml();
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    document.querySelectorAll('link[rel="icon"], meta[name="theme-color"]').forEach((el) => el.remove());
  });

  it("При ru-локали favicon и theme-color присутствуют ровно по одному и имеют корректные значения", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    const favicons = queryFavicons();
    expect(favicons.length, "ожидался ровно 1 <link rel=\"icon\">").toBe(1);
    expect(favicons[0].getAttribute("href")).toBe(EXPECTED_FAVICON_HREF);
    expect(favicons[0].getAttribute("type")).toBe(EXPECTED_FAVICON_TYPE);

    const themes = queryThemeColors();
    expect(themes.length, "ожидался ровно 1 <meta name=\"theme-color\">").toBe(1);
    expect(themes[0].getAttribute("content")).toBe(EXPECTED_THEME_COLOR);
  });

  it("На каждом public-маршруте favicon и theme-color не сбрасываются и не дублируются", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    const initialFavicon = queryFavicons()[0];
    const initialTheme = queryThemeColors()[0];

    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");

      const favicons = queryFavicons();
      expect(favicons.length, `на ${path} favicon-теги дублируются (${favicons.length})`).toBe(1);
      expect(favicons[0].getAttribute("href"), `favicon href изменился на ${path}`).toBe(
        EXPECTED_FAVICON_HREF,
      );
      expect(favicons[0].getAttribute("type"), `favicon type изменился на ${path}`).toBe(
        EXPECTED_FAVICON_TYPE,
      );
      // Тот же самый узел — не пересоздаётся при навигации.
      expect(favicons[0], `favicon-узел был пересоздан на ${path}`).toBe(initialFavicon);

      const themes = queryThemeColors();
      expect(themes.length, `на ${path} theme-color-теги дублируются (${themes.length})`).toBe(1);
      expect(themes[0].getAttribute("content"), `theme-color content изменился на ${path}`).toBe(
        EXPECTED_THEME_COLOR,
      );
      expect(themes[0], `theme-color узел был пересоздан на ${path}`).toBe(initialTheme);
    }
  });

  it("Переключение языков en ↔ ru ↔ es не меняет favicon и theme-color", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    const initialFavicon = queryFavicons()[0];
    const initialTheme = queryThemeColors()[0];

    for (const lang of ["ru", "en", "es", "ru"] as Language[]) {
      act(() => api.setLang(lang));

      const favicons = queryFavicons();
      expect(favicons.length, `после setLang(${lang}) favicon-теги дублируются`).toBe(1);
      expect(favicons[0]).toBe(initialFavicon);
      expect(favicons[0].getAttribute("href")).toBe(EXPECTED_FAVICON_HREF);

      const themes = queryThemeColors();
      expect(themes.length, `после setLang(${lang}) theme-color-теги дублируются`).toBe(1);
      expect(themes[0]).toBe(initialTheme);
      expect(themes[0].getAttribute("content")).toBe(EXPECTED_THEME_COLOR);
    }
  });

  it("Прямой вход на public-маршрут с предустановленной ru-локалью даёт корректные favicon/theme-color", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/about");

    expect(queryFavicons().length).toBe(1);
    expect(queryFavicons()[0].getAttribute("href")).toBe(EXPECTED_FAVICON_HREF);

    expect(queryThemeColors().length).toBe(1);
    expect(queryThemeColors()[0].getAttribute("content")).toBe(EXPECTED_THEME_COLOR);

    act(() => api.navigateTo("/contact"));
    expect(queryFavicons().length).toBe(1);
    expect(queryFavicons()[0].getAttribute("href")).toBe(EXPECTED_FAVICON_HREF);
    expect(queryThemeColors().length).toBe(1);
    expect(queryThemeColors()[0].getAttribute("content")).toBe(EXPECTED_THEME_COLOR);
  });
});
