/**
 * Проверяет жизненный цикл локали:
 *  1. Без сохранённой локали приложение автоопределяет ru по navigator.language.
 *  2. Пользователь переключает язык в UI → выбор сохраняется в localStorage
 *     под ключом "yorso-lang".
 *  3. При следующем запуске сохранённая локаль перекрывает navigator.language.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { translations, type Language } from "@/i18n/translations";

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
 * Зонд + кнопка-переключатель: показывает текущий язык и текущий
 * заголовок hero, а также позволяет изменить язык извне через onReady.
 */
const Probe = ({ onReady }: { onReady?: (setter: (l: Language) => void) => void }) => {
  const { lang, setLang, t } = useLanguage();
  if (onReady) onReady(setLang);
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="hero">{t.hero_title1}</span>
    </div>
  );
};

const renderWithProvider = (onReady?: (setter: (l: Language) => void) => void) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <Probe onReady={onReady} />
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("Language switch persists to localStorage and overrides navigator.language", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("автоопределение ru → переключение на en сохраняется в localStorage", () => {
    setBrowserLanguages("ru-RU", ["ru-RU", "ru", "en"]);

    let setLang: ((l: Language) => void) | null = null;
    renderWithProvider((s) => {
      setLang = s;
    });

    // 1. Стартовая локаль — ru (из navigator), localStorage пуст.
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(screen.getByTestId("hero").textContent).toBe(translations.ru.hero_title1);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // 2. Пользователь переключает язык в UI.
    expect(setLang).not.toBeNull();
    act(() => {
      setLang!("en");
    });

    // 3. Локаль обновилась и записалась в localStorage.
    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(screen.getByTestId("hero").textContent).toBe(translations.en.hero_title1);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  it("после перезагрузки сохранённая en перекрывает navigator.language=ru-RU", () => {
    setBrowserLanguages("ru-RU", ["ru-RU", "ru", "en"]);

    // Имитация: предыдущая сессия записала "en" в localStorage.
    let setLang: ((l: Language) => void) | null = null;
    renderWithProvider((s) => {
      setLang = s;
    });
    act(() => {
      setLang!("en");
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");

    // Размонтируем и монтируем провайдер заново — это эквивалент перезагрузки.
    cleanup();
    document.body.innerHTML = "";

    // navigator всё ещё ru-RU, но localStorage уже содержит "en".
    setBrowserLanguages("ru-RU", ["ru-RU", "ru", "en"]);
    renderWithProvider();

    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(screen.getByTestId("hero").textContent).toBe(translations.en.hero_title1);
    expect(screen.getByTestId("hero").textContent).not.toBe(translations.ru.hero_title1);
  });

  it("переключение на es также персистится и переопределяет navigator при перезагрузке", () => {
    setBrowserLanguages("ru-RU", ["ru-RU", "ru"]);

    let setLang: ((l: Language) => void) | null = null;
    renderWithProvider((s) => {
      setLang = s;
    });
    expect(screen.getByTestId("lang").textContent).toBe("ru");

    act(() => {
      setLang!("es");
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("es");
    expect(screen.getByTestId("hero").textContent).toBe(translations.es.hero_title1);

    // Перезагрузка: navigator по-прежнему ru, но в storage — es.
    cleanup();
    document.body.innerHTML = "";
    setBrowserLanguages("ru-RU", ["ru-RU", "ru"]);
    renderWithProvider();

    expect(screen.getByTestId("lang").textContent).toBe("es");
    expect(screen.getByTestId("hero").textContent).toBe(translations.es.hero_title1);
  });

  it("значение в localStorage записывается ровно как код языка ('ru' | 'en' | 'es')", () => {
    setBrowserLanguages("en-US");
    let setLang: ((l: Language) => void) | null = null;
    renderWithProvider((s) => {
      setLang = s;
    });

    for (const code of ["ru", "es", "en"] as Language[]) {
      act(() => {
        setLang!(code);
      });
      expect(localStorage.getItem(STORAGE_KEY)).toBe(code);
    }
  });
});
