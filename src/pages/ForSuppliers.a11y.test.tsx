import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForSuppliers from "./ForSuppliers";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";

const STORAGE_KEY = "yorso-lang";

const renderPage = () => {
  const utils = render(
    <MemoryRouter>
      <LanguageProvider>
        <ForSuppliers />
      </LanguageProvider>
    </MemoryRouter>
  );
  const main = utils.container.querySelector("main");
  if (!main) throw new Error("Page <main> not found");
  return { ...utils, main: main as HTMLElement };
};

// A heading is "hidden from screen readers" if itself or any ancestor up to <main>
// is aria-hidden, hidden, role=presentation/none, or display/visibility-hidden inline.
const isHiddenForA11y = (el: HTMLElement, root: HTMLElement): boolean => {
  let node: HTMLElement | null = el;
  while (node && node !== root.parentElement) {
    if (node.getAttribute("aria-hidden") === "true") return true;
    if (node.hasAttribute("hidden")) return true;
    const role = node.getAttribute("role");
    if (role === "presentation" || role === "none") return true;
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

      it("uses heading levels in document order without skipping levels (within <main>)", () => {
        const { main } = renderPage();
        const headings = Array.from(
          main.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ) as HTMLElement[];

        expect(headings.length).toBeGreaterThan(0);

        const levels = headings.map((h) => Number(h.tagName.substring(1)));
        // First heading inside <main> must be the page H1
        expect(levels[0]).toBe(1);

        // Going deeper, level may only increase by 1 step at a time (h2 -> h4 is invalid).
        // Going back up to a shallower level is always allowed (h3 -> h2 is fine).
        for (let i = 1; i < levels.length; i++) {
          const delta = levels[i] - levels[i - 1];
          expect(
            delta <= 1,
            `Heading level jumps from h${levels[i - 1]} to h${levels[i]} in locale ${lang}`
          ).toBe(true);
        }
      });

      it("has no empty or whitespace-only headings", () => {
        const { main } = renderPage();
        const headings = Array.from(
          main.querySelectorAll("h1, h2, h3, h4, h5, h6")
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
        const { main } = renderPage();
        const headings = Array.from(
          main.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ) as HTMLElement[];

        for (const h of headings) {
          expect(
            isHiddenForA11y(h, main),
            `Heading "${h.textContent?.trim()}" is hidden from screen readers in locale ${lang}`
          ).toBe(false);
        }
      });

      it("H1 and H2 texts are human-readable (>= 2 chars, contain a letter or digit)", () => {
        const { main } = renderPage();
        const headings = Array.from(main.querySelectorAll("h1, h2")) as HTMLElement[];

        for (const h of headings) {
          const text = (h.textContent ?? "").replace(/\s+/g, " ").trim();
          expect(text.length).toBeGreaterThanOrEqual(2);
          expect(/[\p{L}\p{N}]/u.test(text)).toBe(true);
        }
      });

      it("each H2 section has an accessible name (visible text)", () => {
        const { main } = renderPage();
        const h2s = Array.from(main.querySelectorAll("h2")) as HTMLElement[];

        // Sanity: page should have meaningful sections.
        expect(h2s.length).toBeGreaterThanOrEqual(5);

        for (const h of h2s) {
          // aria-label should not be empty if present
          const ariaLabel = h.getAttribute("aria-label");
          if (ariaLabel !== null) {
            expect(ariaLabel.trim().length).toBeGreaterThan(0);
          }
          // Visible text content must exist
          const text = (h.textContent ?? "").replace(/\s+/g, " ").trim();
          expect(text.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
