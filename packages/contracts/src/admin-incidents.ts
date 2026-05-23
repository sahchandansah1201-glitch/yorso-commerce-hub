import { z } from "zod";
import { adminAuditEventSchema } from "./admin-audit.js";

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

const adminIncidentExecutionUpdateRequestBaseSchema = z.object({
  assignedToUserId: z.string().uuid().optional(),
  blockedReason: adminIncidentSafeNoteSchema.optional(),
  evidenceNote: adminIncidentSafeNoteSchema.optional(),
  note: adminIncidentSafeNoteSchema.optional(),
  status: adminIncidentExecutionStatusSchema,
});

const refineAdminIncidentExecutionUpdate = (
  value: z.infer<typeof adminIncidentExecutionUpdateRequestBaseSchema>,
  context: z.RefinementCtx,
) => {
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
};

export const adminIncidentExecutionUpdateRequestSchema =
  adminIncidentExecutionUpdateRequestBaseSchema.superRefine(refineAdminIncidentExecutionUpdate);

export const adminIncidentExecutionUpdateResponseSchema = adminIncidentExecutionResponseSchema.extend({
  updatedItem: adminIncidentExecutionItemSchema,
});

export const adminIncidentExecutionAssignmentFilterSchema = z.enum(["assigned", "unassigned"]);
export const adminIncidentExecutionOwnerRoleSchema = z.enum(["operator", "engineering", "security", "founder"]);

export const adminIncidentExecutionQueueQuerySchema = z.object({
  assigned: adminIncidentExecutionAssignmentFilterSchema.optional(),
  incidentSeverity: adminIncidentSeveritySchema.optional(),
  incidentSlaStatus: adminIncidentSlaStatusSchema.optional(),
  incidentStatus: adminIncidentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  overdueOnly: z.coerce.boolean().optional(),
  ownerRole: adminIncidentExecutionOwnerRoleSchema.optional(),
  priority: adminIncidentExecutionPrioritySchema.optional(),
  source: adminIncidentExecutionSourceSchema.optional(),
  status: adminIncidentExecutionStatusSchema.optional(),
});

export const adminIncidentExecutionQueueExportQuerySchema = adminIncidentExecutionQueueQuerySchema.extend({
  format: adminIncidentExportFormatSchema.default("json"),
});

export const adminIncidentExecutionQueueItemSchema = adminIncidentExecutionItemSchema.extend({
  incidentDueAt: z.string().datetime(),
  incidentId: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
  incidentSeverity: adminIncidentSeveritySchema,
  incidentSlaStatus: adminIncidentSlaStatusSchema,
  incidentSource: adminIncidentSourceSchema,
  incidentStatus: adminIncidentStatusSchema,
  incidentTitle: z.string().min(1).max(180),
  overdue: z.boolean(),
  targetDueAt: z.string().datetime(),
});

export const adminIncidentExecutionQueueSummarySchema = adminIncidentExecutionSummarySchema.extend({
  assigned: z.number().int().min(0),
  overdue: z.number().int().min(0),
  unassigned: z.number().int().min(0),
});

export const adminIncidentExecutionQueueResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(adminIncidentExecutionQueueItemSchema).max(100),
  limit: z.number().int().min(1).max(100),
  ok: z.literal(true),
  offset: z.number().int().min(0),
  requestId: z.string().uuid(),
  summary: adminIncidentExecutionQueueSummarySchema,
});

export const adminIncidentExecutionQueueBulkUpdateRequestSchema = adminIncidentExecutionUpdateRequestBaseSchema.extend({
  items: z.array(z.object({
    incidentId: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
    itemId: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
  })).min(1).max(50),
}).superRefine(refineAdminIncidentExecutionUpdate);

export const adminIncidentExecutionQueueBulkUpdateResponseSchema = z.object({
  failed: z.array(z.object({
    code: z.enum(["admin_incident_not_found", "admin_incident_execution_item_not_found"]),
    incidentId: z.string().min(1).max(180),
    itemId: z.string().min(1).max(180),
  })).max(50),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  succeeded: z.number().int().min(0).max(50),
  updatedItems: z.array(adminIncidentExecutionQueueItemSchema).max(50),
});

export const adminIncidentWorkloadQuerySchema = z.object({
  includeResolved: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  overdueOnly: z.coerce.boolean().optional(),
  ownerRole: adminIncidentExecutionOwnerRoleSchema.optional(),
  priority: adminIncidentExecutionPrioritySchema.optional(),
  source: adminIncidentSourceSchema.optional(),
  status: adminIncidentExecutionStatusSchema.optional(),
});

