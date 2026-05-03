/**
 * Regression: at 390px width, SupplierRow action buttons must not create
 * nested interactive elements (no <button>/<a> inside another <button>/<a>)
 * and must remain fully visible — they must use full-width stacking on
 * mobile so they cannot be clipped by their container.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { SupplierRow } from "@/components/suppliers/SupplierRow";
import { mockSuppliers } from "@/data/mockSuppliers";

const supplier = mockSuppliers[0];

const setMobileViewport = () => {
  Object.defineProperty(window, "innerWidth", { value: 390, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 844, configurable: true });
  window.dispatchEvent(new Event("resize"));
};

const renderRow = (accessLevel: "anonymous_locked" | "registered_locked" | "qualified_unlocked") =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <TooltipProvider>
          <ul>
            <SupplierRow
              supplier={supplier}
              isSelected={false}
              isShortlisted={false}
              accessLevel={accessLevel}
              onSelect={() => {}}
              onShortlist={() => {}}
              onPrimaryAction={() => {}}
            />
          </ul>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("SupplierRow @ 390px — no nested interactives, no clipping", () => {
  beforeEach(() => {
    localStorage.clear();
    setMobileViewport();
  });
  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
  });

  for (const level of ["anonymous_locked", "registered_locked", "qualified_unlocked"] as const) {
    it(`[${level}] no <button>/<a> nested inside another <button>/<a>`, () => {
      renderRow(level);
      const row = screen.getByTestId("supplier-row");
      const interactives = row.querySelectorAll("button, a");
      expect(interactives.length).toBeGreaterThan(0);
      for (const el of Array.from(interactives)) {
        let p = el.parentElement;
        while (p && p !== row) {
          const tag = p.tagName.toLowerCase();
          expect(tag, `nested interactive ancestor <${tag}>`).not.toBe("button");
          expect(tag, `nested interactive ancestor <${tag}>`).not.toBe("a");
          p = p.parentElement;
        }
      }
    });

    it(`[${level}] action buttons stretch full-width and container has no clipping/fixed width`, () => {
      renderRow(level);
      const row = screen.getByTestId("supplier-row");

      // All buttons in the action stack must be full-width (w-full) so they
      // cannot be clipped horizontally on a 390px viewport.
      const buttons = within(row).getAllByRole("button");
      // Filter out the row-level "select" role=button wrapper (it's a div, not <button>).
      const realButtons = buttons.filter((b) => b.tagName.toLowerCase() === "button");
      expect(realButtons.length).toBeGreaterThanOrEqual(2);
      for (const b of realButtons) {
        expect(b.className).toMatch(/\bw-full\b/);
      }

      // The action stack container itself must not impose overflow-hidden
      // or a fixed pixel width that would clip its children at 390px.
      const stack = realButtons[0].parentElement!;
      expect(stack.className).toMatch(/\bflex-col\b/);
      expect(stack.className).not.toMatch(/\boverflow-hidden\b/);
      expect(stack.className).not.toMatch(/\bw-\[\d+px\]/);
    });
  }
});
