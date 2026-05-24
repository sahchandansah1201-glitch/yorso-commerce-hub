import { afterEach, describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { mockOffers } from "@/data/mockOffers";
import { fallbackOfferForLevel } from "@/lib/catalog-fallback";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";

const renderShell = (ui: ReactElement) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>{ui}</BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("catalog offer locale hardening", () => {
  afterEach(() => cleanup());

  it("renders locked desktop offer labels in the active English locale", () => {
    const offer = fallbackOfferForLevel(mockOffers[0], "anonymous_locked");

    renderShell(
      <CatalogOfferRow
        offer={offer}
        isSelected={false}
        onSelect={() => {}}
        forceLevel="anonymous_locked"
      />,
    );

    expect(screen.getByTestId("catalog-row-price")).toHaveTextContent("Exact price locked");

    const analyticsToggle = screen.getByTestId("catalog-row-analytics-toggle");
    expect(analyticsToggle).toHaveTextContent("Price & market analytics");
    expect(analyticsToggle.getAttribute("aria-label")).toBe(
      `Show price and market analytics for ${offer.productName}`,
    );
    expect(analyticsToggle.getAttribute("title")).toBe("Price & market analytics");

    const hintId = analyticsToggle.getAttribute("aria-describedby");
    expect(document.getElementById(hintId!)?.textContent).toContain("The page does not reload");
    expect(document.body.textContent).not.toContain("Цена по запросу");
    expect(document.body.textContent).not.toContain("Аналитика цен");
    expect(document.body.textContent).not.toContain("Разворачивает");
  });

  it("renders locked mobile offer labels in the active English locale", () => {
    const offer = fallbackOfferForLevel(mockOffers[0], "anonymous_locked");

    renderShell(
      <MobileOfferCard
        offer={offer}
        isSelected={false}
        onSelect={() => {}}
        forceLevel="anonymous_locked"
      />,
    );

    expect(screen.getByTestId("catalog-row-price")).toHaveTextContent("Exact price locked");

    const trendToggle = screen.getByTestId("catalog-row-trend-analytics-toggle");
    expect(trendToggle.getAttribute("aria-label")).toBe("Show price analytics");
    expect(trendToggle.getAttribute("title")).toBe("Show price analytics");

    expect(document.body.textContent).not.toContain("Цена по запросу");
    expect(document.body.textContent).not.toContain("Показать аналитику");
  });
});
