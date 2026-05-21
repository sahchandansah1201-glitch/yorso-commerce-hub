import {
  adminIncidentAcknowledgeRequestSchema,
  adminIncidentAcknowledgeResponseSchema,
  adminIncidentDetailResponseSchema,
  adminIncidentListResponseSchema,
  adminIncidentQuerySchema,
  type AdminAuditEvent,
  type AdminIncident,
  type AdminIncidentAcknowledgeResponse,
  type AdminIncidentDetailResponse,
  type AdminIncidentListResponse,
  type AdminIncidentQuery,
  type AdminIncidentSeverity,
  type AdminIncidentSource,
  type AdminIncidentStatus,
} from "../../../../../packages/contracts/dist/index.js";
import { auditHash } from "../../audit.js";
import type { AdminAuditService } from "../admin-audit/service.js";
import type { AdminRuntimeService } from "../admin-runtime/service.js";
import type { AdminIncidentAcknowledgement, AdminIncidentRepository } from "./repository.js";

export class AdminIncidentError extends Error {
  constructor(
    readonly code: "admin_incident_not_found",
    message: string,
  ) {
    super(message);
    this.name = "AdminIncidentError";
  }
}

export class AdminIncidentService {
  // Batch #101 capacity note: this service is a low-QPS operator control-plane
  // path for the 10,000 concurrent users baseline, not a buyer hot path.
  constructor(
    private readonly repository: AdminIncidentRepository,
    private readonly runtimeService: AdminRuntimeService,
    private readonly auditService: AdminAuditService,
  ) {}

  async listIncidents(payload: unknown, requestId: string): Promise<AdminIncidentListResponse> {
    const query = adminIncidentQuerySchema.parse(payload);
    const incidents = await this.deriveIncidents(requestId);
    const filtered = incidents.filter((incident) => matchesQuery(incident, query));
    const page = filtered.slice(query.offset, query.offset + query.limit);

    return adminIncidentListResponseSchema.parse({
      incidents: page,
      limit: query.limit,
      ok: true,
      offset: query.offset,
      requestId,
      summary: summarizeIncidents(incidents),
    });
  }

  async getIncident(incidentId: string, requestId: string): Promise<AdminIncidentDetailResponse> {
    const incident = (await this.deriveIncidents(requestId)).find((item) => item.id === incidentId);
    if (!incident) throw new AdminIncidentError("admin_incident_not_found", "Admin incident was not found.");
    return adminIncidentDetailResponseSchema.parse({
      incident,
      ok: true,
      requestId,
    });
  }

  async acknowledgeIncident(
    incidentId: string,
    payload: unknown,
    actorUserId: string,
    requestId: string,
  ): Promise<AdminIncidentAcknowledgeResponse> {
    const request = adminIncidentAcknowledgeRequestSchema.parse(payload);
    const current = (await this.deriveIncidents(requestId)).find((item) => item.id === incidentId);
    if (!current) throw new AdminIncidentError("admin_incident_not_found", "Admin incident was not found.");
    const acknowledgement = await this.repository.upsertAcknowledgement({
      acknowledgedByUserId: actorUserId,
      incidentId,
      note: request.note,
      status: request.status,
    });
    const incident = applyAcknowledgement(current, acknowledgement);
    return adminIncidentAcknowledgeResponseSchema.parse({
      incident,
      ok: true,
      requestId,
    });
  }

  private async deriveIncidents(requestId: string): Promise<AdminIncident[]> {
    const [diagnostics, auditPage] = await Promise.all([
      Promise.resolve(this.runtimeService.getDiagnostics(requestId)),
      this.auditService.listAuditEvents({ limit: "100" }, requestId),
    ]);
    const derived = [
      ...diagnosticIncidents(diagnostics.generatedAt, diagnostics.diagnostics.checks),
      ...auditIncidents(auditPage.events),
    ].sort(compareIncidents);
    const acknowledgements = await this.repository.listAcknowledgements(derived.map((incident) => incident.id));
    return derived.map((incident) => {
      const acknowledgement = acknowledgements.get(incident.id);
      return acknowledgement ? applyAcknowledgement(incident, acknowledgement) : incident;
    });
  }
}

function diagnosticIncidents(
  generatedAt: string,
  checks: ReturnType<AdminRuntimeService["getDiagnostics"]>["diagnostics"]["checks"],
): AdminIncident[] {
  return checks
    .filter((check) => check.status !== "pass")
    .map((check) => ({
      acknowledgedAt: null,
      acknowledgedByUserHash: null,
      count: 1,
      description: check.summary,
      evidence: [
        { label: "check", value: check.id },
        { label: "status", value: check.status },
        { label: "severity", value: check.severity },
      ],
      firstSeenAt: generatedAt,
      id: `runtime:${check.id}`,
      lastSeenAt: generatedAt,
      note: null,
      recommendedActions: [
        check.action,
        "Open /admin/runtime and compare diagnostics with production runtime configuration.",
      ],
      relatedAuditIds: [],
      route: "/v1/admin/runtime/diagnostics",
      severity: check.status === "fail" || check.severity === "critical" ? "critical" : "medium",
      source: check.id === "production_policy" || check.id === "capacity_baseline" ? "policy" : "runtime",
      status: "open",
      title: check.label,
    }));
}

