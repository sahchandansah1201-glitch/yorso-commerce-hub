import {
  adminOperationsOverviewSchema,
  type AdminAuditEvent,
  type AdminOperationsOverview,
  type AdminOperationsReadinessItem,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierAccessService } from "../access/service.js";
import type { AdminAuditService } from "../admin-audit/service.js";
import type { AdminIncidentService } from "../admin-incidents/service.js";
import type { AdminRuntimeService } from "../admin-runtime/service.js";

export class AdminOperationsService {
  constructor(
    private readonly runtimeService: AdminRuntimeService,
    private readonly accessService: SupplierAccessService,
    private readonly auditService: AdminAuditService,
    private readonly incidentService: AdminIncidentService,
  ) {}

  async getOverview(requestId: string): Promise<AdminOperationsOverview> {
    const status = this.runtimeService.getStatus(requestId);
    const diagnostics = this.runtimeService.getDiagnostics(requestId);
    const [review, grants, auditPage, incidents] = await Promise.all([
      this.accessService.listReviewRequests({
        rawQuery: { limit: "5", offset: "0", status: "open" },
        requestId,
      }),
      this.accessService.listAdminGrants({
        rawQuery: { limit: "5", offset: "0", status: "active" },
        requestId,
      }),
      this.auditService.listAuditEvents({ limit: "25" }, requestId),
      this.incidentService.listIncidents({ limit: "5", status: "open" }, requestId),
    ]);
    const readiness = buildReadiness({
      auditEvents: auditPage.events,
      diagnostics,
      grantsTotal: grants.total,
      incidentSummary: incidents.summary,
      reviewOpen: review.summary.open,
      status,
    });

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
      audit: {
        recent: auditPage.events.slice(0, 5),
        summary: summarizeAuditEvents(auditPage.events),
      },
      capacityPlan: {
        backpressureStrategy: "Use explicit refresh, bounded 5-row previews, bounded 25-row audit samples, bounded 5-row incident previews, existing request timeouts, admin auth guards and audit backpressure. Do not poll the hub by default.",
        cacheStrategy: "No browser auto-polling. Runtime facts are read on page load or manual refresh, and each downstream query remains paginated.",
        databaseStrategy: "Use existing indexed admin access review, grant, incident acknowledgement and audit queries. Any future total-count expansion must use indexed status filters, route filters or precomputed rollups.",
        failureMode: "If one protected dependency fails, return a normal HTTP error instead of fabricating operator data. Frontend keeps a visible error state and preserves manual refresh.",
        loadTestPlan: "Include overview, incident response, audit page and access consoles as low-frequency operator paths during the 10,000 concurrent users load-test plan.",
        observabilityPlan: "Emit audit events for reads and rely on request, error, metrics and admin runtime diagnostics telemetry. Never include session ids, emails or connection strings.",
        readProfile: "Low-frequency admin overview read path. One request fans out to runtime status, diagnostics, access review preview, grants preview, bounded incident preview and bounded audit activity.",
        writeProfile: "No writes in the overview. Incident acknowledgements, access decisions and revocations stay in dedicated endpoints.",
      },
      generatedAt: new Date().toISOString(),
      incidents: {
        recent: incidents.incidents,
        summary: incidents.summary,
      },
      ok: true,
      operatorActions: [
        {
          description: "Process the oldest open exact-price access requests.",
          href: "/admin/access-requests",
          id: "review_requests",
          label: "Review access queue",
          priority: review.summary.open > 0 ? "primary" : "secondary",
        },
        {
          description: "Inspect active buyer access and revoke stale grants.",
          href: "/admin/access-grants",
          id: "inspect_grants",
          label: "Inspect active grants",
          priority: grants.summary.active > 0 ? "primary" : "secondary",
        },
        {
          description: "Check runtime diagnostics before deploying or handling an incident.",
          href: "/admin/runtime",
          id: "inspect_runtime",
          label: "Inspect runtime",
          priority: diagnostics.diagnostics.overallStatus === "fail" ? "danger" : "secondary",
        },
        {
          description: "Triage open runtime, audit and security incidents from the self-hosted API.",
          href: "/admin/incidents",
          id: "inspect_incidents",
          label: "Triage incidents",
          priority: incidents.summary.open > 0 ? "danger" : "secondary",
        },
        {
          description: "Review recent operator actions, blocked access and backend errors.",
          href: "/admin/audit",
          id: "inspect_audit",
          label: "Inspect audit trail",
          priority: auditPage.events.some((event) => event.outcome !== "success") ? "primary" : "secondary",
        },
        {
          description: "Export a bounded audit window for incident review.",
          href: "/v1/admin/audit-events/export?format=csv&limit=1000",
          id: "export_audit",
          label: "Export audit CSV",
          priority: "secondary",
        },
      ],
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
        {
          description: "Triage derived runtime, audit and security incidents with durable acknowledgement state.",
          href: "/admin/incidents",
          id: "incidents",
          label: "Incident response",
        },
      ],
      productionPolicy: status.productionPolicy,
      productionScaleBaseline: status.productionScaleBaseline,
      readiness,
      requestId,
      runtime: {
        diagnostics,
        status,
      },
      selfHostedBackend: true,
    });
  }
}

