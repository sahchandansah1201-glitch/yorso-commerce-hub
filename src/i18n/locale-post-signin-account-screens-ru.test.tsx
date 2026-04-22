/**
 * End-to-end: после смены локали на ru пользователь успешно входит через
 * /signin и затем обходит ВСЕ основные экраны аккаунта, доступные
 * после логина. Отдельного /profile в Phase 0 ещё нет, поэтому «экраны
 * аккаунта» — это все маршруты, на которые приложение ведёт после входа
 * и куда авторизованный пользователь естественно переходит:
 *
 *   1) /offers            — пост-логин редирект (navigate("/offers"))
 *   2) /offers/:id        — карточка предложения (из клика по офферу)
 *   3) /                  — возврат на главную через логотип в Header
 *   4) /register          — повторное открытие онбординга (если нужно)
 *
 * На каждом маршруте проверяем:
 *   - `useLanguage().lang === "ru"`
 *   - localStorage["yorso-lang"] === "ru"
 *   - присутствует ключевой русский текст
 *   - НЕТ en/es варианта того же ключа (не произошло редиректа на
 *     английскую версию)
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { translations, type Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";
import OfferDetail from "@/pages/OfferDetail";
import RegisterChoose from "@/pages/register/RegisterChoose";
import { mockOffers } from "@/data/mockOffers";

const STORAGE_KEY = "yorso-lang";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", { value: list ?? [primary], configurable: true });
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
    <MemoryRouter initialEntries={["/signin"]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <Probe onReady={onReady} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/offers/:id" element={<OfferDetail />} />
              <Route path="/register" element={<RegisterChoose />} />
            </Routes>
            <Sonner />
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const otherLangs = (current: Language): Language[] =>
  (["en", "ru", "es"] as Language[]).filter((l) => l !== current);

const expectRuAbsentOthers = (key: keyof typeof translations.ru) => {
  const body = document.body.textContent ?? "";
  const ruText = translations.ru[key] as string;
  expect(body, `Ожидался русский текст для "${String(key)}"`).toContain(ruText);
  for (const other of otherLangs("ru")) {
    const otherText = translations[other][key] as string;
    if (otherText && otherText !== ruText) {
      expect(body, `Английский/испанский текст "${otherText}" не должен присутствовать`).not.toContain(otherText);
    }
  }
};

describe("После sign-in с ru-локалью все основные экраны аккаунта остаются на русском", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("ru сохраняется на /offers, /offers/:id, / и /register после успешного входа", async () => {
    let api!: Api;
    renderApp((a) => (api = a));

    // 1) Включаем ru прямо на /signin.
    act(() => api.setLang("ru"));
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuAbsentOthers("signin_title");

    // 2) Успешный submit: любой email + пароль "Password1" (мок-контракт).
    const email = document.querySelector<HTMLInputElement>('input[type="email"]')!;
    const password = document.querySelector<HTMLInputElement>('input[type="password"]')!;
    fireEvent.change(email, { target: { value: "buyer@yorso.test" } });
    fireEvent.change(password, { target: { value: "Password1" } });
    fireEvent.submit(document.querySelector("form")!);

    // 3) Ждём редирект на /offers — ключевой пост-логин экран.
    await waitFor(
      () => {
        expect(document.body.textContent ?? "").toContain(translations.ru.offersPage_title);
      },
      { timeout: 5000 },
    );
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuAbsentOthers("offersPage_title");

    // 4) Переход на карточку оффера — /offers/:id.
    const firstOfferId = mockOffers[0]?.id;
    expect(firstOfferId, "В mockOffers должен быть хотя бы один оффер").toBeTruthy();
    act(() => api.navigateTo(`/offers/${firstOfferId}`));

    await waitFor(() => {
      // На детальной странице всегда есть breadcrumb с локализованным
      // словом «Главная» (offerDetail_home).
      expect(document.body.textContent ?? "").toContain(translations.ru.offerDetail_home);
    });
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuAbsentOthers("offerDetail_home");
    // Примечание: ключ `offerDetail_offers` → en "Offers" слишком общий и
    // пересекается с нелокализованным контентом (статьи, «Similar Offers»).
    // Поэтому достаточно проверить наличие русской версии.
    expect(document.body.textContent ?? "").toContain(translations.ru.offerDetail_offers);

    // 5) Возврат на главную — / (Index, Hero).
    act(() => api.navigateTo("/"));
    await waitFor(() => {
      expect(document.body.textContent ?? "").toContain(translations.ru.hero_title1);
    });
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuAbsentOthers("hero_title1");

    // 6) Повторный переход в онбординг /register — по-прежнему ru.
    act(() => api.navigateTo("/register"));
    await waitFor(() => {
      expect(document.body.textContent ?? "").toContain(translations.ru.reg_chooseSubtitle);
    });
    expect(screen.getByTestId("lang").textContent).toBe("ru");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("ru");
    expectRuAbsentOthers("reg_chooseSubtitle");
  });
});
