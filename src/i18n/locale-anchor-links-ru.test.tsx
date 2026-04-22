/**
 * Кликает по якорным ссылкам на главной (#offers, #faq, #categories, #how-it-works)
 * после установки ru-локали и проверяет:
 *   - локаль не сбрасывается (lang остаётся "ru", localStorage["yorso-lang"] === "ru");
 *   - целевая секция присутствует в DOM (по id);
 *   - её заголовок [data-testid="section-title"][data-section="<id>"] локализован
 *     именно русским текстом из translations.ru;
 *   - hero [data-testid="page-title"] продолжает показывать русский hero_title1.
 *
 * Якорь моделируется кликом по <a href="#section">. В jsdom браузерный скролл
 * не выполняется, но навигация по hash и стабильность локали — да; это
 * именно то, что нам нужно проверить.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";

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

const renderHome = (onReady: (api: Api) => void) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <Probe onReady={onReady} />
            <Routes>
              <Route path="/" element={<Index />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

type AnchorCase = {
  href: string;
  sectionId: string;
  expectedRu: string;
  expectedEn: string;
  expectedEs: string;
};

const ANCHOR_CASES: AnchorCase[] = [
  {
    href: "#offers",
    sectionId: "offers",
    expectedRu: translations.ru.offers_title,
    expectedEn: translations.en.offers_title,
    expectedEs: translations.es.offers_title,
  },
  {
    href: "#faq",
    sectionId: "faq",
    expectedRu: translations.ru.faq_title,
    expectedEn: translations.en.faq_title,
    expectedEs: translations.es.faq_title,
  },
  {
    href: "#categories",
    sectionId: "categories",
    expectedRu: translations.ru.cat_title,
    expectedEn: translations.en.cat_title,
    expectedEs: translations.es.cat_title,
  },
  {
    href: "#how-it-works",
    sectionId: "how-it-works",
    expectedRu: translations.ru.verify_title,
    expectedEn: translations.en.verify_title,
    expectedEs: translations.es.verify_title,
  },
];

const findSectionTitle = (sectionId: string): HTMLElement => {
  const node = document.querySelector<HTMLElement>(
    `[data-testid="section-title"][data-section="${sectionId}"]`,
  );
  if (!node) throw new Error(`section-title for "${sectionId}" not found`);
  return node;
};

describe("Якорные ссылки главной: ru-локаль не сбрасывается, секции остаются локализованными", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    // jsdom не реализует scrollIntoView — обработчики Hero вызывают его при клике на #offers.
    if (!(Element.prototype as unknown as { scrollIntoView?: () => void }).scrollIntoView) {
      (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    } else {
      // Перетираем на no-op, чтобы реальная реализация не падала в тестовой среде.
      (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    }
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("Все 4 якорные секции имеют русский section-title после setLang('ru')", () => {
    let api!: Api;
    renderHome((a) => (api = a));

    act(() => api.setLang("ru"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expect(screen.getByTestId("lang").textContent).toBe("ru");

    for (const c of ANCHOR_CASES) {
      // Целевая секция существует.
      const section = document.getElementById(c.sectionId);
      expect(section, `секция #${c.sectionId} не найдена в DOM`).not.toBeNull();

      // Заголовок секции локализован.
      const title = findSectionTitle(c.sectionId);
      expect(title.textContent, `section-title #${c.sectionId} не на русском`).toBe(c.expectedRu);

      // Английский/испанский тексты не должны просочиться в этот конкретный заголовок.
      if (c.expectedEn !== c.expectedRu) {
        expect(title.textContent).not.toBe(c.expectedEn);
      }
      if (c.expectedEs !== c.expectedRu) {
        expect(title.textContent).not.toBe(c.expectedEs);
      }

      // Заголовок должен находиться внутри своей секции.
      expect(within(section as HTMLElement).getByTestId("section-title")).toBe(title);
    }

    // Hero page-title тоже на русском.
    const heroTitle = screen.getAllByTestId("page-title")[0];
    expect(heroTitle.textContent).toContain(translations.ru.hero_title1);
  });

  it("Клик по каждой якорной ссылке сохраняет ru и не ломает локализацию заголовков", () => {
    let api!: Api;
    renderHome((a) => (api = a));

    act(() => api.setLang("ru"));

    for (const c of ANCHOR_CASES) {
      // Находим хотя бы одну реальную якорную ссылку на странице с этим href.
      const anchor = document.querySelector<HTMLAnchorElement>(`a[href="${c.href}"]`);

      if (anchor) {
        // Кликаем по реально существующей якорной ссылке.
        act(() => {
          fireEvent.click(anchor);
        });
      } else {
        // Фолбэк: ставим hash напрямую — имитируем ручной переход к якорю.
        act(() => {
          window.history.replaceState(null, "", c.href);
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
      }

      // Локаль остаётся ru.
      expect(screen.getByTestId("lang").textContent, `lang сбросился после ${c.href}`).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился после ${c.href}`).toBe("ru");

      // Секция и её заголовок остаются на русском.
      const section = document.getElementById(c.sectionId);
      expect(section, `секция #${c.sectionId} исчезла после клика`).not.toBeNull();

      const title = findSectionTitle(c.sectionId);
      expect(title.textContent, `section-title #${c.sectionId} перестал быть русским после клика`).toBe(
        c.expectedRu,
      );

      // Hero page-title тоже не сбросился.
      const heroTitle = screen.getAllByTestId("page-title")[0];
      expect(heroTitle.textContent).toContain(translations.ru.hero_title1);
    }
  });

  it("После последовательных переходов по всем якорям hero и все секции стабильно русские", () => {
    let api!: Api;
    renderHome((a) => (api = a));

    act(() => api.setLang("ru"));

    for (const c of ANCHOR_CASES) {
      act(() => {
        window.history.replaceState(null, "", c.href);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
    }

    // Финальная проверка: всё по-прежнему ru.
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    for (const c of ANCHOR_CASES) {
      const title = findSectionTitle(c.sectionId);
      expect(title.textContent).toBe(c.expectedRu);
    }

    const heroTitle = screen.getAllByTestId("page-title")[0];
    expect(heroTitle.textContent).toContain(translations.ru.hero_title1);
  });
});
