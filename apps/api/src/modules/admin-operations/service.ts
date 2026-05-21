import {
  adminOperationsOverviewSchema,
  type AdminOperationsOverview,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierAccessService } from "../access/service.js";
import type { AdminRuntimeService } from "../admin-runtime/service.js";

export class AdminOperationsService {
  constructor(
    private readonly runtimeService: AdminRuntimeService,
    private readonly accessService: SupplierAccessService,
  ) {}

  async getOverview(requestId: string): Promise<AdminOperationsOverview> {
    const status = this.runtimeService.getStatus(requestId);
    const diagnostics = this.runtimeService.getDiagnostics(requestId);
    const [review, grants] = await Promise.all([
      this.accessService.listReviewRequests({
        rawQuery: { limit: "5", offset: "0", status: "open" },
        requestId,
      }),
      this.accessService.listAdminGrants({
        rawQuery: { limit: "5", offset: "0", status: "active" },
        requestId,
      }),
    ]);

    return adminOperationsOverviewSchema.parse({
      access: {
        grants: {
          recent: grants.items,
          summary: grants.summary,
          total: grants.total,
        },
        review: {
          recent: review.items,
          summary: review.summary,
          total: review.total,
        },
      },
      capacityPlan: {
        backpressureStrategy: "Use explicit refresh, bounded 5-row previews, existing request timeouts, admin auth guards and audit backpressure. Do not poll the hub by default.",
        cacheStrategy: "No browser auto-polling. Runtime facts are read on page load or manual refresh, and the endpoint keeps each downstream query paginated.",
        databaseStrategy: "Use existing indexed admin access review and grant queries with limit 5. Any future count expansion must use indexed status filters or precomputed rollups.",
        failureMode: "If one protected dependency fails, return a normal HTTP error instead of fabricating operator data. Frontend keeps a visible error state.",
        loadTestPlan: "Include the endpoint in admin smoke tests and run it as a low-frequency operator path during the 10,000 concurrent users load-test plan.",
        observabilityPlan: "Emit audit events for reads and rely on request, error, metrics and admin runtime diagnostics telemetry. Never include session ids, emails or connection strings.",
        readProfile: "Low-frequency admin overview read path. One request fans out to runtime status, diagnostics, access review preview and grants preview.",
        writeProfile: "No writes. Decisions and revocations stay in the dedicated access review and access grants endpoints.",
      },
      generatedAt: new Date().toISOString(),
      ok: true,
      operatorLinks: [
        {
          description: "Single operator landing page for runtime, access and production-readiness signals.",
          href: "/admin",
          id: "overview",
          label: "Operations overview",
        },
        {
          description: "Inspect sanitized self-hosted runtime configuration, diagnostics and capacity controls.",
          href: "/admin/runtime",
          id: "runtime",
          label: "Runtime status",
        },
        {
          description: "Review supplier access requests and approve exact-price access without exposing private supplier data early.",
          href: "/admin/access-requests",
          id: "access_requests",
          label: "Access review",
        },
        {
          description: "Audit active buyer grants and revoke supplier access when it is no longer valid.",
          href: "/admin/access-grants",
          id: "access_grants",
          label: "Access grants",
        },
        {
          description: "Use the durable audit console for incident and operator action traceability.",
          href: "/admin/audit",
          id: "audit",
          label: "Audit trail",
        },
      ],
      productionPolicy: status.productionPolicy,
      productionScaleBaseline: status.productionScaleBaseline,
      requestId,
      runtime: {
        diagnostics,
        status,
      },
      selfHostedBackend: true,
    });
  }
}
