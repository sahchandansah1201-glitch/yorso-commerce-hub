import { z } from "zod";
import {
  adminAuditEventSchema,
  adminAuditOutcomeSchema,
} from "./admin-audit.js";
import {
  adminIncidentListResponseSchema,
  adminIncidentSchema,
} from "./admin-incidents.js";
import {
  adminRuntimeDiagnosticsSchema,
  adminRuntimeStatusSchema,
} from "./admin-runtime.js";
import {
  supplierAccessGrantAdminItemSchema,
  supplierAccessGrantSummarySchema,
  supplierAccessReviewItemSchema,
  supplierAccessReviewSummarySchema,
} from "./supplier-access.js";

// Contract markers guarded by scripts:
// targetConcurrentUsers remains 10_000 through adminRuntimeStatusSchema.
// SupplierAccessReviewItem and SupplierAccessGrantAdminItem stay the source row shapes.

export const adminOperationsLinkSchema = z.object({
  description: z.string().min(1),
  href: z.string().min(1),
  id: z.enum(["overview", "runtime", "access_requests", "access_grants", "audit", "incidents"]),
  label: z.string().min(1),
});

export const adminOperationsCapacityPlanSchema = z.object({
  backpressureStrategy: z.string().min(1),
  cacheStrategy: z.string().min(1),
  databaseStrategy: z.string().min(1),
  failureMode: z.string().min(1),
  loadTestPlan: z.string().min(1),
  observabilityPlan: z.string().min(1),
  readProfile: z.string().min(1),
  writeProfile: z.string().min(1),
});

export const adminOperationsReadinessItemSchema = z.object({
  action: z.string().min(1),
  detail: z.string().min(1),
  id: z.enum([
    "runtime",
    "audit",
    "access_review",
    "access_grants",
    "incidents",
    "scale_baseline",
    "security",
  ]),
  label: z.string().min(1),
  route: z.string().min(1).nullable(),
  status: z.enum(["pass", "warn", "fail"]),
});

export const adminOperationsActionSchema = z.object({
  description: z.string().min(1),
  href: z.string().min(1),
  id: z.enum([
    "review_requests",
    "inspect_grants",
    "inspect_runtime",
    "inspect_incidents",
    "inspect_audit",
    "export_audit",
    "run_retention",
  ]),
  label: z.string().min(1),
  priority: z.enum(["primary", "secondary", "danger"]),
});

export const adminOperationsAuditSummarySchema = z.object({
  blocked: z.number().int().min(0),
  failure: z.number().int().min(0),
  sampleSize: z.number().int().min(0).max(25),
  statusClasses: z.object({
    "2xx": z.number().int().min(0).optional(),
    "3xx": z.number().int().min(0).optional(),
    "4xx": z.number().int().min(0).optional(),
    "5xx": z.number().int().min(0).optional(),
  }),
  success: z.number().int().min(0),
});

export const adminOperationsOverviewSchema = z.object({
  access: z.object({
    grants: z.object({
      recent: z.array(supplierAccessGrantAdminItemSchema).max(5),
      summary: supplierAccessGrantSummarySchema,
      total: z.number().int().min(0),
    }),
    review: z.object({
      recent: z.array(supplierAccessReviewItemSchema).max(5),
      summary: supplierAccessReviewSummarySchema,
      total: z.number().int().min(0),
    }),
  }),
  audit: z.object({
    recent: z.array(adminAuditEventSchema).max(5),
    summary: adminOperationsAuditSummarySchema,
  }),
  capacityPlan: adminOperationsCapacityPlanSchema,
  generatedAt: z.string().datetime(),
  incidents: z.object({
    recent: z.array(adminIncidentSchema).max(5),
    summary: adminIncidentListResponseSchema.shape.summary,
  }),
  ok: z.literal(true),
  operatorActions: z.array(adminOperationsActionSchema).min(4),
  operatorLinks: z.array(adminOperationsLinkSchema).min(4),
  productionPolicy: adminRuntimeStatusSchema.shape.productionPolicy,
  productionScaleBaseline: adminRuntimeStatusSchema.shape.productionScaleBaseline,
  readiness: z.object({
    fail: z.number().int().min(0),
    items: z.array(adminOperationsReadinessItemSchema).min(4),
    pass: z.number().int().min(0),
    status: z.enum(["pass", "warn", "fail"]),
    warn: z.number().int().min(0),
  }),
  requestId: z.string().uuid(),
  runtime: z.object({
    diagnostics: adminRuntimeDiagnosticsSchema,
    status: adminRuntimeStatusSchema,
  }),
  selfHostedBackend: z.literal(true),
});

export type AdminOperationsCapacityPlan = z.infer<typeof adminOperationsCapacityPlanSchema>;
export type AdminOperationsLink = z.infer<typeof adminOperationsLinkSchema>;
export type AdminOperationsAction = z.infer<typeof adminOperationsActionSchema>;
export type AdminOperationsAuditOutcome = z.infer<typeof adminAuditOutcomeSchema>;
export type AdminOperationsAuditSummary = z.infer<typeof adminOperationsAuditSummarySchema>;
export type AdminOperationsOverview = z.infer<typeof adminOperationsOverviewSchema>;
export type AdminOperationsReadinessItem = z.infer<typeof adminOperationsReadinessItemSchema>;
