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

  it("becomes a 3-column workspace at sm (tablet portrait, 640–1023px) for fast scanning", () => {
    renderRow();
    const row = getRow();
    // Tablet (incl. 768px iPad portrait): три колонки [фото | идентификация |
    // цена/поставщик]. Это даёт сканирование «слева направо» и убирает
    // широкую полосу цены под идентификацией, на которую раньше уходил
    // весь горизонтальный экстент карточки.
    expect(row.className).toContain("sm:grid-cols-[minmax(140px,170px)_minmax(0,1fr)_minmax(190px,220px)]");
  });

  it("keeps a 3-column workspace at lg+ (≥1024px) and refines at xl", () => {
    renderRow();
    const row = getRow();
    expect(row.className).toContain("lg:grid-cols-[minmax(220px,260px)_minmax(0,1.32fr)_minmax(205px,222px)]");
    expect(row.className).toContain("xl:grid-cols-[300px_minmax(0,2.12fr)_minmax(222px,250px)]");
  });

  it("price/supplier block is its own grid column from sm+ (no full-width span)", () => {
    renderRow();
    let priceBlock: HTMLElement | null = screen.getByTestId("catalog-row-price");
    while (priceBlock && !priceBlock.className.includes("flex-col items-stretch")) {
      priceBlock = priceBlock.parentElement;
    }
    expect(priceBlock, "expected to find price/supplier column wrapper").not.toBeNull();
    const cls = (priceBlock as HTMLElement).className;
    expect(cls).not.toContain("sm:col-span-2");
    expect(cls).toContain("border-t");
    expect(cls).toContain("sm:border-t-0");
  });

  it("product image stays compact across breakpoints (4:3 ≤md, square at lg, 5:4+max-height at xl)", () => {
    renderRow();
    // The PhotoGallery wrapper is the first .relative inside the row.
    const imgWrap = getRow().querySelector("div.relative");
    expect(imgWrap).not.toBeNull();
    const cls = (imgWrap as HTMLElement).className;
    // Mobile + tablet (≤1023px): 4:3 keeps the image short relative to the
    // identity column so the row scans horizontally instead of vertically.
    expect(cls).toContain("aspect-[4/3]");
    expect(cls).toContain("sm:aspect-[4/3]");
    // Desktop (1024–1279): square — the row is wide enough for a balanced
    // photo-to-content ratio.
    expect(cls).toContain("lg:aspect-square");
    // XL (≥1280): switch to 5:4 and cap height so a 300px image column
    // never produces a 300px tall hero that dominates the row.
    expect(cls).toContain("xl:aspect-[5/4]");
    expect(cls).toContain("xl:max-h-[260px]");
  });

  it("product title clamps to 3 lines on mobile, 2 from sm+, and breaks long words", () => {
    renderRow();
    const offer = mockOffers[0];
    const heading = screen.getByRole("heading", { level: 3, name: offer.productName });
    // Mobile gets a 3-line clamp so single-column stacking can show the full
    // species name; tablet/desktop tighten back to 2 lines. break-words
    // prevents Latin binomials from forcing horizontal overflow.
    expect(heading.className).toContain("line-clamp-3");
    expect(heading.className).toContain("sm:line-clamp-2");
    expect(heading.className).toContain("break-words");
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
