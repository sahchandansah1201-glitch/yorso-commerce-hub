import { z } from "zod";

export const adminIncidentSeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export const adminIncidentSourceSchema = z.enum(["runtime", "audit", "access", "security", "policy"]);
export const adminIncidentStatusSchema = z.enum(["open", "acknowledged", "resolved"]);

export const adminIncidentEvidenceSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(240),
});

export const adminIncidentSchema = z.object({
  acknowledgedAt: z.string().datetime().nullable(),
  acknowledgedByUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  count: z.number().int().min(1),
  description: z.string().min(1).max(600),
  evidence: z.array(adminIncidentEvidenceSchema).max(10),
  firstSeenAt: z.string().datetime(),
  id: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
  lastSeenAt: z.string().datetime(),
  note: z.string().max(500).nullable(),
  recommendedActions: z.array(z.string().min(1).max(220)).min(1).max(8),
  relatedAuditIds: z.array(z.string().min(1).max(180)).max(25),
  route: z.string().min(1).max(260).nullable(),
  severity: adminIncidentSeveritySchema,
  source: adminIncidentSourceSchema,
  status: adminIncidentStatusSchema,
  title: z.string().min(1).max(180),
});

export const adminIncidentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  severity: adminIncidentSeveritySchema.optional(),
  source: adminIncidentSourceSchema.optional(),
  status: adminIncidentStatusSchema.optional(),
});

export const adminIncidentAcknowledgeRequestSchema = z.object({
  note: z.string().trim().max(500).optional(),
  status: z.enum(["acknowledged", "resolved"]).default("acknowledged"),
});

export const adminIncidentListResponseSchema = z.object({
  incidents: z.array(adminIncidentSchema),
  limit: z.number().int().min(1),
  ok: z.literal(true),
  offset: z.number().int().min(0),
  requestId: z.string().uuid(),
  summary: z.object({
    acknowledged: z.number().int().min(0),
    critical: z.number().int().min(0),
    high: z.number().int().min(0),
    open: z.number().int().min(0),
    resolved: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
});

export const adminIncidentDetailResponseSchema = z.object({
  incident: adminIncidentSchema,
  ok: z.literal(true),
  requestId: z.string().uuid(),
});

export const adminIncidentAcknowledgeResponseSchema = z.object({
  incident: adminIncidentSchema,
  ok: z.literal(true),
  requestId: z.string().uuid(),
});

export type AdminIncident = z.infer<typeof adminIncidentSchema>;
export type AdminIncidentAcknowledgeRequest = z.infer<typeof adminIncidentAcknowledgeRequestSchema>;
export type AdminIncidentAcknowledgeResponse = z.infer<typeof adminIncidentAcknowledgeResponseSchema>;
export type AdminIncidentDetailResponse = z.infer<typeof adminIncidentDetailResponseSchema>;
export type AdminIncidentListResponse = z.infer<typeof adminIncidentListResponseSchema>;
export type AdminIncidentQuery = z.infer<typeof adminIncidentQuerySchema>;
export type AdminIncidentSeverity = z.infer<typeof adminIncidentSeveritySchema>;
export type AdminIncidentSource = z.infer<typeof adminIncidentSourceSchema>;
export type AdminIncidentStatus = z.infer<typeof adminIncidentStatusSchema>;
