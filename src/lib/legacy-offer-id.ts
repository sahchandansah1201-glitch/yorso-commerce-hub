/**
 * legacy-offer-id.ts — единый маппинг старых mock-id ("1".."99") → стабильных
 * UUID, которые получили демо-офферы при сидинге Supabase.
 *
 * Используется и в роутере (LegacyOfferRedirect), и внутри OfferDetail
 * (как защита на случай прямого попадания старого id в компонент).
 */

const LEGACY_ID_PATTERN = /^\d{1,12}$/;

export const isLegacyOfferId = (id: string | undefined): id is string =>
  !!id && LEGACY_ID_PATTERN.test(id);

export const legacyOfferIdToUuid = (numericId: string): string =>
  `00000000-0000-0000-0000-${numericId.padStart(12, "0")}`;
