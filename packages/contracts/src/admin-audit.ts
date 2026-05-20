import { z } from "zod";

export const adminUserRoleSchema = z.enum(["admin", "support", "company_admin", "buyer", "supplier"]);

export const adminAuditOutcomeSchema = z.enum(["success", "failure", "blocked"]);

export const adminAuditCursorSchema = z.string().min(12).max(512).regex(/^[A-Za-z0-9_-]+$/);

export const adminAuditStatusClassSchema = z.enum(["2xx", "3xx", "4xx", "5xx"]);

export const adminAuditEventSchema = z.object({
  auditId: z.string().min(4).max(180),
  occurredAt: z.string().datetime(),
  requestId: z.string().min(1).max(180),
  correlationId: z.string().min(1).max(180),
  action: z.string().min(1).max(160),
  outcome: adminAuditOutcomeSchema,
  httpMethod: z.string().min(1).max(16).nullable(),
  route: z.string().min(1).max(260).nullable(),
  statusCode: z.number().int().min(100).max(599).nullable(),
  actorUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  sessionHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  resourceType: z.string().min(1).max(120).nullable(),
  resourceHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  reason: z.string().min(1).max(96).nullable(),
});

export const adminAuditQuerySchema = z.object({
  action: z.string().trim().min(1).max(160).optional(),
  actorUserHash: z.string().trim().regex(/^sha256:[a-f0-9]{24}$/).optional(),
  correlationId: z.string().trim().min(1).max(180).optional(),
  cursor: adminAuditCursorSchema.optional(),
  from: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  outcome: adminAuditOutcomeSchema.optional(),
  resourceHash: z.string().trim().regex(/^sha256:[a-f0-9]{24}$/).optional(),
  resourceType: z.string().trim().min(1).max(120).optional(),
  route: z.string().trim().min(1).max(260).optional(),
  statusClass: adminAuditStatusClassSchema.optional(),
  statusCode: z.coerce.number().int().min(100).max(599).optional(),
  to: z.string().datetime().optional(),
});

export const adminAuditExportQuerySchema = adminAuditQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(10_000).default(1_000),
});

export const adminAuditListResponseSchema = z.object({
  ok: z.literal(true),
  events: z.array(adminAuditEventSchema),
  limit: z.number().int().min(1),
  nextCursor: adminAuditCursorSchema.nullable(),
  requestId: z.string().uuid(),
});

export type AdminUserRole = z.infer<typeof adminUserRoleSchema>;
export type AdminAuditEvent = z.infer<typeof adminAuditEventSchema>;
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;
export type AdminAuditExportQuery = z.infer<typeof adminAuditExportQuerySchema>;
export type AdminAuditListResponse = z.infer<typeof adminAuditListResponseSchema>;
