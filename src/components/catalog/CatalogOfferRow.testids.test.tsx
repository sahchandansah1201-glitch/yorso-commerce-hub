/**
 * Контракт стабильных data-testid селекторов CatalogOfferRow.
 *
 * Эти testid задумываются как публичный API карточки для unit/e2e
 * тестов: верстка, классы и переводы могут меняться, селекторы — нет.
 * Любое переименование testid в коде должно осознанно ломать этот тест.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";
import { CATALOG_OFFER_ROW_TEST_IDS as TID } from "@/components/catalog/catalog-offer-row-testids";
import type { AccessLevel } from "@/lib/access-level";

const renderRow = (level: AccessLevel) => {
  cleanup();
  // Берём оффер с volume breaks, чтобы покрыть и MOQ-сводку, и обычный MOQ.
  const offer =
    mockOffers.find((o) => (o.volumeBreaks ?? []).length > 1) ?? mockOffers[0];
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogOfferRow
            offer={offer}
            isSelected={false}
            onSelect={() => {}}
            forceLevel={level}
          />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  return offer;
};

describe("CatalogOfferRow · контракт data-testid", () => {
  it("экспортирует ожидаемый набор констант testid", () => {
    expect(TID).toMatchObject({
      row: "catalog-offer-row",
      priceBlock: "catalog-row-price-block",
      price: "catalog-row-price",
      moq: "catalog-row-moq",
      moqSummary: "catalog-row-moq-summary",
      volumeTiers: "catalog-row-volume-tiers",
      supplierLine: "catalog-row-supplier-line",
      supplierName: "catalog-row-supplier-name",
      supplierCountry: "catalog-row-supplier-country",
      analyticsToggle: "catalog-row-analytics-toggle",
      analyticsPanel: "catalog-row-analytics-panel",
    });
  });

  describe("anonymous_locked", () => {
    it("рендерит контейнер цены/MOQ и строку поставщика по стабильным testid", () => {
      renderRow("anonymous_locked");

      const priceBlock = screen.getByTestId(TID.priceBlock);
      expect(priceBlock).toBeInTheDocument();
      expect(priceBlock).toHaveAttribute("data-access-level", "anonymous_locked");

      // Внутри блока цены: цена + MOQ-сводка (для locked используется summary).
      expect(within(priceBlock).getByTestId(TID.price)).toBeInTheDocument();
      expect(within(priceBlock).getByTestId(TID.moqSummary)).toBeInTheDocument();

      // Строка поставщика и её внутренние узлы.
      const supplierLine = screen.getByTestId(TID.supplierLine);
      expect(supplierLine).toBeInTheDocument();
      expect(supplierLine).toHaveAttribute("data-supplier-unlocked", "false");
      expect(within(supplierLine).getByTestId(TID.supplierName)).toBeInTheDocument();
      expect(within(supplierLine).getByTestId(TID.supplierCountry)).toBeInTheDocument();
    });
  });

  describe("registered_locked", () => {
    it("сохраняет testid контейнеров цены и поставщика", () => {
      renderRow("registered_locked");
      expect(screen.getByTestId(TID.priceBlock)).toHaveAttribute(
        "data-access-level",
        "registered_locked",
      );
      expect(screen.getByTestId(TID.supplierLine)).toHaveAttribute(
        "data-supplier-unlocked",
        "false",
      );
    });
  });

  describe("qualified_unlocked", () => {
    it("отдаёт unlocked-вариант блока цены с MOQ-строкой и unlocked-поставщиком", () => {
      renderRow("qualified_unlocked");

      const priceBlock = screen.getByTestId(TID.priceBlock);
      expect(priceBlock).toHaveAttribute("data-access-level", "qualified_unlocked");
      expect(within(priceBlock).getByTestId(TID.price)).toBeInTheDocument();
      // В unlocked-режиме рендерится MoqLine, а не MoqSummary.
      expect(within(priceBlock).getByTestId(TID.moq)).toBeInTheDocument();
      expect(within(priceBlock).queryByTestId(TID.moqSummary)).toBeNull();

      const supplierLine = screen.getByTestId(TID.supplierLine);
      expect(supplierLine).toHaveAttribute("data-supplier-unlocked", "true");
      expect(within(supplierLine).getByTestId(TID.supplierName)).toBeInTheDocument();
      expect(within(supplierLine).getByTestId(TID.supplierCountry)).toBeInTheDocument();
    });
  });

  it("каждый ключевой контейнер присутствует ровно по одному разу", () => {
    renderRow("anonymous_locked");
    expect(screen.getAllByTestId(TID.priceBlock)).toHaveLength(1);
    expect(screen.getAllByTestId(TID.price)).toHaveLength(1);
    expect(screen.getAllByTestId(TID.supplierLine)).toHaveLength(1);
    expect(screen.getAllByTestId(TID.supplierName)).toHaveLength(1);
    expect(screen.getAllByTestId(TID.supplierCountry)).toHaveLength(1);
  });
});
