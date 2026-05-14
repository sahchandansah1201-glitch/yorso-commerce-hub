import { z } from "zod";

export const accountRoleSchema = z.enum(["buyer", "supplier", "both"]);
export const companyPublicationStatusSchema = z.enum(["draft", "review", "published", "blocked"]);
export const buyerQualificationStatusSchema = z.enum(["not_started", "pending", "qualified", "rejected"]);
export const branchTypeSchema = z.enum([
  "registered_address",
  "office",
  "warehouse",
  "processing_plant",
  "sales_office",
  "loading_point",
]);
export const productStateSchema = z.enum(["frozen", "fresh", "chilled", "alive", "cooked"]);
export const productRoleSchema = z.enum(["buying", "selling", "both"]);
export const metaRegionLogisticsReasonSchema = z.enum([
  "similar_freight_cost",
  "same_customs_zone",
  "same_sales_market",
  "same_warehouse_route",
  "manual",
]);
export const metaRegionUsedForSchema = z.enum([
  "notifications",
  "price_access",
  "campaigns",
  "landed_cost",
  "supplier_matching",
]);
export const notificationChannelSchema = z.enum(["email", "messenger", "in_app", "agent"]);
export const notificationEventSchema = z.enum([
  "price_access_approved",
  "new_matching_product",
  "rfq_response",
  "price_movement",
  "document_readiness",
  "country_news",
  "supplier_profile_review",
]);
export const notificationFrequencySchema = z.enum(["instant", "daily", "weekly"]);
export const accountFilePurposeSchema = z.enum([
  "company_logo",
  "company_cover",
  "company_document",
  "supplier_certificate",
  "supplier_trade_document",
]);
export const companyDocumentTypeSchema = z.enum([
  "business_license",
  "facility_approval",
  "haccp",
  "msc",
  "asc",
  "brc",
  "ifs",
  "health_certificate",
  "origin_certificate",
  "packing_list",
  "other",
]);
export const companyDocumentVisibilitySchema = z.enum(["private", "buyer_qualified", "public_teaser"]);
export const companyDocumentStatusSchema = z.enum(["draft", "uploaded", "review", "approved", "rejected", "expired"]);

export const companyMediaSchema = z.object({
  logoObjectKey: z.string().min(1).nullable(),
  coverObjectKey: z.string().min(1).nullable(),
  logoAlt: z.string().max(160).nullable(),
  coverAlt: z.string().max(160).nullable(),
  logoFit: z.enum(["contain", "cover"]),
  coverFocalX: z.number().min(0).max(1),
  coverFocalY: z.number().min(0).max(1),
});

export const companyProfileSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string().min(2).max(180),
  tradeName: z.string().min(2).max(120),
  accountRole: accountRoleSchema,
  countryCode: z.string().length(2),
  website: z.string().url().nullable(),
  yearFounded: z.number().int().min(1800).max(2100).nullable(),
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().min(5).max(40).nullable(),
  messengerHandle: z.string().max(80).nullable(),
  description: z.string().max(1200).nullable(),
  productFocus: z.array(z.string().min(1)).max(20),
  certificates: z.array(z.string().min(1)).max(30),
  paymentTerms: z.array(z.string().min(1)).max(20),
  publicationStatus: companyPublicationStatusSchema,
  buyerQualificationStatus: buyerQualificationStatusSchema,
  media: companyMediaSchema,
  updatedAt: z.string().datetime(),
});

export const companyProfileUpdateSchema = companyProfileSchema
  .omit({ id: true, updatedAt: true, media: true })
  .partial()
  .extend({
    media: companyMediaSchema.partial().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one company profile field must be provided.",
  });

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(5).max(40).nullable(),
  preferredLanguage: z.enum(["en", "ru", "es"]),
  timezone: z.string().min(1).max(80),
  updatedAt: z.string().datetime(),
});

export const userProfileUpdateSchema = userProfileSchema
  .omit({ id: true, updatedAt: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one user profile field must be provided.",
  });

