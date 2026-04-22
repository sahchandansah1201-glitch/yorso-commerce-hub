/**
 * Валидация footer-ссылок: каждая href из translations.ru.footer_links
 * должна вести на существующий маршрут (а не на 404/NotFound) и показывать
 * локализованный контент.
 *
 * Логика:
 *   - href, начинающиеся с "#", это якоря к секциям главной (#offers, #faq,
 *     #categories, #how-it-works). Для них проверяем, что на "/" есть
 *     соответствующая секция с этим id и её section-title локализован
 *     русским переводом.
 *   - href, начинающиеся с "/", это полноценные маршруты. Для них рендерим
 *     приложение с initialPath = href и проверяем:
 *       а) НЕ показан 404: на странице нет [data-testid="page-title"] с
 *          текстом translations.ru.notFound_title и нет page-subtitle с
 *          notFound_subtitle.
 *       б) Локаль сохранена: lang === "ru", localStorage["yorso-lang"] === "ru".
 *       в) Есть локализованный контент: либо [data-testid="page-title"] с
 *          ожидаемым русским заголовком из translations.ru.info_*Title,
 *          либо непустой [data-testid="info-content"]. Также допускается
 *          совпадение текстом метки ссылки.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

// Маппинг известных маршрутов на ожидаемый ключ заголовка из translations.ru.
// Если маршрут не указан — fallback-проверка на info-content / label.
const ROUTE_TO_TITLE_KEY: Record<string, keyof typeof translations.ru | undefined> = {
  "/about": "info_aboutTitle",
  "/contact": "info_contactTitle",
  "/careers": "info_careersTitle",
  "/press": "info_pressTitle",
  "/partners": "info_partnersTitle",
  "/terms": "info_termsTitle",
  "/privacy": "info_privacyTitle",
  "/cookies": "info_cookiesTitle",
  "/gdpr": "info_gdprTitle",
  "/anti-fraud": "info_antiFraudTitle",
};

// Маппинг якорных href на ожидаемый ключ заголовка секции.
const ANCHOR_TO_SECTION: Record<string, { sectionId: string; titleKey: keyof typeof translations.ru }> = {
  "#offers": { sectionId: "offers", titleKey: "offers_title" },
  "#categories": { sectionId: "categories", titleKey: "cat_title" },
  "#how-it-works": { sectionId: "how-it-works", titleKey: "verify_title" },
  "#faq": { sectionId: "faq", titleKey: "faq_title" },
};

const allFooterLinks = () => [
  ...translations.ru.footer_links.platform,
  ...translations.ru.footer_links.company,
  ...translations.ru.footer_links.legal,
];

describe("Footer links (ru): все href ведут на существующие маршруты и показывают локализованный контент", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    // jsdom не реализует scrollIntoView; на главной могут срабатывать обработчики, использующие его.
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("Sanity: footer_links содержит ожидаемые группы и непустые href", () => {
    const links = allFooterLinks();
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      expect(l.label, `пустой label у ссылки ${JSON.stringify(l)}`).toBeTruthy();
      expect(l.href, `пустой href у ссылки ${JSON.stringify(l)}`).toBeTruthy();
      expect(l.href.startsWith("#") || l.href.startsWith("/"), `неожиданный формат href: ${l.href}`).toBe(true);
    }
  });

  it("Якорные ссылки футера: на главной существует секция и её section-title локализован русским", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");
    act(() => api.setLang("ru"));

    const anchors = allFooterLinks().filter((l) => l.href.startsWith("#"));
    expect(anchors.length).toBeGreaterThan(0);

    for (const link of anchors) {
      const meta = ANCHOR_TO_SECTION[link.href];
      expect(meta, `неизвестный якорь в footer_links: ${link.href}`).toBeDefined();
      if (!meta) continue;

      const section = document.getElementById(meta.sectionId);
      expect(section, `секция #${meta.sectionId} (для ${link.href}) не найдена на главной`).not.toBeNull();

      const title = document.querySelector<HTMLElement>(
        `[data-testid="section-title"][data-section="${meta.sectionId}"]`,
      );
      expect(title, `section-title для ${meta.sectionId} не найден`).not.toBeNull();
      expect(
        title!.textContent,
        `section-title для ${meta.sectionId} не содержит русский перевод "${translations.ru[meta.titleKey]}"`,
      ).toBe(translations.ru[meta.titleKey] as string);
    }

    // Локаль не сбросилась.
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
  });

  it("Каждый /-маршрут из footer_links: рендерится без 404, локаль ru, есть локализованный контент", () => {
    const routeLinks = allFooterLinks().filter((l) => l.href.startsWith("/"));
    expect(routeLinks.length).toBeGreaterThan(0);

    const ruNotFoundTitle = translations.ru.notFound_title;
    const ruNotFoundSubtitle = translations.ru.notFound_subtitle;

    for (const link of routeLinks) {
      // Каждая итерация — отдельный mount, чтобы initialPath применился чисто.
      localStorage.setItem(STORAGE_KEY, "ru"); // локаль ru ещё до маунта

      let api!: Api;
      renderApp((a) => (api = a), link.href);

      // 1) Локаль ru сохранена.
      expect(screen.getByTestId("lang").textContent, `lang сбросился на ${link.href}`).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${link.href}`).toBe("ru");

      // 2) НЕ 404. Если page-title есть — он не должен быть равен notFound_title.
      const pageTitleNodes = document.querySelectorAll<HTMLElement>('[data-testid="page-title"]');
      for (const t of Array.from(pageTitleNodes)) {
        expect(t.textContent, `маршрут ${link.href} рендерит 404 (page-title=notFound_title)`).not.toBe(
          ruNotFoundTitle,
        );
      }
      const subtitle = document.querySelector<HTMLElement>('[data-testid="page-subtitle"]');
      if (subtitle) {
        expect(
          subtitle.textContent,
          `маршрут ${link.href} рендерит 404 (page-subtitle=notFound_subtitle)`,
        ).not.toBe(ruNotFoundSubtitle);
      }

      // 3) Локализованный контент.
      const expectedTitleKey = ROUTE_TO_TITLE_KEY[link.href];
      let localizedContentOk = false;

      if (expectedTitleKey) {
        const expectedTitle = translations.ru[expectedTitleKey] as string;
        const titleMatch = Array.from(pageTitleNodes).some((n) => n.textContent === expectedTitle);
        if (titleMatch) localizedContentOk = true;
      }

      // Fallback: непустой info-content на странице.
      if (!localizedContentOk) {
        const infoContent = document.querySelector<HTMLElement>('[data-testid="info-content"]');
        if (infoContent && (infoContent.textContent ?? "").trim().length > 0) {
          localizedContentOk = true;
        }
      }

      // Fallback: текст метки ссылки встречается в DOM.
      if (!localizedContentOk) {
        if ((document.body.textContent ?? "").includes(link.label)) {
          localizedContentOk = true;
        }
      }

      expect(
        localizedContentOk,
        `на маршруте ${link.href} не найден локализованный контент: ни ожидаемый русский page-title (${
          expectedTitleKey ? translations.ru[expectedTitleKey] : "n/a"
        }), ни info-content, ни label "${link.label}"`,
      ).toBe(true);

      cleanup();
      document.body.innerHTML = "";
      localStorage.clear();
    }
  });
});
