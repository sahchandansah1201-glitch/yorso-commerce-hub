/**
 * Проверяет, что после `setLang('ru')` локаль ru сохраняется при
 * последовательном проходе по ВСЕМ подстраницам регистрации
 * (/register → /register/email → /register/verify → /register/details
 * → /register/onboarding → /register/countries → /register/ready),
 * и на каждой подстранице виден ключевой русский заголовок/подзаголовок.
 *
 * Подстраницы регистрации защищены `useRegistrationGuard`, который
 * редиректит назад при отсутствии нужных данных в RegistrationContext.
 * Чтобы изолированно проверить i18n каждой страницы, мы предварительно
 * заполняем контекст валидными mock-данными через `setFields`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";

// canvas-confetti использует HTMLCanvasElement.getContext, который не реализован
// в jsdom. На /register/ready запускается confetti — мокаем его no-op'ом.
vi.mock("canvas-confetti", () => ({ default: () => undefined }));
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import {
  RegistrationProvider,
  useRegistration,
  type RegistrationData,
} from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import RegisterChoose from "@/pages/register/RegisterChoose";
import RegisterEmail from "@/pages/register/RegisterEmail";
import RegisterVerify from "@/pages/register/RegisterVerify";
import RegisterDetails from "@/pages/register/RegisterDetails";
import RegisterOnboarding from "@/pages/register/RegisterOnboarding";
import RegisterCountries from "@/pages/register/RegisterCountries";
import RegisterReady from "@/pages/register/RegisterReady";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? [primary],
    configurable: true,
  });
};

type ProbeApi = {
  setLang: (l: Language) => void;
  navigateTo: (p: string) => void;
  seedRegistration: (fields: Partial<RegistrationData>) => void;
};

const Probe = ({ onReady }: { onReady: (api: ProbeApi) => void }) => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const { setFields } = useRegistration();
  onReady({
    setLang,
    navigateTo: (p) => navigate(p),
    seedRegistration: (fields) => setFields(fields),
  });
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (onReady: (api: ProbeApi) => void) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <Probe onReady={onReady} />
            <Routes>
              <Route path="/register" element={<RegisterChoose />} />
              <Route path="/register/email" element={<RegisterEmail />} />
              <Route path="/register/verify" element={<RegisterVerify />} />
              <Route path="/register/details" element={<RegisterDetails />} />
              <Route path="/register/onboarding" element={<RegisterOnboarding />} />
              <Route path="/register/countries" element={<RegisterCountries />} />
              <Route path="/register/ready" element={<RegisterReady />} />
              <Route path="/" element={<div data-testid="home" />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

/**
 * Полностью валидные mock-данные регистрации, удовлетворяющие
 * требованиям всех STEP_REQUIREMENTS из use-registration-guard.
 */
const FULL_REG: Partial<RegistrationData> = {
  role: "buyer",
  sessionId: "test-session",
  email: "buyer@example.com",
  emailVerified: true,
  fullName: "Иван Иванов",
  company: "ООО Тест",
  password: "Password1",
  country: "RU",
  vatTin: "1234567890",
  phone: "+79991234567",
  phoneVerified: true,
  categories: ["salmon"],
  certifications: [],
  countries: ["NO"],
  volume: "10t",
};

type Step = {
  path: string;
  /** Один или несколько ключей переводов; должна совпасть хотя бы одна подстрока. */
  ruKeys: Array<keyof typeof translations.ru>;
};

/**
 * Для /register/ready ключ `reg_welcome` — это шаблон с {name}.
 * На странице рендерится "Добро пожаловать, Иван!" — поэтому проверяем
 * подстроку до "{name}" ("Добро пожаловать, ").
 */
const STEPS: Step[] = [
  { path: "/register", ruKeys: ["reg_chooseSubtitle"] },
  { path: "/register/email", ruKeys: ["reg_emailSubtitle"] },
  { path: "/register/verify", ruKeys: ["reg_checkInbox"] },
  { path: "/register/details", ruKeys: ["reg_detailsSubtitleBuyer"] },
  { path: "/register/onboarding", ruKeys: ["reg_onboardingSubtitleBuyer"] },
  { path: "/register/countries", ruKeys: ["reg_countriesSubtitleBuyer"] },
  { path: "/register/ready", ruKeys: ["reg_welcome"] },
];

const ruTextFor = (key: keyof typeof translations.ru): string => {
  const raw = translations.ru[key] as string;
  // Срезаем placeholder вида {name}/{role}, оставляя стабильный префикс.
  const cut = raw.indexOf("{");
  return cut === -1 ? raw : raw.slice(0, cut).trim();
};

describe("Locale ru сохраняется на всех подстраницах регистрации", () => {
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

  it("на каждой подстранице регистрации виден русский заголовок и lang === 'ru'", () => {
    let api!: ProbeApi;
    renderApp((a) => (api = a));

    // Включаем ru и заполняем данные регистрации, чтобы пройти все guards.
    act(() => api.setLang("ru"));
    act(() => api.seedRegistration(FULL_REG));

    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expect(screen.getByTestId("lang").textContent).toBe("ru");

    for (const step of STEPS) {
      act(() => api.navigateTo(step.path));

      // 1) Локаль не сбрасывается.
      expect(
        screen.getByTestId("lang").textContent,
        `lang сбросился на маршруте ${step.path}`,
      ).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

      // 2) Хотя бы один ключевой русский фрагмент присутствует на странице.
      const body = document.body.textContent ?? "";
      const matched = step.ruKeys.some((k) => body.includes(ruTextFor(k)));
      expect(
        matched,
        `На ${step.path} не найден ни один из русских ключей: ${step.ruKeys
          .map((k) => `"${ruTextFor(k)}"`)
          .join(", ")}`,
      ).toBe(true);

      // 3) Английская версия первого ключа не должна просочиться.
      const enText = translations.en[step.ruKeys[0]] as string;
      const enClean = enText.indexOf("{") === -1 ? enText : enText.slice(0, enText.indexOf("{")).trim();
      const ruClean = ruTextFor(step.ruKeys[0]);
      if (enClean && enClean !== ruClean) {
        expect(body, `Английский текст "${enClean}" не должен присутствовать на ${step.path}`).not.toContain(enClean);
      }
    }
  });

  it("обратный обход подстраниц регистрации тоже не сбрасывает ru", () => {
    let api!: ProbeApi;
    renderApp((a) => (api = a));

    act(() => api.setLang("ru"));
    act(() => api.seedRegistration(FULL_REG));

    for (const step of [...STEPS].reverse()) {
      act(() => api.navigateTo(step.path));
      expect(screen.getByTestId("lang").textContent).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
      const body = document.body.textContent ?? "";
      const matched = step.ruKeys.some((k) => body.includes(ruTextFor(k)));
      expect(matched, `На ${step.path} (обратный проход) не найден русский заголовок`).toBe(true);
    }
  });
});
