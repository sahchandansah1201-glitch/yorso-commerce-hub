/**
 * Document-level метаданные при ru-локали должны быть корректны и устойчивы
 * к переходам между public-маршрутами:
 *   - <html dir="ltr"> (en/ru/es — все LTR)
 *   - <link rel="canonical" href="${origin}${pathname}">
 *   - <meta name="twitter:title">       === translations.ru.meta_siteTitle
 *   - <meta name="twitter:description"> === translations.ru.meta_siteDescription
 *   - <link rel="alternate" hreflang="en|ru|es|x-default"> — присутствуют, href = canonical
 *
 * Английские значения twitter не должны просачиваться, dir не должен сбрасываться,
 * canonical должен обновляться под текущий маршрут.
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

const HREFLANGS = ["en", "ru", "es", "x-default"];

const metaContent = (selector: string): string =>
  document.querySelector<HTMLMetaElement>(selector)?.getAttribute("content") ?? "";

const linkHref = (selector: string): string =>
  document.querySelector<HTMLLinkElement>(selector)?.getAttribute("href") ?? "";

describe("Document meta при ru-локали: dir/canonical/twitter/hreflang устойчивы к переходам", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    document.documentElement.removeAttribute("dir");
    document
      .querySelectorAll('meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"]')
      .forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    document.documentElement.removeAttribute("dir");
    document
      .querySelectorAll('meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"]')
      .forEach((el) => el.remove());
  });

  it("После setLang('ru') dir=ltr, twitter-теги и canonical/hreflang корректны", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    expect(document.documentElement.getAttribute("dir")).toBe("ltr");

    expect(metaContent('meta[name="twitter:title"]')).toBe(translations.ru.meta_siteTitle);
    expect(metaContent('meta[name="twitter:description"]')).toBe(
      translations.ru.meta_siteDescription,
    );
    // EN не просочился.
    expect(metaContent('meta[name="twitter:title"]')).not.toBe(translations.en.meta_siteTitle);
    expect(metaContent('meta[name="twitter:description"]')).not.toBe(
      translations.en.meta_siteDescription,
    );

    const expectedCanonical = `${window.location.origin}/`;
    expect(linkHref('link[rel="canonical"]')).toBe(expectedCanonical);

    for (const hl of HREFLANGS) {
      const href = linkHref(`link[rel="alternate"][hreflang="${hl}"]`);
      expect(href, `hreflang=${hl} отсутствует или с пустым href`).toBe(expectedCanonical);
    }
  });

  it("На каждом public-маршруте dir/twitter/hreflang остаются ru, canonical обновляется под путь", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");

      // dir стабилен.
      expect(document.documentElement.getAttribute("dir"), `dir сбросился на ${path}`).toBe("ltr");

      // Twitter-теги остаются русскими и не уходят на en.
      expect(
        metaContent('meta[name="twitter:title"]'),
        `twitter:title не русский на ${path}`,
      ).toBe(translations.ru.meta_siteTitle);
      expect(
        metaContent('meta[name="twitter:description"]'),
        `twitter:description не русский на ${path}`,
      ).toBe(translations.ru.meta_siteDescription);
      expect(
        metaContent('meta[name="twitter:title"]'),
        `twitter:title переключился на en на ${path}`,
      ).not.toBe(translations.en.meta_siteTitle);
      expect(
        metaContent('meta[name="twitter:description"]'),
        `twitter:description переключился на en на ${path}`,
      ).not.toBe(translations.en.meta_siteDescription);

      // Canonical отражает текущий путь.
      const expectedCanonical = `${window.location.origin}${path}`;
      expect(linkHref('link[rel="canonical"]'), `canonical не обновился на ${path}`).toBe(
        expectedCanonical,
      );

      // ровно один canonical в DOM.
      expect(
        document.querySelectorAll('link[rel="canonical"]').length,
        `на ${path} больше одного canonical`,
      ).toBe(1);

      // hreflang ссылки присутствуют, по одной на каждую локаль + x-default,
      // и совпадают с canonical.
      for (const hl of HREFLANGS) {
        const tags = document.querySelectorAll(`link[rel="alternate"][hreflang="${hl}"]`);
        expect(tags.length, `на ${path} ожидался 1 hreflang=${hl}, найдено ${tags.length}`).toBe(1);
        expect(tags[0].getAttribute("href"), `hreflang=${hl} href ≠ canonical на ${path}`).toBe(
          expectedCanonical,
        );
      }
    }
  });

  it("Прямой вход на public-маршрут с предустановленной ru-локалью сразу даёт корректные meta", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/about");

    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    expect(metaContent('meta[name="twitter:title"]')).toBe(translations.ru.meta_siteTitle);
    expect(metaContent('meta[name="twitter:description"]')).toBe(
      translations.ru.meta_siteDescription,
    );

    const aboutCanonical = `${window.location.origin}/about`;
    expect(linkHref('link[rel="canonical"]')).toBe(aboutCanonical);
    for (const hl of HREFLANGS) {
      expect(linkHref(`link[rel="alternate"][hreflang="${hl}"]`)).toBe(aboutCanonical);
    }

    // Переход — canonical обновился, остальное стабильно.
    act(() => api.navigateTo("/contact"));
    const contactCanonical = `${window.location.origin}/contact`;
    expect(linkHref('link[rel="canonical"]')).toBe(contactCanonical);
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    expect(metaContent('meta[name="twitter:title"]')).toBe(translations.ru.meta_siteTitle);
    for (const hl of HREFLANGS) {
      expect(linkHref(`link[rel="alternate"][hreflang="${hl}"]`)).toBe(contactCanonical);
    }
  });
});
