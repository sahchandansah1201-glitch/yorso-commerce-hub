/**
 * Усиленная проверка локализации toast-уведомлений в форме регистрации.
 *
 * В отличие от `toast-language-switch.test.tsx`, который проверяет лишь
 * присутствие перевода title в контейнере Sonner, здесь мы убеждаемся, что:
 *
 *  1. TITLE последнего toast РОВНО равен переводу `reg_couldNotContinue`
 *     текущего языка (а не просто «содержит» его — так мы исключаем кейс,
 *     когда в DOM остался старый toast со старым языком и совпадение
 *     случайно).
 *  2. BODY (description) toast также локализован под текущий язык:
 *     для inline-валидации `reg_emailInvalid` (полностью клиентская
 *     валидация — гарантированно локализована) и не содержит переводов
 *     других языков.
 *  3. Ни TITLE, ни BODY последнего toast не содержат строк из других
 *     языков (no-cross-locale-leak).
 *
 * Сценарий: автодетект ru → переключаем на en → переключаем на es,
 * на каждом шаге триггерим заново и валидируем title+body.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";
import RegisterEmail from "@/pages/register/RegisterEmail";

const REG_STORAGE_KEY = "yorso_registration";

const seedRegistration = () => {
  sessionStorage.setItem(
    REG_STORAGE_KEY,
    JSON.stringify({
      role: "buyer",
      email: "",
      emailVerified: false,
      fullName: "",
      company: "",
      password: "",
      country: "",
      vatTin: "",
      phoneVerified: false,
    }),
  );
};

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

const ExposeSetter = ({ onReady }: { onReady: (s: (l: Language) => void) => void }) => {
  const { setLang } = useLanguage();
  onReady(setLang);
  return null;
};

const renderRegisterEmail = (onReady: (s: (l: Language) => void) => void) =>
  render(
    <MemoryRouter initialEntries={["/register/email"]}>
      <LanguageProvider>
        <ExposeSetter onReady={onReady} />
        <TooltipProvider>
          <RegistrationProvider>
            <Routes>
              <Route path="/register/email" element={<RegisterEmail />} />
            </Routes>
            <Sonner />
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const submitEmail = (value: string) => {
  const input = document.querySelector<HTMLInputElement>('input[type="email"]');
  expect(input).not.toBeNull();
  fireEvent.change(input!, { target: { value } });
  const form = document.querySelector("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
};

/**
 * Дожидается, пока форма регистрации перейдёт в idle-состояние:
 *  - submit-кнопка не `disabled` (loading=false в RegisterEmail)
 *  - спиннер `.animate-spin` (Loader2) исчез из DOM
 *  - текст кнопки больше не содержит `reg_checking` ни на одном языке
 *
 * Это устраняет flakiness, когда тест проверяет следующий toast,
 * пока предыдущий запрос startRegistration ещё в полёте (mock latency 700ms)
 * или пока React не успел снять loading-state.
 */
const waitForIdle = async () => {
  await waitFor(() => {
    const button = document.querySelector<HTMLButtonElement>("button[type='submit']");
    expect(button).not.toBeNull();
    expect(button!.disabled).toBe(false);
    expect(document.querySelector(".animate-spin")).toBeNull();
    const btnText = button!.textContent ?? "";
    expect(btnText).not.toContain(translations.en.reg_checking);
    expect(btnText).not.toContain(translations.ru.reg_checking);
    expect(btnText).not.toContain(translations.es.reg_checking);
  }, { timeout: 5000 });
};

/**
 * Возвращает строго САМЫЙ ВЕРХНИЙ (= самый свежий) toast и из него выделяет
 * title и description через data-атрибуты Sonner.
 *
 * Sonner размечает структуру так:
 *   [data-sonner-toast]
 *     [data-title]   → заголовок
 *     [data-description] → тело (если передано через `{ description }`)
 */
const getLatestToastParts = () => {
  const toasts = document.querySelectorAll<HTMLElement>(
    "[data-sonner-toaster] [data-sonner-toast]",
  );
  if (toasts.length === 0) return { title: "", description: "", raw: "" };
  const latest = toasts[0];
  const title =
    latest.querySelector<HTMLElement>("[data-title]")?.textContent?.trim() ?? "";
  const description =
    latest.querySelector<HTMLElement>("[data-description]")?.textContent?.trim() ?? "";
  return { title, description, raw: latest.textContent ?? "" };
};

const otherLangs = (current: Language): Language[] =>
  (["en", "ru", "es"] as Language[]).filter((l) => l !== current);

