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

const supplierProfileI18nKeySchema = z.string().min(1).max(120);

export const supplierShipmentCaseSchema = z.object({
  id: z.string().min(1).max(80),
  titleKey: supplierProfileI18nKeySchema,
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  destinationKey: supplierProfileI18nKeySchema,
  product: z.string().min(1).max(160),
  volumeTons: z.number().int().min(0).max(100000),
  incoterm: z.string().min(2).max(80),
  buyerTypeKey: supplierProfileI18nKeySchema,
  notesKey: supplierProfileI18nKeySchema,
  photoCaptionKeys: z.array(supplierProfileI18nKeySchema).max(8),
});

export const supplierFaqItemSchema = z.object({
  qKey: supplierProfileI18nKeySchema,
  aKey: supplierProfileI18nKeySchema,
  params: z.record(z.union([z.string().max(160), z.number()])).optional(),
});

export const supplierLegalDetailsSchema = z.object({
  registrationLabel: z.string().min(1).max(120),
  registrationNumber: z.string().min(1).max(120),
  vatNumber: z.string().min(1).max(120).nullable(),
  eoriNumber: z.string().min(1).max(120).nullable(),
  legalForm: z.string().min(1).max(160),
  foundedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const supplierDocumentTypeSchema = z.enum([
  "health_certificate",
  "origin_certificate",
  "analysis_certificate",
  "packing_list",
  "bill_of_lading",
  "halal_kosher",
  "audit_report",
  "other",
]);

export const supplierDocumentStatusSchema = z.enum(["approved", "review", "expired", "on_request"]);

export const supplierDocumentPayloadSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  documentType: supplierDocumentTypeSchema,
  status: supplierDocumentStatusSchema,
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  fileName: z.string().min(1).max(180).nullable(),
  fileAssetId: z.string().min(1).max(120).nullable(),
});

export const supplierDocumentManagementRoleSchema = z.enum(["supplier_owner", "admin"]);
export const supplierDocumentManagementActionSchema = z.enum([
  "create",
  "update_metadata",
  "submit_for_review",
  "approve",
  "reject",
  "expire",
  "delete",
]);
export const supplierDocumentManagementAuditActionSchema = z.enum([
  "supplier_document.create",
  "supplier_document.update_metadata",
  "supplier_document.submit_for_review",
  "supplier_document.approve",
  "supplier_document.reject",
  "supplier_document.expire",
  "supplier_document.delete",
]);

const supplierDocumentManagementDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

export const supplierDocumentManagementCreateRequestSchema = z.object({
  title: z.string().trim().min(1).max(180),
  documentType: supplierDocumentTypeSchema,
  issuedAt: supplierDocumentManagementDateSchema.optional(),
  expiresAt: supplierDocumentManagementDateSchema.optional(),
  fileUploadId: z.string().trim().min(1).max(120),
  fileName: z.string().trim().min(1).max(180),
}).strict();

export const supplierDocumentManagementUpdateRequestSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  documentType: supplierDocumentTypeSchema.optional(),
  issuedAt: supplierDocumentManagementDateSchema.optional(),
  expiresAt: supplierDocumentManagementDateSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one supplier document metadata field is required",
});

export const supplierDocumentManagementAuditEventSchema = z.object({
  action: supplierDocumentManagementAuditActionSchema,
  actorRole: supplierDocumentManagementRoleSchema,
  supplierId: z.string().min(1).max(80),
  documentId: z.string().min(1).max(80),
  previousStatus: supplierDocumentStatusSchema.nullable(),
  nextStatus: supplierDocumentStatusSchema.nullable(),
  reason: z.string().min(1).max(160),
  requestId: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
}).strict();

export const supplierDocumentManagementItemSchema = supplierDocumentPayloadSchema.omit({
  fileAssetId: true,
}).strict();

export const supplierDocumentManagementCreateResponseSchema = z.object({
  ok: z.literal(true),
  document: supplierDocumentManagementItemSchema,
  audit: supplierDocumentManagementAuditEventSchema,
  requestId: z.string(),
});

