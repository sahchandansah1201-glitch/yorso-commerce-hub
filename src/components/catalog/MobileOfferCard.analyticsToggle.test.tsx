/**
 * MobileOfferCard · аналитика по индикатору тренда у цены.
 *
 * Цели:
 *  1. По умолчанию панель аналитики свёрнута.
 *  2. Клик по индикатору тренда (+4.8% и т.п.) разворачивает панель.
 *  3. Повторный клик — сворачивает.
 *  4. В карточке нет дублирующего триггера аналитики
 *     (data-testid="catalog-row-analytics-toggle"), используется
 *     только индикатор тренда.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";

const renderCard = () => {
  // Берём первый Salmon-оффер — для категории Salmon в priceTrends
  // объявлен d30 = +4.8%, поэтому индикатор тренда точно отрисуется.
  const offer = mockOffers[0];
  const utils = render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <MobileOfferCard
            offer={offer}
            isSelected={false}
            onSelect={() => {}}
          />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  return { ...utils, offer };
};

describe("MobileOfferCard · trend indicator opens analytics", () => {
  beforeEach(() => {
    // Чистый стейт перед каждым тестом.
  });

  afterEach(() => {
    cleanup();
  });

  it("по умолчанию панель аналитики свёрнута", () => {
    const { queryByTestId } = renderCard();
    const trigger = queryByTestId("catalog-row-trend-analytics-toggle");
    expect(trigger).not.toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("клик по индикатору тренда раскрывает панель", () => {
    const { getByTestId } = renderCard();
    const trigger = getByTestId("catalog-row-trend-analytics-toggle");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("повторный клик по индикатору сворачивает панель", () => {
    const { getByTestId } = renderCard();
    const trigger = getByTestId("catalog-row-trend-analytics-toggle");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("индикатор тренда отображает процент изменения (+4.8% для Salmon)", () => {
    const { getByTestId } = renderCard();
    const trigger = getByTestId("catalog-row-trend-analytics-toggle");
    expect(trigger.textContent).toMatch(/4\.8%/);
  });

  it("в карточке нет дублирующего триггера аналитики внизу", () => {
    const { container, queryByTestId, queryAllByTestId } = renderCard();

    // Старый триггер с пиктограммой BarChart3 (data-testid
    // "catalog-row-analytics-toggle") должен быть удалён —
    // используется только индикатор тренда.
    expect(queryByTestId("catalog-row-analytics-toggle")).toBeNull();

    // На всякий случай: единственный триггер аналитики в карточке —
    // именно trend-индикатор, других кнопок-аналитики быть не должно.
    const trendToggles = queryAllByTestId(
      "catalog-row-trend-analytics-toggle",
    );
    expect(trendToggles).toHaveLength(1);

    // Дополнительная страховка: нет иконки lucide BarChart3 в карточке.
    const barChartIcons = container.querySelectorAll(".lucide-bar-chart-3");
    expect(barChartIcons.length).toBe(0);
  });

  it("индикатор тренда — единственный связанный с аналитикой триггер", () => {
    const { container } = renderCard();
    // Все элементы с aria-expanded внутри карточки должны быть либо
    // диалогами/меню (которых сейчас нет в дефолтном уровне), либо
    // нашим единственным trend-триггером.
    const expandables = container.querySelectorAll("[aria-expanded]");
    const analyticsTriggers = Array.from(expandables).filter((el) =>
      (el as HTMLElement).getAttribute("aria-label")?.includes("аналитик"),
    );
    expect(analyticsTriggers).toHaveLength(1);
  });
});
