/**
 * Проверяет идентификацию страницы NotFound по выделенному root-маркеру
 * ([data-testid="notfound-root"], [data-route="not-found"], role="alert"),
 * а не только по тексту заголовка/подзаголовка.
 *
 * Сценарии:
 *   1) На существующих маршрутах NotFound root отсутствует.
 *   2) На несуществующих маршрутах NotFound root присутствует ровно один,
 *      имеет корректный data-route и role, и содержит локализованные
 *      page-title/page-subtitle/home-link.
 *   3) Возврат на существующий маршрут убирает NotFound root из DOM.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import About from "@/pages/About";
import Cookies from "@/pages/Cookies";
import NotFound from "@/pages/NotFound";

const STORAGE_KEY = "yorso-lang";

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
              <Route path="/cookies" element={<Cookies />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const KNOWN_ROUTES = ["/", "/about", "/cookies"];
const UNKNOWN_ROUTES = [
  "/some-unknown-route",
  "/does/not/exist",
  "/RANDOM?foo=bar",
  "/совсем-несуществующий",
];

const queryNotFoundRoot = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-testid="notfound-root"]');

describe("NotFound root marker: дедицированный маркер используется для идентификации 404", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    localStorage.setItem(STORAGE_KEY, "ru");
  });

  afterEach(() => {
    cleanup();
  });

  it("На каждом существующем маршруте NotFound root отсутствует", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    for (const path of KNOWN_ROUTES) {
      act(() => api.navigateTo(path));

      expect(
        queryNotFoundRoot(),
        `на ${path} ошибочно найден [data-testid="notfound-root"]`,
      ).toBeNull();
      expect(
        document.querySelector('[data-route="not-found"]'),
        `на ${path} ошибочно найден [data-route="not-found"]`,
      ).toBeNull();

      // Локаль не сбросилась.
      expect(screen.getByTestId("lang").textContent).toBe("ru");
    }
  });

  it("На каждом несуществующем маршруте есть ровно один NotFound root с корректными атрибутами", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    for (const path of UNKNOWN_ROUTES) {
      act(() => api.navigateTo(path));

      const roots = document.querySelectorAll<HTMLElement>('[data-testid="notfound-root"]');
      expect(roots.length, `на ${path} ожидался 1 notfound-root, найдено ${roots.length}`).toBe(1);

      const root = roots[0];
      // Идентификация именно по dedicated маркерам, а не только по тексту.
      expect(root.getAttribute("data-route")).toBe("not-found");
      expect(root.getAttribute("role")).toBe("alert");
      expect(root.getAttribute("aria-labelledby")).toBe("notfound-heading");

      // Внутри root — те же page-title/page-subtitle/home-link на ru.
      const title = within(root).getByTestId("page-title");
      const subtitle = within(root).getByTestId("page-subtitle");
      const homeLink = within(root).getByTestId("page-home-link");

      expect(title.id).toBe("notfound-heading");
      expect(title.textContent).toBe(translations.ru.notFound_title);
      expect(subtitle.textContent).toBe(translations.ru.notFound_subtitle);
      expect(homeLink.textContent).toBe(translations.ru.notFound_returnHome);
      expect(homeLink.getAttribute("href")).toBe("/");

      // Локаль ru стабильна.
      expect(screen.getByTestId("lang").textContent).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    }
  });

  it("Переход с 404 обратно на существующий маршрут убирает notfound-root", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/missing");

    // На 404 root есть.
    expect(queryNotFoundRoot()).not.toBeNull();

    // Возвращаемся на существующий маршрут.
    act(() => api.navigateTo("/about"));

    expect(queryNotFoundRoot(), "после возврата на /about notfound-root остался в DOM").toBeNull();
    expect(document.querySelector('[data-route="not-found"]')).toBeNull();

    // Снова 404 — root появился.
    act(() => api.navigateTo("/another-missing"));
    const root = queryNotFoundRoot();
    expect(root).not.toBeNull();
    expect(root!.getAttribute("data-route")).toBe("not-found");
  });
});
