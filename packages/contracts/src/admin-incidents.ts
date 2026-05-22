import { z } from "zod";

export const adminIncidentSeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export const adminIncidentSourceSchema = z.enum(["runtime", "audit", "access", "security", "policy"]);
export const adminIncidentStatusSchema = z.enum(["open", "acknowledged", "resolved"]);
export const adminIncidentAssignmentFilterSchema = z.enum(["assigned", "unassigned"]);
export const adminIncidentEscalationLevelSchema = z.enum(["none", "lead", "engineering", "executive"]);
export const adminIncidentExportFormatSchema = z.enum(["json", "csv"]);
export const adminIncidentHandoffFormatSchema = z.enum(["json", "markdown"]);
export const adminIncidentPostmortemFormatSchema = z.enum(["json", "markdown"]);
export const adminIncidentSlaStatusSchema = z.enum(["ok", "at_risk", "breached"]);
export const adminIncidentTimelineEventTypeSchema = z.enum([
  "created",
  "acknowledged",
  "assigned",
  "commented",
  "escalated",
  "resolved",
]);

export const adminIncidentEvidenceSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(240),
});

export const adminIncidentRunbookStepSchema = z.object({
  description: z.string().min(1).max(260),
  label: z.string().min(1).max(80),
  ownerRole: z.enum(["operator", "engineering", "security", "founder"]),
  targetMinutes: z.number().int().min(1).max(1440),
});

export const adminIncidentTimelineEventSchema = z.object({
  actorUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  assignedToUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  escalationLevel: adminIncidentEscalationLevelSchema.nullable(),
  eventId: z.string().min(8).max(180),
  note: z.string().max(500).nullable(),
  occurredAt: z.string().datetime(),
  status: adminIncidentStatusSchema.nullable(),
  type: adminIncidentTimelineEventTypeSchema,
});

export const adminIncidentSchema = z.object({
  acknowledgedAt: z.string().datetime().nullable(),
  acknowledgedByUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  assignedAt: z.string().datetime().nullable(),
  assignedToUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  count: z.number().int().min(1),
  description: z.string().min(1).max(600),
  dueAt: z.string().datetime(),
  escalatedAt: z.string().datetime().nullable(),
  escalationLevel: adminIncidentEscalationLevelSchema,
  evidence: z.array(adminIncidentEvidenceSchema).max(10),
  firstSeenAt: z.string().datetime(),
  id: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
  lastSeenAt: z.string().datetime(),
  note: z.string().max(500).nullable(),
  recommendedActions: z.array(z.string().min(1).max(220)).min(1).max(8),
  relatedAuditIds: z.array(z.string().min(1).max(180)).max(25),
  route: z.string().min(1).max(260).nullable(),
  runbook: z.array(adminIncidentRunbookStepSchema).min(1).max(6),
  severity: adminIncidentSeveritySchema,
  slaStatus: adminIncidentSlaStatusSchema,
  source: adminIncidentSourceSchema,
  status: adminIncidentStatusSchema,
  timelinePreview: z.array(adminIncidentTimelineEventSchema).max(6),
  title: z.string().min(1).max(180),
});

export const adminIncidentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  assigned: adminIncidentAssignmentFilterSchema.optional(),
  escalationLevel: adminIncidentEscalationLevelSchema.optional(),
  severity: adminIncidentSeveritySchema.optional(),
  slaStatus: adminIncidentSlaStatusSchema.optional(),
  source: adminIncidentSourceSchema.optional(),
  status: adminIncidentStatusSchema.optional(),
});

export const adminIncidentExportQuerySchema = adminIncidentQuerySchema.extend({
  format: adminIncidentExportFormatSchema.default("json"),
});

export const adminIncidentHandoffQuerySchema = z.object({
  format: adminIncidentHandoffFormatSchema.default("json"),
});

export const adminIncidentPostmortemQuerySchema = z.object({
  format: adminIncidentPostmortemFormatSchema.default("json"),
});

export const adminIncidentSafeNoteSchema = z.string()
  .trim()
  .max(500)
  .refine((value) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value), {
    message: "note must not contain raw email addresses",
  })
  .refine((value) => !/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(value), {
    message: "note must not contain raw UUID identifiers",
  })
  .refine((value) => !/\b(session|token|secret|password)\s*[:=]\s*\S+/i.test(value), {
    message: "note must not contain raw secrets or session tokens",
  });

export const adminIncidentAcknowledgeRequestSchema = z.object({
  note: adminIncidentSafeNoteSchema.optional(),
  status: z.enum(["acknowledged", "resolved"]).default("acknowledged"),
});

export const adminIncidentWorkflowActionSchema = z.enum(["assign", "comment", "escalate", "resolve"]);

