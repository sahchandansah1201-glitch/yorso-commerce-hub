import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
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

// Detect headings that screen readers will treat as hidden.
// We check the element + all ancestors up to the container.
const isHiddenForA11y = (el: HTMLElement, root: HTMLElement): boolean => {
  let node: HTMLElement | null = el;
  while (node && node !== root.parentElement) {
    if (node.getAttribute("aria-hidden") === "true") return true;
    if (node.hasAttribute("hidden")) return true;
    const role = node.getAttribute("role");
    if (role === "presentation" || role === "none") return true;
    // display:none / visibility:hidden via inline styles
    const style = node.getAttribute("style") ?? "";
    if (/display\s*:\s*none/i.test(style)) return true;
    if (/visibility\s*:\s*hidden/i.test(style)) return true;
    node = node.parentElement;
  }
  return false;
};

describe("/for-suppliers heading accessibility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  (["en", "ru", "es"] as const satisfies readonly Language[]).forEach((lang) => {
    describe(`locale: ${lang}`, () => {
      beforeEach(() => {
        localStorage.setItem(STORAGE_KEY, lang);
      });

      it("only uses heading levels h1 and h2 (no skipped levels, no h3-h6)", () => {
        const { container } = renderPage();
        const allHeadings = Array.from(
          container.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ) as HTMLElement[];

        expect(allHeadings.length).toBeGreaterThan(0);

        const levels = new Set(allHeadings.map((h) => Number(h.tagName.substring(1))));
        // Must contain h1 and h2
        expect(levels.has(1)).toBe(true);
        expect(levels.has(2)).toBe(true);
        // Must NOT contain any deeper level used without its parent (we don't use h3+ on this page)
        for (const lvl of [3, 4, 5, 6]) {
          expect(levels.has(lvl)).toBe(false);
        }
      });

      it("has no empty or whitespace-only headings", () => {
        const { container } = renderPage();
        const headings = Array.from(
          container.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ) as HTMLElement[];

        for (const h of headings) {
          const text = (h.textContent ?? "").replace(/\s+/g, " ").trim();
          expect(
            text.length,
            `Heading <${h.tagName.toLowerCase()}> is empty in locale ${lang}`
          ).toBeGreaterThan(0);
        }
      });

      it("has no headings hidden from screen readers (aria-hidden / hidden / role=presentation)", () => {
        const { container } = renderPage();
        const headings = Array.from(
          container.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ) as HTMLElement[];

        for (const h of headings) {
          expect(
            isHiddenForA11y(h, container),
            `Heading "${h.textContent?.trim()}" is hidden from screen readers in locale ${lang}`
          ).toBe(false);
        }
      });

      it("H1 and H2 texts are human-readable (length >= 2 chars, not pure punctuation)", () => {
        const { container } = renderPage();
        const headings = Array.from(
          container.querySelectorAll("h1, h2")
        ) as HTMLElement[];

        for (const h of headings) {
          const text = (h.textContent ?? "").replace(/\s+/g, " ").trim();
          expect(text.length).toBeGreaterThanOrEqual(2);
          // Must contain at least one letter or digit (any unicode script)
          expect(/[\p{L}\p{N}]/u.test(text)).toBe(true);
        }
      });
    });
  });
});
