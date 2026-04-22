/**
 * Сторожевой тест: при выбранной локали `ru` в публичном UI не должно
 * оставаться непереведённых английских строк.
 *
 * Стратегия:
 *  1. Рендерим основные публичные маршруты под локалью `ru`.
 *  2. Собираем видимый текст из document.body.
 *  3. Проверяем, что не встречаются заранее объявленные «маркерные»
 *     английские фразы, которые обязаны быть локализованы.
 *
 * Список маркеров намеренно консервативный: бренд (YORSO), e-mail-адреса,
 * технические токены (KVK, GDPR, HACCP, BRC, MSC, EN/RU/ES) исключены —
 * они не подлежат переводу.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
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
import NotFound from "@/pages/NotFound";
import OfferDetail from "@/pages/OfferDetail";
import Offers from "@/pages/Offers";
import OfferCard from "@/components/landing/OfferCard";
import LiveOffers from "@/components/landing/LiveOffers";
import RegisterChoose from "@/pages/register/RegisterChoose";
import RegisterEmail from "@/pages/register/RegisterEmail";
import RegisterDetails from "@/pages/register/RegisterDetails";
import { mockOffers } from "@/data/mockOffers";
import { translations } from "@/i18n/translations";

/**
 * Маркерные английские фразы, которые точно должны быть переведены
 * на русский. Если хотя бы одна встречается в DOM при ru-локали — тест падает.
 *
 * Правила пополнения:
 *  - только фразы из видимого UI (заголовки, кнопки, лейблы, подсказки);
 *  - НЕ добавлять имена собственные, e-mail, акронимы стандартов;
 *  - НЕ добавлять одиночные общеупотребимые слова (Email, OK, MOQ).
 */
const ENGLISH_UI_MARKERS = [
  // offer-detail
  "Frequently Asked Questions",
  "Full Specifications",
  "Commercial Terms",
  "Delivery Basis",
  "Volume pricing",
  "Related Market Insights",
  "Compare Alternatives",
  "Verified Supplier",
  "Pending Full Verification",
  "Reviewed documents",
  "Why this offer is safe",
  // registration
  "Country or code",
  "No results found",
  // catalog / offer cards (UI labels — НЕ названия продуктов / стран)
  "View Offer",
  "per kg",
  "Listed today",
  "Live Marketplace",
  "View All",
  "Show more",
  "Show less",
  "Search offers",
  "Showing all",
  "Back to home",
  // info pages
  "About YORSO",
  "Our Mission",
  "What We Do",
  "Key Facts",
  "Anti-Fraud Policy",
  "Supplier Verification",
  "Ongoing Monitoring",
  "Reporting Concerns",
  "Sanctions Screening",
  "Careers at YORSO",
  "Why YORSO?",
  "Open Positions",
  "Contact Us",
  "General Inquiries",
  "Buyer Support",
  "Supplier Onboarding",
  "Cookie Policy",
  "Essential Cookies",
  "Analytics Cookies",
  "Managing Cookies",
  "GDPR Compliance",
  "Your Rights Under GDPR",
];

const renderRoute = (path: string, element: React.ReactNode) => {
  localStorage.setItem("yorso-lang", "ru");
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <Routes>
              <Route path={path} element={element} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

const collectText = () =>
  // textContent даёт видимый текст без HTML-разметки и без атрибутов
  (document.body.textContent ?? "").replace(/\s+/g, " ").trim();

const findLeaks = (text: string) =>
  ENGLISH_UI_MARKERS.filter((m) => text.includes(m));

interface RouteCase {
  name: string;
  path: string;
  element: React.ReactNode;
}

const ROUTES: RouteCase[] = [
  { name: "Index (homepage)", path: "/", element: <Index /> },
  { name: "Offers (catalog)", path: "/offers", element: <Offers /> },
  { name: "SignIn", path: "/signin", element: <SignIn /> },
  { name: "About", path: "/about", element: <About /> },
  { name: "Contact", path: "/contact", element: <Contact /> },
  { name: "Terms", path: "/terms", element: <Terms /> },
  { name: "Privacy", path: "/privacy", element: <Privacy /> },
  { name: "Cookies", path: "/cookies", element: <Cookies /> },
  { name: "GDPR", path: "/gdpr", element: <GDPR /> },
  { name: "AntiFraud", path: "/anti-fraud", element: <AntiFraud /> },
  { name: "Careers", path: "/careers", element: <Careers /> },
  { name: "Press", path: "/press", element: <Press /> },
  { name: "Partners", path: "/partners", element: <Partners /> },
  { name: "NotFound", path: "/__missing__", element: <NotFound /> },
  {
    name: "OfferDetail",
    path: `/offers/${mockOffers[0]?.id ?? "1"}`,
    element: <OfferDetail />,
  },
  { name: "Register / Choose", path: "/register", element: <RegisterChoose /> },
  { name: "Register / Email", path: "/register/email", element: <RegisterEmail /> },
  { name: "Register / Details", path: "/register/details", element: <RegisterDetails /> },
];

describe("UI leaks: untranslated English strings under ru locale", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  for (const route of ROUTES) {
    it(`route "${route.name}" must not contain hardcoded English UI strings`, () => {
      renderRoute(route.path, route.element);
      const text = collectText();
      const leaks = findLeaks(text);
      if (leaks.length > 0) {
        throw new Error(
          `Найдены непереведённые английские строки на маршруте "${route.name}" (${route.path}):\n` +
            leaks.map((l) => `  • ${l}`).join("\n") +
            `\n\nДобавьте ключи в src/i18n/translations.ts и используйте useLanguage().`,
        );
      }
      expect(leaks).toEqual([]);
    });
  }
});

