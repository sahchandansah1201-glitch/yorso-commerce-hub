import { z } from "zod";

export const supplierDirectoryAccessLevelSchema = z.enum([
  "anonymous_locked",
  "registered_locked",
  "qualified_unlocked",
]);

export const supplierTypeSchema = z.enum([
  "producer",
  "processor",
  "exporter",
  "distributor",
  "trader",
]);

export const supplierResponseSignalSchema = z.enum(["fast", "normal", "slow"]);
export const supplierDocumentReadinessSchema = z.enum(["ready", "partial", "on_request"]);
export const supplierVerificationLevelSchema = z.enum(["documents_reviewed", "basic", "unverified"]);
export const supplierDirectorySortBySchema = z.enum([
  "updated_at",
  "country",
  "verification",
  "response",
]);
export const supplierDirectorySortDirectionSchema = z.enum(["asc", "desc"]);

export const supplierProductFocusSchema = z.object({
  species: z.string().min(1).max(120),
  forms: z.string().min(1).max(220),
});

export const supplierDeliveryCountrySchema = z.object({
  code: z.string().length(2),
  name: z.string().min(2).max(120),
});

export const supplierCatalogPreviewItemSchema = z.object({
  name: z.string().min(2).max(160),
  species: z.string().min(1).max(120),
  form: z.string().min(1).max(120),
  image: z.string().min(1).max(260),
});

export const supplierCertificationBadgeSchema = z.object({
  code: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  logo: z.string().max(260).nullable(),
});

export const supplierProductionFactsSchema = z.object({
  dailyTons: z.number().int().min(0).max(100000),
  lines: z.number().int().min(0).max(10000),
  coldStorageT: z.number().int().min(0).max(1000000),
  blastFreezerT: z.number().int().min(0).max(100000),
  staff: z.number().int().min(0).max(1000000),
});

export const supplierLogisticsFactsSchema = z.object({
  incoterms: z.array(z.string().min(2).max(12)).min(1).max(12),
  transitDaysMin: z.number().int().min(0).max(365),
  transitDaysMax: z.number().int().min(0).max(365),
  minBatchTons: z.number().int().min(0).max(100000),
  containers: z.array(z.string().min(1).max(80)).min(1).max(12),
  tempRange: z.string().min(1).max(80),
}).refine((facts) => facts.transitDaysMax >= facts.transitDaysMin, {
  message: "transitDaysMax must be greater than or equal to transitDaysMin",
  path: ["transitDaysMax"],
});

export const supplierDirectoryRecordSchema = z.object({
  id: z.string().min(1).max(80),
  companyName: z.string().min(2).max(180),
  maskedName: z.string().min(2).max(180),
  country: z.string().min(2).max(120),
  countryCode: z.string().length(2),
  city: z.string().min(1).max(120),
  supplierType: supplierTypeSchema,
  inBusinessSinceYear: z.number().int().min(1800).max(2100),
  productFocus: z.array(supplierProductFocusSchema).max(20),
  certifications: z.array(z.string().min(1).max(80)).max(30),
  certificationBadges: z.array(supplierCertificationBadgeSchema).max(30),
  activeOffersCount: z.number().int().min(0).max(100000),
  shortDescription: z.string().min(1).max(600),
  about: z.string().min(1).max(1600),
  responseSignal: supplierResponseSignalSchema,
  documentReadiness: supplierDocumentReadinessSchema,
  verificationLevel: supplierVerificationLevelSchema,
  heroImage: z.string().min(1).max(260),
  logoImage: z.string().max(260).nullable(),
  deliveryCountries: z.array(supplierDeliveryCountrySchema).max(120),
  deliveryCountriesTotal: z.number().int().min(0).max(1000),
  totalProductsCount: z.number().int().min(0).max(100000),
  productCatalogPreview: z.array(supplierCatalogPreviewItemSchema).max(12),
  productionFacts: supplierProductionFactsSchema,
  logisticsFacts: supplierLogisticsFactsSchema,
  website: z.string().url().nullable(),
  whatsapp: z.string().min(5).max(80).nullable(),
  updatedAt: z.string().datetime(),
});

export const supplierDirectoryItemSchema = supplierDirectoryRecordSchema
  .omit({
    companyName: true,
    about: true,
    activeOffersCount: true,
    deliveryCountriesTotal: true,
    totalProductsCount: true,
    website: true,
    whatsapp: true,
  })
  .extend({
    companyName: z.string().min(2).max(180).nullable(),
    about: z.string().min(1).max(1600).nullable(),
    activeOffersCount: z.number().int().min(0).max(100000).nullable(),
    deliveryCountriesTotal: z.number().int().min(0).max(1000).nullable(),
    totalProductsCount: z.number().int().min(0).max(100000).nullable(),
    website: z.string().url().nullable(),
    whatsapp: z.string().min(5).max(80).nullable(),
    accessLevel: supplierDirectoryAccessLevelSchema,
  });

export const supplierDirectoryQuerySchema = z.object({
  q: z.string().max(120).optional(),
  species: z.string().max(120).optional(),
  countryCode: z.string().length(2).optional(),
  supplierType: supplierTypeSchema.optional(),
  verificationLevel: supplierVerificationLevelSchema.optional(),
  certification: z.string().max(80).optional(),
  sortBy: supplierDirectorySortBySchema.default("updated_at"),
  sortDirection: supplierDirectorySortDirectionSchema.default("desc"),
  accessLevel: supplierDirectoryAccessLevelSchema.default("anonymous_locked"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});

export const supplierDirectoryListResponseSchema = z.object({
  ok: z.literal(true),
  suppliers: z.array(supplierDirectoryItemSchema),
  total: z.number().int().min(0),
  accessLevel: supplierDirectoryAccessLevelSchema,
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
  requestId: z.string(),
});

export const supplierDirectoryDetailResponseSchema = z.object({
  ok: z.literal(true),
  supplier: supplierDirectoryItemSchema,
  accessLevel: supplierDirectoryAccessLevelSchema,
  requestId: z.string(),
});

export type SupplierCatalogPreviewItem = z.infer<typeof supplierCatalogPreviewItemSchema>;
export type SupplierCertificationBadge = z.infer<typeof supplierCertificationBadgeSchema>;
export type SupplierDeliveryCountry = z.infer<typeof supplierDeliveryCountrySchema>;
export type SupplierDirectoryAccessLevel = z.infer<typeof supplierDirectoryAccessLevelSchema>;
export type SupplierDirectoryItem = z.infer<typeof supplierDirectoryItemSchema>;
export type SupplierDirectoryQuery = z.infer<typeof supplierDirectoryQuerySchema>;
export type SupplierDirectoryRecord = z.infer<typeof supplierDirectoryRecordSchema>;
export type SupplierDirectoryResponseSignal = z.infer<typeof supplierResponseSignalSchema>;
export type SupplierDirectorySortBy = z.infer<typeof supplierDirectorySortBySchema>;
export type SupplierDirectorySortDirection = z.infer<typeof supplierDirectorySortDirectionSchema>;
export type SupplierDocumentReadiness = z.infer<typeof supplierDocumentReadinessSchema>;
export type SupplierLogisticsFacts = z.infer<typeof supplierLogisticsFactsSchema>;
export type SupplierProductFocus = z.infer<typeof supplierProductFocusSchema>;
export type SupplierProductionFacts = z.infer<typeof supplierProductionFactsSchema>;
export type SupplierType = z.infer<typeof supplierTypeSchema>;
export type SupplierVerificationLevel = z.infer<typeof supplierVerificationLevelSchema>;
