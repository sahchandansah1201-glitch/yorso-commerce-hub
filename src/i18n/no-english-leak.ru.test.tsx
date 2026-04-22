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