describe("Toast title AND body match the current language after switching", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("ru-RU", ["ru-RU", "ru", "en"]);
    seedRegistration();
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  /**
   * API-ошибка (taken@yorso.test → EMAIL_ALREADY_EXISTS): проверяем, что TITLE
   * последнего toast РОВНО равен `t.reg_couldNotContinue` текущего языка
   * и не содержит переводов из других языков.
   */
  it("API-error toast: title strictly matches current language at ru → en → es", async () => {
    let setLang!: (l: Language) => void;
    renderRegisterEmail((s) => (setLang = s));

    // Дожидаемся, что начальный рендер формы стабилен (нет спиннера, кнопка enabled).
    await waitForIdle();

    // ── ru ──────────────────────────────────────────────────────────────────
    submitEmail("taken@yorso.test");
    await waitFor(() => {
      const { title } = getLatestToastParts();
      expect(title).toBe(translations.ru.reg_couldNotContinue);
    }, { timeout: 3000 });
    // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: ждём, пока запрос startRegistration завершится
    // (loading=false, спиннер ушёл). Без этого следующий submit может быть
    // отброшен `disabled`-кнопкой или интерферировать с прошлым pending-запросом.
    await waitForIdle();
    {
      const { title } = getLatestToastParts();
      expect(title).toBe(translations.ru.reg_couldNotContinue);
      for (const other of otherLangs("ru")) {
        expect(title).not.toContain(translations[other].reg_couldNotContinue);
      }
    }

    // ── ru → en ─────────────────────────────────────────────────────────────
    act(() => setLang("en"));
    submitEmail("blocked@yorso.test");
    await waitFor(() => {
      const { title } = getLatestToastParts();
      expect(title).toBe(translations.en.reg_couldNotContinue);
    }, { timeout: 3000 });
    await waitForIdle();
    {
      const { title } = getLatestToastParts();
      expect(title).toBe(translations.en.reg_couldNotContinue);
      for (const other of otherLangs("en")) {
        expect(title).not.toContain(translations[other].reg_couldNotContinue);
      }
    }

    // ── en → es ─────────────────────────────────────────────────────────────
    act(() => setLang("es"));
    submitEmail("taken@yorso.test");
    await waitFor(() => {
      const { title } = getLatestToastParts();
      expect(title).toBe(translations.es.reg_couldNotContinue);
    }, { timeout: 3000 });
    await waitForIdle();
    {
      const { title } = getLatestToastParts();
      expect(title).toBe(translations.es.reg_couldNotContinue);
      for (const other of otherLangs("es")) {
        expect(title).not.toContain(translations[other].reg_couldNotContinue);
      }
    }
  });

  /**
   * Inline-валидация (полностью клиентская и полностью локализованная):
   * сообщение об ошибке формы — это «body» вокруг toast-уровня.
   * Проверяем, что после переключения языка inline-сообщение строго
   * соответствует текущему языку и не содержит переводов из других.
   */
  it("Inline validation body matches current language and leaks no other locale", () => {
    let setLang!: (l: Language) => void;
    renderRegisterEmail((s) => (setLang = s));

    const expectInlineErrorIn = (lang: Language) => {
      const node = document.querySelector(".text-destructive");
      expect(node).not.toBeNull();
      const text = node!.textContent?.trim() ?? "";
      expect(text).toBe(translations[lang].reg_emailInvalid);
      for (const other of otherLangs(lang)) {
        expect(text).not.toContain(translations[other].reg_emailInvalid);
      }
    };

    submitEmail("not-an-email");
    expectInlineErrorIn("ru");

    act(() => setLang("en"));
    submitEmail("still-not-an-email");
    expectInlineErrorIn("en");

    act(() => setLang("es"));
    submitEmail("aun-no-email");
    expectInlineErrorIn("es");
  });

  /**
   * Композитная проверка: после переключения языка ОДНОВРЕМЕННО
   * top-toast.title локализован и видимая локализуемая часть UI
   * (кнопка submit) тоже на текущем языке. Это исключает регрессию,
   * когда toast перерисовался, а часть страницы — нет.
   */
  it("After switch both toast title and surrounding UI render in current language", async () => {
    let setLang!: (l: Language) => void;
    renderRegisterEmail((s) => (setLang = s));

    await waitForIdle();
    act(() => setLang("es"));

    // Локализуемая часть страницы вокруг toast — кнопка continue.
    const button = document.querySelector("button[type='submit']");
    expect(button?.textContent ?? "").toContain(translations.es.reg_continue);

    submitEmail("taken@yorso.test");
    await waitFor(() => {
      const { title } = getLatestToastParts();
      expect(title).toBe(translations.es.reg_couldNotContinue);
    }, { timeout: 3000 });
    // Дожидаемся, чтобы при assert ниже кнопка уже вернулась из loading-состояния
    // (`reg_checking` → `reg_continue`) и не дала ложный fail.
    await waitForIdle();

    const { title } = getLatestToastParts();
    expect(title).toBe(translations.es.reg_couldNotContinue);
    expect(title).not.toContain(translations.en.reg_couldNotContinue);
    expect(title).not.toContain(translations.ru.reg_couldNotContinue);

    // И кнопка всё ещё на испанском (UI не «откатился» при показе toast).
    expect(button?.textContent ?? "").toContain(translations.es.reg_continue);
  });
});
