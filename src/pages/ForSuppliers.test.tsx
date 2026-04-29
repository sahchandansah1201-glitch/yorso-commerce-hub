/**
 * Smoke test: /for-suppliers route renders for EN and RU,
 * key sections + primary CTAs are present and link to /register and /offers.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import ForSuppliers from "@/pages/ForSuppliers";

const STORAGE_KEY = "yorso-lang";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/for-suppliers"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <RegistrationProvider>
              <Routes>
                <Route path="/for-suppliers" element={<ForSuppliers />} />
              </Routes>
            </RegistrationProvider>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("/for-suppliers route", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the page in EN with H1, all section headings and CTA targets", () => {
    localStorage.setItem(STORAGE_KEY, "en");
    renderPage();

    // H1 present
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent ?? "").toMatch(/price/i);

    // Section H2s
    expect(
      screen.getByRole("heading", { level: 2, name: /How a supplier works in YORSO|Four steps/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /What buyers see/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Control over price visibility|Three access levels/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Less noise|Before and after/i })).toBeInTheDocument();

    // Primary register CTA links to /register (at least one)
    const registerLinks = screen
      .getAllByRole("link", { name: /Register as supplier/i })
      .map((a) => a.getAttribute("href"));
    expect(registerLinks).toContain("/register");

    // Secondary "see buyer requests" CTA links to /offers
    const requestsLinks = screen
      .getAllByRole("link", { name: /See buyer requests/i })
      .map((a) => a.getAttribute("href"));
    expect(requestsLinks).toContain("/offers");
  });

  it("renders the page in RU with localized H1 and primary CTA", () => {
    localStorage.setItem(STORAGE_KEY, "ru");
    renderPage();

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent ?? "").toMatch(/прайсы|перестаньте/i);

    // RU primary CTA
    const registerLinks = screen.getAllByRole("link", { name: /Зарегистрироваться как поставщик/i });
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks.map((a) => a.getAttribute("href"))).toContain("/register");

    // RU secondary CTA
    const requestsLinks = screen.getAllByRole("link", { name: /Смотреть запросы покупателей/i });
    expect(requestsLinks.length).toBeGreaterThan(0);
    expect(requestsLinks.map((a) => a.getAttribute("href"))).toContain("/offers");

    // RU section heading sample (workflow)
    expect(
      screen.getByRole("heading", { level: 2, name: /Как поставщик работает в YORSO|Четыре шага/i }),
    ).toBeInTheDocument();
  });

  it("uses semantic <main> landmark", () => {
    renderPage();
    expect(screen.getByRole("main")).toBeInTheDocument();
    // Hero H1 lives inside main
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
