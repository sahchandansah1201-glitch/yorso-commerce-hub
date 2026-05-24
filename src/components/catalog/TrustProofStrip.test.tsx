import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";

vi.mock("@/lib/analytics", () => ({
  default: {
    track: vi.fn(),
  },
}));

import TrustProofStrip from "./TrustProofStrip";

const makeAnchor = (id: string, visible: boolean) => {
  const el = document.createElement("div");
  el.id = id;
  el.style.display = visible ? "block" : "none";
  el.style.visibility = "visible";

  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      top: 0,
      right: visible ? 320 : 0,
      bottom: visible ? 120 : 0,
      left: 0,
      width: visible ? 320 : 0,
      height: visible ? 120 : 0,
      toJSON: () => ({}),
    }),
  });

  const scrollIntoView = vi.fn();
  el.scrollIntoView = scrollIntoView;
  document.body.appendChild(el);

  return { el, scrollIntoView };
};

const renderStrip = () =>
  render(
    <LanguageProvider>
      <TrustProofStrip />
    </LanguageProvider>,
  );

describe("TrustProofStrip", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("falls back from the hidden desktop intelligence panel to visible offer results", () => {
    const intelligence = makeAnchor("catalog-anchor-intelligence", false);
    const results = makeAnchor("catalog-anchor-results", true);

    renderStrip();
    fireEvent.click(screen.getByTestId("catalog-trust-proof-signals"));

    expect(intelligence.scrollIntoView).not.toHaveBeenCalled();
    expect(results.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "smooth",
    });
  });

  it("uses the primary intelligence anchor when it is visible", () => {
    const intelligence = makeAnchor("catalog-anchor-intelligence", true);
    const results = makeAnchor("catalog-anchor-results", true);

    renderStrip();
    fireEvent.click(screen.getByTestId("catalog-trust-proof-signals"));

    expect(intelligence.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "smooth",
    });
    expect(results.scrollIntoView).not.toHaveBeenCalled();
  });

  it("sends document-readiness proof directly to offer evidence instead of the filter bar", () => {
    const filters = makeAnchor("catalog-anchor-filters", true);
    const results = makeAnchor("catalog-anchor-results", true);

    renderStrip();
    fireEvent.click(screen.getByTestId("catalog-trust-proof-documents"));

    expect(filters.scrollIntoView).not.toHaveBeenCalled();
    expect(results.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "smooth",
    });
  });
});