export const adminIncidentWorkloadExportQuerySchema = adminIncidentWorkloadQuerySchema.extend({
  format: adminIncidentExportFormatSchema.default("json"),
});

export const adminIncidentWorkloadOwnerSchema = z.object({
  assigned: z.number().int().min(0),
  blocked: z.number().int().min(0),
  breachedIncidents: z.number().int().min(0),
  done: z.number().int().min(0),
  immediate: z.number().int().min(0),
  inProgress: z.number().int().min(0),
  loadScore: z.number().int().min(0),
  oldestTargetMinutes: z.number().int().min(0),
  open: z.number().int().min(0),
  overdue: z.number().int().min(0),
  ownerRole: adminIncidentExecutionOwnerRoleSchema,
  skipped: z.number().int().min(0),
  total: z.number().int().min(0),
  unassigned: z.number().int().min(0),
});

export const adminIncidentWorkloadHotIncidentSchema = z.object({
  blockedItems: z.number().int().min(0),
  dueAt: z.string().datetime(),
  immediateItems: z.number().int().min(0),
  incidentId: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
  loadScore: z.number().int().min(0),
  nextTargetDueAt: z.string().datetime().nullable(),
  openItems: z.number().int().min(0),
  overdueItems: z.number().int().min(0),
  severity: adminIncidentSeveritySchema,
  slaStatus: adminIncidentSlaStatusSchema,
  source: adminIncidentSourceSchema,
  status: adminIncidentStatusSchema,
  title: z.string().min(1).max(180),
  topOwnerRole: adminIncidentExecutionOwnerRoleSchema.nullable(),
  unassignedItems: z.number().int().min(0),
});

export const adminIncidentWorkloadMixSchema = z.object({
  blocked: z.number().int().min(0),
  done: z.number().int().min(0),
  inProgress: z.number().int().min(0),
  key: z.string().min(1).max(80),
  open: z.number().int().min(0),
  overdue: z.number().int().min(0),
  total: z.number().int().min(0),
});

export const adminIncidentWorkloadResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  hotIncidents: z.array(adminIncidentWorkloadHotIncidentSchema).max(50),
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
  ok: z.literal(true),
  owners: z.array(adminIncidentWorkloadOwnerSchema).min(4).max(4),
  requestId: z.string().uuid(),
  sourceMix: z.array(adminIncidentWorkloadMixSchema).max(10),
  statusMix: z.array(adminIncidentWorkloadMixSchema).max(8),
  summary: z.object({
    assigned: z.number().int().min(0),
    blocked: z.number().int().min(0),
    done: z.number().int().min(0),
    hotIncidentCount: z.number().int().min(0),
    inProgress: z.number().int().min(0),
    loadScore: z.number().int().min(0),
    open: z.number().int().min(0),
    overdue: z.number().int().min(0),
    total: z.number().int().min(0),
    unassigned: z.number().int().min(0),
  }),
});

export const adminIncidentWorkloadForecastQuerySchema = adminIncidentWorkloadQuerySchema.extend({
  horizonHours: z.coerce.number().int().min(1).max(168).default(24),
});

export const adminIncidentWorkloadCapacityRiskSchema = z.enum(["low", "moderate", "high", "critical"]);

export const adminIncidentWorkloadForecastOwnerSchema = z.object({
  capacityRisk: adminIncidentWorkloadCapacityRiskSchema,
  currentOpen: z.number().int().min(0),
  currentOverdue: z.number().int().min(0),
  currentScore: z.number().int().min(0),
  ownerRole: adminIncidentExecutionOwnerRoleSchema,
  projectedOpen: z.number().int().min(0),
  projectedOverdue: z.number().int().min(0),
  recommendedAction: z.string().min(1).max(240),
});

export const adminIncidentWorkloadForecastResponseSchema = z.object({
  assumptions: z.array(z.string().min(1).max(260)).min(2).max(8),
  generatedAt: z.string().datetime(),
  horizonHours: z.number().int().min(1).max(168),
  ok: z.literal(true),
  owners: z.array(adminIncidentWorkloadForecastOwnerSchema).min(4).max(4),
  requestId: z.string().uuid(),
  summary: z.object({
    capacityRisk: adminIncidentWorkloadCapacityRiskSchema,
    highestRiskOwnerRole: adminIncidentExecutionOwnerRoleSchema.nullable(),
    projectedOpen: z.number().int().min(0),
    projectedOverdue: z.number().int().min(0),
    recommendedAction: z.string().min(1).max(260),
  }),
});