const workspaceIdSchema = z.string().min(1).max(80);
export const accountWorkspaceItemIdSchema = workspaceIdSchema;
const stringListSchema = (maxItems: number) => z.array(z.string().min(1).max(120)).max(maxItems);

export const companyBranchSchema = z.object({
  id: workspaceIdSchema,
  name: z.string().min(2).max(120),
  type: branchTypeSchema,
  country: z.string().min(2).max(80),
  region: z.string().max(120),
  city: z.string().min(1).max(120),
  addressLine: z.string().max(220),
  defaultIncoterms: z.string().min(2).max(20),
  portOrPickupPoint: z.string().max(160),
  notes: z.string().max(600),
});
export const companyBranchCreateSchema = companyBranchSchema.omit({ id: true });
export const companyBranchUpdateSchema = companyBranchCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one branch field must be provided.",
});

export const companyProductSchema = z.object({
  id: workspaceIdSchema,
  commercialName: z.string().min(2).max(140),
  latinName: z.string().max(140),
  category: z.string().min(2).max(80),
  state: productStateSchema,
  format: z.string().max(180),
  role: productRoleSchema,
  monthlyVolume: z.string().max(80),
  certificates: stringListSchema(30),
  targetCountries: stringListSchema(60),
});
export const companyProductCreateSchema = companyProductSchema.omit({ id: true });
export const companyProductUpdateSchema = companyProductCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one product field must be provided.",
});

export const metaRegionSchema = z.object({
  id: workspaceIdSchema,
  name: z.string().min(2).max(120),
  countries: stringListSchema(80),
  logisticsReason: metaRegionLogisticsReasonSchema,
  defaultCurrency: z.string().length(3),
  notes: z.string().max(600),
  usedFor: z.array(metaRegionUsedForSchema).max(10),
});
export const metaRegionCreateSchema = metaRegionSchema.omit({ id: true });
export const metaRegionUpdateSchema = metaRegionCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one meta-region field must be provided.",
});

const notificationPreferenceBaseSchema = z.object({
  id: workspaceIdSchema,
  channel: notificationChannelSchema,
  enabled: z.boolean(),
  events: z.array(notificationEventSchema).max(20),
  frequency: notificationFrequencySchema,
});
export const notificationPreferenceSchema = notificationPreferenceBaseSchema.refine((value) => !value.enabled || value.events.length > 0, {
  message: "Enabled notification channels must contain at least one event.",
  path: ["events"],
});
export const notificationPreferenceCreateSchema = notificationPreferenceBaseSchema.omit({ id: true }).refine(
  (value) => !value.enabled || value.events.length > 0,
  {
    message: "Enabled notification channels must contain at least one event.",
    path: ["events"],
  },
);
export const notificationPreferenceUpdateSchema = notificationPreferenceBaseSchema.omit({ id: true }).partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one notification preference field must be provided.",
  },
);

export const accountBranchesSchema = z.array(companyBranchSchema).max(100);
export const accountProductsSchema = z.array(companyProductSchema).max(300);
export const accountMetaRegionsSchema = z.array(metaRegionSchema).max(80);
export const accountNotificationsSchema = z.array(notificationPreferenceSchema).max(20);

const base64Schema = z.string().min(1).refine((value) => /^[A-Za-z0-9+/]+={0,2}$/.test(value), {
  message: "File content must be raw base64 without a data URL prefix.",
});

export const accountFileUploadPayloadSchema = z.object({
  fileName: z.string().min(1).max(180),
  contentType: z.string().min(3).max(120).regex(/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i),
  sizeBytes: z.number().int().min(1).max(8 * 1024 * 1024),
  contentBase64: base64Schema,
});

export const companyMediaUploadSchema = accountFileUploadPayloadSchema.extend({
  alt: z.string().max(160).nullable().optional(),
});

export const accountFileAssetSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  purpose: accountFilePurposeSchema,
  objectKey: z.string().min(1).max(500),
  originalFileName: z.string().min(1).max(180),
  contentType: z.string().min(3).max(120),
  sizeBytes: z.number().int().min(1),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  storageDriver: z.enum(["local", "s3"]),
  createdAt: z.string().datetime(),
});

