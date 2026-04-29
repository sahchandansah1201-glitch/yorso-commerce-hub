/**
 * Валидация footer-ссылок: каждая href из translations.ru.footer_links
 * должна вести на существующий маршрут (а не на 404/NotFound) и показывать
 * локализованный или хотя бы непустой контент.
 *
 * Логика:
 *   - Якорные href (#offers, #faq, #categories, #how-it-works) проверяются
 *     на главной: соответствующая секция существует и её section-title
 *     локализован русским переводом.
 *   - /-маршруты проверяются на:
 *       а) НЕ 404: на странице нет page-title с notFound_title и нет
 *          page-subtitle с notFound_subtitle.
 *       б) Локаль ru сохранена (lang === "ru", localStorage["yorso-lang"] === "ru").
 *       в) На странице есть непустой <h1> (доказательство, что компонент
 *          реально отрендерился, а не упал в NotFound).
 *
 *   Замечание: статические info-страницы (About/Contact/Terms/...) сейчас
 *   не локализованы — для них достаточно подтвердить, что маршрут жив и
 *   локаль не сбросилась. Якорные секции уже локализованы и проверяются
 *   по русскому тексту явно.
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
import Suppliers from "@/pages/Suppliers";

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
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

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

describe("Footer links (ru): все href ведут на существующие маршруты без 404", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("Sanity: footer_links содержит непустые группы и валидные href", () => {
    const links = allFooterLinks();
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      expect(l.label, `пустой label у ссылки ${JSON.stringify(l)}`).toBeTruthy();
      expect(l.href, `пустой href у ссылки ${JSON.stringify(l)}`).toBeTruthy();
      expect(
        l.href.startsWith("#") || l.href.startsWith("/"),
        `неожиданный формат href: ${l.href}`,
      ).toBe(true);
    }
  });

  it("Якорные ссылки футера: соответствующая секция главной существует и её section-title на русском", () => {
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
      expect(section, `секция #${meta.sectionId} (для ${link.href}) не найдена`).not.toBeNull();

      const title = document.querySelector<HTMLElement>(
        `[data-testid="section-title"][data-section="${meta.sectionId}"]`,
      );
      expect(title, `section-title для ${meta.sectionId} не найден`).not.toBeNull();
      expect(title!.textContent).toBe(translations.ru[meta.titleKey] as string);
    }

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
  });

  it("Каждый /-маршрут из footer_links: рендерится без 404, локаль ru сохранена, есть непустой <h1>", () => {
    const routeLinks = allFooterLinks().filter((l) => l.href.startsWith("/"));
    expect(routeLinks.length).toBeGreaterThan(0);

    const ruNotFoundTitle = translations.ru.notFound_title;
    const ruNotFoundSubtitle = translations.ru.notFound_subtitle;

    for (const link of routeLinks) {
      localStorage.setItem(STORAGE_KEY, "ru");

      let api!: Api;
      renderApp((a) => (api = a), link.href);

      // Локаль не сбросилась.
      expect(screen.getByTestId("lang").textContent, `lang сбросился на ${link.href}`).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${link.href}`).toBe("ru");

      // НЕ 404.
      const pageTitleNodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-testid="page-title"]'),
      );
      for (const t of pageTitleNodes) {
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

      // На странице есть какой-то заголовок — компонент реально отрисовался.
      const headings = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"));
      const hasNonEmptyHeading = headings.some((h) => (h.textContent ?? "").trim().length > 0);
      expect(
        hasNonEmptyHeading,
        `маршрут ${link.href} не отрендерил ни одного непустого <h1>/<h2> — вероятно, упал в 404`,
      ).toBe(true);

      cleanup();
      document.body.innerHTML = "";
      localStorage.clear();
    }
  });
});
