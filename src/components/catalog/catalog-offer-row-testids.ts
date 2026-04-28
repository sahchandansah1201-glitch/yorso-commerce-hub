/**
 * Стабильные data-testid селекторы для CatalogOfferRow.
 *
 * Источник правды для e2e/unit тестов: тесты должны импортировать эти
 * константы или дублировать строки 1:1, чтобы изменение testid в коде
 * автоматически ломало контрактные тесты, а не молча меняло селекторы.
 *
 * Зоны карточки:
 *   - row              — корневой <article> ряда
 *   - priceBlock       — контейнер цены + MOQ + volume breaks
 *   - price            — баблик с числовой/диапазонной ценой
 *   - moq              — строка MOQ (минимальный заказ)
 *   - moqSummary       — сводка MOQ для locked-режима ("1,000 – 20,000+ kg")
 *   - volumeTiers      — список доп. тиров объёмного прайсинга
 *   - supplierLine     — контейнер строки поставщика
 *   - supplierName     — имя поставщика (blur для locked)
 *   - supplierCountry  — страна поставщика
 *   - analyticsToggle  — пиктограмма-кнопка раскрытия аналитики
 *   - analyticsPanel   — раскрывающийся контейнер с панелью аналитики
 */
export const CATALOG_OFFER_ROW_TEST_IDS = {
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
} as const;

export type CatalogOfferRowTestId =
  (typeof CATALOG_OFFER_ROW_TEST_IDS)[keyof typeof CATALOG_OFFER_ROW_TEST_IDS];
