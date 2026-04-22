/**
 * После переходов по public-страницам и установки ru-локали документ должен
 * содержать ru-метаданные:
 *   - <html lang="ru">
 *   - document.title === translations.ru.meta_siteTitle
 *   - <meta name="description"> === translations.ru.meta_siteDescription
 *   - английский meta_siteTitle/Description не должен попадать в документ.
 *
 * Маршруты: главная, регистрационные шаги, signin, offers и все info-страницы
 * из роутера. Между переходами лангметаданные не должны переключаться на en.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
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

const getMetaDescription = (): string =>
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.getAttribute("content") ?? "";

describe("Public-страницы: метаданные документа на ru, не переключаются на en", () => {
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
    // Сбрасываем lang/title между тестами, чтобы видеть реальные изменения от провайдера.
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

  it("После setLang('ru') html[lang]=ru, title и description на русском", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    expect(document.documentElement.getAttribute("lang")).toBe("ru");
    expect(document.title).toBe(translations.ru.meta_siteTitle);
    expect(getMetaDescription()).toBe(translations.ru.meta_siteDescription);

    // Английские варианты НЕ должны просочиться.
    expect(document.title).not.toBe(translations.en.meta_siteTitle);
    expect(getMetaDescription()).not.toBe(translations.en.meta_siteDescription);
  });

  it("На каждом public-маршруте после setLang('ru') ru-метаданные сохраняются и не сбрасываются на en", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      expect(screen.getByTestId("lang").textContent, `lang сбросился на ${path}`).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");

      expect(document.documentElement.getAttribute("lang"), `html[lang] не ru на ${path}`).toBe("ru");
      expect(document.title, `title не русский на ${path}`).toBe(translations.ru.meta_siteTitle);
      expect(getMetaDescription(), `description не русский на ${path}`).toBe(
        translations.ru.meta_siteDescription,
      );

      expect(document.title, `title переключился на en на ${path}`).not.toBe(
        translations.en.meta_siteTitle,
      );
      expect(getMetaDescription(), `description переключился на en на ${path}`).not.toBe(
        translations.en.meta_siteDescription,
      );
    }
  });

  it("Прямой вход на public-маршрут с предустановленной ru-локалью сразу даёт ru-метаданные", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/about");

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(document.documentElement.getAttribute("lang")).toBe("ru");
    expect(document.title).toBe(translations.ru.meta_siteTitle);
    expect(getMetaDescription()).toBe(translations.ru.meta_siteDescription);

    // Дополнительно: переход на ещё один маршрут не сбрасывает.
    act(() => api.navigateTo("/contact"));
    expect(document.documentElement.getAttribute("lang")).toBe("ru");
    expect(document.title).toBe(translations.ru.meta_siteTitle);
    expect(getMetaDescription()).toBe(translations.ru.meta_siteDescription);
  });
});
