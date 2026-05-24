const REDACTED_PRICE_LABELS = new Set([
  "Цена по запросу",
  "Price on request",
  "Precio a consultar",
]);

export const resolveCatalogPriceRangeLabel = (
  priceRange: string | null | undefined,
  lockedLabel: string,
) => {
  const normalized = priceRange?.trim();
  if (!normalized || REDACTED_PRICE_LABELS.has(normalized)) return lockedLabel;
  return priceRange;
};
