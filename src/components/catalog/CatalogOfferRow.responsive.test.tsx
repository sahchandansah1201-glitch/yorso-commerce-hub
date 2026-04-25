import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";

/**
 * Visual / layout contract tests for the catalog offer row.
 *
 * jsdom cannot render pixels, so we cannot diff screenshots here. Instead we
 * pin the responsive Tailwind class contract that controls grid layout, image
 * aspect ratio, and price/supplier column placement. If anyone tweaks the row
 * grid in a way that would visibly break tablet (768px) or mobile (375px /
 * 390px) layouts — losing the third-column wrap, removing single-column
 * stacking, restoring fixed 320px image, etc. — these tests fail loudly.
 *
 * Pair with manual screenshot review in the preview at iPhone (390px),
 * Android (360–412px) and iPad (768px) widths.
 */

const renderRow = () => {
  const offer = mockOffers[0];
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogOfferRow
            offer={offer}
            isSelected={false}
            onSelect={() => {}}
            forceLevel="anonymous_locked"
          />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

const getRow = () => screen.getByTestId("catalog-offer-row");

describe("CatalogOfferRow — responsive layout contract", () => {
  it("uses a single-column stack on mobile (<sm)", () => {
    renderRow();
    const row = getRow();
    // Mobile: must start as one column. Anything else creates the cramped
    // 2-word-wide right column we previously shipped on iPhone widths.
    expect(row.className).toMatch(/(^|\s)grid-cols-1(\s|$)/);
  });

  it("switches to 2-column [image | content] at sm (tablet portrait, 640–1023px)", () => {
    renderRow();
    const row = getRow();
    // Tablet (incl. 768px iPad portrait): image column ~180px, content fluid.
    // The price/supplier block then spans both columns underneath.
    expect(row.className).toContain("sm:grid-cols-[180px_minmax(0,1fr)]");
  });

  it("becomes a 3-column workspace at lg+ (≥1024px) and refines at xl", () => {
    renderRow();
    const row = getRow();
    expect(row.className).toContain("lg:grid-cols-[260px_minmax(0,1.5fr)_minmax(0,220px)]");
    expect(row.className).toContain("xl:grid-cols-[300px_minmax(0,1.61fr)_minmax(0,230px)]");
  });

  it("price/supplier block spans full width below lg and becomes its own column at lg+", () => {
    renderRow();
    const priceBlock = screen.getByTestId("catalog-row-price").closest("div.flex.flex-col");
    expect(priceBlock).not.toBeNull();
    const cls = (priceBlock as HTMLElement).className;
    // Spans both columns on tablet so it never gets squeezed into a narrow
    // sliver next to the content column.
    expect(cls).toContain("sm:col-span-2");
    expect(cls).toContain("lg:col-span-1");
    // Visual separator only below lg (where it sits under the content).
    expect(cls).toContain("border-t");
    expect(cls).toContain("lg:border-t-0");
  });

  it("product image uses 4:3 on mobile and square from sm+", () => {
    renderRow();
    // The PhotoGallery wrapper is the first .relative inside the row.
    const imgWrap = getRow().querySelector("div.relative");
    expect(imgWrap).not.toBeNull();
    const cls = (imgWrap as HTMLElement).className;
    expect(cls).toContain("aspect-[4/3]");
    expect(cls).toContain("sm:aspect-square");
  });

  it("product title and Latin name remain visible and clamp instead of overflowing", () => {
    renderRow();
    const offer = mockOffers[0];
    const heading = screen.getByRole("heading", { level: 3, name: offer.productName });
    // Two-line clamp prevents the "Atlant Sal..." 1-word truncation that we
    // saw when the right column was too narrow on tablet.
    expect(heading.className).toContain("line-clamp-2");
    const latin = heading.parentElement?.parentElement?.querySelector("p");
    expect(latin?.className).toContain("line-clamp-1");
  });

  it("renders price, MOQ and locked-access copy in the same block on mobile", () => {
    renderRow();
    const priceBlock = screen.getByTestId("catalog-row-price");
    // Locked access message must stay co-located with price so mobile users
    // see the access rule without scrolling to a different region.
    expect(within(priceBlock.parentElement as HTMLElement).getByText(/—/)).toBeTruthy();
  });
});
