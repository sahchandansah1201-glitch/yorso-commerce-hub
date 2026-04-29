import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForSuppliers from "./ForSuppliers";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";

const STORAGE_KEY = "yorso-lang";

const renderPage = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ForSuppliers />
      </LanguageProvider>
    </MemoryRouter>
  );

describe("/for-suppliers heading hierarchy", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  (["en", "ru", "es"] as const satisfies readonly Language[]).forEach((lang) => {
    describe(`locale: ${lang}`, () => {
      beforeEach(() => {
        localStorage.setItem(STORAGE_KEY, lang);
      });

      it("renders exactly one H1", () => {
        renderPage();
        const h1s = screen.getAllByRole("heading", { level: 1 });
        expect(h1s).toHaveLength(1);
        expect((h1s[0].textContent ?? "").trim().length).toBeGreaterThan(0);
      });

      it("renders multiple H2s with unique text (no duplicates)", () => {
        renderPage();
        const h2s = screen.getAllByRole("heading", { level: 2 });

        // Sanity: page has the expected number of section H2s.
        // (hero is H1; sections: flow, pain, preview, access, help, gets, noise, cta = 8)
        expect(h2s.length).toBe(8);

        const texts = h2s.map((h) => (h.textContent ?? "").trim());
        // No empty H2
        for (const text of texts) {
          expect(text.length).toBeGreaterThan(0);
        }
        // All H2s are unique
        const unique = new Set(texts);
        expect(unique.size).toBe(texts.length);
      });

      it("H1 text does not also appear as any H2", () => {
        renderPage();
        const h1Text = (screen.getByRole("heading", { level: 1 }).textContent ?? "").trim();
        const h2Texts = screen
          .getAllByRole("heading", { level: 2 })
          .map((h) => (h.textContent ?? "").trim());
        expect(h2Texts).not.toContain(h1Text);
      });
    });
  });
});
