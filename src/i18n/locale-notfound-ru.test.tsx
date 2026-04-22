/**
 * Проверяет, что после `setLang('ru')` неизвестные маршруты рендерят
 * локализованную страницу NotFound (404) с русским заголовком и не
 * сбрасывают локаль обратно на en.
 *
 * Для стабильности проверяем конкретные элементы:
 *   - [data-testid="page-title"]      — "404"
 *   - [data-testid="page-subtitle"]   — "Упс! Страница не найдена"
 *   - [data-testid="page-home-link"]  — "Вернуться на главную"
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const UNKNOWN_PATHS = [
  "/some-unknown-route",
  "/does/not/exist",
  "/profile",
  "/offers/NOT_A_REAL_ID/extra",
  "/register/email/extra-segment",
  "/RANDOM?foo=bar&baz=1",
];

/** Забирает page-title НЕ из главной (hero). На 404 он единственный. */
const getNotFoundTitle = () => screen.getByTestId("page-title");
const getNotFoundSubtitle = () => screen.getByTestId("page-subtitle");
const getNotFoundHomeLink = () => screen.getByTestId("page-home-link");

const assertRuNotFoundPage = () => {
  expect(getNotFoundTitle().textContent ?? "").toBe(translations.ru.notFound_title);
  expect(getNotFoundSubtitle().textContent ?? "").toBe(translations.ru.notFound_subtitle);
  expect(getNotFoundHomeLink().textContent?.trim() ?? "").toBe(translations.ru.notFound_returnHome);

  // En/Es-версии НЕ должны проскакивать в эти элементы.
  expect(getNotFoundSubtitle().textContent ?? "").not.toContain(translations.en.notFound_subtitle);
  expect(getNotFoundSubtitle().textContent ?? "").not.toContain(translations.es.notFound_subtitle);
  expect(getNotFoundHomeLink().textContent ?? "").not.toContain(translations.en.notFound_returnHome);
  expect(getNotFoundHomeLink().textContent ?? "").not.toContain(translations.es.notFound_returnHome);
};

describe("Locale ru: 404/NotFound — стабильные проверки через data-testid", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("Прямой вход на несуществующий маршрут при сохранённой ru-локали — русский 404", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/totally-missing-page");

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    assertRuNotFoundPage();
  });

  it("Серия несуществующих маршрутов не сбрасывает ru и каждый раз показывает локализованный 404", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    for (const path of UNKNOWN_PATHS) {
      act(() => api.navigateTo(path));
      expect(screen.getByTestId("lang").textContent, `lang сбросился на ${path}`).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
      assertRuNotFoundPage();
    }
  });

  it("Циклы / ↔ 404 сохраняют ru и локализованные заголовки", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    // 1) → 404
    act(() => api.navigateTo("/unknown-1"));
    assertRuNotFoundPage();

    // 2) → / (Hero). page-title должен быть hero_title1.
    act(() => api.navigateTo("/"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    const heroTitles = screen.getAllByTestId("page-title");
    expect(heroTitles.length).toBeGreaterThan(0);
    expect(heroTitles[0].textContent ?? "").toContain(translations.ru.hero_title1);

    // 3) → другой 404.
    act(() => api.navigateTo("/another-missing"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    assertRuNotFoundPage();
  });
});
