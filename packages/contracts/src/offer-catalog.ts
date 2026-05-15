import { z } from "zod";

export const offerCatalogAccessLevelSchema = z.enum([
  "anonymous_locked",
  "registered_locked",
  "qualified_unlocked",
]);

export const offerFormatSchema = z.enum(["Frozen", "Fresh", "Chilled"]);
export const offerStockStatusSchema = z.enum(["In Stock", "Limited", "Pre-order"]);
export const offerCatalogSortBySchema = z.enum(["updated_at", "category", "origin", "moq"]);
export const offerCatalogSortDirectionSchema = z.enum(["asc", "desc"]);

export const offerGalleryImageSchema = z.object({
  src: z.string().min(1).max(320),
  alt: z.string().min(1).max(220),
  caption: z.string().max(320).optional(),
  sourceLabel: z.string().max(120).optional(),
});

export const offerDeliveryBasisOptionSchema = z.object({
  code: z.string().min(1).max(20),
  label: z.string().min(1).max(120),
  isDefault: z.boolean(),
  priceRange: z.string().max(120),
  priceUnit: z.string().max(80),
  shipmentPort: z.string().max(140),
  leadTime: z.string().max(120),
  note: z.string().max(240).optional(),
});

export const offerRelatedArticleSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(220),
  slug: z.string().min(1).max(180),
  category: z.string().min(1).max(120),
  readTime: z.string().min(1).max(40),
  relevanceReason: z.string().min(1).max(160),
});

export const offerVolumeBreakSchema = z.object({
  minQty: z.string().min(1).max(80),
  priceRange: z.string().min(1).max(120),
});

export const offerCommercialTermsSchema = z.object({
  incoterm: z.string().min(1).max(20),
  paymentTerms: z.string().min(1).max(160),
  availableVolume: z.string().min(1).max(120),
  leadTime: z.string().min(1).max(120),
  stockStatus: offerStockStatusSchema,
  shipmentPort: z.string().max(140).optional(),
});

export const offerProductSpecsSchema = z.object({
  catchingMethod: z.string().max(160),
  freezingProcess: z.string().max(160),
  glazing: z.string().max(80),
  storageTemperature: z.string().max(80),
  fishingArea: z.string().max(120),
  ingredients: z.string().max(240),
  nutritionPer100g: z.object({
    calories: z.string().max(80),
    protein: z.string().max(80),
    fat: z.string().max(80),
    carbs: z.string().max(80),
  }),
  packingWeight: z.string().max(120),
  shelfLife: z.string().max(120),
});

export const offerSupplierInfoSchema = z.object({
  id: z.string().min(1).max(80).nullable(),
  name: z.string().min(2).max(180).nullable(),
  country: z.string().min(2).max(120).nullable(),
  countryCode: z.string().length(2).nullable(),
  countryFlag: z.string().max(16).nullable(),
  isVerified: z.boolean().nullable(),
  inBusinessSince: z.number().int().min(1800).max(2100).nullable(),
  responseTime: z.string().max(80).nullable(),
  certifications: z.array(z.string().min(1).max(80)).max(30),
  documentsReviewed: z.array(z.string().min(1).max(160)).max(40),
  profileSlug: z.string().max(120).nullable(),
});

export const offerCatalogRecordSchema = z.object({
  id: z.string().min(1).max(80),
  productName: z.string().min(2).max(220),
  species: z.string().min(1).max(140),
  latinName: z.string().max(140),
  category: z.string().min(1).max(120),
  origin: z.string().min(2).max(120),
  originCode: z.string().length(2),
  originFlag: z.string().max(16),
  format: offerFormatSchema,
  cutType: z.string().max(180),
  packaging: z.string().max(180),
  certifications: z.array(z.string().min(1).max(80)).max(30),
  image: z.string().min(1).max(320),
  images: z.array(z.string().min(1).max(320)).max(20),
  gallery: z.array(offerGalleryImageSchema).max(20),
  photoSourceLabel: z.string().max(160),
  sampleAvailable: z.boolean(),
  inspectionAvailable: z.boolean(),
  traceability: z.string().max(1600).nullable(),
  freshness: z.string().max(120),
  moqLabel: z.string().max(120),
  moqValue: z.number().min(0).nullable(),
  moqUnit: z.string().max(30).nullable(),
  priceRangeLabel: z.string().max(120),
  priceUnit: z.string().max(80),
  priceMin: z.number().min(0).nullable(),
  priceMax: z.number().min(0).nullable(),
  currency: z.string().length(3).nullable(),
  supplier: offerSupplierInfoSchema,
  specs: offerProductSpecsSchema,
  commercial: offerCommercialTermsSchema,
  deliveryBasisOptions: z.array(offerDeliveryBasisOptionSchema).max(20),
  relatedArticles: z.array(offerRelatedArticleSchema).max(20),
  volumeBreaks: z.array(offerVolumeBreakSchema).max(20),
  updatedAt: z.string().datetime(),
});

export const offerCatalogItemSchema = offerCatalogRecordSchema.extend({
  accessLevel: offerCatalogAccessLevelSchema,
});

export const offerCatalogQuerySchema = z.object({
  q: z.string().max(140).optional(),
  category: z.string().max(120).optional(),
  species: z.string().max(140).optional(),
  originCode: z.string().length(2).optional(),
  supplierCountryCode: z.string().length(2).optional(),
  format: offerFormatSchema.optional(),
  certification: z.string().max(80).optional(),
  sortBy: offerCatalogSortBySchema.default("updated_at"),
  sortDirection: offerCatalogSortDirectionSchema.default("desc"),
  accessLevel: offerCatalogAccessLevelSchema.default("anonymous_locked"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});

export const offerCatalogListResponseSchema = z.object({
  ok: z.literal(true),
  offers: z.array(offerCatalogItemSchema),
  total: z.number().int().min(0),
  accessLevel: offerCatalogAccessLevelSchema,
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
  requestId: z.string(),
});

export const offerCatalogDetailResponseSchema = z.object({
  ok: z.literal(true),
  offer: offerCatalogItemSchema,
  accessLevel: offerCatalogAccessLevelSchema,
  requestId: z.string(),
});

export type OfferCatalogAccessLevel = z.infer<typeof offerCatalogAccessLevelSchema>;
export type OfferCatalogItem = z.infer<typeof offerCatalogItemSchema>;
export type OfferCatalogQuery = z.infer<typeof offerCatalogQuerySchema>;
export type OfferCatalogRecord = z.infer<typeof offerCatalogRecordSchema>;
export type OfferCatalogSortBy = z.infer<typeof offerCatalogSortBySchema>;
export type OfferCatalogSortDirection = z.infer<typeof offerCatalogSortDirectionSchema>;
export type OfferCatalogSupplierInfo = z.infer<typeof offerSupplierInfoSchema>;
export type OfferCommercialTerms = z.infer<typeof offerCommercialTermsSchema>;
export type OfferDeliveryBasisOption = z.infer<typeof offerDeliveryBasisOptionSchema>;
export type OfferFormat = z.infer<typeof offerFormatSchema>;
export type OfferGalleryImage = z.infer<typeof offerGalleryImageSchema>;
export type OfferProductSpecs = z.infer<typeof offerProductSpecsSchema>;
export type OfferRelatedArticle = z.infer<typeof offerRelatedArticleSchema>;
export type OfferVolumeBreak = z.infer<typeof offerVolumeBreakSchema>;
