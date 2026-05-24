import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations, type Language } from "@/i18n/translations";

const renderHeader = (lang: Language) => {
  localStorage.setItem("yorso-lang", lang);
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Header />
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("Header landmark labels", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  (["en", "ru", "es"] as const).forEach((lang) => {
    it(`labels desktop and mobile navigation landmarks (${lang})`, () => {
      renderHeader(lang);
      const t = translations[lang];

      expect(
        screen.getByRole("navigation", { name: t.aria_mainNavigation }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: t.aria_toggleMenu }));

      expect(
        screen.getByRole("navigation", { name: t.aria_mobileNavigation }),
      ).toBeInTheDocument();
    });
  });
});
