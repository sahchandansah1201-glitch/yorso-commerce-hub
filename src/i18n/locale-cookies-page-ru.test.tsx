/**
 * Cookies-страница в ru-локали:
 *   - page-title содержит русский cookies_title;
 *   - info-content содержит ключевые русские блоки (intro + 4 раздела с заголовками);
 *   - кнопка "На главную" (info-back-home) локализована и ведёт на "/";
 *   - клик по кнопке возвращает на главную (Index рендерится);
 *   - локаль ru сохраняется на всех шагах.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import Cookies from "@/pages/Cookies";

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

const renderApp = (onReady: (api: Api) => void, initialPath = "/cookies") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <Probe onReady={onReady} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cookies" element={<Cookies />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("Cookies page (ru): локализованный заголовок, тело и кнопка возврата", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    localStorage.setItem(STORAGE_KEY, "ru");
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("Заголовок Cookies на русском, английский вариант отсутствует", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/cookies");

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    const title = screen.getByTestId("page-title");
    expect(title.textContent).toBe(translations.ru.cookies_title);
    expect(title.textContent).not.toBe(translations.en.cookies_title);
  });

  it("Основной контент содержит intro и все 4 локализованных раздела на русском", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/cookies");

    const content = screen.getByTestId("info-content");
    const text = content.textContent ?? "";

    // Intro и тела разделов.
    expect(text).toContain(translations.ru.cookies_intro);
    expect(text).toContain(translations.ru.cookies_essentialBody);
    expect(text).toContain(translations.ru.cookies_analyticsBody);
    expect(text).toContain(translations.ru.cookies_manageBody);
    expect(text).toContain(translations.ru.cookies_contactBody);

    // Заголовки разделов.
    const headings = within(content).getAllByRole("heading", { level: 2 });
    const headingTexts = headings.map((h) => h.textContent ?? "");
    expect(headingTexts).toContain(translations.ru.cookies_essentialTitle);
    expect(headingTexts).toContain(translations.ru.cookies_analyticsTitle);
    expect(headingTexts).toContain(translations.ru.cookies_manageTitle);
    expect(headingTexts).toContain(translations.ru.cookies_contactTitle);

    // Английские варианты НЕ должны попадать в content.
    expect(text).not.toContain(translations.en.cookies_intro);
    expect(text).not.toContain(translations.en.cookies_essentialBody);

    // updated-метка тоже на русском.
    const updated = screen.getByTestId("info-updated");
    expect(updated.textContent).toContain(translations.ru.info_lastUpdated);
    expect(updated.textContent).toContain(translations.ru.cookies_updated);
  });

  it("Кнопка возврата локализована, ведёт на '/' и реально возвращает на главную", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/cookies");

    const backLink = screen.getByTestId("info-back-home") as HTMLAnchorElement;

    // Локализованный лейбл.
    expect(backLink.textContent).toContain(translations.ru.info_backToHome);
    expect(backLink.textContent).not.toContain(translations.en.info_backToHome);

    // href ведёт на корень.
    expect(backLink.getAttribute("href")).toBe("/");

    // Кликаем — должен отрендериться Index с hero page-title на русском.
    act(() => {
      fireEvent.click(backLink);
    });

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");

    const heroTitle = screen.getAllByTestId("page-title")[0];
    expect(heroTitle.textContent).toContain(translations.ru.hero_title1);
  });
});