function summarizeAuditEvents(events: AdminAuditEvent[]) {
  const statusClasses: Record<"2xx" | "3xx" | "4xx" | "5xx", number> = {
    "2xx": 0,
    "3xx": 0,
    "4xx": 0,
    "5xx": 0,
  };
  const summary = {
    blocked: 0,
    failure: 0,
    sampleSize: events.length,
    statusClasses,
    success: 0,
  };

  for (const event of events) {
    summary[event.outcome] += 1;
    if (event.statusCode) {
      const key = `${Math.floor(event.statusCode / 100)}xx` as keyof typeof statusClasses;
      if (key in statusClasses) statusClasses[key] += 1;
    }
  }

  return summary;
}

function buildReadiness(input: {
  auditEvents: AdminAuditEvent[];
  diagnostics: ReturnType<AdminRuntimeService["getDiagnostics"]>;
  grantsTotal: number;
  incidentSummary: { critical: number; high: number; open: number; total: number };
  reviewOpen: number;
  status: ReturnType<AdminRuntimeService["getStatus"]>;
}) {
  const hasAuditFailures = input.auditEvents.some(
    (event) => event.outcome === "failure" || Boolean(event.statusCode && event.statusCode >= 500),
  );
  const hasAuditBlocked = input.auditEvents.some((event) => event.outcome === "blocked");
  const items: AdminOperationsReadinessItem[] = [
    {
      action: "Open runtime diagnostics.",
      detail: `Runtime diagnostics report ${input.diagnostics.diagnostics.overallStatus}.`,
      id: "runtime",
      label: "Runtime diagnostics",
      route: "/admin/runtime",
      status: input.diagnostics.diagnostics.overallStatus,
    },
    {
      action: "Inspect recent audit events.",
      detail: hasAuditFailures
        ? "Recent audit sample includes failed backend actions."
        : "Recent audit sample has no failed backend actions.",
      id: "audit",
      label: "Audit activity",
      route: "/admin/audit",
      status: hasAuditFailures ? "fail" : hasAuditBlocked ? "warn" : "pass",
    },
    {
      action: "Process open access requests.",
      detail: `${input.reviewOpen} open supplier access requests in the bounded review preview.`,
      id: "access_review",
      label: "Access review queue",
      route: "/admin/access-requests",
      status: input.reviewOpen > 20 ? "warn" : "pass",
    },
    {
      action: "Review active grants.",
      detail: `${input.grantsTotal} active or recent grants visible through the admin grant console.`,
      id: "access_grants",
      label: "Grant hygiene",
      route: "/admin/access-grants",
      status: "pass",
    },
    {
      action: "Triage open incidents.",
      detail: `${input.incidentSummary.open} open incidents, ${input.incidentSummary.critical} critical and ${input.incidentSummary.high} high.`,
      id: "incidents",
      label: "Incident queue",
      route: "/admin/incidents",
      status: input.incidentSummary.critical > 0 ? "fail" : input.incidentSummary.high > 0 ? "warn" : "pass",
    },
    {
      action: "Keep production capacity policy visible.",
      detail: `Target baseline remains ${input.status.productionScaleBaseline.targetConcurrentUsers.toLocaleString("en-US")} concurrent users.`,
      id: "scale_baseline",
      label: "Scale baseline",
      route: null,
      status: input.status.productionScaleBaseline.targetConcurrentUsers >= 10_000 ? "pass" : "fail",
    },
    {
      action: "Keep hosted BaaS out of production runtime.",
      detail: input.status.productionPolicy.hostedBaasProductionBackend
        ? "Hosted BaaS production backend is enabled and must be removed."
        : "Self-hosted production policy is enforced.",
      id: "security",
      label: "Self-hosted policy",
      route: null,
      status: input.status.productionPolicy.hostedBaasProductionBackend ? "fail" : "pass",
    },
  ];
  const fail = items.filter((item) => item.status === "fail").length;
  const warn = items.filter((item) => item.status === "warn").length;
  const pass = items.filter((item) => item.status === "pass").length;
  return {
    fail,
    items,
    pass,
    status: fail > 0 ? "fail" as const : warn > 0 ? "warn" as const : "pass" as const,
    warn,
  };
}