export const adminIncidentCorrelationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export const adminIncidentCorrelationSignalSchema = z.object({
  actorUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  evidence: z.array(adminIncidentEvidenceSchema).max(6),
  label: z.string().min(1).max(180),
  occurredAt: z.string().datetime().nullable(),
  priority: adminIncidentExecutionPrioritySchema.nullable(),
  route: z.string().min(1).max(260).nullable(),
  source: z.enum(["audit_event", "timeline_event", "execution_item"]),
  status: z.string().min(1).max(80).nullable(),
});

export const adminIncidentCorrelationResponseSchema = z.object({
  auditEvents: z.array(adminAuditEventSchema).max(50),
  executionItems: z.array(adminIncidentExecutionItemSchema).max(40),
  generatedAt: z.string().datetime(),
  incident: adminIncidentSchema,
  ok: z.literal(true),
  recommendedNextSteps: z.array(z.string().min(1).max(260)).min(2).max(8),
  requestId: z.string().uuid(),
  signals: z.array(adminIncidentCorrelationSignalSchema).max(50),
  summary: z.object({
    auditEvents: z.number().int().min(0),
    blockedItems: z.number().int().min(0),
    doneItems: z.number().int().min(0),
    openItems: z.number().int().min(0),
    timelineEvents: z.number().int().min(0),
  }),
  timeline: z.array(adminIncidentTimelineEventSchema).max(100),
});

export const adminIncidentTrendWindowSchema = z.enum(["24h", "7d", "30d"]);
export const adminIncidentTrendGranularitySchema = z.enum(["hour", "day"]);
export const adminIncidentTrendAnomalySeveritySchema = z.enum(["watch", "warning", "critical"]);
export const adminIncidentTrendActionKindSchema = z.enum([
  "anomaly_follow_up",
  "route_risk_review",
  "sla_recovery",
  "capacity_rebalance",
]);
export const adminIncidentTrendActionDecisionSchema = z.enum(["proposed", "accepted", "dismissed"]);

export const adminIncidentTrendQuerySchema = z.object({
  granularity: adminIncidentTrendGranularitySchema.default("day"),
  includeResolved: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  severity: adminIncidentSeveritySchema.optional(),
  source: adminIncidentSourceSchema.optional(),
  status: adminIncidentStatusSchema.optional(),
  window: adminIncidentTrendWindowSchema.default("7d"),
});

export const adminIncidentTrendExportQuerySchema = adminIncidentTrendQuerySchema.extend({
  format: adminIncidentExportFormatSchema.default("json"),
});

export const adminIncidentTrendBucketSchema = z.object({
  acknowledged: z.number().int().min(0),
  access: z.number().int().min(0),
  atRisk: z.number().int().min(0),
  audit: z.number().int().min(0),
  breached: z.number().int().min(0),
  critical: z.number().int().min(0),
  endAt: z.string().datetime(),
  executionBlocked: z.number().int().min(0),
  executionDone: z.number().int().min(0),
  executionOpen: z.number().int().min(0),
  high: z.number().int().min(0),
  key: z.string().min(1).max(80),
  loadScore: z.number().int().min(0),
  open: z.number().int().min(0),
  policy: z.number().int().min(0),
  resolved: z.number().int().min(0),
  runtime: z.number().int().min(0),
  security: z.number().int().min(0),
  startAt: z.string().datetime(),
  total: z.number().int().min(0),
});

export const adminIncidentTrendDimensionSchema = z.object({
  breached: z.number().int().min(0),
  critical: z.number().int().min(0),
  key: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
  loadScore: z.number().int().min(0),
  open: z.number().int().min(0),
  sharePct: z.number().int().min(0).max(100),
  total: z.number().int().min(0),
});

export const adminIncidentTrendRouteRiskSchema = z.object({
  blocked: z.number().int().min(0),
  breached: z.number().int().min(0),
  critical: z.number().int().min(0),
  loadScore: z.number().int().min(0),
  recommendedAction: z.string().min(1).max(260),
  route: z.string().min(1).max(260),
  total: z.number().int().min(0),
});

export const adminIncidentTrendSlaSchema = z.object({
  acknowledgedPct: z.number().int().min(0).max(100),
  breachRatePct: z.number().int().min(0).max(100),
  breached: z.number().int().min(0),
  openCritical: z.number().int().min(0),
  oldestOpenMinutes: z.number().int().min(0),
  unresolved: z.number().int().min(0),
});

