import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SelectedOfferPanel from "@/components/catalog/SelectedOfferPanel";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";

/**
 * Heading-order contract for the procurement workspace right panel.
 *
 * Buyers scan the panel top→bottom while evaluating an offer. The agreed
 * scanning order is:
 *
 *   1. Price trend       (price movement signal)
 *   2. Market signals    (alerts/watch items relevant to category)
 *   3. News              (country news affecting this offer)
 *
 * If anyone reorders these sections — for example pushes Market signals
 * back to the bottom of the panel — these tests fail loudly.
 *
 * We assert on rendered <h3> headings (what users actually see),
 * matched per active locale via the LanguageProvider, so the test is
 * resilient to copy tweaks but strict on order.
 */

const renderPanel = () => {
  // Pick an offer that has both price trend, signals, and country news data.
  const offer =
    mockOffers.find(
      (o) => o.category === "Salmon" || o.category === "Whitefish",
    ) ?? mockOffers[0];

  return render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <SelectedOfferPanel offer={offer} />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

const expectedHeadings = {
  en: ["Price trend", "Market signals", "Country news affecting this offer"],
  ru: [
    "Динамика цены",
    "Рыночные сигналы",
    "Новости стран, влияющие на это предложение",
  ],
  es: [
    "Tendencia de precio",
    "Señales de mercado",
    "Noticias de países que afectan a esta oferta",
  ],
} as const;

describe("SelectedOfferPanel — heading sequence", () => {
  beforeEach(() => {
    // LanguageProvider reads from localStorage; reset to a known state so
    // navigator.language doesn't drift the locale between test runs.
    window.localStorage.clear();
  });

  it("renders all three section headings", () => {
    renderPanel();

    for (const heading of expectedHeadings.en) {
      expect(
        screen.getByRole("heading", { level: 3, name: heading }),
      ).toBeInTheDocument();
    }
  });

  it("orders headings as Price trend → Market signals → News (default locale)", () => {
    const { container } = renderPanel();

    // Collect every <h3> the panel renders, in DOM order.
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h3"),
    ).map((h) => h.textContent?.trim());

    const priceIdx = headings.indexOf(expectedHeadings.en[0]);
    const signalsIdx = headings.indexOf(expectedHeadings.en[1]);
    const newsIdx = headings.indexOf(expectedHeadings.en[2]);

    expect(priceIdx, "Price trend heading must render").toBeGreaterThanOrEqual(
      0,
    );
    expect(signalsIdx, "Market signals heading must render").toBeGreaterThanOrEqual(
      0,
    );
    expect(newsIdx, "News heading must render").toBeGreaterThanOrEqual(0);

    expect(priceIdx).toBeLessThan(signalsIdx);
    expect(signalsIdx).toBeLessThan(newsIdx);
  });

  it("Market signals heading appears immediately after Price trend (no section in between)", () => {
    const { container } = renderPanel();
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h3"),
    ).map((h) => h.textContent?.trim());

    const priceIdx = headings.indexOf(expectedHeadings.en[0]);
    const signalsIdx = headings.indexOf(expectedHeadings.en[1]);

    // Adjacent in the heading sequence — guarantees no other section
    // (news, docs, supplier trust, countries-affecting-price, etc.) sneaks
    // between Price trend and Market signals.
    expect(signalsIdx - priceIdx).toBe(1);
  });

  it("preserves the order in Russian locale", () => {
    window.localStorage.setItem("yorso-lang", "ru");
    const { container } = renderPanel();

    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h3"),
    ).map((h) => h.textContent?.trim());

    const [price, signals, news] = expectedHeadings.ru;
    const priceIdx = headings.indexOf(price);
    const signalsIdx = headings.indexOf(signals);
    const newsIdx = headings.indexOf(news);

    expect(priceIdx).toBeGreaterThanOrEqual(0);
    expect(signalsIdx).toBeGreaterThanOrEqual(0);
    expect(newsIdx).toBeGreaterThanOrEqual(0);
    expect(priceIdx).toBeLessThan(signalsIdx);
    expect(signalsIdx).toBeLessThan(newsIdx);
    expect(signalsIdx - priceIdx).toBe(1);
  });
});
