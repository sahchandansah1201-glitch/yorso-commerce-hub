import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { legacyOfferIdToUuid } from "@/lib/legacy-offer-id";

const REDACTED_PRICE = "Цена по запросу";
const REDACTED_SUPPLIER = "Имя поставщика скрыто";

const redactDeliveryBasisOptions = (offer: SeafoodOffer) =>
  offer.deliveryBasisOptions.map((basis) => ({
    ...basis,
    priceRange: REDACTED_PRICE,
    priceUnit: "",
  }));

export const supplierAccessIdForOffer = (offer: SeafoodOffer): string =>
  offer.supplier.id ?? offer.supplier.profileSlug ?? offer.id;

export const fallbackOfferForLevel = (offer: SeafoodOffer, level: AccessLevel): SeafoodOffer => {
  if (level === "qualified_unlocked") {
    return {
      ...offer,
      accessLevel: "qualified_unlocked",
    };
  }
  return {
    ...offer,
    accessLevel: level,
    supplierName: REDACTED_SUPPLIER,
    isVerified: false,
    priceRange: REDACTED_PRICE,
    priceUnit: "",
    priceMin: undefined,
    priceMax: undefined,
    currency: undefined,
    deliveryBasisOptions: redactDeliveryBasisOptions(offer),
    volumeBreaks: [],
    supplier: {
      ...offer.supplier,
      id: offer.supplier.id ?? offer.supplier.profileSlug ?? offer.id,
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

export const fallbackOfferForSupplierAccess = (
  offer: SeafoodOffer,
  level: AccessLevel,
  approvedSupplierIds: readonly string[] | ReadonlySet<string> = [],
): SeafoodOffer => {
  const supplierAccessId = supplierAccessIdForOffer(offer);
  const approved = "has" in approvedSupplierIds
    ? approvedSupplierIds.has(supplierAccessId)
    : approvedSupplierIds.includes(supplierAccessId);
  return fallbackOfferForLevel(offer, approved ? "qualified_unlocked" : level);
};

export const fallbackOffersForSupplierAccess = (
  level: AccessLevel,
  approvedSupplierIds: readonly string[] | ReadonlySet<string> = [],
): SeafoodOffer[] =>
  mockOffers.map((offer) =>
    fallbackOfferForSupplierAccess(offer, level, approvedSupplierIds),
  );

export const findFallbackOfferById = (id: string, level: AccessLevel): SeafoodOffer | null => {
  const offer = mockOffers.find((item) => item.id === id || legacyOfferIdToUuid(item.id) === id);
  return offer ? fallbackOfferForLevel(offer, level) : null;
};

export const findFallbackOfferByIdForSupplierAccess = (
  id: string,
  level: AccessLevel,
  approvedSupplierIds: readonly string[] | ReadonlySet<string> = [],
): SeafoodOffer | null => {
  const offer = mockOffers.find((item) => item.id === id || legacyOfferIdToUuid(item.id) === id);
  return offer ? fallbackOfferForSupplierAccess(offer, level, approvedSupplierIds) : null;
};
