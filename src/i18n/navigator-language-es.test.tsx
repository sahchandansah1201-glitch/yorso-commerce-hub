/**
 * Проверяет, что при отсутствии сохранённой локали в localStorage
 * приложение корректно определяет es по navigator.language и отображает
 * подсказки (aria-label / placeholder) и toast-уведомления на испанском.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import Header from "@/components/landing/Header";
import SignIn from "@/pages/SignIn";

/** Подменяем navigator.language / languages для имитации браузера. */
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

const renderAuto = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        {ui}
        <Sonner />
      </LanguageProvider>
    </MemoryRouter>,
  );

/** Маленький компонент-зонд: показывает текущий код языка из контекста. */
const LangProbe = () => {
  const { lang } = useLanguage();
  return <span data-testid="lang-probe">{lang}</span>;
};

describe("Auto-detected es locale via navigator.language", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("LanguageContext выбирает es при navigator.language = 'es-ES' и пустом localStorage", () => {
    setBrowserLanguages("es-ES", ["es-ES", "es", "en"]);
    renderAuto(<LangProbe />);
    expect(screen.getByTestId("lang-probe").textContent).toBe("es");
  });

  it("LanguageContext выбирает es при navigator.language = 'es-MX' (региональный вариант)", () => {
    setBrowserLanguages("es-MX", ["es-MX", "es"]);
    renderAuto(<LangProbe />);
    expect(screen.getByTestId("lang-probe").textContent).toBe("es");
  });

  it("Header показывает испанский aria-label при автоопределении es", () => {
    setBrowserLanguages("es-ES");
    renderAuto(<Header />);
    expect(
      screen.getByRole("button", { name: translations.es.aria_toggleMenu }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: translations.en.aria_toggleMenu }),
    ).not.toBeInTheDocument();
  });

  it("Подсказки SignIn (placeholder email) — на испанском при автоопределении es", () => {
    setBrowserLanguages("es-ES");
    renderAuto(<SignIn />);
    const placeholders = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[placeholder]"),
    ).map((i) => i.getAttribute("placeholder") ?? "");
    expect(placeholders).toContain(translations.es.signin_emailPlaceholder);
    expect(placeholders).not.toContain(translations.en.signin_emailPlaceholder);
  });

  it("Toast валидации SignIn рендерится на испанском (Sonner) при автоопределении es", async () => {
    setBrowserLanguages("es-ES");
    renderAuto(<SignIn />);

    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(
      () => {
        const region = document.querySelector("[data-sonner-toaster]");
        expect(region?.textContent ?? "").toContain(translations.es.signin_fillAll);
      },
      { timeout: 1500 },
    );

    const toastText = document.querySelector("[data-sonner-toaster]")?.textContent ?? "";
    expect(toastText).not.toContain(translations.en.signin_fillAll);
    expect(toastText).not.toContain(translations.ru.signin_fillAll);
  });

  it("Сохранённая локаль в localStorage перекрывает navigator.language = es", () => {
    localStorage.setItem("yorso-lang", "en");
    setBrowserLanguages("es-ES");
    renderAuto(<LangProbe />);
    expect(screen.getByTestId("lang-probe").textContent).toBe("en");
  });
});
