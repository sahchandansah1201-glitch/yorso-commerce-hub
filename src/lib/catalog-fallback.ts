import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { legacyOfferIdToUuid } from "@/lib/legacy-offer-id";

const REDACTED_PRICE = "Цена по запросу";
const REDACTED_SUPPLIER = "Имя поставщика скрыто";

export const fallbackOfferForLevel = (offer: SeafoodOffer, level: AccessLevel): SeafoodOffer => {
  if (level === "qualified_unlocked") return offer;
  return {
    ...offer,
    supplierName: REDACTED_SUPPLIER,
    isVerified: false,
    priceRange: REDACTED_PRICE,
    priceUnit: "",
    priceMin: undefined,
    priceMax: undefined,
    currency: undefined,
    supplier: {
      ...offer.supplier,
      name: REDACTED_SUPPLIER,
      isVerified: false,
      responseTime: "",
      documentsReviewed: [],
      profileSlug: "",
    },
  };
};

export const fallbackOffersForLevel = (level: AccessLevel): SeafoodOffer[] =>
  mockOffers.map((offer) => fallbackOfferForLevel(offer, level));

export const findFallbackOfferById = (id: string, level: AccessLevel): SeafoodOffer | null => {
  const offer = mockOffers.find((item) => item.id === id || legacyOfferIdToUuid(item.id) === id);
  return offer ? fallbackOfferForLevel(offer, level) : null;
};