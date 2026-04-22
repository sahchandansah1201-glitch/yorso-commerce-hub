/**
 * Обходит все публичные ссылки из футера/хедера (информационные и
 * legal-страницы) и на каждой проверяет:
 *   1) `useLanguage().lang === "ru"` не сбросился,
 *   2) `localStorage["yorso-lang"] === "ru"`,
 *   3) на странице виден стабильный элемент
 *      `[data-testid="page-title"]` c текстом ИЗ ru-переводов, ЛИБО
 *      (для страниц без локализованного заголовка — fallback)
 *      `[data-testid="info-content"]` непуст.
 *
 * Тест использует перечень маршрутов непосредственно из
 * `translations.ru.footer_links` (platform/company/legal) — так мы
 * гарантируем, что проверяются именно те ссылки, которые видит
 * пользователь в футере. Внутристраничные якоря (`#offers`, `#faq` …)
 * пропускаются, их рендерит главная.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
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
import SignIn from "@/pages/SignIn";
import RegisterChoose from "@/pages/register/RegisterChoose";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? [primary],
    configurable: true,
  });
};

type Api = { setLang: (l: Language) => void; navigateTo: (p: string) => void };

const Probe = ({ onReady }: { onReady: (api: Api) => void }) => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  onReady({ setLang, navigateTo: (p) => navigate(p) });
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (onReady: (api: Api) => void) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <Probe onReady={onReady} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/register" element={<RegisterChoose />} />
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

/**
 * Соответствие маршрута ключу переводов, по которому проверяется
 * локализованный заголовок. Если для маршрута такого ключа нет —
 * используется fallback: непустой блок `[data-testid="info-content"]`.
 */
const ROUTE_TITLE_KEY: Record<string, keyof typeof translations.ru | null> = {
  "/about": "info_aboutTitle",
  "/contact": "info_contactTitle",
  "/terms": "info_termsTitle",
  "/privacy": "info_privacyTitle",
  "/cookies": "info_cookiesTitle",
  "/gdpr": "info_gdprTitle",
  "/anti-fraud": "info_antiFraudTitle",
  "/careers": "info_careersTitle",
  "/press": "info_pressTitle",
  "/partners": "info_partnersTitle",
};

/** Извлекает все внешние (начинающиеся с /) публичные ссылки футера. */
const footerExternalPaths = (): string[] => {
  const groups = translations.ru.footer_links;
  const all = [...groups.platform, ...groups.company, ...groups.legal];
  return Array.from(
    new Set(all.map((l) => l.href).filter((h) => h.startsWith("/"))),
  );
};

/** Ссылки из хедера, на которые явно ведут публичные CTA. */
const HEADER_PUBLIC_PATHS = ["/signin", "/register"];

describe("Публичные ссылки хедера/футера: ru-локаль сохраняется, заголовок локализован или есть fallback-контент", () => {
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

  it("Все внешние ссылки из footer_links показывают локализованный заголовок и не сбрасывают ru", () => {
    let api!: Api;
    renderApp((a) => (api = a));

    act(() => api.setLang("ru"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    const paths = footerExternalPaths();
    // Санити-чек: действительно получили полный список.
    expect(paths.length, "footer_links должен содержать внешние ссылки").toBeGreaterThanOrEqual(10);

    for (const path of paths) {
      act(() => api.navigateTo(path));

      // 1) Локаль ru сохранилась.
      expect(
        screen.getByTestId("lang").textContent,
        `lang сбросился при переходе на ${path}`,
      ).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

      // 2) page-title локализован по соответствующему ключу.
      const key = ROUTE_TITLE_KEY[path];
      const titles = screen.queryAllByTestId("page-title");

      if (key) {
        expect(titles.length, `На ${path} не найден [data-testid=page-title]`).toBeGreaterThan(0);
        const expected = translations.ru[key] as string;
        const actual = titles[0].textContent ?? "";
        expect(actual, `На ${path} ожидался русский заголовок "${expected}"`).toContain(expected);

        // Английский эквивалент не должен просачиваться в заголовок.
        const enText = translations.en[key] as string;
        if (enText && enText !== expected) {
          expect(actual).not.toContain(enText);
        }
      } else {
        // Fallback: локализованного ключа нет — проверяем, что контент не пуст.
        const content = screen.queryByTestId("info-content");
        expect(content, `${path}: нужен хотя бы [data-testid=info-content] fallback`).not.toBeNull();
        expect((content!.textContent ?? "").trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("Публичные ссылки из хедера (/signin, /register) тоже сохраняют ru и показывают русский заголовок", () => {
    let api!: Api;
    renderApp((a) => (api = a));

    act(() => api.setLang("ru"));

    for (const path of HEADER_PUBLIC_PATHS) {
      act(() => api.navigateTo(path));
      expect(screen.getByTestId("lang").textContent).toBe("ru");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

      const title = screen.getByTestId("page-title");
      if (path === "/signin") {
        expect(title.textContent ?? "").toContain(translations.ru.signin_title);
        expect(title.textContent ?? "").not.toContain(translations.en.signin_title);
      } else {
        expect(title.textContent ?? "").toContain(translations.ru.reg_joinYorso);
        expect(title.textContent ?? "").not.toContain(translations.en.reg_joinYorso);
      }
    }
  });

  it("Кнопка «На главную» в InfoPageLayout локализована", () => {
    let api!: Api;
    renderApp((a) => (api = a));

    act(() => api.setLang("ru"));
    act(() => api.navigateTo("/about"));

    // Кнопка возврата — текст `info_backToHome`.
    const body = document.body.textContent ?? "";
    expect(body).toContain(translations.ru.info_backToHome);
    // Английский вариант не должен присутствовать.
    expect(body).not.toContain(translations.en.info_backToHome);
  });
});