function auditIncidents(events: AdminAuditEvent[]): AdminIncident[] {
  const groups = new Map<string, AdminAuditEvent[]>();
  for (const event of events) {
    const key = auditIncidentKey(event);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, group]) => {
    const sorted = group.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const severity = auditSeverity(last);
    const source = auditSource(last);
    return {
      acknowledgedAt: null,
      acknowledgedByUserHash: null,
      count: group.length,
      description: auditDescription(last, group.length),
      evidence: [
        { label: "outcome", value: last.outcome },
        { label: "status", value: String(last.statusCode ?? "none") },
        { label: "reason", value: last.reason ?? "none" },
        { label: "action", value: last.action },
      ],
      firstSeenAt: first.occurredAt,
      id: key,
      lastSeenAt: last.occurredAt,
      note: null,
      recommendedActions: auditActions(last),
      relatedAuditIds: sorted.slice(-25).map((event) => event.auditId),
      route: last.route,
      severity,
      source,
      status: "open",
      title: auditTitle(last, severity),
    } satisfies AdminIncident;
  });
}

function auditIncidentKey(event: AdminAuditEvent) {
  if (event.statusCode && event.statusCode >= 500) {
    return `audit:5xx:${slug(event.route ?? "unknown")}:${slug(event.action)}`;
  }
  if (event.outcome === "failure") {
    return `audit:failure:${slug(event.route ?? "unknown")}:${slug(event.reason ?? event.action)}`;
  }
  if (event.outcome === "blocked" && event.route?.startsWith("/v1/admin")) {
    return `audit:admin-blocked:${slug(event.route)}:${slug(event.reason ?? "blocked")}`;
  }
  if (event.outcome === "blocked" && event.action.includes("auth")) {
    return `security:auth-blocked:${slug(event.reason ?? event.action)}`;
  }
  return null;
}

function auditSeverity(event: AdminAuditEvent): AdminIncidentSeverity {
  if (event.statusCode && event.statusCode >= 500) return "critical";
  if (event.route?.startsWith("/v1/admin") && event.outcome === "blocked") return "high";
  if (event.outcome === "failure") return "high";
  return "medium";
}

function auditSource(event: AdminAuditEvent): AdminIncidentSource {
  if (event.action.includes("auth")) return "security";
  if (event.route?.startsWith("/v1/access")) return "access";
  return "audit";
}

function auditTitle(event: AdminAuditEvent, severity: AdminIncidentSeverity) {
  if (event.statusCode && event.statusCode >= 500) return `Backend ${event.statusCode} on ${event.route ?? "unknown route"}`;
  if (event.route?.startsWith("/v1/admin") && event.outcome === "blocked") return "Blocked admin route access";
  if (severity === "high") return `Failed backend action: ${event.action}`;
  return `Blocked backend action: ${event.action}`;
}

function auditDescription(event: AdminAuditEvent, count: number) {
  const route = event.route ?? "unknown route";
  return `${count} recent audit event(s) indicate ${event.outcome} on ${route}. Identifiers are hashed and raw sessions are not exposed.`;
}

function auditActions(event: AdminAuditEvent) {
  if (event.statusCode && event.statusCode >= 500) {
    return [
      "Inspect recent backend errors and request telemetry for the route.",
      "Check /admin/runtime diagnostics before restarting workers.",
      "If the route is customer-facing, apply backpressure before scaling workers.",
    ];
  }
  if (event.route?.startsWith("/v1/admin") && event.outcome === "blocked") {
    return [
      "Confirm whether the blocked actor should have admin role.",
      "Review auth security events for repeated attempts.",
      "Keep session ids and emails out of incident notes.",
    ];
  }
  return [
    "Open the audit trail with the route filter.",
    "Compare failures with deployment and runtime telemetry.",
  ];
}

function applyAcknowledgement(incident: AdminIncident, acknowledgement: AdminIncidentAcknowledgement): AdminIncident {
  return {
    ...incident,
    acknowledgedAt: acknowledgement.acknowledgedAt,
    acknowledgedByUserHash: auditHash(acknowledgement.acknowledgedByUserId),
    note: acknowledgement.note,
    status: acknowledgement.status,
  };
}

function matchesQuery(incident: AdminIncident, query: AdminIncidentQuery) {
  if (query.severity && incident.severity !== query.severity) return false;
  if (query.source && incident.source !== query.source) return false;
  if (query.status && incident.status !== query.status) return false;
  return true;
}

function summarizeIncidents(incidents: AdminIncident[]) {
  return {
    acknowledged: incidents.filter((incident) => incident.status === "acknowledged").length,
    critical: incidents.filter((incident) => incident.severity === "critical").length,
    high: incidents.filter((incident) => incident.severity === "high").length,
    open: incidents.filter((incident) => incident.status === "open").length,
    resolved: incidents.filter((incident) => incident.status === "resolved").length,
    total: incidents.length,
  };
}

const severityRank: Record<AdminIncidentSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function compareIncidents(left: AdminIncident, right: AdminIncident) {
  return severityRank[left.severity] - severityRank[right.severity] ||
    right.lastSeenAt.localeCompare(left.lastSeenAt) ||
    left.id.localeCompare(right.id);
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}
