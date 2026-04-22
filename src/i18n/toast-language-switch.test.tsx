/**
 * Проверяет, что после смены языка в UI (без перезагрузки) последующие
 * валидационные toast-уведомления в форме регистрации приходят на
 * выбранном языке.
 *
 * Сценарий:
 *  1. navigator.language = ru-RU, localStorage пуст → автодетект ru.
 *  2. Submit RegisterEmail с email "taken@yorso.test" → ожидаемый toast
 *     EMAIL_ALREADY_EXISTS приходит на русском (`reg_couldNotContinue`).
 *  3. Через UI вызывается `setLang("en")`.
 *  4. Повторный submit того же email → новый toast приходит на английском.
 *  5. Аналогично для `setLang("es")`.
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

/** Слот, через который тест получает доступ к setLang. */
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

const getToastText = () =>
  document.querySelector("[data-sonner-toaster]")?.textContent ?? "";

/**
 * Возвращает текст ПОСЛЕДНЕГО (самого нового) toast в контейнере Sonner.
 * Sonner оставляет угасающие старые toasts в DOM — для проверки «новый
 * toast пришёл на новом языке» правильно смотреть именно последний узел.
 */
const getLatestToastText = () => {
  const toasts = document.querySelectorAll<HTMLElement>(
    "[data-sonner-toaster] [data-sonner-toast]",
  );
  if (toasts.length === 0) return "";
  return toasts[toasts.length - 1].textContent ?? "";
};


describe("Validation toasts follow current language after in-UI switch", () => {
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

  it("ru → en: после смены языка в UI новый toast приходит на английском", async () => {
    let setLang!: (l: Language) => void;
    renderRegisterEmail((s) => (setLang = s));

    // 1) Автодетект ru → русский toast.
    submitEmail("taken@yorso.test");
    await waitFor(
      () => expect(getToastText()).toContain(translations.ru.reg_couldNotContinue),
      { timeout: 3000 },
    );
    expect(getToastText()).not.toContain(translations.en.reg_couldNotContinue);

    // 2) Переключаем язык в UI (toast от прошлого submit может ещё висеть —
    //    это ОК: мы дождёмся, что в контейнере появится строка нового языка).
    act(() => setLang("en"));

    // 3) Повторный submit с другим email-триггером (чтобы Sonner не дедуплицировал
    //    toast по идентичному содержимому). Здесь — SERVER_ERROR-кейс,
    //    но заголовок берётся из того же ключа `t.reg_couldNotContinue`,
    //    значит должен прийти на английском.
    submitEmail("blocked@yorso.test");
    await new Promise((r) => setTimeout(r, 1500));
    // eslint-disable-next-line no-console
    console.log("[debug ru→en] toaster:", document.querySelector("[data-sonner-toaster]")?.textContent);
    // eslint-disable-next-line no-console
    console.log("[debug ru→en] toasts count:", document.querySelectorAll("[data-sonner-toaster] [data-sonner-toast]").length);
    await waitFor(
      () => expect(getLatestToastText()).toContain(translations.en.reg_couldNotContinue),
      { timeout: 3000 },
    );
    const latest = getLatestToastText();
    expect(latest).toContain(translations.en.reg_couldNotContinue);
    expect(latest).not.toContain(translations.ru.reg_couldNotContinue);
  });

  it("ru → es: после смены языка в UI новый toast приходит на испанском", async () => {
    let setLang!: (l: Language) => void;
    renderRegisterEmail((s) => (setLang = s));

    submitEmail("taken@yorso.test");
    await waitFor(
      () => expect(getToastText()).toContain(translations.ru.reg_couldNotContinue),
      { timeout: 3000 },
    );

    act(() => setLang("es"));

    submitEmail("blocked@yorso.test");
    await waitFor(
      () => expect(getLatestToastText()).toContain(translations.es.reg_couldNotContinue),
      { timeout: 3000 },
    );
    const latest = getLatestToastText();
    expect(latest).toContain(translations.es.reg_couldNotContinue);
    expect(latest).not.toContain(translations.ru.reg_couldNotContinue);
    expect(latest).not.toContain(translations.en.reg_couldNotContinue);
  });

  it("Смена языка обновляет также inline-валидацию (некорректный email)", () => {
    let setLang!: (l: Language) => void;
    renderRegisterEmail((s) => (setLang = s));

    // Стартуем на ru-автодетекте.
    submitEmail("not-an-email");
    expect(document.body.textContent ?? "").toContain(translations.ru.reg_emailInvalid);

    act(() => setLang("en"));
    submitEmail("still-not-an-email");
    expect(document.body.textContent ?? "").toContain(translations.en.reg_emailInvalid);
    expect(document.body.textContent ?? "").not.toContain(translations.ru.reg_emailInvalid);
  });
});