export const adminIncidentTrendResponseSchema = z.object({
  buckets: z.array(adminIncidentTrendBucketSchema).min(1).max(60),
  generatedAt: z.string().datetime(),
  granularity: adminIncidentTrendGranularitySchema,
  limit: z.number().int().min(1).max(50),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  routeRisks: z.array(adminIncidentTrendRouteRiskSchema).max(50),
  severityMix: z.array(adminIncidentTrendDimensionSchema).max(8),
  sla: adminIncidentTrendSlaSchema,
  sourceMix: z.array(adminIncidentTrendDimensionSchema).max(10),
  statusMix: z.array(adminIncidentTrendDimensionSchema).max(8),
  summary: z.object({
    averageLoadScore: z.number().int().min(0),
    breached: z.number().int().min(0),
    critical: z.number().int().min(0),
    peakBucketKey: z.string().min(1).max(80).nullable(),
    peakBucketLoadScore: z.number().int().min(0),
    total: z.number().int().min(0),
    trendDirection: z.enum(["down", "flat", "up"]),
  }),
  window: adminIncidentTrendWindowSchema,
});

export const adminIncidentTrendAnomalySchema = z.object({
  baseline: z.number().int().min(0),
  current: z.number().int().min(0),
  deltaPct: z.number().int().min(-100).max(10_000),
  evidence: z.array(adminIncidentEvidenceSchema).min(1).max(6),
  recommendedAction: z.string().min(1).max(260),
  severity: adminIncidentTrendAnomalySeveritySchema,
  signal: z.string().min(1).max(160),
});

export const adminIncidentTrendAnomaliesResponseSchema = z.object({
  anomalies: z.array(adminIncidentTrendAnomalySchema).max(12),
  generatedAt: z.string().datetime(),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  summary: z.object({
    critical: z.number().int().min(0),
    highestSeverity: adminIncidentTrendAnomalySeveritySchema.nullable(),
    warning: z.number().int().min(0),
    watch: z.number().int().min(0),
  }),
  window: adminIncidentTrendWindowSchema,
});

export const adminIncidentTrendBriefingSectionSchema = z.object({
  body: z.array(z.string().min(1).max(420)).min(1).max(8),
  title: z.string().min(1).max(120),
});

export const adminIncidentTrendBriefingResponseSchema = z.object({
  capacityReview: z.array(z.string().min(1).max(320)).min(3).max(8),
  generatedAt: z.string().datetime(),
  ok: z.literal(true),
  operatorActions: z.array(z.string().min(1).max(260)).min(3).max(8),
  requestId: z.string().uuid(),
  riskRegister: z.array(adminIncidentTrendRouteRiskSchema).max(10),
  sections: z.array(adminIncidentTrendBriefingSectionSchema).min(3).max(8),
  summary: z.object({
    headline: z.string().min(1).max(260),
    highestAnomalySeverity: adminIncidentTrendAnomalySeveritySchema.nullable(),
    totalIncidents: z.number().int().min(0),
    trendDirection: z.enum(["down", "flat", "up"]),
  }),
  window: adminIncidentTrendWindowSchema,
});

export const adminIncidentTrendActionSchema = z.object({
  acceptedAt: z.string().datetime().nullable(),
  actionId: z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/),
  decidedByUserHash: z.string().regex(/^sha256:[a-f0-9]{24}$/).nullable(),
  description: z.string().min(1).max(420),
  dismissedAt: z.string().datetime().nullable(),
  evidence: z.array(adminIncidentEvidenceSchema).min(1).max(8),
  kind: adminIncidentTrendActionKindSchema,
  loadScore: z.number().int().min(0),
  note: z.string().max(500).nullable(),
  ownerRole: adminIncidentExecutionOwnerRoleSchema,
  priority: adminIncidentExecutionPrioritySchema,
  recommendedAction: z.string().min(1).max(260),
  relatedIncidentIds: z.array(z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/)).min(1).max(25),
  route: z.string().min(1).max(260).nullable(),
  signal: z.string().min(1).max(160),
  status: adminIncidentTrendActionDecisionSchema,
  title: z.string().min(1).max(160),
});

