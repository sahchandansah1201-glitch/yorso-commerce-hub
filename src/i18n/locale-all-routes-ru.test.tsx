/**
 * Проходит по всем основным локализованным маршрутам приложения и
 * проверяет, что после установки локали ru на каждой странице
 * присутствует ключевой русский заголовок/текст.
 *
 * Покрытые маршруты:
 *   - /          (Index → Hero, hero_title1)
 *   - /register  (RegisterChoose → reg_chooseSubtitle)
 *   - /signin    (SignIn → signin_title)
 *   - /offers    (Offers → offersPage_title)
 *
 * Информационные страницы (/about, /contact, /terms, /privacy и т.д.)
 * сейчас не локализованы (статический английский контент) и осознанно
 * исключены из проверки русского текста, но валидируются как
 * "не падают и сохраняют локаль ru" — отдельным smoke-проходом.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import RegisterChoose from "@/pages/register/RegisterChoose";
import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Cookies from "@/pages/Cookies";
import GDPR from "@/pages/GDPR";
import AntiFraud from "@/pages/AntiFraud";
import Careers from "@/pages/Careers";
import Press from "@/pages/Press";
import Partners from "@/pages/Partners";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? [primary],
    configurable: true,
  });
};

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
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/gdpr" element={<GDPR />} />
              <Route path="/anti-fraud" element={<AntiFraud />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/press" element={<Press />} />
              <Route path="/partners" element={<Partners />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

type LocalizedRoute = {
  path: string;
  key: keyof typeof translations.ru;
};

const LOCALIZED_ROUTES: LocalizedRoute[] = [
  { path: "/", key: "hero_title1" },
  { path: "/register", key: "reg_chooseSubtitle" },
  { path: "/signin", key: "signin_title" },
  { path: "/offers", key: "offersPage_title" },
];

const STATIC_INFO_ROUTES = [
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/gdpr",
  "/anti-fraud",
  "/careers",
  "/press",
  "/partners",
];

describe("Locale ru: ключевой русский заголовок присутствует на всех основных маршрутах", () => {
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

  it("На каждом локализованном маршруте отображается соответствующий русский текст", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expect(screen.getByTestId("lang").textContent).toBe("ru");

    for (const route of LOCALIZED_ROUTES) {
      act(() => api.navigateTo(route.path));
      const ruText = translations.ru[route.key] as string;
      const enText = translations.en[route.key] as string;
      const esText = translations.es[route.key] as string;

      expect(screen.getByTestId("lang").textContent).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

      const body = document.body.textContent ?? "";
      expect(
        body,
        `Ожидался русский текст "${ruText}" для ключа "${String(route.key)}" на маршруте ${route.path}`,
      ).toContain(ruText);

      // На локализованных страницах английских/испанских версий тех же ключей быть не должно.
      if (enText && enText !== ruText) {
        expect(body, `Английский текст "${enText}" не должен присутствовать на ${route.path}`).not.toContain(enText);
      }
      if (esText && esText !== ruText) {
        expect(body).not.toContain(esText);
      }
    }
  });

  it("Smoke: статические информационные маршруты рендерятся без падений и не сбрасывают локаль ru", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    for (const path of STATIC_INFO_ROUTES) {
      act(() => api.navigateTo(path));
      expect(screen.getByTestId("lang").textContent).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
      // Базовый smoke: на странице есть хоть какой-то контент.
      expect((document.body.textContent ?? "").length).toBeGreaterThan(0);
    }
  });
});
