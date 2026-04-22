/**
 * Twitter Card мета (twitter:title, twitter:description) при ru-локали:
 *   - Присутствуют в <head> ровно по одному.
 *   - Содержат translations.ru.meta_siteTitle / meta_siteDescription.
 *   - Не сбрасываются и не дублируются при переходах по 14 public-маршрутам.
 *   - Не переключаются на английские значения при навигации.
 *   - Корректно обновляются при смене языка ru → en → ru.
 *   - Прямой вход на ru-маршрут сразу даёт ru-значения.
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

const twitterTitleTags = () =>
  Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="twitter:title"]'));
const twitterDescTags = () =>
  Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="twitter:description"]'));

const cleanupTwitter = () =>
  document.querySelectorAll('meta[name^="twitter:"]').forEach((el) => el.remove());

describe("Twitter Card мета на ru: устойчивость при навигации и переключениях", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    cleanupTwitter();
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    cleanupTwitter();
  });

  it("После setLang('ru') twitter:title/description русские и не равны английским", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    const titles = twitterTitleTags();
    const descs = twitterDescTags();
    expect(titles.length, "ожидался ровно 1 twitter:title").toBe(1);
    expect(descs.length, "ожидался ровно 1 twitter:description").toBe(1);

    expect(titles[0].getAttribute("content")).toBe(translations.ru.meta_siteTitle);
    expect(descs[0].getAttribute("content")).toBe(translations.ru.meta_siteDescription);

    expect(titles[0].getAttribute("content")).not.toBe(translations.en.meta_siteTitle);
    expect(descs[0].getAttribute("content")).not.toBe(translations.en.meta_siteDescription);
  });

  it("На каждом из 14 public-маршрутов twitter:title/description остаются ru, без дублей и без en", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    const initialTitle = twitterTitleTags()[0];
    const initialDesc = twitterDescTags()[0];

    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");

      const titles = twitterTitleTags();
      const descs = twitterDescTags();

      expect(titles.length, `на ${path} twitter:title-теги дублируются (${titles.length})`).toBe(
        1,
      );
      expect(descs.length, `на ${path} twitter:description-теги дублируются (${descs.length})`).toBe(
        1,
      );

      // Узлы не пересоздаются — провайдер обновляет content на месте.
      expect(titles[0], `twitter:title пересоздан на ${path}`).toBe(initialTitle);
      expect(descs[0], `twitter:description пересоздан на ${path}`).toBe(initialDesc);

      expect(
        titles[0].getAttribute("content"),
        `twitter:title не русский на ${path}`,
      ).toBe(translations.ru.meta_siteTitle);
      expect(
        descs[0].getAttribute("content"),
        `twitter:description не русский на ${path}`,
      ).toBe(translations.ru.meta_siteDescription);

      expect(
        titles[0].getAttribute("content"),
        `twitter:title переключился на en на ${path}`,
      ).not.toBe(translations.en.meta_siteTitle);
      expect(
        descs[0].getAttribute("content"),
        `twitter:description переключился на en на ${path}`,
      ).not.toBe(translations.en.meta_siteDescription);
    }
  });

  it("Прямой вход на ru-маршрут сразу даёт русские twitter-теги", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/about");

    expect(twitterTitleTags()[0].getAttribute("content")).toBe(translations.ru.meta_siteTitle);
    expect(twitterDescTags()[0].getAttribute("content")).toBe(
      translations.ru.meta_siteDescription,
    );

    act(() => api.navigateTo("/contact"));
    expect(twitterTitleTags()[0].getAttribute("content")).toBe(translations.ru.meta_siteTitle);
    expect(twitterDescTags()[0].getAttribute("content")).toBe(
      translations.ru.meta_siteDescription,
    );
  });

  it("Переключение ru → en → ru обновляет twitter-теги в обе стороны без остатков en", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    expect(twitterTitleTags()[0].getAttribute("content")).toBe(translations.ru.meta_siteTitle);

    act(() => api.setLang("en"));
    expect(twitterTitleTags()[0].getAttribute("content")).toBe(translations.en.meta_siteTitle);
    expect(twitterDescTags()[0].getAttribute("content")).toBe(translations.en.meta_siteDescription);

    act(() => api.setLang("ru"));
    expect(twitterTitleTags()[0].getAttribute("content")).toBe(translations.ru.meta_siteTitle);
    expect(twitterDescTags()[0].getAttribute("content")).toBe(
      translations.ru.meta_siteDescription,
    );
    expect(twitterTitleTags()[0].getAttribute("content")).not.toBe(translations.en.meta_siteTitle);
    expect(twitterDescTags()[0].getAttribute("content")).not.toBe(
      translations.en.meta_siteDescription,
    );

    // Дублей не появилось ни на одном шаге.
    expect(twitterTitleTags().length).toBe(1);
    expect(twitterDescTags().length).toBe(1);
  });
});
