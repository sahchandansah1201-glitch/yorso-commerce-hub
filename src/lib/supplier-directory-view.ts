import { mockSuppliers, type MockSupplier } from "@/data/mockSuppliers";
import { localizeSupplier } from "@/data/mockSuppliersI18n";
import type { Language } from "@/i18n/translations";
import type { SupplierDirectoryItem } from "@/lib/supplier-directory-api";

const currentYear = () => new Date().getFullYear();

export const supplierDirectoryItemToMockSupplier = (
  item: SupplierDirectoryItem,
): MockSupplier => {
  const catalogPreview = item.productCatalogPreview ?? [];
  const deliveryCountries = item.deliveryCountries ?? [];
  const unlocked = item.accessLevel === "qualified_unlocked";

  return {
    id: item.id,
    companyName: item.companyName ?? item.maskedName,
    maskedName: item.maskedName,
    country: item.country,
    countryCode: item.countryCode,
    city: item.city,
    supplierType: item.supplierType,
    yearsInBusiness: Math.max(0, currentYear() - item.inBusinessSinceYear),
    inBusinessSinceYear: item.inBusinessSinceYear,
    productFocus: item.productFocus,
    certifications: item.certifications,
    certificationBadges: item.certificationBadges.map((badge) => ({
      code: badge.code,
      label: badge.label,
      ...(badge.logo ? { logo: badge.logo } : {}),
    })),
    activeOffersCount: item.activeOffersCount ?? 0,
    productPreviewImages: catalogPreview.map((preview) => preview.image),
    shortDescription: item.shortDescription,
    about: item.about ?? item.shortDescription,
    responseSignal: item.responseSignal,
    documentReadiness: item.documentReadiness,
    verificationLevel: item.verificationLevel,
    heroImage: item.heroImage,
    ...(item.logoImage ? { logoImage: item.logoImage } : {}),
    deliveryCountries,
    deliveryCountriesTotal: item.deliveryCountriesTotal ?? deliveryCountries.length,
    totalProductsCount: item.totalProductsCount ?? catalogPreview.length,
    productCatalogPreview: catalogPreview,
    ...(unlocked && item.website ? { website: item.website } : {}),
    ...(unlocked && item.whatsapp ? { whatsapp: item.whatsapp } : {}),
  };
};

export const localizeSupplierDirectoryItem = (
  item: SupplierDirectoryItem,
  language: Language,
): MockSupplier => localizeSupplier(supplierDirectoryItemToMockSupplier(item), language);

export const localizedMockSuppliers = (language: Language) =>
  mockSuppliers.map((supplier) => localizeSupplier(supplier, language));
