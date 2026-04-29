import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations, type Language } from "@/i18n/translations";

const renderFooter = (lang: Language) => {
  localStorage.setItem("yorso-lang", lang);
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    </MemoryRouter>
  );
};

describe("Footer — /for-suppliers link in Company section", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  (["en", "ru", "es"] as const).forEach((lang) => {
    it(`renders /for-suppliers link inside the Company column (${lang})`, () => {
      const { unmount } = renderFooter(lang);

      const t = translations[lang];
      const companyLink = t.footer_links.company.find(
        (l) => l.href === "/for-suppliers"
      );
      expect(
        companyLink,
        `Company section must contain /for-suppliers in ${lang} translations`
      ).toBeDefined();

      // Company column heading is rendered
      const heading = screen.getByRole("heading", {
        name: t.footer_company,
        level: 4,
      });
      expect(heading).toBeInTheDocument();

      // The visible link uses the localized label and points to /for-suppliers
      const link = screen.getByRole("link", { name: companyLink!.label });
      expect(link).toHaveAttribute("href", "/for-suppliers");

      // And it lives inside the same section as the Company heading
      const companySection = heading.parentElement!;
      expect(companySection.contains(link)).toBe(true);

      // It must NOT be duplicated in the Platform column
      const platformDup = t.footer_links.platform.find(
        (l) => l.href === "/for-suppliers"
      );
      expect(
        platformDup,
        `Platform section must not contain /for-suppliers in ${lang}`
      ).toBeUndefined();

      unmount();
    });
  });
});