export const adminIncidentTrendActionsResponseSchema = z.object({
  actions: z.array(adminIncidentTrendActionSchema).max(25),
  generatedAt: z.string().datetime(),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  summary: z.object({
    accepted: z.number().int().min(0),
    dismissed: z.number().int().min(0),
    immediate: z.number().int().min(0),
    proposed: z.number().int().min(0),
    relatedIncidents: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  window: adminIncidentTrendWindowSchema,
});

export const adminIncidentTrendActionDecisionRequestSchema = z.object({
  decision: z.enum(["accept", "dismiss"]),
  note: adminIncidentSafeNoteSchema.optional(),
});

export const adminIncidentTrendActionDecisionResponseSchema = z.object({
  action: adminIncidentTrendActionSchema,
  affectedIncidents: z.array(adminIncidentSchema).max(25),
  decision: z.enum(["accept", "dismiss"]),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  timelineEventsCreated: z.number().int().min(0).max(50),
});

export const adminIncidentTrendActionQueueQuerySchema = adminIncidentTrendQuerySchema.extend({
  decision: adminIncidentTrendActionDecisionSchema.optional(),
  kind: adminIncidentTrendActionKindSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  ownerRole: adminIncidentExecutionOwnerRoleSchema.optional(),
  priority: adminIncidentExecutionPrioritySchema.optional(),
});

export const adminIncidentTrendActionQueueExportQuerySchema = adminIncidentTrendActionQueueQuerySchema.extend({
  format: adminIncidentExportFormatSchema.default("json"),
});

export const adminIncidentTrendActionQueueResponseSchema = z.object({
  actions: z.array(adminIncidentTrendActionSchema).max(100),
  generatedAt: z.string().datetime(),
  limit: z.number().int().min(1).max(100),
  ok: z.literal(true),
  offset: z.number().int().min(0),
  requestId: z.string().uuid(),
  summary: z.object({
    accepted: z.number().int().min(0),
    dismissed: z.number().int().min(0),
    immediate: z.number().int().min(0),
    proposed: z.number().int().min(0),
    relatedIncidents: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  window: adminIncidentTrendWindowSchema,
});

export const adminIncidentTrendActionQueueBulkDecisionRequestSchema = z.object({
  actionIds: z.array(z.string().min(8).max(180).regex(/^[a-z0-9._:-]+$/)).min(1).max(25),
  decision: z.enum(["accept", "dismiss"]),
  note: adminIncidentSafeNoteSchema.optional(),
});

export const adminIncidentTrendActionQueueBulkDecisionResponseSchema = z.object({
  failed: z.array(z.object({
    actionId: z.string().min(1).max(180),
    code: z.enum(["admin_incident_trend_action_not_found"]),
  })).max(25),
  ok: z.literal(true),
  requestId: z.string().uuid(),
  succeeded: z.number().int().min(0).max(25),
  timelineEventsCreated: z.number().int().min(0).max(500),
  updatedActions: z.array(adminIncidentTrendActionSchema).max(25),
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
export type AdminIncidentExecutionAssignmentFilter = z.infer<typeof adminIncidentExecutionAssignmentFilterSchema>;
export type AdminIncidentExecutionExportQuery = z.infer<typeof adminIncidentExecutionExportQuerySchema>;
export type AdminIncidentExecutionOwnerRole = z.infer<typeof adminIncidentExecutionOwnerRoleSchema>;
export type AdminIncidentExecutionPriority = z.infer<typeof adminIncidentExecutionPrioritySchema>;
export type AdminIncidentExecutionQueueBulkUpdateRequest = z.infer<typeof adminIncidentExecutionQueueBulkUpdateRequestSchema>;
export type AdminIncidentExecutionQueueBulkUpdateResponse = z.infer<typeof adminIncidentExecutionQueueBulkUpdateResponseSchema>;
export type AdminIncidentExecutionQueueExportQuery = z.infer<typeof adminIncidentExecutionQueueExportQuerySchema>;
export type AdminIncidentExecutionQueueItem = z.infer<typeof adminIncidentExecutionQueueItemSchema>;
export type AdminIncidentExecutionQueueQuery = z.infer<typeof adminIncidentExecutionQueueQuerySchema>;
export type AdminIncidentExecutionQueueResponse = z.infer<typeof adminIncidentExecutionQueueResponseSchema>;
export type AdminIncidentExecutionQueueSummary = z.infer<typeof adminIncidentExecutionQueueSummarySchema>;
export type AdminIncidentCorrelationQuery = z.infer<typeof adminIncidentCorrelationQuerySchema>;
export type AdminIncidentCorrelationResponse = z.infer<typeof adminIncidentCorrelationResponseSchema>;
export type AdminIncidentCorrelationSignal = z.infer<typeof adminIncidentCorrelationSignalSchema>;
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
export type AdminIncidentTrendAnomaliesResponse = z.infer<typeof adminIncidentTrendAnomaliesResponseSchema>;
export type AdminIncidentTrendAnomaly = z.infer<typeof adminIncidentTrendAnomalySchema>;
export type AdminIncidentTrendAnomalySeverity = z.infer<typeof adminIncidentTrendAnomalySeveritySchema>;
export type AdminIncidentTrendAction = z.infer<typeof adminIncidentTrendActionSchema>;
export type AdminIncidentTrendActionQueueBulkDecisionRequest = z.infer<typeof adminIncidentTrendActionQueueBulkDecisionRequestSchema>;
export type AdminIncidentTrendActionQueueBulkDecisionResponse = z.infer<typeof adminIncidentTrendActionQueueBulkDecisionResponseSchema>;
export type AdminIncidentTrendActionQueueExportQuery = z.infer<typeof adminIncidentTrendActionQueueExportQuerySchema>;
export type AdminIncidentTrendActionQueueQuery = z.infer<typeof adminIncidentTrendActionQueueQuerySchema>;
export type AdminIncidentTrendActionQueueResponse = z.infer<typeof adminIncidentTrendActionQueueResponseSchema>;
export type AdminIncidentTrendActionDecision = z.infer<typeof adminIncidentTrendActionDecisionSchema>;
export type AdminIncidentTrendActionDecisionRequest = z.infer<typeof adminIncidentTrendActionDecisionRequestSchema>;
export type AdminIncidentTrendActionDecisionResponse = z.infer<typeof adminIncidentTrendActionDecisionResponseSchema>;
export type AdminIncidentTrendActionKind = z.infer<typeof adminIncidentTrendActionKindSchema>;
export type AdminIncidentTrendActionsResponse = z.infer<typeof adminIncidentTrendActionsResponseSchema>;
export type AdminIncidentTrendBriefingResponse = z.infer<typeof adminIncidentTrendBriefingResponseSchema>;
export type AdminIncidentTrendBriefingSection = z.infer<typeof adminIncidentTrendBriefingSectionSchema>;
export type AdminIncidentTrendBucket = z.infer<typeof adminIncidentTrendBucketSchema>;
export type AdminIncidentTrendDimension = z.infer<typeof adminIncidentTrendDimensionSchema>;
export type AdminIncidentTrendExportQuery = z.infer<typeof adminIncidentTrendExportQuerySchema>;
export type AdminIncidentTrendGranularity = z.infer<typeof adminIncidentTrendGranularitySchema>;
export type AdminIncidentTrendQuery = z.infer<typeof adminIncidentTrendQuerySchema>;
export type AdminIncidentTrendResponse = z.infer<typeof adminIncidentTrendResponseSchema>;
export type AdminIncidentTrendRouteRisk = z.infer<typeof adminIncidentTrendRouteRiskSchema>;
export type AdminIncidentTrendSla = z.infer<typeof adminIncidentTrendSlaSchema>;
export type AdminIncidentTrendWindow = z.infer<typeof adminIncidentTrendWindowSchema>;
export type AdminIncidentWorkloadExportQuery = z.infer<typeof adminIncidentWorkloadExportQuerySchema>;
export type AdminIncidentWorkloadCapacityRisk = z.infer<typeof adminIncidentWorkloadCapacityRiskSchema>;
export type AdminIncidentWorkloadForecastOwner = z.infer<typeof adminIncidentWorkloadForecastOwnerSchema>;
export type AdminIncidentWorkloadForecastQuery = z.infer<typeof adminIncidentWorkloadForecastQuerySchema>;
export type AdminIncidentWorkloadForecastResponse = z.infer<typeof adminIncidentWorkloadForecastResponseSchema>;
export type AdminIncidentWorkloadHotIncident = z.infer<typeof adminIncidentWorkloadHotIncidentSchema>;
export type AdminIncidentWorkloadMix = z.infer<typeof adminIncidentWorkloadMixSchema>;
export type AdminIncidentWorkloadOwner = z.infer<typeof adminIncidentWorkloadOwnerSchema>;
export type AdminIncidentWorkloadQuery = z.infer<typeof adminIncidentWorkloadQuerySchema>;
export type AdminIncidentWorkloadResponse = z.infer<typeof adminIncidentWorkloadResponseSchema>;