/**
 * Прицельные позитивные проверки каталога/карточек: убеждаемся, что
 * под локалью ru видны ожидаемые русские лейблы фильтров, кнопок и
 * подсказок карточек товара.
 */
describe("Catalog & offer cards render Russian UI under ru locale", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("Offers (catalog page): заголовок, поиск, кнопки и категории — на русском", () => {
    renderRoute("/offers", <Offers />);
    const ru = translations.ru;

    // Заголовок и подзаголовок
    expect(document.body.textContent).toContain(ru.offersPage_title);
    expect(
      document.body.textContent ?? "",
    ).toContain(ru.offersPage_subtitle.replace("{count}", String(mockOffers.length)));

    // Поле поиска c русским placeholder
    const placeholders = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[placeholder]"),
    ).map((i) => i.getAttribute("placeholder") ?? "");
    expect(placeholders).toContain(ru.offersPage_searchPlaceholder);
    expect(placeholders).not.toContain("Search offers");

    // Кнопка "назад на главную"
    expect(document.body.textContent).toContain(ru.offersPage_backToHome);

    // Хотя бы одна локализованная категория из cat_names присутствует
    const catNames = Object.values(ru.cat_names);
    const text = document.body.textContent ?? "";
    expect(catNames.some((name) => text.includes(name))).toBe(true);
  });

  it("OfferCard: подписи под карточкой (per kg, View Offer, freshness) — на русском", () => {
    const offer = mockOffers[0];
    localStorage.setItem("yorso-lang", "ru");
    render(
      <MemoryRouter>
        <LanguageProvider>
          <OfferCard offer={offer} />
        </LanguageProvider>
      </MemoryRouter>,
    );
    const ru = translations.ru;
    const text = document.body.textContent ?? "";

    expect(text).toContain(ru.card_perKg);
    expect(text).toContain(ru.card_viewOffer);
    expect(text).not.toContain("per kg");
    expect(text).not.toContain("View Offer");

    // Freshness нормализуется: либо "Добавлено сегодня", либо "Обновлено … назад"
    const isToday = text.includes(ru.card_listedToday);
    const isUpdated = text.includes(ru.card_updatedAgo.replace(" {time} ", " "));
    const isUpdatedAnyTime = /Обновлено\s.+\sназад/.test(text);
    expect(isToday || isUpdated || isUpdatedAnyTime).toBe(true);
  });

  it("LiveOffers: бейдж 'Live Marketplace', заголовок и список — на русском", () => {
    renderRoute("/", <LiveOffers />);
    const ru = translations.ru;
    const text = document.body.textContent ?? "";

    expect(text).toContain(ru.offers_liveMarketplace);
    expect(text).toContain(ru.offers_title);
    expect(text).toContain(ru.offers_subtitle);
    expect(text).not.toContain("Live Marketplace");

    // CTA "Смотреть" / "за кг" приходят из карточек
    expect(text).toContain(ru.card_viewOffer);
    expect(text).toContain(ru.card_perKg);

    // Aria-label секции/списка — локализованы
    const labels = Array.from(document.querySelectorAll("[aria-label]")).map(
      (e) => e.getAttribute("aria-label") ?? "",
    );
    // Для секции/списка должно быть хоть одно нелатинское aria-label
    const hasCyrillic = labels.some((l) => /[А-Яа-яЁё]/.test(l));
    expect(hasCyrillic).toBe(true);
  });
});

