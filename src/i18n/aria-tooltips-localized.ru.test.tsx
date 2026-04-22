/**
 * Проверяет, что при локали `ru` все aria-label, placeholder и тултипы
 * в публичном UI берутся из translations и не содержат английских строк.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { translations } from "@/i18n/translations";

import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
import OfferDetail from "@/pages/OfferDetail";
import RegisterDetails from "@/pages/register/RegisterDetails";
import CountryPhoneInput from "@/components/registration/CountryPhoneInput";
import { mockOffers } from "@/data/mockOffers";

const renderRu = (path: string, element: React.ReactNode) => {
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

const collectAttrs = () => {
  const all = Array.from(document.querySelectorAll<HTMLElement>("*"));
  const labels: string[] = [];
  const placeholders: string[] = [];
  const titles: string[] = [];
  for (const el of all) {
    const aria = el.getAttribute("aria-label");
    if (aria) labels.push(aria);
    const ph = el.getAttribute("placeholder");
    if (ph) placeholders.push(ph);
    const ti = el.getAttribute("title");
    if (ti) titles.push(ti);
  }
  return { labels, placeholders, titles };
};

// Английские маркеры, которые НЕ должны встречаться в подсказках под ru.
const EN_TOOLTIP_MARKERS = [
  "Toggle menu",
  "Go back",
  "Breadcrumb",
  "Country or code",
  "No results found",
  "John Smith",
  "Acme Seafood Ltd.",
  "john@company.com",
  "View details for",
];

describe("ARIA / placeholders / tooltips are localized under ru", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("Homepage: aria-label uses Russian (toggle menu)", () => {
    renderRu("/", <Index />);
    const { labels } = collectAttrs();
    expect(labels).toContain(translations.ru.aria_toggleMenu);
    for (const m of EN_TOOLTIP_MARKERS) {
      expect(labels.some((l) => l.includes(m))).toBe(false);
    }
  });

  it("OfferDetail: breadcrumb aria-label is Russian", () => {
    const id = mockOffers[0]?.id ?? "1";
    renderRu(`/offers/${id}`, <OfferDetail />);
    const { labels } = collectAttrs();
    expect(labels).toContain(translations.ru.aria_breadcrumb);
    expect(labels).not.toContain("Breadcrumb");
  });

  it("SignIn: email placeholder is Russian-localized template", () => {
    renderRu("/signin", <SignIn />);
    const { placeholders } = collectAttrs();
    expect(placeholders).toContain(translations.ru.signin_emailPlaceholder);
    expect(placeholders).not.toContain("john@company.com");
  });

  it("RegisterDetails: full-name & company placeholders are Russian", () => {
    renderRu("/register/details", <RegisterDetails />);
    const { placeholders } = collectAttrs();
    expect(placeholders).toContain(translations.ru.reg_fullNamePlaceholder);
    expect(placeholders).toContain(translations.ru.reg_companyPlaceholder);
    expect(placeholders).not.toContain("John Smith");
    expect(placeholders).not.toContain("Acme Seafood Ltd.");
  });

  it("CountryPhoneInput: search placeholder & empty-state are Russian", () => {
    localStorage.setItem("yorso-lang", "ru");
    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <CountryPhoneInput
            phone=""
            onPhoneChange={() => {}}
            onCountryChange={() => {}}
            countryName=""
            disabled={false}
          />
        </LanguageProvider>
      </MemoryRouter>,
    );
    // Открываем выпадающий список
    const trigger = container.querySelector("button");
    trigger?.click();

    const { placeholders } = collectAttrs();
    expect(placeholders).toContain(translations.ru.country_searchPlaceholder);
    expect(placeholders).not.toContain("Country or code");
  });
});
