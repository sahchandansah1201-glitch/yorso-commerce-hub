import { z } from "zod";
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
  id: z.enum(["overview", "runtime", "access_requests", "access_grants", "audit"]),
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
  capacityPlan: adminOperationsCapacityPlanSchema,
  generatedAt: z.string().datetime(),
  ok: z.literal(true),
  operatorLinks: z.array(adminOperationsLinkSchema).min(4),
  productionPolicy: adminRuntimeStatusSchema.shape.productionPolicy,
  productionScaleBaseline: adminRuntimeStatusSchema.shape.productionScaleBaseline,
  requestId: z.string().uuid(),
  runtime: z.object({
    diagnostics: adminRuntimeDiagnosticsSchema,
    status: adminRuntimeStatusSchema,
  }),
  selfHostedBackend: z.literal(true),
});

export type AdminOperationsCapacityPlan = z.infer<typeof adminOperationsCapacityPlanSchema>;
export type AdminOperationsLink = z.infer<typeof adminOperationsLinkSchema>;
export type AdminOperationsOverview = z.infer<typeof adminOperationsOverviewSchema>;
