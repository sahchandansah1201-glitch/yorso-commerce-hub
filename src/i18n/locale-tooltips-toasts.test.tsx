import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import Header from "@/components/landing/Header";
import CertificationBadges from "@/components/CertificationBadges";
import SignIn from "@/pages/SignIn";

const renderWithLang = (
  ui: React.ReactElement,
  { lang = "ru", browser }: { lang?: "ru" | "en" | "es" | null; browser?: string } = {},
) => {
  if (lang) localStorage.setItem("yorso-lang", lang);
  if (browser) {
    Object.defineProperty(window.navigator, "language", { value: browser, configurable: true });
  }
  return render(
    <MemoryRouter>
      <LanguageProvider>
        {ui}
        <Sonner />
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("Tooltips & toasts honor the active locale", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("Header mobile-toggle tooltip uses Russian aria-label when locale=ru", () => {
    renderWithLang(<Header />, { lang: "ru" });
    expect(
      screen.getByRole("button", { name: translations.ru.aria_toggleMenu }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: translations.en.aria_toggleMenu }),
    ).not.toBeInTheDocument();
  });

  it("Certification badge tooltip uses Russian template with cert code interpolated", () => {
    const { container } = renderWithLang(
      <CertificationBadges certifications={["MSC"]} />,
      { lang: "ru" },
    );
    const expected = translations.ru.cert_viewDetails.replace("{cert}", "MSC");
    const badge = container.querySelector("button");
    expect(badge?.getAttribute("aria-label")).toBe(expected);
  });

  it("Sign In validation toast renders in Russian via Sonner", async () => {
    renderWithLang(<SignIn />, { lang: "ru" });

    // Submit empty form -> triggers toast.error(t.signin_fillAll)
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(
      () => {
        const region = document.querySelector("[data-sonner-toaster]");
        expect(region?.textContent ?? "").toContain(translations.ru.signin_fillAll);
      },
      { timeout: 1500 },
    );

    const toastText = document.querySelector("[data-sonner-toaster]")?.textContent ?? "";
    expect(toastText).not.toContain(translations.en.signin_fillAll);
  });

  it("Falls back to browser language (ru-RU) when nothing is stored", () => {
    renderWithLang(<Header />, { lang: null, browser: "ru-RU" });
    expect(
      screen.getByRole("button", { name: translations.ru.aria_toggleMenu }),
    ).toBeInTheDocument();
  });
});