const adminIncidentWorkflowRequestBaseSchema = z.object({
  action: adminIncidentWorkflowActionSchema,
  assignedToUserId: z.string().uuid().optional(),
  escalationLevel: adminIncidentEscalationLevelSchema.optional(),
  note: adminIncidentSafeNoteSchema.optional(),
});

const validateWorkflowRequest = (
  value: z.infer<typeof adminIncidentWorkflowRequestBaseSchema>,
  context: z.RefinementCtx,
) => {
  if (value.action === "assign" && !value.assignedToUserId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "assignedToUserId is required for assign action",
      path: ["assignedToUserId"],
    });
  }
  if (value.action === "escalate" && (!value.escalationLevel || value.escalationLevel === "none")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "escalationLevel is required for escalate action",
      path: ["escalationLevel"],
    });
  }
  if (value.action === "comment" && !value.note) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "note is required for comment action",
      path: ["note"],
    });
  }
};

export const adminIncidentWorkflowRequestSchema = adminIncidentWorkflowRequestBaseSchema.superRefine(validateWorkflowRequest);

export const adminIncidentBulkWorkflowRequestSchema = adminIncidentWorkflowRequestBaseSchema.extend({
  incidentIds: z.array(z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/)).min(1).max(25),
}).superRefine(validateWorkflowRequest);

export const adminIncidentListResponseSchema = z.object({
  incidents: z.array(adminIncidentSchema),
  limit: z.number().int().min(1),
  ok: z.literal(true),
  offset: z.number().int().min(0),
  requestId: z.string().uuid(),
  summary: z.object({
    acknowledged: z.number().int().min(0),
    access: z.number().int().min(0),
    assigned: z.number().int().min(0),
    assignmentCoveragePct: z.number().int().min(0).max(100),
    atRisk: z.number().int().min(0),
    audit: z.number().int().min(0),
    breachRatePct: z.number().int().min(0).max(100),
    breached: z.number().int().min(0),
    critical: z.number().int().min(0),
    engineeringEscalations: z.number().int().min(0),
    escalated: z.number().int().min(0),
    executiveEscalations: z.number().int().min(0),
    high: z.number().int().min(0),
    leadEscalations: z.number().int().min(0),
    open: z.number().int().min(0),
    openCritical: z.number().int().min(0),
    oldestOpenMinutes: z.number().int().min(0),
    policy: z.number().int().min(0),
    resolved: z.number().int().min(0),
    runtime: z.number().int().min(0),
    security: z.number().int().min(0),
    total: z.number().int().min(0),
    unassigned: z.number().int().min(0),
  }),
});

export const adminIncidentDetailResponseSchema = z.object({
  incident: adminIncidentSchema,
  ok: z.literal(true),
  requestId: z.string().uuid(),
  timeline: z.array(adminIncidentTimelineEventSchema).max(100),
});

export const adminIncidentAcknowledgeResponseSchema = z.object({
  incident: adminIncidentSchema,
  ok: z.literal(true),
  requestId: z.string().uuid(),
  timeline: z.array(adminIncidentTimelineEventSchema).max(100),
});

export const adminIncidentWorkflowResponseSchema = z.object({
  incident: adminIncidentSchema,
  ok: z.literal(true),
  requestId: z.string().uuid(),
  timeline: z.array(adminIncidentTimelineEventSchema).max(100),
});

export const adminIncidentBulkWorkflowResponseSchema = z.object({
  failed: z.array(z.object({
    code: z.enum(["admin_incident_not_found"]),
    incidentId: z.string().min(1).max(180),
  })).max(25),
  incidents: z.array(adminIncidentSchema).max(25),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  succeeded: z.number().int().min(0).max(25),
});

export const adminIncidentExportResponseSchema = z.object({
  count: z.number().int().min(0).max(100),
  generatedAt: z.string().datetime(),
  incidents: z.array(adminIncidentSchema).max(100),
  ok: z.literal(true),
  requestId: z.string().uuid(),
});

export const adminIncidentHandoffSectionSchema = z.object({
  body: z.array(z.string().min(1).max(500)).min(1).max(12),
  title: z.string().min(1).max(120),
});

export const adminIncidentHandoffChecklistItemSchema = z.object({
  detail: z.string().min(1).max(240),
  label: z.string().min(1).max(120),
  status: z.enum(["ready", "needs_attention"]),
});

export const adminIncidentHandoffResponseSchema = z.object({
  checklist: z.array(adminIncidentHandoffChecklistItemSchema).min(3).max(8),
  generatedAt: z.string().datetime(),
  handoffId: z.string().min(8).max(180),
  incident: adminIncidentSchema,
  ok: z.literal(true),
  requestId: z.string().uuid(),
  sections: z.array(adminIncidentHandoffSectionSchema).min(3).max(8),
  timeline: z.array(adminIncidentTimelineEventSchema).max(100),
});

