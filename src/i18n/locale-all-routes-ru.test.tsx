/**
 * Проходит по всем основным локализованным маршрутам и проверяет, что
 * после `setLang('ru')` у каждого маршрута виден стабильный элемент
 * `[data-testid="page-title"]` с корректным русским текстом. Это
 * избавляет тест от хрупких проверок по `document.body.textContent`.
 *
 * Информационные страницы (/about, /contact, /terms, …) в Phase 0 ещё
 * не локализованы — они проверяются отдельным smoke-проходом: страницы
 * рендерятся, локаль ru не сбрасывается.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, within } from "@testing-library/react";
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

// Каждый маршрут рендерит элемент [data-testid="page-title"] с текстом,
// соответствующим указанному ключу переводов.
const LOCALIZED_ROUTES: LocalizedRoute[] = [
  { path: "/", key: "hero_title1" },
  { path: "/register", key: "reg_joinYorso" },
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

/**
 * Возвращает видимый элемент page-title. На главной в DOM есть как
 * заголовок хедера, так и Hero-заголовок — нас интересует именно тот,
 * что помечен как page-title через data-testid. Если их несколько
 * (маловероятно), берём первый.
 */
const getPageTitle = (): HTMLElement => {
  const nodes = screen.getAllByTestId("page-title");
  expect(nodes.length, "Ожидался хотя бы один [data-testid=page-title]").toBeGreaterThan(0);
  return nodes[0];
};

describe("Locale ru: каждый маршрут показывает русский заголовок через [data-testid=page-title]", () => {
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

  it("На каждом локализованном маршруте [data-testid=page-title] содержит русский текст", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    for (const route of LOCALIZED_ROUTES) {
      act(() => api.navigateTo(route.path));

      expect(screen.getByTestId("lang").textContent).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

      const title = getPageTitle();
      const ruText = translations.ru[route.key] as string;
      const enText = translations.en[route.key] as string;
      const esText = translations.es[route.key] as string;

      // Основное утверждение: заголовок страницы содержит русскую версию ключа.
      expect(
        title.textContent ?? "",
        `Ожидался русский заголовок "${ruText}" на ${route.path}`,
      ).toContain(ruText);

      // En/Es-варианты НЕ должны присутствовать в заголовке.
      if (enText && enText !== ruText) {
        expect(title.textContent ?? "").not.toContain(enText);
      }
      if (esText && esText !== ruText) {
        expect(title.textContent ?? "").not.toContain(esText);
      }

      // Для /register дополнительно валидируем подзаголовок.
      if (route.path === "/register") {
        const subtitle = screen.getByTestId("page-subtitle");
        expect(subtitle.textContent ?? "").toContain(translations.ru.reg_chooseSubtitle);
      }
    }
  });

  it("Smoke: статические информационные маршруты рендерятся и не сбрасывают ru", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    for (const path of STATIC_INFO_ROUTES) {
      act(() => api.navigateTo(path));
      expect(screen.getByTestId("lang").textContent).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
      // На этих страницах page-title может не существовать (нет локализации) —
      // поэтому проверяем только, что в DOM хоть что-то отрендерилось.
      expect(within(document.body).getByRole("main") || document.body.firstChild).toBeTruthy();
    }
  });
});