export const companyDocumentSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  fileAssetId: z.string().uuid(),
  title: z.string().min(2).max(180),
  documentType: companyDocumentTypeSchema,
  visibility: companyDocumentVisibilitySchema,
  status: companyDocumentStatusSchema,
  fileName: z.string().min(1).max(180),
  contentType: z.string().min(3).max(120),
  sizeBytes: z.number().int().min(1),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.string().date().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const companyDocumentCreateSchema = z.object({
  title: z.string().min(2).max(180),
  documentType: companyDocumentTypeSchema,
  visibility: companyDocumentVisibilitySchema.default("private"),
  expiresAt: z.string().date().nullable().optional(),
  file: accountFileUploadPayloadSchema,
});

export const accountCompanyDocumentsSchema = z.array(companyDocumentSchema).max(300);

export type AccountRole = z.infer<typeof accountRoleSchema>;
export type AccountBranchesUpdate = z.infer<typeof accountBranchesSchema>;
export type AccountCompanyDocuments = z.infer<typeof accountCompanyDocumentsSchema>;
export type AccountFileAsset = z.infer<typeof accountFileAssetSchema>;
export type AccountFilePurpose = z.infer<typeof accountFilePurposeSchema>;
export type AccountFileUploadPayload = z.infer<typeof accountFileUploadPayloadSchema>;
export type AccountMetaRegionsUpdate = z.infer<typeof accountMetaRegionsSchema>;
export type AccountNotificationsUpdate = z.infer<typeof accountNotificationsSchema>;
export type AccountProductsUpdate = z.infer<typeof accountProductsSchema>;
export type BranchType = z.infer<typeof branchTypeSchema>;
export type BuyerQualificationStatus = z.infer<typeof buyerQualificationStatusSchema>;
export type CompanyBranch = z.infer<typeof companyBranchSchema>;
export type CompanyBranchCreate = z.infer<typeof companyBranchCreateSchema>;
export type CompanyBranchUpdate = z.infer<typeof companyBranchUpdateSchema>;
export type CompanyMedia = z.infer<typeof companyMediaSchema>;
export type CompanyMediaUpload = z.infer<typeof companyMediaUploadSchema>;
export type CompanyDocument = z.infer<typeof companyDocumentSchema>;
export type CompanyDocumentCreate = z.infer<typeof companyDocumentCreateSchema>;
export type CompanyDocumentStatus = z.infer<typeof companyDocumentStatusSchema>;
export type CompanyDocumentType = z.infer<typeof companyDocumentTypeSchema>;
export type CompanyDocumentVisibility = z.infer<typeof companyDocumentVisibilitySchema>;
export type CompanyProduct = z.infer<typeof companyProductSchema>;
export type CompanyProductCreate = z.infer<typeof companyProductCreateSchema>;
export type CompanyProductUpdate = z.infer<typeof companyProductUpdateSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type CompanyProfileUpdate = z.infer<typeof companyProfileUpdateSchema>;
export type CompanyPublicationStatus = z.infer<typeof companyPublicationStatusSchema>;
export type MetaRegion = z.infer<typeof metaRegionSchema>;
export type MetaRegionCreate = z.infer<typeof metaRegionCreateSchema>;
export type MetaRegionLogisticsReason = z.infer<typeof metaRegionLogisticsReasonSchema>;
export type MetaRegionUpdate = z.infer<typeof metaRegionUpdateSchema>;
export type MetaRegionUsedFor = z.infer<typeof metaRegionUsedForSchema>;
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type NotificationFrequency = z.infer<typeof notificationFrequencySchema>;
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
export type NotificationPreferenceCreate = z.infer<typeof notificationPreferenceCreateSchema>;
export type NotificationPreferenceUpdate = z.infer<typeof notificationPreferenceUpdateSchema>;
export type ProductRole = z.infer<typeof productRoleSchema>;
export type ProductState = z.infer<typeof productStateSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