export const supplierDocumentDownloadGrantSchema = z.object({
  id: z.string().min(1).max(120),
  supplierId: z.string().min(1).max(80),
  documentId: z.string().min(1).max(80),
  fileName: z.string().min(1).max(180),
  downloadPath: z.string().min(1).max(360),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const supplierDocumentDownloadGrantResponseSchema = z.object({
  ok: z.literal(true),
  grant: supplierDocumentDownloadGrantSchema,
  requestId: z.string(),
});

export const supplierDocumentDownloadGrantStatusSchema = z.enum([
  "granted",
  "access_denied",
  "document_not_found",
  "document_unavailable",
]);

export const supplierDocumentDownloadGrantAdminQuerySchema = z.object({
  status: supplierDocumentDownloadGrantStatusSchema.optional(),
  supplierId: z.string().trim().min(1).max(80).optional(),
  buyerUserId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const supplierDocumentDownloadGrantAdminItemSchema = z.object({
  id: z.string().min(1).max(120),
  buyerUserId: z.string().uuid(),
  supplierId: z.string().min(1).max(80),
  documentId: z.string().min(1).max(80),
  status: supplierDocumentDownloadGrantStatusSchema,
  reason: z.string().min(1).max(120),
  requestId: z.string().min(1).max(120),
  grantedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const supplierDocumentDownloadGrantAdminListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(supplierDocumentDownloadGrantAdminItemSchema),
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0).max(10_000),
  requestId: z.string(),
});

export const supplierDocumentDownloadEventStatusSchema = z.enum([
  "downloaded",
  "grant_not_found",
  "grant_denied",
  "grant_expired",
  "access_denied",
  "document_unavailable",
  "file_unavailable",
]);

export const supplierDocumentDownloadEventAdminQuerySchema = z.object({
  status: supplierDocumentDownloadEventStatusSchema.optional(),
  supplierId: z.string().trim().min(1).max(80).optional(),
  buyerUserId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const supplierDocumentDownloadEventAdminItemSchema = z.object({
  id: z.string().min(1).max(120),
  buyerUserId: z.string().uuid(),
  supplierId: z.string().min(1).max(80),
  documentId: z.string().min(1).max(80),
  grantId: z.string().min(1).max(120).nullable(),
  status: supplierDocumentDownloadEventStatusSchema,
  reason: z.string().min(1).max(120),
  requestId: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
});

export const supplierDocumentDownloadEventAdminListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(supplierDocumentDownloadEventAdminItemSchema),
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0).max(10_000),
  requestId: z.string(),
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
  shipmentCases: z.array(supplierShipmentCaseSchema).max(24),
  faqItems: z.array(supplierFaqItemSchema).max(24),
  legalDetails: supplierLegalDetailsSchema.nullable(),
  supplierDocuments: z.array(supplierDocumentPayloadSchema).max(60),
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
    legalDetails: supplierLegalDetailsSchema.nullable(),
    supplierDocuments: z.array(supplierDocumentPayloadSchema).max(60).nullable(),
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
export type SupplierDocumentDownloadGrant = z.infer<typeof supplierDocumentDownloadGrantSchema>;
export type SupplierDocumentDownloadGrantAdminItem = z.infer<typeof supplierDocumentDownloadGrantAdminItemSchema>;
export type SupplierDocumentDownloadGrantAdminQuery = z.infer<typeof supplierDocumentDownloadGrantAdminQuerySchema>;
export type SupplierDocumentDownloadGrantStatus = z.infer<typeof supplierDocumentDownloadGrantStatusSchema>;
export type SupplierDocumentDownloadEventAdminItem = z.infer<typeof supplierDocumentDownloadEventAdminItemSchema>;
export type SupplierDocumentDownloadEventAdminQuery = z.infer<typeof supplierDocumentDownloadEventAdminQuerySchema>;
export type SupplierDocumentDownloadEventStatus = z.infer<typeof supplierDocumentDownloadEventStatusSchema>;
export type SupplierDocumentManagementAction = z.infer<typeof supplierDocumentManagementActionSchema>;
export type SupplierDocumentManagementAuditAction = z.infer<typeof supplierDocumentManagementAuditActionSchema>;
export type SupplierDocumentManagementAuditEvent = z.infer<typeof supplierDocumentManagementAuditEventSchema>;
export type SupplierDocumentManagementCreateResponse = z.infer<typeof supplierDocumentManagementCreateResponseSchema>;
export type SupplierDocumentManagementCreateRequest = z.infer<typeof supplierDocumentManagementCreateRequestSchema>;
export type SupplierDocumentManagementItem = z.infer<typeof supplierDocumentManagementItemSchema>;
export type SupplierDocumentManagementRole = z.infer<typeof supplierDocumentManagementRoleSchema>;
export type SupplierDocumentManagementUpdateRequest = z.infer<typeof supplierDocumentManagementUpdateRequestSchema>;
export type SupplierDocumentPayload = z.infer<typeof supplierDocumentPayloadSchema>;
export type SupplierDocumentReadiness = z.infer<typeof supplierDocumentReadinessSchema>;
export type SupplierDocumentStatus = z.infer<typeof supplierDocumentStatusSchema>;
export type SupplierDocumentType = z.infer<typeof supplierDocumentTypeSchema>;
export type SupplierFaqItem = z.infer<typeof supplierFaqItemSchema>;
export type SupplierLogisticsFacts = z.infer<typeof supplierLogisticsFactsSchema>;
export type SupplierLegalDetails = z.infer<typeof supplierLegalDetailsSchema>;
export type SupplierProductFocus = z.infer<typeof supplierProductFocusSchema>;
export type SupplierProductionFacts = z.infer<typeof supplierProductionFactsSchema>;
export type SupplierShipmentCase = z.infer<typeof supplierShipmentCaseSchema>;
export type SupplierType = z.infer<typeof supplierTypeSchema>;
export type SupplierVerificationLevel = z.infer<typeof supplierVerificationLevelSchema>;
