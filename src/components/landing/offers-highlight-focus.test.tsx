import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import Hero from "./Hero";
import LiveOffers from "./LiveOffers";
import { LanguageProvider } from "@/i18n/LanguageContext";

/**
 * Focus contract for the "Highlight Live Wholesale Offers" interaction:
 *
 *   1) Clicking the Hero "Explore live offers" CTA must NOT steal focus away
 *      from the user — focus stays on the triggering element so screen-reader
 *      and keyboard users can keep their place.
 *   2) The highlight side-effect (yorso:highlight-offers event + card
 *      re-mount with new keys) must NOT move focus to <body> or to a random
 *      offer card.
 *   3) Repeated rapid clicks must remain stable: each click re-triggers the
 *      pulse, focus never escapes the trigger, no errors thrown.
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

const getHeroCta = (container: HTMLElement) =>
  container.querySelector('a[href="#offers"]') as HTMLAnchorElement;

describe("Live Wholesale Offers — focus behavior on highlight", () => {
  let originalScrollIntoView: typeof Element.prototype.scrollIntoView;

  beforeEach(() => {
    vi.useFakeTimers();
    originalScrollIntoView = Element.prototype.scrollIntoView;
    // jsdom does not implement scrollIntoView; stub to no-op so Hero handler runs.
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    vi.useRealTimers();
  });

  it("focus stays on the Hero CTA after a single highlight click (does not jump to <body> or a card)", () => {
    const { container } = renderHomeFragment();
    const cta = getHeroCta(container);
    expect(cta).not.toBeNull();

    cta.focus();
    expect(document.activeElement).toBe(cta);

    fireEvent.click(cta);

    // Run the 450ms timeout that dispatches yorso:highlight-offers.
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Focus must still be on the trigger — not on <body>, not on a card.
    expect(document.activeElement).toBe(cta);
    expect(document.activeElement).not.toBe(document.body);

    const firstCardLink = container.querySelector(
      '#offers .grid > li a[href^="/offers/"]',
    ) as HTMLElement | null;
    expect(firstCardLink).not.toBeNull();
    expect(document.activeElement).not.toBe(firstCardLink);
  });

  it("rapid repeated clicks keep focus on the trigger and do not throw", () => {
    const { container } = renderHomeFragment();
    const cta = getHeroCta(container);
    cta.focus();
    expect(document.activeElement).toBe(cta);

    const CLICKS = 6;
    expect(() => {
      for (let i = 0; i < CLICKS; i++) {
        fireEvent.click(cta);
        // Flush each pending highlight dispatch before the next click so the
        // event handler in LiveOffers runs and re-mounts cards with a new key.
        act(() => {
          vi.advanceTimersByTime(500);
        });
        // Focus must survive every cycle.
        expect(document.activeElement).toBe(cta);
      }
    }).not.toThrow();

    // Sanity: cards were re-mounted on each click — keys must be unique across
    // the 6 cycles (initial render counts as tick 0, so we expect tick === 6).
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>("#offers .grid > li"),
    );
    expect(cards.length).toBeGreaterThan(0);
    const ticks = new Set(
      cards.map((c) => c.getAttribute("data-card-key")?.split("-").pop()),
    );
    // All visible cards in the current render share the SAME tick suffix.
    expect(ticks.size).toBe(1);
    expect(Array.from(ticks)[0]).toBe(String(CLICKS));
  });

  it("highlight event dispatched directly does not move focus away from the currently focused control", () => {
    const { container } = renderHomeFragment();
    const cta = getHeroCta(container);
    cta.focus();
    expect(document.activeElement).toBe(cta);

    // Simulate the side-effect alone (e.g. another component dispatches it).
    act(() => {
      window.dispatchEvent(new CustomEvent("yorso:highlight-offers"));
    });
    act(() => {
      window.dispatchEvent(new CustomEvent("yorso:highlight-offers"));
    });
    act(() => {
      window.dispatchEvent(new CustomEvent("yorso:highlight-offers"));
    });

    // Pure visual side-effect — focus must not move.
    expect(document.activeElement).toBe(cta);
  });
});
