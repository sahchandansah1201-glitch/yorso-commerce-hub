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
import type { SupplierAccessRepository } from "../access/repository.js";

export class OfferCatalogService {
  constructor(
    private readonly repository: OfferCatalogRepository,
    private readonly accessRepository?: SupplierAccessRepository,
  ) {}

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

  async getOfferById(
    id: string,
    rawQuery: Record<string, string | undefined>,
    requestId: string,
    viewer?: { buyerUserId: string } | null,
  ) {
    const query = offerCatalogQuerySchema.pick({ accessLevel: true }).parse(rawQuery);
    const offer = await this.repository.getOfferById(id);
    if (!offer) throw new Error("offer_not_found");
    const accessLevel = await this.resolveDetailAccessLevel(offer, query.accessLevel, viewer);

    return offerCatalogDetailResponseSchema.parse({
      ok: true,
      offer: shapeOfferForAccess(offer, accessLevel),
      accessLevel,
      requestId,
    });
  }

  private async resolveDetailAccessLevel(
    offer: OfferCatalogRecord,
    requested: OfferCatalogAccessLevel,
    viewer?: { buyerUserId: string } | null,
  ): Promise<OfferCatalogAccessLevel> {
    if (requested === "anonymous_locked") return "anonymous_locked";
    if (!viewer?.buyerUserId || !this.accessRepository) return "anonymous_locked";
    if (!offer.supplier.id) return "registered_locked";

    const hasAccess = await this.accessRepository.hasSupplierAccess({
      buyerUserId: viewer.buyerUserId,
      supplierId: offer.supplier.id,
    });

    if (hasAccess) return "qualified_unlocked";
    return "registered_locked";
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
          id: offer.supplier.id,
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
