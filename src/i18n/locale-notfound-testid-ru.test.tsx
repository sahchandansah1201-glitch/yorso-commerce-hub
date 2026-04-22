/**
 * Стабильная проверка ru-локали на 404/NotFound через data-testid:
 *   - На каждом несуществующем маршруте должен присутствовать ровно один
 *     элемент [data-testid="page-title"] с русским заголовком notFound_title.
 *   - Локаль ru не должна сбрасываться (ни в localStorage, ни в контексте).
 *   - Английский/испанский варианты заголовка не должны попадать в page-title.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, within } from "@testing-library/react";
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
  "/совсем-несуществующий",
  "/a/b/c/d/e/f",
];

const getNotFoundTitle = (): HTMLElement => {
  // На 404 у нас одна страница и один page-title — берём именно его.
  const nodes = screen.getAllByTestId("page-title");
  // NotFound — последний отрендеренный page-title в дереве (Index не отрисован при *-маршруте).
  return nodes[nodes.length - 1];
};

describe("404/NotFound: ru-локаль и [data-testid=page-title] на каждом неизвестном маршруте", () => {
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

  it("Прямой вход на неизвестный маршрут с сохранённой ru: page-title содержит русский notFound_title", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/totally-missing-page");

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    const title = getNotFoundTitle();
    expect(title).toBeInTheDocument();
    expect(title.textContent).toBe(translations.ru.notFound_title);

    // Доп. подтверждение: subtitle и home-link тоже на русском.
    expect(screen.getByTestId("page-subtitle").textContent).toBe(translations.ru.notFound_subtitle);
    expect(screen.getByTestId("page-home-link").textContent).toBe(translations.ru.notFound_returnHome);
  });

  it("Каждый из UNKNOWN_PATHS показывает page-title с ru notFound_title и не сбрасывает локаль", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    for (const path of UNKNOWN_PATHS) {
      act(() => api.navigateTo(path));

      // Локаль стабильна.
      expect(screen.getByTestId("lang").textContent, `lang сбросился на ${path}`).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");

      // page-title существует и содержит именно русский заголовок 404.
      const title = getNotFoundTitle();
      expect(title, `page-title отсутствует на ${path}`).toBeInTheDocument();
      expect(title.textContent, `page-title не на русском на ${path}`).toBe(translations.ru.notFound_title);
      expect(title.textContent, `page-title оказался на английском на ${path}`).not.toBe(
        translations.en.notFound_title,
      );
      expect(title.textContent, `page-title оказался на испанском на ${path}`).not.toBe(
        translations.es.notFound_title,
      );

      // page-title находится внутри отрендеренной 404-страницы (есть и subtitle/home-link рядом).
      const subtitle = screen.getByTestId("page-subtitle");
      const homeLink = screen.getByTestId("page-home-link");
      expect(subtitle.textContent).toBe(translations.ru.notFound_subtitle);
      expect(homeLink.textContent).toBe(translations.ru.notFound_returnHome);

      // Sanity: page-title и subtitle принадлежат одному контейнеру 404.
      const container = title.parentElement as HTMLElement;
      expect(within(container).getByTestId("page-subtitle")).toBe(subtitle);
    }
  });

  it("Возврат на / и повторный заход на 404 сохраняют ru-локаль и корректный page-title", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    act(() => api.navigateTo("/unknown-1"));
    expect(getNotFoundTitle().textContent).toBe(translations.ru.notFound_title);

    act(() => api.navigateTo("/"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    act(() => api.navigateTo("/another-missing"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expect(getNotFoundTitle().textContent).toBe(translations.ru.notFound_title);
  });
});
