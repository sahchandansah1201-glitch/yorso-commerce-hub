import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";

/**
 * Volume tiers contract.
 *
 * The additional-volume-breaks list under the price block must:
 *   1. Render in DOM order: <price> · <MOQ> — never swap (RTL safety).
 *   2. Be marked dir="ltr" so numeric/commercial data isn't mirrored when
 *      the surrounding locale is RTL or when an LTR locale wraps long
 *      tokens.
 *   3. NOT use justify-between — that pushes price and MOQ to opposite
 *      edges on wide tablet rows and broke scanning previously.
 *   4. Stay within a bounded reading column (max-w-[260px]) regardless of
 *      how wide the parent column gets.
 *   5. Use tabular-nums so long numbers (e.g. "20,000+ kg" in ru-RU as
 *      "20 000+ kg") align consistently.
 *
 * These hold across all access levels and locales — verify both.
 */

const renderRow = (level: AccessLevel) => {
  const offer = mockOffers[0]; // has 3 volumeBreaks
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogOfferRow
            offer={offer}
            isSelected={false}
            onSelect={() => {}}
            forceLevel={level}
          />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("CatalogOfferRow — volume tiers layout contract", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  for (const level of ["anonymous_locked", "registered_locked", "qualified_unlocked"] as const) {
    describe(`access level: ${level}`, () => {
      it("renders volume tiers list with dir=ltr", () => {
        renderRow(level);
        const list = screen.getByTestId("catalog-row-volume-tiers");
        expect(list.getAttribute("dir")).toBe("ltr");
      });

      it("never uses justify-between (would split price/MOQ to opposite edges)", () => {
        renderRow(level);
        const list = screen.getByTestId("catalog-row-volume-tiers");
        const items = within(list).getAllByRole("listitem");
        for (const li of items) {
          expect(li.className).not.toMatch(/\bjustify-between\b/);
        }
      });

      it("uses tabular-nums + flex-wrap for long-number safety", () => {
        renderRow(level);
        const list = screen.getByTestId("catalog-row-volume-tiers");
        const items = within(list).getAllByRole("listitem");
        for (const li of items) {
          expect(li.className).toMatch(/\btabular-nums\b/);
          expect(li.className).toMatch(/\bflex-wrap\b/);
        }
      });

      it("marks price and MOQ chips whitespace-nowrap so each chip stays unbroken", () => {
        renderRow(level);
        const list = screen.getByTestId("catalog-row-volume-tiers");
        const items = within(list).getAllByRole("listitem");
        for (const li of items) {
          const spans = li.querySelectorAll("span");
          // Chip 0 = price, chip 2 = MOQ. Both must be nowrap.
          expect(spans[0].className).toMatch(/\bwhitespace-nowrap\b/);
          expect(spans[2].className).toMatch(/\bwhitespace-nowrap\b/);
        }
      });

      it("MOQ chip uses NBSP between number and unit (never splits across lines)", () => {
        renderRow(level);
        const list = screen.getByTestId("catalog-row-volume-tiers");
        const items = within(list).getAllByRole("listitem");
        for (const li of items) {
          const spans = li.querySelectorAll("span");
          const moqText = spans[2].textContent ?? "";
          // Must contain NBSP (U+00A0) before the unit token.
          expect(moqText).toMatch(/\u00a0(kg|кг)/i);
          // Must NOT contain a regular space immediately before the unit.
          expect(moqText).not.toMatch(/ (kg|кг)\b/i);
        }
      });

      it("constrains tier list to a bounded reading column", () => {
        renderRow(level);
        const list = screen.getByTestId("catalog-row-volume-tiers");
        expect(list.className).toMatch(/max-w-\[260px\]/);
      });

      it("keeps DOM order price → separator → MOQ in each row", () => {
        renderRow(level);
        const list = screen.getByTestId("catalog-row-volume-tiers");
        const items = within(list).getAllByRole("listitem");
        for (const li of items) {
          const spans = li.querySelectorAll("span");
          // 3 spans: price, separator dot, MOQ
          expect(spans.length).toBe(3);
          // Separator is the middle aria-hidden dot.
          expect(spans[1].getAttribute("aria-hidden")).toBe("true");
          expect(spans[1].textContent).toBe("·");
          // MOQ span must contain a unit token (kg/кг) — i.e. it is the
          // quantity, not the price.
          expect(spans[2].textContent ?? "").toMatch(/(kg|кг)/i);
        }
      });
    });
  }
});
