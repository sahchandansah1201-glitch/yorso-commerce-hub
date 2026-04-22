/**
 * Проверяет, что после `setLang('ru')` неизвестные маршруты рендерят
 * локализованную страницу NotFound (404) с русским заголовком и не
 * сбрасывают локаль обратно на en.
 *
 * Покрытые сценарии:
 *   1) Прямой вход на /some-unknown-route при уже выбранной ru → 404 на русском.
 *   2) Несколько разных несуществующих путей подряд (глубокие, с query, кейс-
 *      вариации, вложенные) — каждый показывает русский 404, lang остаётся ru.
 *   3) Переход с главной на 404 и обратно сохраняет ru в localStorage и в UI.
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
  "/profile", // нет в роутере — тоже 404
  "/offers/NOT_A_REAL_ID/extra",
  "/register/email/extra-segment",
  "/RANDOM?foo=bar&baz=1",
];

describe("Locale ru сохраняется на несуществующих маршрутах и 404-страница локализована", () => {
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

  it("Прямой вход на несуществующий маршрут при сохранённой ru-локали показывает русский 404", () => {
    // Предзаполняем storage — имитируем возврат пользователя, который уже выбирал ru.
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/totally-missing-page");

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    const body = document.body.textContent ?? "";
    expect(body).toContain(translations.ru.notFound_subtitle);
    expect(body).toContain(translations.ru.notFound_returnHome);
    // Английская версия НЕ должна присутствовать.
    expect(body).not.toContain(translations.en.notFound_subtitle);
    expect(body).not.toContain(translations.en.notFound_returnHome);
  });

  it("Переход на несколько несуществующих маршрутов не сбрасывает ru и каждый раз показывает локализованный 404", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    // Включаем ru после старта (как если бы пользователь выбрал язык вручную).
    act(() => api.setLang("ru"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expect(screen.getByTestId("lang").textContent).toBe("ru");

    for (const path of UNKNOWN_PATHS) {
      act(() => api.navigateTo(path));

      expect(screen.getByTestId("lang").textContent, `lang сбросился на ${path}`).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

      const body = document.body.textContent ?? "";
      expect(body, `Русский subtitle отсутствует на ${path}`).toContain(translations.ru.notFound_subtitle);
      expect(body, `Русская ссылка "Вернуться на главную" отсутствует на ${path}`).toContain(
        translations.ru.notFound_returnHome,
      );
      // En/Es версии не должны попадать в тот же 404.
      expect(body).not.toContain(translations.en.notFound_subtitle);
      expect(body).not.toContain(translations.en.notFound_returnHome);
      expect(body).not.toContain(translations.es.notFound_subtitle);
      expect(body).not.toContain(translations.es.notFound_returnHome);
    }
  });

  it("Возврат с 404 на главную и повторный переход на 404 сохраняют ru", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    // На 404
    act(() => api.navigateTo("/unknown-1"));
    expect(document.body.textContent ?? "").toContain(translations.ru.notFound_subtitle);

    // Обратно на /
    act(() => api.navigateTo("/"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expect(document.body.textContent ?? "").toContain(translations.ru.hero_title1);

    // Ещё раз на другой 404
    act(() => api.navigateTo("/another-missing"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expect(document.body.textContent ?? "").toContain(translations.ru.notFound_subtitle);
    expect(document.body.textContent ?? "").not.toContain(translations.en.notFound_subtitle);
  });
});
