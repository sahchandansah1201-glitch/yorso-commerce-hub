/**
 * Сторож для логики fallback в LanguageContext.
 *
 * Контракт (закреплён в `src/i18n/LanguageContext.tsx`):
 *   список = [navigator.language, ...navigator.languages]
 *   → берётся ПЕРВЫЙ поддерживаемый код (ru | es | en).
 *
 * Поэтому navigator.language имеет приоритет над navigator.languages.
 * Этот файл фиксирует поведение крайних кейсов, чтобы случайные правки
 * порядка не сломали мультиязычный onboarding.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";

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

const Probe = () => {
  const { lang } = useLanguage();
  return <span data-testid="lang">{lang}</span>;
};

const renderProbe = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("Fallback rules: navigator.language vs navigator.languages priority", () => {
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

  it("language='ru-RU' + languages=['en-US', 'en'] → ru (language имеет приоритет)", () => {
    setBrowserLanguages("ru-RU", ["en-US", "en"]);
    renderProbe();
    expect(screen.getByTestId("lang").textContent).toBe("ru");
  });

  it("Зеркальный кейс: language='en-US' + languages=['ru-RU', 'ru'] → en", () => {
    setBrowserLanguages("en-US", ["ru-RU", "ru"]);
    renderProbe();
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });

  it("Неподдерживаемый language='fr-FR' + languages=['en-US', 'ru'] → en (первый поддерживаемый из списка)", () => {
    setBrowserLanguages("fr-FR", ["en-US", "ru"]);
    renderProbe();
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });

  it("Неподдерживаемый language='fr-FR' + languages=['ru-RU', 'en'] → ru (порядок в списке решает)", () => {
    setBrowserLanguages("fr-FR", ["ru-RU", "en"]);
    renderProbe();
    expect(screen.getByTestId("lang").textContent).toBe("ru");
  });

  it("Все варианты не поддержаны (fr-FR / it / de) → fallback en", () => {
    setBrowserLanguages("fr-FR", ["it-IT", "de-DE"]);
    renderProbe();
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });

  it("Сохранённый localStorage='es' перекрывает любую комбинацию navigator.*", () => {
    localStorage.setItem("yorso-lang", "es");
    setBrowserLanguages("ru-RU", ["en-US", "ru"]);
    renderProbe();
    expect(screen.getByTestId("lang").textContent).toBe("es");
  });

  it("Региональный код 'es-419' (Latin America) распознаётся как es", () => {
    setBrowserLanguages("es-419", ["es-419", "es", "en"]);
    renderProbe();
    expect(screen.getByTestId("lang").textContent).toBe("es");
  });
});
