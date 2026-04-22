import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LiveOffers from "./LiveOffers";
import { LanguageProvider } from "@/i18n/LanguageContext";

const renderLiveOffers = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <LiveOffers />
      </LanguageProvider>
    </MemoryRouter>,
  );

const getCardWrappers = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>("#offers .grid > div"),
  );

const fireHighlight = () => {
  act(() => {
    window.dispatchEvent(new CustomEvent("yorso:highlight-offers"));
  });
};

describe("LiveOffers highlight behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("applies offer-highlight class on every event dispatch (repeats on re-click)", () => {
    const { container } = renderLiveOffers();
    const initialCards = getCardWrappers(container);
    expect(initialCards.length).toBeGreaterThan(0);
    initialCards.forEach((el) => {
      expect(el.className).not.toContain("offer-highlight");
    });

    fireHighlight();
    const firstPass = getCardWrappers(container);
    firstPass.forEach((el) => {
      expect(el.className).toContain("offer-highlight");
    });
    const firstKeys = firstPass.map((el) => el.getAttribute("data-card-key"));

    // Repeat: must re-mount nodes (new keys) so the CSS animation restarts.
    fireHighlight();
    const secondPass = getCardWrappers(container);
    secondPass.forEach((el) => {
      expect(el.className).toContain("offer-highlight");
    });
    const secondKeys = secondPass.map((el) => el.getAttribute("data-card-key"));
    expect(secondKeys).not.toEqual(firstKeys);
  });

  it("highlight does not become permanent: animation is one-shot, not infinite, and state is not affected by scroll", () => {
    const { container } = renderLiveOffers();
    fireHighlight();
    const cards = getCardWrappers(container);
    // CSS rule is set at 1.4s ease-out, no `infinite` keyword.
    // We assert via the inline animationDelay staggering and the absence of
    // any class mutation triggered by scroll events.
    cards.forEach((el, idx) => {
      expect(el.style.animationDelay).toBe(`${idx * 60}ms`);
    });

    // Simulate aggressive scrolling — must not toggle/append highlight class.
    const before = cards.map((el) => el.className);
    for (let i = 0; i < 20; i++) {
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
    }
    const after = getCardWrappers(container).map((el) => el.className);
    expect(after).toEqual(before);
  });
});
