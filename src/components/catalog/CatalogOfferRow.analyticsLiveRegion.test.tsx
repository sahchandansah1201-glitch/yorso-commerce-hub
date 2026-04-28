/**
 * Семантика панели «Аналитика»: live-region и иерархия заголовков.
 *
 * Что закрепляем:
 *  1. Регион панели имеет role="region" и aria-labelledby на скрытый h4
 *     с человекочитаемым именем «Аналитика по офферу <название>».
 *  2. Inner-обёртка (туда монтируется фактический контент) — это
 *     polite live-region с aria-atomic="false" и
 *     aria-relevant="additions text", чтобы скринридер озвучивал
 *     обновление при открытии панели, но не дублировал удаления при
 *     закрытии.
 *  3. Внутри OfferAnalyticsPanel подзаголовки секций — h5,
 *     соответствующие иерархии H3 (товар) → H4 (регион) → H5 (секции).
 *  4. Каждая секция (price-trend / market-signals / news), если
 *     отрисована, содержит ровно один h5 с непустым текстом.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";

const renderRow = () => {
  const offer = mockOffers[0];
  render(
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
  return offer;
};

describe("CatalogOfferRow · «Аналитика» — live-region и иерархия заголовков", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("регион панели подписан скрытым h4 с именем оффера", () => {
    const offer = renderRow();
    const panel = screen.getByTestId("catalog-row-analytics-panel");

    expect(panel.getAttribute("role")).toBe("region");
    const headingId = panel.getAttribute("aria-labelledby");
    expect(headingId).toBe(`offer-analytics-${offer.id}-heading`);

    const heading = document.getElementById(headingId!);
    expect(heading).not.toBeNull();
    expect(heading!.tagName).toBe("H4");
    expect(heading!.className).toContain("sr-only");
    expect(heading!.textContent).toMatch(/Аналитика по офферу/);
    expect(heading!.textContent).toContain(offer.productName);
  });

  it("inner-обёртка работает как polite live-region для объявления обновлений", () => {
    renderRow();
    const inner = screen.getByTestId("catalog-row-analytics-panel-inner");

    expect(inner.getAttribute("aria-live")).toBe("polite");
    expect(inner.getAttribute("aria-atomic")).toBe("false");
    expect(inner.getAttribute("aria-relevant")).toBe("additions text");
  });

  it("внутри панели подзаголовки секций — h5 (иерархия H3 → H4 → H5)", () => {
    renderRow();
    const body = screen.getByTestId("catalog-row-analytics-body");

    // Все заголовки секций должны быть h5 — h4 на этом уровне зарезервирован
    // под скрытый заголовок региона.
    const h5s = body.querySelectorAll("h5");
    expect(h5s.length).toBeGreaterThan(0);

    // На уровне body не должно быть h4/h3 — это нарушит иерархию,
    // потому что h4 уже занят регионом, а h3 — карточкой товара.
    expect(body.querySelectorAll("h4").length).toBe(0);
    expect(body.querySelectorAll("h3").length).toBe(0);

    // Каждый h5 имеет непустой видимый текст.
    h5s.forEach((h) => {
      expect((h.textContent ?? "").trim().length).toBeGreaterThan(0);
    });
  });

  it("каждая отрисованная секция (price-trend / signals / news) содержит ровно один h5", () => {
    renderRow();
    const body = screen.getByTestId("catalog-row-analytics-body");

    const sectionTestIds = [
      "catalog-row-price-trend",
      "catalog-row-market-signals",
      "catalog-row-news",
    ] as const;

    let renderedSections = 0;
    for (const tid of sectionTestIds) {
      const sec = within(body).queryByTestId(tid);
      if (!sec) continue;
      renderedSections += 1;
      const headings = sec.querySelectorAll("h5");
      expect(
        headings.length,
        `секция ${tid} должна содержать ровно один h5-подзаголовок`,
      ).toBe(1);
    }
    // Хотя бы одна секция должна быть отрисована — иначе тест бессмысленный.
    expect(renderedSections).toBeGreaterThan(0);
  });

  it("заголовок товара остаётся h3, а заголовок региона — h4 (общая иерархия документа карточки)", () => {
    const offer = renderRow();
    // Заголовок продукта в карточке.
    const h3 = screen.getByRole("heading", { level: 3, name: offer.productName });
    expect(h3).toBeInTheDocument();

    // Скрытый заголовок региона панели.
    const h4 = document.getElementById(`offer-analytics-${offer.id}-heading`);
    expect(h4).not.toBeNull();
    expect(h4!.tagName).toBe("H4");
  });
});
