/**
 * Проверяет, что при автоопределении ru через navigator.language
 * toast-уведомления в потоке регистрации (SignUp / RegisterEmail)
 * локализованы на русский и не содержат английских аналогов.
 *
 * Сценарий: пользователь вводит email с заранее сконфигурированной
 * мок-ошибкой (`taken@yorso.test` → EMAIL_ALREADY_EXISTS,
 * `blocked@yorso.test` → SERVER_ERROR). RegisterEmail вызывает
 * `toast.error(t.reg_couldNotContinue, { description: result.message })`.
 * Заголовок берётся из translations и должен быть русским.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations } from "@/i18n/translations";
import RegisterEmail from "@/pages/register/RegisterEmail";

const REG_STORAGE_KEY = "yorso_registration";

const seedRegistration = () => {
  // Гард RegisterEmail требует выбранную роль.
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

const renderRegisterEmail = () =>
  render(
    <MemoryRouter initialEntries={["/register/email"]}>
      <LanguageProvider>
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

describe("SignUp toasts are localized to ru when navigator.language=ru-RU", () => {
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

  it("EMAIL_ALREADY_EXISTS: заголовок toast — на русском, без английского", async () => {
    renderRegisterEmail();
    submitEmail("taken@yorso.test");

    await waitFor(
      () => {
        expect(getToastText()).toContain(translations.ru.reg_couldNotContinue);
      },
      { timeout: 3000 },
    );

    const text = getToastText();
    expect(text).toContain(translations.ru.reg_couldNotContinue);
    expect(text).not.toContain(translations.en.reg_couldNotContinue);
    expect(text).not.toContain(translations.es.reg_couldNotContinue);
  });

  it("SERVER_ERROR: заголовок toast — на русском, без английского", async () => {
    renderRegisterEmail();
    submitEmail("blocked@yorso.test");

    await waitFor(
      () => {
        expect(getToastText()).toContain(translations.ru.reg_couldNotContinue);
      },
      { timeout: 3000 },
    );

    const text = getToastText();
    expect(text).toContain(translations.ru.reg_couldNotContinue);
    expect(text).not.toContain(translations.en.reg_couldNotContinue);
  });

  it("Placeholder поля email — на русском при автоопределении ru", () => {
    renderRegisterEmail();
    const input = document.querySelector<HTMLInputElement>('input[type="email"]');
    expect(input?.getAttribute("placeholder")).toBe(translations.ru.reg_emailPlaceholder);
    expect(input?.getAttribute("placeholder")).not.toBe(translations.en.reg_emailPlaceholder);
  });

  it("Inline-валидация (некорректный email) — на русском", async () => {
    renderRegisterEmail();
    submitEmail("not-an-email");

    await waitFor(() => {
      expect(document.body.textContent ?? "").toContain(translations.ru.reg_emailInvalid);
    });
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(translations.en.reg_emailInvalid);
  });
});
