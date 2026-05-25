import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { mockOffers } from "@/data/mockOffers";
import OfferSummary from "@/components/offer-detail/OfferSummary";

const renderSummary = () => {
  localStorage.setItem("yorso-lang", "en");
  const offer = mockOffers[0];
  const utils = render(
    <MemoryRouter>
      <LanguageProvider>
        <OfferSummary offer={offer} accessLevel="anonymous_locked" />
      </LanguageProvider>
    </MemoryRouter>,
  );
  return { ...utils, offer };
};

describe("OfferSummary · public offer detail locale hardening", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders buyer decision labels in English on the English route", () => {
    renderSummary();

    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByText("Inventory level")).toBeInTheDocument();
    expect(screen.getByLabelText("Inventory level: medium volume")).toBeInTheDocument();
    expect(screen.getByText("Compliance certifications")).toBeInTheDocument();
    expect(screen.getByText("Delivery basis")).toBeInTheDocument();
    expect(screen.getByText("Min. lot:")).toBeInTheDocument();
    expect(screen.getByText("Price and supplier — after sign-up")).toBeInTheDocument();
  });

  it("does not leak Russian visible or programmatic labels into English offer detail", () => {
    const { container } = renderSummary();

    const visibleText = document.body.textContent ?? "";
    expect(visibleText).not.toMatch(/Уровень запасов|Сертификаты соответствия|Базис поставки|Мин\. партия|Цена и поставщик/u);

    const ariaLabels = Array.from(container.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label") ?? "");
    expect(ariaLabels.filter((label) => /[А-Яа-яЁё]/.test(label))).toEqual([]);
  });
});
