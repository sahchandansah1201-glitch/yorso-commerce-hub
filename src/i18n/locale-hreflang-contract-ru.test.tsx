/**
 * Контракт hreflang-ссылок для ru/en/es:
 *   - Для каждой поддерживаемой локали (en, ru, es) и x-default в <head>
 *     присутствует РОВНО один <link rel="alternate" hreflang="...">.
 *   - Все hreflang href указывают на canonical URL текущего маршрута
 *     (origin + pathname).
 *   - Никаких лишних hreflang (например, "en-US", "ru-RU", "de") в DOM нет.
 *   - При ru-локали в документе НЕ появляются английские значения вместо русских:
 *     <title>, <meta name="description">, og:title/description/locale,
 *     twitter:title/description, <html lang>.
 *   - На всех 14 public-маршрутах hreflang остаётся валидным и обновляется
 *     под путь, а ru-контент не сбрасывается на en.
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

const EXPECTED_HREFLANGS = ["en", "ru", "es", "x-default"] as const;

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

const allHreflangTags = () =>
  Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]'));

const metaContent = (selector: string) =>
  document.querySelector<HTMLMetaElement>(selector)?.getAttribute("content") ?? "";

const cleanupHead = () => {
  document
    .querySelectorAll(
      'link[rel="alternate"], link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"]',
    )
    .forEach((el) => el.remove());
};

describe("hreflang-контракт для ru/en/es: корректность и отсутствие en-просачивания", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");
  const originalHtmlLang = document.documentElement.getAttribute("lang");
  const originalTitle = document.title;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    document.documentElement.setAttribute("lang", "en");
    document.title = "Lovable App";
    cleanupHead();
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    if (originalHtmlLang !== null) {
      document.documentElement.setAttribute("lang", originalHtmlLang);
    }
    document.title = originalTitle;
    cleanupHead();
  });

  it("Для каждой локали и x-default есть ровно один hreflang, лишних значений нет", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    const tags = allHreflangTags();
    // Ровно 4 — en, ru, es, x-default.
    expect(tags.length, `ожидалось 4 hreflang-тега, найдено ${tags.length}`).toBe(4);

    const seen = new Map<string, string>();
    for (const tag of tags) {
      const hl = tag.getAttribute("hreflang") ?? "";
      const href = tag.getAttribute("href") ?? "";
      expect(seen.has(hl), `дубликат hreflang=${hl}`).toBe(false);
      seen.set(hl, href);
    }

    for (const expected of EXPECTED_HREFLANGS) {
      expect(seen.has(expected), `отсутствует hreflang="${expected}"`).toBe(true);
    }

    // Никаких лишних кодов вроде en-US/ru-RU/de.
    const allowed = new Set<string>(EXPECTED_HREFLANGS);
    for (const hl of seen.keys()) {
      expect(allowed.has(hl), `неожиданный hreflang="${hl}"`).toBe(true);
    }

    // Все href указывают на canonical "/".
    const expectedHref = `${window.location.origin}/`;
    for (const [hl, href] of seen) {
      expect(href, `hreflang=${hl} href неверен`).toBe(expectedHref);
    }
  });

  it("На всех 14 public-маршрутах hreflang валиден и обновляется под путь; en не просачивается в ru-теги", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      // Локаль ru стабильна.
      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");
      expect(document.documentElement.getAttribute("lang"), `html[lang] не ru на ${path}`).toBe(
        "ru",
      );

      // hreflang: ровно 4, без дублей и лишних.
      const tags = allHreflangTags();
      expect(tags.length, `на ${path} hreflang-тегов ${tags.length}, ожидалось 4`).toBe(4);

      const map = new Map<string, string>();
      for (const tag of tags) {
        const hl = tag.getAttribute("hreflang") ?? "";
        expect(map.has(hl), `на ${path} дубликат hreflang=${hl}`).toBe(false);
        map.set(hl, tag.getAttribute("href") ?? "");
      }
      for (const expected of EXPECTED_HREFLANGS) {
        expect(map.has(expected), `на ${path} отсутствует hreflang=${expected}`).toBe(true);
      }

      // Все href = canonical (origin + path).
      const expectedHref = `${window.location.origin}${path}`;
      for (const [hl, href] of map) {
        expect(href, `на ${path} hreflang=${hl} href ≠ canonical`).toBe(expectedHref);
      }

      // canonical совпадает с hreflang href и существует ровно один.
      const canonicals = document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]');
      expect(canonicals.length, `на ${path} canonical-тегов ${canonicals.length}`).toBe(1);
      expect(canonicals[0].getAttribute("href"), `canonical href на ${path}`).toBe(expectedHref);

      // Английские значения НЕ должны просачиваться в ru-теги.
      expect(document.title, `title=en на ${path}`).toBe(translations.ru.meta_siteTitle);
      expect(document.title, `title=en просочился на ${path}`).not.toBe(
        translations.en.meta_siteTitle,
      );

      expect(metaContent('meta[name="description"]'), `description=en на ${path}`).toBe(
        translations.ru.meta_siteDescription,
      );
      expect(metaContent('meta[name="description"]')).not.toBe(
        translations.en.meta_siteDescription,
      );

      expect(metaContent('meta[property="og:title"]'), `og:title=en на ${path}`).toBe(
        translations.ru.meta_siteTitle,
      );
      expect(metaContent('meta[property="og:title"]')).not.toBe(translations.en.meta_siteTitle);

      expect(
        metaContent('meta[property="og:description"]'),
        `og:description=en на ${path}`,
      ).toBe(translations.ru.meta_siteDescription);
      expect(metaContent('meta[property="og:description"]')).not.toBe(
        translations.en.meta_siteDescription,
      );

      expect(metaContent('meta[property="og:locale"]'), `og:locale=en_US на ${path}`).toBe(
        "ru_RU",
      );
      expect(metaContent('meta[property="og:locale"]')).not.toBe("en_US");

      expect(metaContent('meta[name="twitter:title"]'), `twitter:title=en на ${path}`).toBe(
        translations.ru.meta_siteTitle,
      );
      expect(metaContent('meta[name="twitter:title"]')).not.toBe(translations.en.meta_siteTitle);

      expect(
        metaContent('meta[name="twitter:description"]'),
        `twitter:description=en на ${path}`,
      ).toBe(translations.ru.meta_siteDescription);
      expect(metaContent('meta[name="twitter:description"]')).not.toBe(
        translations.en.meta_siteDescription,
      );
    }
  });

  it("Прямой вход на ru-маршрут сразу даёт корректный hreflang-набор и ru-метаданные", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    renderApp(() => undefined, "/about");

    const tags = allHreflangTags();
    expect(tags.length).toBe(4);

    const expectedHref = `${window.location.origin}/about`;
    const map = new Map<string, string>();
    for (const tag of tags) {
      map.set(tag.getAttribute("hreflang") ?? "", tag.getAttribute("href") ?? "");
    }
    for (const expected of EXPECTED_HREFLANGS) {
      expect(map.get(expected), `hreflang=${expected} href`).toBe(expectedHref);
    }

    expect(document.documentElement.getAttribute("lang")).toBe("ru");
    expect(document.title).toBe(translations.ru.meta_siteTitle);
    expect(metaContent('meta[property="og:locale"]')).toBe("ru_RU");
  });

  it("Переключение ru → en → ru не оставляет en в ru-тегах и сохраняет 4 hreflang", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    expect(allHreflangTags().length).toBe(4);
    expect(document.title).toBe(translations.ru.meta_siteTitle);

    act(() => api.setLang("en"));
    // Под en: значения, ожидаемо, английские.
    expect(document.title).toBe(translations.en.meta_siteTitle);
    expect(metaContent('meta[property="og:locale"]')).toBe("en_US");
    // hreflang набор не меняется.
    expect(allHreflangTags().length).toBe(4);

    act(() => api.setLang("ru"));
    // Возврат: en НЕ должен остаться в ru-тегах.
    expect(document.title).toBe(translations.ru.meta_siteTitle);
    expect(document.title).not.toBe(translations.en.meta_siteTitle);
    expect(metaContent('meta[property="og:locale"]')).toBe("ru_RU");
    expect(metaContent('meta[name="twitter:title"]')).toBe(translations.ru.meta_siteTitle);
    expect(metaContent('meta[name="twitter:title"]')).not.toBe(translations.en.meta_siteTitle);
    expect(allHreflangTags().length).toBe(4);
  });
});
