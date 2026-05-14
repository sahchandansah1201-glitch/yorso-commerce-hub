import {
  offerCatalogDetailResponseSchema,
  offerCatalogItemSchema,
  offerCatalogListResponseSchema,
  offerCatalogQuerySchema,
  type OfferCatalogAccessLevel,
  type OfferCatalogItem,
  type OfferCatalogRecord,
} from "../../../../../packages/contracts/dist/index.js";
import type { OfferCatalogRepository } from "./repository.js";

export class OfferCatalogService {
  constructor(private readonly repository: OfferCatalogRepository) {}

  async listOffers(rawQuery: Record<string, string | undefined>, requestId: string) {
    const query = offerCatalogQuerySchema.parse(rawQuery);
    const { offers, total } = await this.repository.listOffers(query);

    return offerCatalogListResponseSchema.parse({
      ok: true,
      offers: offers.map((offer) => shapeOfferForAccess(offer, query.accessLevel)),
      total,
      accessLevel: query.accessLevel,
      limit: query.limit,
      offset: query.offset,
      requestId,
    });
  }

  async getOfferById(id: string, rawQuery: Record<string, string | undefined>, requestId: string) {
    const query = offerCatalogQuerySchema.pick({ accessLevel: true }).parse(rawQuery);
    const offer = await this.repository.getOfferById(id);
    if (!offer) throw new Error("offer_not_found");

    return offerCatalogDetailResponseSchema.parse({
      ok: true,
      offer: shapeOfferForAccess(offer, query.accessLevel),
      accessLevel: query.accessLevel,
      requestId,
    });
  }
}

export function shapeOfferForAccess(
  offer: OfferCatalogRecord,
  accessLevel: OfferCatalogAccessLevel,
): OfferCatalogItem {
  const unlocked = accessLevel === "qualified_unlocked";

  return offerCatalogItemSchema.parse({
    ...offer,
    supplier: unlocked
      ? offer.supplier
      : {
          id: null,
          name: null,
          country: offer.supplier.country,
          countryCode: offer.supplier.countryCode,
          countryFlag: offer.supplier.countryFlag,
          isVerified: offer.supplier.isVerified,
          inBusinessSince: null,
          responseTime: null,
          certifications: offer.supplier.certifications.slice(0, 2),
          documentsReviewed: [],
          profileSlug: null,
        },
    priceMin: unlocked ? offer.priceMin : null,
    priceMax: unlocked ? offer.priceMax : null,
    currency: unlocked ? offer.currency : null,
    volumeBreaks: unlocked ? offer.volumeBreaks : [],
    accessLevel,
  });
}
