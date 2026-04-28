import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import fs from "node:fs";
import path from "node:path";
import Header from "./Header";
import Hero from "./Hero";
import LiveOffers from "./LiveOffers";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { mockOffers } from "@/data/mockOffers";

// Стабилизируем источник данных LiveOffers: тест проверяет только anchor/scroll,
// сетевые вызовы тут только мешают. Имитируем успешный ответ Supabase.
vi.mock("@/lib/useLandingOffers", () => ({
  useLandingOffers: () => ({
    offers: mockOffers,
    source: "supabase" as const,
    isLoading: false,
  }),
}));

/**
 * Verifies that the #offers anchor lands BELOW the sticky header — i.e. the
 * top of the section is not hidden under the fixed/sticky <header>.
 *
 * We assert three layers:
 *   1) global CSS reserves enough scroll-padding-top for the header height.
 *   2) the #offers section declares scroll-mt-* matching that reservation.
 *   3) the Hero's "Explore live offers" CTA scrolls to #offers via
 *      scrollIntoView (which honors scroll-padding-top / scroll-margin-top).
 */

const renderHomeFragment = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <Header />
        <Hero />
        <LiveOffers />
      </LanguageProvider>
    </MemoryRouter>,
  );

const remToPx = (rem: number) => rem * 16;

describe("#offers anchor lands below sticky header", () => {
  let scrollIntoViewSpy: ReturnType<typeof vi.fn>;
  let originalScrollIntoView: typeof Element.prototype.scrollIntoView;

  beforeEach(() => {
    originalScrollIntoView = Element.prototype.scrollIntoView;
    scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy as unknown as typeof Element.prototype.scrollIntoView;
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  it("global html scroll-padding-top reserves space for the sticky header (>= 4rem + 1px border)", () => {
    const cssPath = path.resolve(__dirname, "../../index.css");
    const css = fs.readFileSync(cssPath, "utf8");

    // Match `html { ... scroll-padding-top: <value>; ... }`
    const htmlBlock = css.match(/html\s*\{[^}]*\}/);
    expect(htmlBlock, "expected html { } block in index.css").toBeTruthy();

    const m = htmlBlock![0].match(/scroll-padding-top:\s*([\d.]+)rem/);
    expect(m, "expected scroll-padding-top in rem on html").toBeTruthy();

    const reservedPx = remToPx(parseFloat(m![1]));
    // Header is h-16 (4rem = 64px) + 1px bottom border = 65px minimum.
    expect(reservedPx).toBeGreaterThanOrEqual(65);
  });

  it("#offers section has scroll-mt-* class matching/exceeding header height", () => {
    const { container } = renderHomeFragment();
    const section = container.querySelector("#offers") as HTMLElement | null;
    expect(section).not.toBeNull();

    const className = section!.className;
    // Tailwind: scroll-mt-20 = 5rem on mobile, scroll-mt-24 = 6rem md+.
    // Both are >= header height (4rem + 1px), so the section header is not
    // clipped by the sticky header on any breakpoint.
    expect(className).toMatch(/\bscroll-mt-(20|24|28|32)\b/);
    // And ensure the desktop variant is also at least 6rem (md:scroll-mt-24+).
    expect(className).toMatch(/\bmd:scroll-mt-(24|28|32)\b/);
  });

  it("Hero 'Explore live offers' CTA scrolls #offers into view (honors scroll-padding-top)", () => {
    const { container, getAllByRole } = renderHomeFragment();

    // The Hero CTA is an <a href="#offers"> wrapping a button. Find by href.
    const anchor = container.querySelector('a[href="#offers"]') as HTMLAnchorElement | null;
    expect(anchor, "expected Hero anchor pointing to #offers").not.toBeNull();

    fireEvent.click(anchor!);

    // scrollIntoView must be called on the #offers element.
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
    const callContext = scrollIntoViewSpy.mock.instances[0] as unknown as HTMLElement;
    expect(callContext.id).toBe("offers");

    // Smooth scroll, aligned to start — combined with scroll-padding-top this
    // guarantees the top edge of #offers ends up below the sticky header.
    const opts = scrollIntoViewSpy.mock.calls[0][0] as ScrollIntoViewOptions;
    expect(opts).toMatchObject({ behavior: "smooth", block: "start" });

    // Sanity: at least one CTA button is present (renders correctly).
    expect(getAllByRole("button").length).toBeGreaterThan(0);
  });
});
