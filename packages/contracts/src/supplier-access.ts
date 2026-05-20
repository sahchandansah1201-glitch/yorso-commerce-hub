import { z } from "zod";

const accessPaginationLimitSchema = z.coerce.number().int().min(1).max(100).default(25);
const accessPaginationOffsetSchema = z.coerce.number().int().min(0).max(10_000).default(0);

export const supplierAccessStatusSchema = z.enum([
  "sent",
  "pending",
  "approved",
  "rejected",
  "revoked",
]);

export const supplierAccessIntentSchema = z.literal("exact_price");

export const supplierAccessGrantScopeSchema = z.enum([
  "supplier_identity",
  "offer_price",
]);

export const supplierAccessEventTypeSchema = z.enum([
  "supplier_access_requested",
  "supplier_access_pending",
  "supplier_access_approved",
  "supplier_access_rejected",
  "supplier_access_revoked",
  "notification_created",
  "notification_read",
]);

export const supplierAccessNotificationTypeSchema = z.enum([
  "price_access_approved",
]);

export const supplierAccessRequestSchema = z.object({
  id: z.string().min(1).max(120),
  buyerUserId: z.string().uuid(),
  supplierId: z.string().min(1).max(80),
  status: supplierAccessStatusSchema,
  intent: supplierAccessIntentSchema,
  message: z.string().max(1000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  decidedAt: z.string().datetime().nullable(),
  decidedByUserId: z.string().uuid().nullable(),
});

export const supplierAccessGrantSchema = z.object({
  id: z.string().min(1).max(120),
  buyerUserId: z.string().uuid(),
  supplierId: z.string().min(1).max(80),
  scope: supplierAccessGrantScopeSchema,
  offerId: z.string().min(1).max(80).nullable(),
  grantedByUserId: z.string().uuid().nullable(),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
});

export const supplierAccessEventSchema = z.object({
  id: z.string().min(1).max(120),
  buyerUserId: z.string().uuid(),
  supplierId: z.string().min(1).max(80),
  requestId: z.string().min(1).max(120).nullable(),
  eventType: supplierAccessEventTypeSchema,
  actorUserId: z.string().uuid().nullable(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
});

export const supplierAccessNotificationSchema = z.object({
  id: z.string().min(1).max(120),
  buyerUserId: z.string().uuid(),
  supplierId: z.string().min(1).max(80),
  type: supplierAccessNotificationTypeSchema,
  title: z.string().min(1).max(180),
  body: z.string().min(1).max(320),
  status: z.enum(["unread", "read"]),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullable(),
});

export const supplierAccessRequestCreateSchema = z.object({
  message: z.string().max(1000).default(""),
});

export const supplierAccessDecisionSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "revoked"]),
  message: z.string().max(1000).optional(),
});

export const supplierAccessRequestResponseSchema = z.object({
  ok: z.literal(true),
  request: supplierAccessRequestSchema.nullable(),
  accessGranted: z.boolean(),
  requestId: z.string(),
});

export const supplierAccessDecisionResponseSchema = z.object({
  ok: z.literal(true),
  request: supplierAccessRequestSchema,
  grants: z.array(supplierAccessGrantSchema),
  notification: supplierAccessNotificationSchema.nullable(),
  requestId: z.string(),
});

export const supplierAccessNotificationsResponseSchema = z.object({
  ok: z.literal(true),
  notifications: z.array(supplierAccessNotificationSchema),
  requestId: z.string(),
});

export const supplierAccessNotificationsAckSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100),
});

export const supplierAccessNotificationsAckResponseSchema = z.object({
  ok: z.literal(true),
  notifications: z.array(supplierAccessNotificationSchema),
  markedReadCount: z.number().int().min(0).max(100),
  requestId: z.string(),
});

export const supplierAccessReviewStatusFilterSchema = z.enum([
  "open",
  "all",
  "sent",
  "pending",
  "approved",
  "rejected",
  "revoked",
]);

export const supplierAccessReviewQuerySchema = z.object({
  status: supplierAccessReviewStatusFilterSchema.default("open"),
  q: z.string().trim().min(1).max(120).optional(),
  limit: accessPaginationLimitSchema,
  offset: accessPaginationOffsetSchema,
});

export const supplierAccessReviewBuyerSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(180).nullable(),
  companyName: z.string().min(2).max(180).nullable(),
  accountRole: z.enum(["buyer", "supplier", "both"]).nullable(),
  countryCode: z.string().length(2).nullable(),
});

export const supplierAccessReviewSupplierSchema = z.object({
  supplierId: z.string().min(1).max(80),
  maskedName: z.string().min(2).max(180).nullable(),
  companyName: z.string().min(2).max(180).nullable(),
  country: z.string().min(2).max(120).nullable(),
  city: z.string().min(1).max(120).nullable(),
  verificationLevel: z.enum(["documents_reviewed", "basic", "unverified"]).nullable(),
});

export const supplierAccessReviewItemSchema = z.object({
  request: supplierAccessRequestSchema,
  buyer: supplierAccessReviewBuyerSchema,
  supplier: supplierAccessReviewSupplierSchema,
  ageHours: z.number().min(0),
  decisionSla: z.enum(["fresh", "due_today", "overdue"]),
});

export const supplierAccessReviewSummarySchema = z.object({
  sent: z.number().int().min(0),
  pending: z.number().int().min(0),
  approved: z.number().int().min(0),
  rejected: z.number().int().min(0),
  revoked: z.number().int().min(0),
  open: z.number().int().min(0),
});

export const supplierAccessReviewListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(supplierAccessReviewItemSchema),
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0).max(10_000),
  total: z.number().int().min(0),
  summary: supplierAccessReviewSummarySchema,
  requestId: z.string(),
});

export type SupplierAccessStatus = z.infer<typeof supplierAccessStatusSchema>;
export type SupplierAccessIntent = z.infer<typeof supplierAccessIntentSchema>;
export type SupplierAccessGrantScope = z.infer<typeof supplierAccessGrantScopeSchema>;
export type SupplierAccessEventType = z.infer<typeof supplierAccessEventTypeSchema>;
export type SupplierAccessRequest = z.infer<typeof supplierAccessRequestSchema>;
export type SupplierAccessGrant = z.infer<typeof supplierAccessGrantSchema>;
export type SupplierAccessEvent = z.infer<typeof supplierAccessEventSchema>;
export type SupplierAccessNotification = z.infer<typeof supplierAccessNotificationSchema>;
export type SupplierAccessRequestCreate = z.infer<typeof supplierAccessRequestCreateSchema>;
export type SupplierAccessDecision = z.infer<typeof supplierAccessDecisionSchema>;
export type SupplierAccessNotificationsAck = z.infer<typeof supplierAccessNotificationsAckSchema>;
export type SupplierAccessNotificationsAckResponse = z.infer<typeof supplierAccessNotificationsAckResponseSchema>;
export type SupplierAccessReviewStatusFilter = z.infer<typeof supplierAccessReviewStatusFilterSchema>;
export type SupplierAccessReviewQuery = z.infer<typeof supplierAccessReviewQuerySchema>;
export type SupplierAccessReviewBuyer = z.infer<typeof supplierAccessReviewBuyerSchema>;
export type SupplierAccessReviewSupplier = z.infer<typeof supplierAccessReviewSupplierSchema>;
export type SupplierAccessReviewItem = z.infer<typeof supplierAccessReviewItemSchema>;
export type SupplierAccessReviewSummary = z.infer<typeof supplierAccessReviewSummarySchema>;
export type SupplierAccessReviewListResponse = z.infer<typeof supplierAccessReviewListResponseSchema>;
