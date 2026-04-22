/**
 * Контракт хранилища локали.
 *
 * Гарантии, которые проверяет этот тест:
 *   1. Ключ хранения — РОВНО `yorso-lang`. Никаких альтернативных ключей
 *      ("lang", "i18nextLng", "language", "yorso_lang", "YORSO-LANG" и т.п.)
 *      приложение не пишет.
 *   2. После `setLang(x)` localStorage["yorso-lang"] === x синхронно.
 *   3. Переходы между маршрутами не подменяют значение ключа и не создают
 *      «теневых» ключей.
 *   4. После полного размонтирования + ремонтирования (эмуляция перезагрузки)
 *      значение по ключу `yorso-lang` сохраняется и приложение его читает,
 *      а не сваливается на navigator.language.
 *   5. Внешние записи в `yorso-lang` уважаются при следующем монтировании,
 *      но НЕ влияют на уже смонтированный инстанс (localStorage не реактивен
 *      — это контракт поведения, а не баг).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { type Language } from "@/i18n/translations";

import RegisterChoose from "@/pages/register/RegisterChoose";
import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";
import Index from "@/pages/Index";

const STORAGE_KEY = "yorso-lang";

const FORBIDDEN_ALTERNATIVE_KEYS = [
  "lang",
  "language",
  "i18nextLng",
  "i18nLang",
  "yorso_lang",
  "YORSO-LANG",
  "yorso-language",
  "yorsoLang",
  "locale",
  "yorso-locale",
];

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", { value: list ?? [primary], configurable: true });
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
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

/**
 * Снимает все ключи localStorage и проверяет, что нет «теневых» альтернатив.
 * Возвращает значение основного ключа.
 */
const assertOnlyCanonicalKey = (expectedValue: string | null) => {
  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) allKeys.push(k);
  }
  // Ни один из «запрещённых альтернативных» ключей не должен присутствовать.
  for (const forbidden of FORBIDDEN_ALTERNATIVE_KEYS) {
    expect(allKeys).not.toContain(forbidden);
  }
  // И не должно быть никаких локаль-подобных ключей кроме `yorso-lang`.
  const localeLike = allKeys.filter(
    (k) => /lang|locale|i18n/i.test(k) && k !== STORAGE_KEY,
  );
  expect(localeLike).toEqual([]);

  // Значение основного ключа.
  expect(localStorage.getItem(STORAGE_KEY)).toBe(expectedValue);
};

describe("Locale storage contract: key=yorso-lang, stable across routes & reloads", () => {
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

  it("setLang writes ONLY to `yorso-lang`, no alternative or shadow keys are created", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    // Стартовый автодетект пишет ничего (LanguageProvider пишет в storage
    // только при явной смене через handleSetLang).
    assertOnlyCanonicalKey(null);

    act(() => api.setLang("ru"));
    assertOnlyCanonicalKey("ru");

    act(() => api.setLang("es"));
    assertOnlyCanonicalKey("es");

    act(() => api.setLang("en"));
    assertOnlyCanonicalKey("en");
  });

  it("Navigation between routes does not mutate or duplicate the locale key", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));
    assertOnlyCanonicalKey("ru");

    for (const path of ["/register", "/signin", "/offers", "/"]) {
      act(() => api.navigateTo(path));
      // lang в контексте остался ru
      expect(screen.getByTestId("lang").textContent).toBe("ru");
      // и в storage — то же самое значение под тем же ключом, без дублей
      assertOnlyCanonicalKey("ru");
    }
  });

  it("After full unmount + remount (page reload simulation) value at `yorso-lang` is read back", () => {
    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("es"));
    assertOnlyCanonicalKey("es");

    // Эмулируем reload: размонтируем всё React-дерево.
    cleanup();
    document.body.innerHTML = "";
    // navigator всё ещё en-US, чтобы убедиться, что приложение читает именно
    // localStorage, а не падает обратно на navigator.language.
    setBrowserLanguages("en-US", ["en-US", "en"]);

    // Перепроверка: сторадж пережил «reload».
    expect(localStorage.getItem(STORAGE_KEY)).toBe("es");

    let api2!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api2 = a), "/signin");

    expect(screen.getByTestId("lang").textContent).toBe("es");
    assertOnlyCanonicalKey("es");

    // Навигация после reload — значение и ключ не меняются.
    act(() => api2.navigateTo("/offers"));
    expect(screen.getByTestId("lang").textContent).toBe("es");
    assertOnlyCanonicalKey("es");
  });

  it("Manual seeding of `yorso-lang` BEFORE mount is honored on first render", () => {
    // Преднастройка хранилища до монтирования.
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: { setLang: (l: Language) => void; navigateTo: (p: string) => void };
    renderApp((a) => (api = a), "/offers");

    expect(screen.getByTestId("lang").textContent).toBe("ru");
    assertOnlyCanonicalKey("ru");

    // И после клика по нескольким маршрутам ключ не подменяется.
    act(() => api.navigateTo("/signin"));
    act(() => api.navigateTo("/register"));
    act(() => api.navigateTo("/"));
    assertOnlyCanonicalKey("ru");
  });

  it("Invalid value at `yorso-lang` is ignored and not propagated to other keys", () => {
    // Кладём мусор — провайдер должен его проигнорировать и упасть на
    // navigator/en, НЕ создавая дубль-ключей.
    localStorage.setItem(STORAGE_KEY, "klingon");

    renderApp(() => {}, "/");

    // lang НЕ "klingon"; должно быть одно из поддерживаемых значений
    // (по контракту LanguageContext: ru/es/en).
    const visible = screen.getByTestId("lang").textContent;
    expect(["en", "ru", "es"]).toContain(visible);
    expect(visible).not.toBe("klingon");

    // И никаких альтернативных ключей провайдер не создал.
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) allKeys.push(k);
    }
    for (const forbidden of FORBIDDEN_ALTERNATIVE_KEYS) {
      expect(allKeys).not.toContain(forbidden);
    }
    // Значение по `yorso-lang` приложение НЕ перезаписывает само по себе
    // (запись происходит только через явный setLang) — мусор остаётся как есть.
    expect(localStorage.getItem(STORAGE_KEY)).toBe("klingon");
  });
});
