import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero";
import { LanguageProvider } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";

const renderHero = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <Hero />
        {/* Anchor target so scrollIntoView path is exercised. */}
        <section id="offers" data-testid="offers-anchor">offers</section>
      </LanguageProvider>
    </MemoryRouter>,
  );

const getExploreLink = (container: HTMLElement) =>
  container.querySelector<HTMLAnchorElement>('a[href="#offers"]')!;

describe("Hero — Explore Live Offers tracking & highlight integration", () => {
  let trackSpy: ReturnType<typeof vi.spyOn>;
  let dispatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    trackSpy = vi.spyOn(analytics, "track").mockImplementation(() => {});
    dispatchSpy = vi.spyOn(window, "dispatchEvent");
    // jsdom: scrollIntoView is missing on Element by default.
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    trackSpy.mockRestore();
    dispatchSpy.mockRestore();
    vi.useRealTimers();
  });

  it("fires hero_secondary_cta_click exactly once per click (no duplicates)", () => {
    const { container } = renderHero();
    const link = getExploreLink(container);

    fireEvent.click(link);

    const secondaryCalls = trackSpy.mock.calls.filter(
      ([event]) => event === "hero_secondary_cta_click",
    );
    expect(secondaryCalls).toHaveLength(1);
  });

  it("does not emit unrelated events on the explore click (no hero_primary_cta_click, no hero_search_submit)", () => {
    const { container } = renderHero();
    fireEvent.click(getExploreLink(container));

    const events = trackSpy.mock.calls.map(([event]) => event);
    expect(events).toContain("hero_secondary_cta_click");
    expect(events).not.toContain("hero_primary_cta_click");
    expect(events).not.toContain("hero_search_submit");
  });

  it("debounces highlight dispatch on rapid re-clicks: tracking is per-click, but only one yorso:highlight-offers fires", () => {
    const { container } = renderHero();
    const link = getExploreLink(container);

    fireEvent.click(link);
    fireEvent.click(link);
    fireEvent.click(link);

    // Tracking is honest: each click is recorded.
    const secondaryCalls = trackSpy.mock.calls.filter(
      ([event]) => event === "hero_secondary_cta_click",
    );
    expect(secondaryCalls).toHaveLength(3);

    // Before the timer fires, no highlight event yet.
    const highlightBefore = dispatchSpy.mock.calls.filter(
      ([evt]) => (evt as Event).type === "yorso:highlight-offers",
    );
    expect(highlightBefore).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const highlightAfter = dispatchSpy.mock.calls.filter(
      ([evt]) => (evt as Event).type === "yorso:highlight-offers",
    );
    expect(highlightAfter).toHaveLength(1);
  });

  it("respects modifier-clicks: cmd/ctrl-click does not preventDefault, track, or dispatch highlight", () => {
    const { container } = renderHero();
    const link = getExploreLink(container);

    fireEvent.click(link, { metaKey: true });

    expect(trackSpy).not.toHaveBeenCalledWith("hero_secondary_cta_click");
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const highlight = dispatchSpy.mock.calls.filter(
      ([evt]) => (evt as Event).type === "yorso:highlight-offers",
    );
    expect(highlight).toHaveLength(0);
  });

  it("clears pending highlight timer on unmount (no stray dispatch after Hero leaves)", () => {
    const { container, unmount } = renderHero();
    fireEvent.click(getExploreLink(container));
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const highlight = dispatchSpy.mock.calls.filter(
      ([evt]) => (evt as Event).type === "yorso:highlight-offers",
    );
    expect(highlight).toHaveLength(0);
  });
});
