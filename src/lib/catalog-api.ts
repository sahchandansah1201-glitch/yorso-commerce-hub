/**
 * catalog-api.ts — self-hosted-first catalog facade.
 *
 * Configured deployments read through the self-hosted YORSO offer catalog API.
 * API-disabled preview is delegated to `offer-catalog-api` local fixtures.
 * No catalog path falls back to Supabase.
 */

import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { createOfferCatalogApiClient } from "@/lib/offer-catalog-api";

export const fetchOffers = async (level: AccessLevel): Promise<SeafoodOffer[]> => {
  const offerCatalog = createOfferCatalogApiClient();
  const response = await offerCatalog.listOffers({
    accessLevel: level,
    limit: 50,
    offset: 0,
  });
  return response.offers;
};

export const fetchOfferById = async (
  id: string,
  level: AccessLevel,
): Promise<SeafoodOffer | null> => {
  const offerCatalog = createOfferCatalogApiClient();
  return offerCatalog.getOfferById(id, level);
};
