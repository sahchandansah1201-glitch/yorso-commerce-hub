import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SelectedOfferPanel from "@/components/catalog/SelectedOfferPanel";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";

/**
 * Layout contract: in the procurement workspace right panel
 * (SelectedOfferPanel), the "Market signals" section must always
 * render IMMEDIATELY after the "Price trend" section.
 *
 * If anyone reorders sections (e.g. moves news/docs/trust between
 * them, or pushes signals to the bottom) this test fails loudly.
 */
describe("SelectedOfferPanel — section order", () => {
  it("renders Market signals directly after Price trend", () => {
    // Pick an offer that has both price trend and market signals available.
    const offer =
      mockOffers.find(
        (o) => o.category === "Salmon" || o.category === "Whitefish",
      ) ?? mockOffers[0];

    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <BuyerSessionProvider>
            <SelectedOfferPanel offer={offer} />
          </BuyerSessionProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );

    const trend = container.querySelector(
      '[data-testid="catalog-panel-price-trend"]',
    );
    const signals = container.querySelector(
      '[data-testid="catalog-panel-market-signals"]',
    );

    expect(trend, "Price trend section should render").not.toBeNull();
    expect(signals, "Market signals section should render").not.toBeNull();

    // Both must share the same parent (the panel <aside>).
    expect(trend!.parentElement).toBe(signals!.parentElement);

    // Walk forward from trend skipping non-element nodes/comments — the very
    // next element sibling must be the Market signals section.
    let next: Element | null = trend!.nextElementSibling;
    expect(next, "Price trend must have a following sibling").not.toBeNull();
    expect(next).toBe(signals);
  });
});
