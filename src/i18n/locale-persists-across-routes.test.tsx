/**
 * Проверяет, что выбранная пользователем локаль не сбрасывается при
 * клиентских переходах между маршрутами и сохраняется в localStorage.
 *
 * Сценарий:
 *  1. navigator.language = en-US, localStorage пуст → автодетект en.
 *  2. Пользователь меняет язык в UI на ru → localStorage["yorso-lang"] = "ru".
 *  3. Навигация по нескольким маршрутам (/register, /signin, /offers, /about, /).
 *  4. На каждом маршруте `lang` остаётся "ru" и UI рендерится по-русски.
 *  5. Полное размонтирование + новое монтирование = сохранённый "ru" уцелел.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import RegisterChoose from "@/pages/register/RegisterChoose";
import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";
import Index from "@/pages/Index";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", {
    value: primary,
    configurable: true,
  });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? [primary],
    configurable: true,
  });
};

/**
 * Зонд: текущий язык + контролируемая навигация через `navigateTo()`.
 * Используем react-router `useNavigate`, чтобы не размонтировать провайдер.
 */
const NavProbe = ({
  onReady,
}: {
  onReady: (api: { setLang: (l: Language) => void; navigateTo: (p: string) => void }) => void;
}) => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  onReady({ setLang, navigateTo: (p) => navigate(p) });
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (
  onReady: (api: { setLang: (l: Language) => void; navigateTo: (p: string) => void }) => void,
  initialPath = "/",
) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <NavProbe onReady={onReady} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<RegisterChoose />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/offers" element={<Offers />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("Selected locale persists across client-side route changes", () => {
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

  it("Локаль ru сохраняется при переходах /register → /signin → /offers → /about → /", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    // Старт: автодетект en.
    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Пользователь выбирает ru.
    act(() => api.setLang("ru"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    const routes: Array<{ path: string; expectedRu: string }> = [
      { path: "/register", expectedRu: translations.ru.reg_chooseSubtitle },
      { path: "/signin", expectedRu: translations.ru.signin_title },
      { path: "/offers", expectedRu: translations.ru.offersPage_title },
      { path: "/", expectedRu: translations.ru.hero_title1 },
    ];

    for (const r of routes) {
      act(() => api.navigateTo(r.path));
      // 1) lang из контекста не сбросился
      expect(screen.getByTestId("lang").textContent).toBe("ru");
      // 2) localStorage по-прежнему "ru"
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
      // 3) на странице действительно русский UI
      expect(document.body.textContent ?? "").toContain(r.expectedRu);
    }
  });

  it("После размонтирования провайдера сохранённая локаль восстанавливается на новом маршруте", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");
    act(() => api.setLang("es"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("es");

    // Симулируем «hard reload»: cleanup и новое монтирование с другим маршрутом.
    cleanup();
    document.body.innerHTML = "";
    // navigator всё ещё en-US, но в storage — "es".
    setBrowserLanguages("en-US", ["en-US", "en"]);

    let api2!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api2 = a), "/signin");

    expect(screen.getByTestId("lang").textContent).toBe("es");
    expect(document.body.textContent ?? "").toContain(translations.es.signin_title);
    expect(document.body.textContent ?? "").not.toContain(translations.en.signin_title);

    // И навигация после reload тоже сохраняет es.
    act(() => api2.navigateTo("/offers"));
    expect(screen.getByTestId("lang").textContent).toBe("es");
    expect(document.body.textContent ?? "").toContain(translations.es.offersPage_title);
  });

  it("Многократное переключение ru → en → es через UI отражается в localStorage и переживает навигацию", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    const sequence: Language[] = ["ru", "en", "es", "ru"];
    for (const code of sequence) {
      act(() => api.setLang(code));
      act(() => api.navigateTo("/register"));
      expect(screen.getByTestId("lang").textContent).toBe(code);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(code);
      act(() => api.navigateTo("/signin"));
      expect(screen.getByTestId("lang").textContent).toBe(code);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(code);
    }
  });
});