export const adminIncidentRemediationPlanStepSchema = z.object({
  description: z.string().min(1).max(320),
  evidenceRequired: z.string().min(1).max(220),
  ownerRole: z.enum(["operator", "engineering", "security", "founder"]),
  priority: z.enum(["immediate", "next", "follow_up"]),
  targetMinutes: z.number().int().min(1).max(2880),
  title: z.string().min(1).max(120),
});

export const adminIncidentRemediationPlanResponseSchema = z.object({
  capacityNotes: z.array(z.string().min(1).max(320)).min(2).max(6),
  generatedAt: z.string().datetime(),
  incident: adminIncidentSchema,
  ok: z.literal(true),
  requestId: z.string().uuid(),
  rollbackPlan: z.array(z.string().min(1).max(260)).min(2).max(6),
  steps: z.array(adminIncidentRemediationPlanStepSchema).min(3).max(8),
  verificationChecks: z.array(z.string().min(1).max(260)).min(2).max(8),
});

export const adminIncidentPostmortemActionItemSchema = z.object({
  evidenceRequired: z.string().min(1).max(260),
  ownerRole: z.enum(["operator", "engineering", "security", "founder"]),
  priority: z.enum(["immediate", "next", "follow_up"]),
  targetHours: z.number().int().min(1).max(720),
  title: z.string().min(1).max(140),
});

export const adminIncidentPostmortemResponseSchema = z.object({
  actionItems: z.array(adminIncidentPostmortemActionItemSchema).min(3).max(10),
  capacityReview: z.array(z.string().min(1).max(320)).min(3).max(8),
  executiveSummary: z.string().min(1).max(700),
  generatedAt: z.string().datetime(),
  impactSummary: z.array(z.string().min(1).max(320)).min(2).max(8),
  incident: adminIncidentSchema,
  ok: z.literal(true),
  postmortemId: z.string().min(8).max(180),
  preventionChecks: z.array(z.string().min(1).max(300)).min(3).max(8),
  requestId: z.string().uuid(),
  rootCauseHypotheses: z.array(z.string().min(1).max(320)).min(2).max(6),
  timeline: z.array(adminIncidentTimelineEventSchema).max(100),
});

export const adminIncidentExecutionSourceSchema = z.enum([
  "remediation_step",
  "verification_check",
  "rollback_step",
  "capacity_note",
  "postmortem_action",
  "prevention_check",
]);

export const adminIncidentExecutionStatusSchema = z.enum([
  "open",
  "in_progress",
  "blocked",
  "done",
  "skipped",
]);

export const adminIncidentExecutionPrioritySchema = z.enum(["immediate", "next", "follow_up"]);

export const adminIncidentExecutionExportQuerySchema = z.object({
  format: adminIncidentExportFormatSchema.default("json"),
});

export const adminIncidentExecutionItemSchema = z.object({
  assignedToUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  blockedReason: z.string().min(1).max(240).nullable(),
  completedAt: z.string().datetime().nullable(),
  description: z.string().min(1).max(420),
  evidenceNote: z.string().min(1).max(500).nullable(),
  evidenceRequired: z.string().min(1).max(260),
  itemId: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
  note: z.string().min(1).max(500).nullable(),
  ownerRole: z.enum(["operator", "engineering", "security", "founder"]),
  priority: adminIncidentExecutionPrioritySchema,
  source: adminIncidentExecutionSourceSchema,
  status: adminIncidentExecutionStatusSchema,
  targetMinutes: z.number().int().min(1).max(43_200),
  title: z.string().min(1).max(160),
  updatedAt: z.string().datetime().nullable(),
  updatedByUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
});

export const adminIncidentExecutionSummarySchema = z.object({
  blocked: z.number().int().min(0),
  done: z.number().int().min(0),
  inProgress: z.number().int().min(0),
  open: z.number().int().min(0),
  skipped: z.number().int().min(0),
  total: z.number().int().min(0),
});

export const adminIncidentExecutionResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  incident: adminIncidentSchema,
  items: z.array(adminIncidentExecutionItemSchema).min(1).max(40),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  summary: adminIncidentExecutionSummarySchema,
});

export const adminIncidentExecutionUpdateRequestSchema = z.object({
  assignedToUserId: z.string().uuid().optional(),
  blockedReason: adminIncidentSafeNoteSchema.optional(),
  evidenceNote: adminIncidentSafeNoteSchema.optional(),
  note: adminIncidentSafeNoteSchema.optional(),
  status: adminIncidentExecutionStatusSchema,
}).superRefine((value, context) => {
  if (value.status === "blocked" && !value.blockedReason) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "blockedReason is required when status is blocked",
      path: ["blockedReason"],
    });
  }
  if (value.status === "done" && !value.evidenceNote) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "evidenceNote is required when status is done",
      path: ["evidenceNote"],
    });
  }
});

