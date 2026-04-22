/**
 * Проверяет, что переключение языка через `setLang()` мгновенно обновляет
 * UI без перезагрузки: меняется текст hero, плейсхолдеры в формах
 * (SignIn, RegisterEmail) и `aria-label` в шапке. Никакого unmount/mount.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";
import Hero from "@/components/landing/Hero";
import Header from "@/components/landing/Header";
import SignIn from "@/pages/SignIn";
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

/**
 * Слот, через который тест получает доступ к setLang без отдельного
 * хранилища ссылок: cb сохраняется один раз, переиспользуется при перерендере.
 */
const ExposeSetter = ({ onReady }: { onReady: (s: (l: Language) => void) => void }) => {
  const { setLang } = useLanguage();
  onReady(setLang);
  return null;
};

const getPlaceholders = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>("input[placeholder]")).map(
    (i) => i.getAttribute("placeholder") ?? "",
  );

const getAriaLabels = () =>
  Array.from(document.querySelectorAll<HTMLElement>("[aria-label]")).map(
    (e) => e.getAttribute("aria-label") ?? "",
  );

describe("Language switch updates UI in-place (no reload)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });

  it("Hero: заголовки переключаются между en → ru → es без перемонтажа", () => {
    let setLang!: (l: Language) => void;
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ExposeSetter onReady={(s) => (setLang = s)} />
          <Hero />
        </LanguageProvider>
      </MemoryRouter>,
    );

    // Стартуем явно с en (localStorage пуст, навигатор в jsdom = en).
    act(() => setLang("en"));
    expect(document.body.textContent).toContain(translations.en.hero_title1);
    expect(document.body.textContent).not.toContain(translations.ru.hero_title1);

    act(() => setLang("ru"));
    expect(document.body.textContent).toContain(translations.ru.hero_title1);
    expect(document.body.textContent).toContain(translations.ru.hero_title2);
    expect(document.body.textContent).not.toContain(translations.en.hero_title1);

    act(() => setLang("es"));
    expect(document.body.textContent).toContain(translations.es.hero_title1);
    expect(document.body.textContent).not.toContain(translations.ru.hero_title1);
  });

  it("Header: aria-label кнопки меню переключается мгновенно", () => {
    let setLang!: (l: Language) => void;
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ExposeSetter onReady={(s) => (setLang = s)} />
          <TooltipProvider>
            <Header />
          </TooltipProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );

    act(() => setLang("en"));
    expect(getAriaLabels()).toContain(translations.en.aria_toggleMenu);

    act(() => setLang("ru"));
    const ruLabels = getAriaLabels();
    expect(ruLabels).toContain(translations.ru.aria_toggleMenu);
    expect(ruLabels).not.toContain(translations.en.aria_toggleMenu);

    act(() => setLang("es"));
    const esLabels = getAriaLabels();
    expect(esLabels).toContain(translations.es.aria_toggleMenu);
    expect(esLabels).not.toContain(translations.ru.aria_toggleMenu);
  });

  it("SignIn: placeholder поля email обновляется при смене языка", () => {
    let setLang!: (l: Language) => void;
    render(
      <MemoryRouter initialEntries={["/signin"]}>
        <LanguageProvider>
          <ExposeSetter onReady={(s) => (setLang = s)} />
          <Routes>
            <Route path="/signin" element={<SignIn />} />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>,
    );

    act(() => setLang("en"));
    expect(getPlaceholders()).toContain(translations.en.signin_emailPlaceholder);

    act(() => setLang("ru"));
    expect(getPlaceholders()).toContain(translations.ru.signin_emailPlaceholder);

    act(() => setLang("es"));
    expect(getPlaceholders()).toContain(translations.es.signin_emailPlaceholder);
  });

  it("RegisterEmail: placeholder и заголовок мгновенно меняются на ru", () => {
    seedRegistration();
    let setLang!: (l: Language) => void;
    render(
      <MemoryRouter initialEntries={["/register/email"]}>
        <LanguageProvider>
          <ExposeSetter onReady={(s) => (setLang = s)} />
          <TooltipProvider>
            <RegistrationProvider>
              <Routes>
                <Route path="/register/email" element={<RegisterEmail />} />
              </Routes>
            </RegistrationProvider>
          </TooltipProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );

    act(() => setLang("en"));
    expect(getPlaceholders()).toContain(translations.en.reg_emailPlaceholder);
    expect(document.body.textContent).toContain(translations.en.reg_enterEmail);

    act(() => setLang("ru"));
    expect(getPlaceholders()).toContain(translations.ru.reg_emailPlaceholder);
    expect(document.body.textContent).toContain(translations.ru.reg_enterEmail);
    expect(document.body.textContent).not.toContain(translations.en.reg_enterEmail);

    act(() => setLang("es"));
    expect(document.body.textContent).toContain(translations.es.reg_enterEmail);
  });

  it("Переключение в UI не размонтирует компонент: input сохраняет значение", () => {
    let setLang!: (l: Language) => void;
    render(
      <MemoryRouter initialEntries={["/signin"]}>
        <LanguageProvider>
          <ExposeSetter onReady={(s) => (setLang = s)} />
          <Routes>
            <Route path="/signin" element={<SignIn />} />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>,
    );

    act(() => setLang("en"));
    const emailInput = document.querySelector<HTMLInputElement>('input[type="email"]');
    expect(emailInput).not.toBeNull();
    // Эмулируем пользовательский ввод напрямую (без user-event, чтобы не плодить deps).
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(emailInput, "user@yorso.test");
      emailInput!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(emailInput!.value).toBe("user@yorso.test");

    act(() => setLang("ru"));

    // Тот же DOM-узел должен сохраниться — а значит и значение поля.
    const emailInputAfter = document.querySelector<HTMLInputElement>('input[type="email"]');
    expect(emailInputAfter).toBe(emailInput);
    expect(emailInputAfter!.value).toBe("user@yorso.test");
    // При этом placeholder уже на русском.
    expect(emailInputAfter!.getAttribute("placeholder")).toBe(
      translations.ru.signin_emailPlaceholder,
    );
  });
});
