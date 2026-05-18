/**
 * catalog-api.ts — self-hosted-first catalog facade.
 *
 * Production reads should go through the self-hosted YORSO offer catalog API.
 * The legacy Supabase path is isolated in `legacy-catalog-supabase-adapter.ts`
 * and remains only as a prototype/reference fallback.
 */

import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { createOfferCatalogApiClient } from "@/lib/offer-catalog-api";
import {
  fetchLegacyCatalogOfferById,
  fetchLegacyCatalogOffers,
  type SupplierPublicRow,
} from "@/lib/legacy-catalog-supabase-adapter";

export const fetchOffers = async (level: AccessLevel): Promise<SeafoodOffer[]> => {
  const selfHostedOfferCatalog = createOfferCatalogApiClient();
  if (selfHostedOfferCatalog.enabled) {
    const response = await selfHostedOfferCatalog.listOffers({
      accessLevel: level,
      limit: 50,
      offset: 0,
    });
    return response.offers;
  }

  return fetchLegacyCatalogOffers(level);
};

export const fetchOfferById = async (
  id: string,
  level: AccessLevel,
): Promise<SeafoodOffer | null> => {
  const selfHostedOfferCatalog = createOfferCatalogApiClient();
  if (selfHostedOfferCatalog.enabled) {
    return selfHostedOfferCatalog.getOfferById(id, level);
  }

  return fetchLegacyCatalogOfferById(id, level);
};

// Утилита экспортируется для возможного использования в SupplierTrustPanel,
// если в будущем потребуется отдельный запрос обезличенного supplier-trust.
export type { SupplierPublicRow };