export const adminIncidentExecutionUpdateResponseSchema = adminIncidentExecutionResponseSchema.extend({
  updatedItem: adminIncidentExecutionItemSchema,
});

export type AdminIncident = z.infer<typeof adminIncidentSchema>;
export type AdminIncidentAcknowledgeRequest = z.infer<typeof adminIncidentAcknowledgeRequestSchema>;
export type AdminIncidentAcknowledgeResponse = z.infer<typeof adminIncidentAcknowledgeResponseSchema>;
export type AdminIncidentAssignmentFilter = z.infer<typeof adminIncidentAssignmentFilterSchema>;
export type AdminIncidentBulkWorkflowRequest = z.infer<typeof adminIncidentBulkWorkflowRequestSchema>;
export type AdminIncidentBulkWorkflowResponse = z.infer<typeof adminIncidentBulkWorkflowResponseSchema>;
export type AdminIncidentDetailResponse = z.infer<typeof adminIncidentDetailResponseSchema>;
export type AdminIncidentEscalationLevel = z.infer<typeof adminIncidentEscalationLevelSchema>;
export type AdminIncidentExportFormat = z.infer<typeof adminIncidentExportFormatSchema>;
export type AdminIncidentExportResponse = z.infer<typeof adminIncidentExportResponseSchema>;
export type AdminIncidentExecutionItem = z.infer<typeof adminIncidentExecutionItemSchema>;
export type AdminIncidentExecutionExportQuery = z.infer<typeof adminIncidentExecutionExportQuerySchema>;
export type AdminIncidentExecutionPriority = z.infer<typeof adminIncidentExecutionPrioritySchema>;
export type AdminIncidentExecutionResponse = z.infer<typeof adminIncidentExecutionResponseSchema>;
export type AdminIncidentExecutionSource = z.infer<typeof adminIncidentExecutionSourceSchema>;
export type AdminIncidentExecutionStatus = z.infer<typeof adminIncidentExecutionStatusSchema>;
export type AdminIncidentExecutionSummary = z.infer<typeof adminIncidentExecutionSummarySchema>;
export type AdminIncidentExecutionUpdateRequest = z.infer<typeof adminIncidentExecutionUpdateRequestSchema>;
export type AdminIncidentExecutionUpdateResponse = z.infer<typeof adminIncidentExecutionUpdateResponseSchema>;
export type AdminIncidentHandoffFormat = z.infer<typeof adminIncidentHandoffFormatSchema>;
export type AdminIncidentHandoffChecklistItem = z.infer<typeof adminIncidentHandoffChecklistItemSchema>;
export type AdminIncidentHandoffResponse = z.infer<typeof adminIncidentHandoffResponseSchema>;
export type AdminIncidentHandoffSection = z.infer<typeof adminIncidentHandoffSectionSchema>;
export type AdminIncidentListResponse = z.infer<typeof adminIncidentListResponseSchema>;
export type AdminIncidentPostmortemActionItem = z.infer<typeof adminIncidentPostmortemActionItemSchema>;
export type AdminIncidentPostmortemFormat = z.infer<typeof adminIncidentPostmortemFormatSchema>;
export type AdminIncidentPostmortemResponse = z.infer<typeof adminIncidentPostmortemResponseSchema>;
export type AdminIncidentQuery = z.infer<typeof adminIncidentQuerySchema>;
export type AdminIncidentRemediationPlanResponse = z.infer<typeof adminIncidentRemediationPlanResponseSchema>;
export type AdminIncidentRemediationPlanStep = z.infer<typeof adminIncidentRemediationPlanStepSchema>;
export type AdminIncidentRunbookStep = z.infer<typeof adminIncidentRunbookStepSchema>;
export type AdminIncidentSafeNote = z.infer<typeof adminIncidentSafeNoteSchema>;
export type AdminIncidentSeverity = z.infer<typeof adminIncidentSeveritySchema>;
export type AdminIncidentSlaStatus = z.infer<typeof adminIncidentSlaStatusSchema>;
export type AdminIncidentSource = z.infer<typeof adminIncidentSourceSchema>;
export type AdminIncidentStatus = z.infer<typeof adminIncidentStatusSchema>;
export type AdminIncidentTimelineEvent = z.infer<typeof adminIncidentTimelineEventSchema>;
export type AdminIncidentTimelineEventType = z.infer<typeof adminIncidentTimelineEventTypeSchema>;
export type AdminIncidentWorkflowAction = z.infer<typeof adminIncidentWorkflowActionSchema>;
export type AdminIncidentWorkflowRequest = z.infer<typeof adminIncidentWorkflowRequestSchema>;
export type AdminIncidentWorkflowResponse = z.infer<typeof adminIncidentWorkflowResponseSchema>;
