import {
  adminIncidentAcknowledgeRequestSchema,
  adminIncidentAcknowledgeResponseSchema,
  adminIncidentBulkWorkflowRequestSchema,
  adminIncidentBulkWorkflowResponseSchema,
  adminIncidentDetailResponseSchema,
  adminIncidentExportQuerySchema,
  adminIncidentExportResponseSchema,
  adminIncidentListResponseSchema,
  adminIncidentQuerySchema,
  adminIncidentWorkflowRequestSchema,
  adminIncidentWorkflowResponseSchema,
  type AdminAuditEvent,
  type AdminIncident,
  type AdminIncidentAcknowledgeResponse,
  type AdminIncidentDetailResponse,
  type AdminIncidentEscalationLevel,
  type AdminIncidentListResponse,
  type AdminIncidentQuery,
  type AdminIncidentRunbookStep,
  type AdminIncidentSeverity,
  type AdminIncidentSlaStatus,
  type AdminIncidentSource,
  type AdminIncidentStatus,
  type AdminIncidentTimelineEvent,
  type AdminIncidentTimelineEventType,
  type AdminIncidentWorkflowRequest,
  type AdminIncidentWorkflowResponse,
} from "../../../../../packages/contracts/dist/index.js";
import { auditHash } from "../../audit.js";
import type { AdminAuditService } from "../admin-audit/service.js";
import type { AdminRuntimeService } from "../admin-runtime/service.js";
import type {
  AdminIncidentAcknowledgement,
  AdminIncidentRepository,
  AdminIncidentWorkflowEvent,
} from "./repository.js";

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
      timeline: incident.timelinePreview,
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
    await this.repository.appendEvent({
      actorUserId,
      incidentId,
      note: request.note,
      status: request.status,
      type: request.status === "resolved" ? "resolved" : "acknowledged",
    });
    const incident = await this.rehydrateIncident(current, acknowledgement);
    return adminIncidentAcknowledgeResponseSchema.parse({
      incident,
      ok: true,
      requestId,
      timeline: incident.timelinePreview,
    });
  }

  async updateIncidentWorkflow(
    incidentId: string,
    payload: unknown,
    actorUserId: string,
    requestId: string,
  ): Promise<AdminIncidentWorkflowResponse> {
    const request = adminIncidentWorkflowRequestSchema.parse(payload);
    const current = (await this.deriveIncidents(requestId)).find((item) => item.id === incidentId);
    if (!current) throw new AdminIncidentError("admin_incident_not_found", "Admin incident was not found.");

    const acknowledgement = await this.applyWorkflowRequest(current, request, actorUserId);

    const incident = acknowledgement
      ? await this.rehydrateIncident(current, acknowledgement)
      : (await this.deriveIncidents(requestId)).find((item) => item.id === incidentId);
    if (!incident) throw new AdminIncidentError("admin_incident_not_found", "Admin incident was not found.");

    return adminIncidentWorkflowResponseSchema.parse({
      incident,
      ok: true,
      requestId,
      timeline: incident.timelinePreview,
    });
  }

  async bulkUpdateIncidentWorkflow(
    payload: unknown,
    actorUserId: string,
    requestId: string,
  ) {
    const request = adminIncidentBulkWorkflowRequestSchema.parse(payload);
    const incidents = await this.deriveIncidents(requestId);
    const incidentMap = new Map(incidents.map((incident) => [incident.id, incident]));
    const uniqueIncidentIds = [...new Set(request.incidentIds)];
    const failed: Array<{ code: "admin_incident_not_found"; incidentId: string }> = [];
    const succeededIds: string[] = [];

    for (const incidentId of uniqueIncidentIds) {
      const current = incidentMap.get(incidentId);
      if (!current) {
        failed.push({ code: "admin_incident_not_found", incidentId });
        continue;
      }
      await this.applyWorkflowRequest(current, request, actorUserId);
      succeededIds.push(incidentId);
    }

    const refreshed = await this.deriveIncidents(requestId);
    const refreshedMap = new Map(refreshed.map((incident) => [incident.id, incident]));
    const updatedIncidents = succeededIds
      .map((incidentId) => refreshedMap.get(incidentId))
      .filter((incident): incident is AdminIncident => Boolean(incident));

    return adminIncidentBulkWorkflowResponseSchema.parse({
      failed,
      incidents: updatedIncidents,
      ok: true,
      requestId,
      succeeded: updatedIncidents.length,
    });
  }

  async exportIncidents(payload: unknown, requestId: string) {
    const query = adminIncidentExportQuerySchema.parse(payload);
    const incidents = (await this.deriveIncidents(requestId))
      .filter((incident) => matchesQuery(incident, query))
      .slice(query.offset, query.offset + query.limit);
    const json = adminIncidentExportResponseSchema.parse({
      count: incidents.length,
      generatedAt: new Date().toISOString(),
      incidents,
      ok: true,
      requestId,
    });
    if (query.format === "csv") {
      return {
        body: formatIncidentsCsv(incidents),
        contentType: "text/csv; charset=utf-8",
        fileName: "yorso-admin-incidents.csv",
      };
    }
    return {
      body: JSON.stringify(json),
      contentType: "application/json; charset=utf-8",
      fileName: "yorso-admin-incidents.json",
    };
  }

  private async applyWorkflowRequest(
    current: AdminIncident,
    request: AdminIncidentWorkflowRequest,
    actorUserId: string,
  ): Promise<AdminIncidentAcknowledgement | null> {
    if (request.action === "assign") {
      const acknowledgement = await this.repository.upsertWorkflowState({
        acknowledgedByUserId: actorUserId,
        assignedToUserId: request.assignedToUserId,
        incidentId: current.id,
        note: request.note,
        status: current.status === "resolved" ? "resolved" : "acknowledged",
      });
      await this.repository.appendEvent({
        actorUserId,
        assignedToUserId: request.assignedToUserId,
        incidentId: current.id,
        note: request.note,
        status: acknowledgement.status,
        type: "assigned",
      });
      return acknowledgement;
    }

    if (request.action === "escalate") {
      const acknowledgement = await this.repository.upsertWorkflowState({
        acknowledgedByUserId: actorUserId,
        escalationLevel: request.escalationLevel,
        incidentId: current.id,
        note: request.note,
        status: current.status === "resolved" ? "resolved" : "acknowledged",
      });
      await this.repository.appendEvent({
        actorUserId,
        escalationLevel: request.escalationLevel,
        incidentId: current.id,
        note: request.note,
        status: acknowledgement.status,
        type: "escalated",
      });
      return acknowledgement;
    }

    if (request.action === "resolve") {
      const acknowledgement = await this.repository.upsertWorkflowState({
        acknowledgedByUserId: actorUserId,
        incidentId: current.id,
        note: request.note,
        status: "resolved",
      });
      await this.repository.appendEvent({
        actorUserId,
        incidentId: current.id,
        note: request.note,
        status: "resolved",
        type: "resolved",
      });
      return acknowledgement;
    }

    await this.repository.appendEvent({
      actorUserId,
      incidentId: current.id,
      note: request.note,
      status: current.status,
      type: "commented",
    });
    return null;
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
    const incidentIds = derived.map((incident) => incident.id);
    const [acknowledgements, eventMap] = await Promise.all([
      this.repository.listAcknowledgements(incidentIds),
      this.repository.listEvents(incidentIds),
    ]);
    return derived.map((incident) => {
      const acknowledgement = acknowledgements.get(incident.id);
      const events = eventMap.get(incident.id) ?? [];
      return applyWorkflow(acknowledgement ? applyAcknowledgement(incident, acknowledgement) : incident, events);
    });
  }

  private async rehydrateIncident(
    current: AdminIncident,
    acknowledgement: AdminIncidentAcknowledgement,
  ): Promise<AdminIncident> {
    const events = (await this.repository.listEvents([current.id])).get(current.id) ?? [];
    return applyWorkflow(applyAcknowledgement(current, acknowledgement), events);
  }
}

function diagnosticIncidents(
  generatedAt: string,
  checks: ReturnType<AdminRuntimeService["getDiagnostics"]>["diagnostics"]["checks"],
): AdminIncident[] {
  return checks
    .filter((check) => check.status !== "pass")
    .map((check) => baseIncident({
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
    return baseIncident({
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
    });
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

function baseIncident(input: Omit<
  AdminIncident,
  | "assignedAt"
  | "assignedToUserHash"
  | "dueAt"
  | "escalatedAt"
  | "escalationLevel"
  | "runbook"
  | "slaStatus"
  | "timelinePreview"
>): AdminIncident {
  const dueAt = incidentDueAt(input.firstSeenAt, input.severity);
  return {
    ...input,
    assignedAt: null,
    assignedToUserHash: null,
    dueAt,
    escalatedAt: null,
    escalationLevel: "none",
    runbook: incidentRunbook(input.source, input.severity, input.route),
    slaStatus: incidentSlaStatus(input.status, dueAt),
    timelinePreview: [
      {
        actorUserHash: null,
        assignedToUserHash: null,
        escalationLevel: null,
        eventId: `${input.id}:created`,
        note: null,
        occurredAt: input.firstSeenAt,
        status: "open",
        type: "created",
      },
    ],
  };
}

function applyAcknowledgement(incident: AdminIncident, acknowledgement: AdminIncidentAcknowledgement): AdminIncident {
  const dueAt = incident.dueAt;
  return {
    ...incident,
    acknowledgedAt: acknowledgement.acknowledgedAt,
    acknowledgedByUserHash: auditHash(acknowledgement.acknowledgedByUserId),
    assignedAt: acknowledgement.assignedAt,
    assignedToUserHash: acknowledgement.assignedToUserId ? auditHash(acknowledgement.assignedToUserId) : null,
    escalatedAt: acknowledgement.escalatedAt,
    escalationLevel: acknowledgement.escalationLevel,
    note: acknowledgement.note,
    slaStatus: incidentSlaStatus(acknowledgement.status, dueAt),
    status: acknowledgement.status,
  };
}

function applyWorkflow(incident: AdminIncident, events: AdminIncidentWorkflowEvent[]): AdminIncident {
  const timelinePreview = [
    incident.timelinePreview[0],
    ...events.map(toTimelineEvent),
  ]
    .filter((event): event is AdminIncidentTimelineEvent => Boolean(event))
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId))
    .slice(-6);

  return {
    ...incident,
    timelinePreview,
  };
}

function toTimelineEvent(event: AdminIncidentWorkflowEvent): AdminIncidentTimelineEvent {
  return {
    actorUserHash: auditHash(event.actorUserId),
    assignedToUserHash: event.assignedToUserId ? auditHash(event.assignedToUserId) : null,
    escalationLevel: event.escalationLevel,
    eventId: event.eventId,
    note: event.note,
    occurredAt: event.occurredAt,
    status: event.status,
    type: event.type,
  };
}

function incidentDueAt(firstSeenAt: string, severity: AdminIncidentSeverity) {
  const minutes: Record<AdminIncidentSeverity, number> = {
    critical: 15,
    high: 60,
    low: 24 * 60,
    medium: 4 * 60,
  };
  return new Date(new Date(firstSeenAt).getTime() + minutes[severity] * 60_000).toISOString();
}

function incidentSlaStatus(status: AdminIncidentStatus, dueAt: string): AdminIncidentSlaStatus {
  if (status === "resolved") return "ok";
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  if (now >= due) return "breached";
  const remainingMs = due - now;
  return remainingMs <= 15 * 60_000 ? "at_risk" : "ok";
}

function incidentRunbook(
  source: AdminIncidentSource,
  severity: AdminIncidentSeverity,
  route: string | null,
): AdminIncidentRunbookStep[] {
  const firstTarget = severity === "critical" ? 5 : severity === "high" ? 15 : 30;
  const routeHint = route ? `Route: ${route}.` : "No route is attached to this incident.";
  const steps: AdminIncidentRunbookStep[] = [
    {
      description: `Confirm the signal source and operational scope. ${routeHint}`,
      label: "Confirm scope",
      ownerRole: "operator",
      targetMinutes: firstTarget,
    },
    {
      description: "Check recent request, error, audit and metrics telemetry before restarting services.",
      label: "Inspect telemetry",
      ownerRole: source === "security" ? "security" : "engineering",
      targetMinutes: severity === "critical" ? 10 : 30,
    },
    {
      description: "Write a short operator note without emails, session ids, credentials or connection strings.",
      label: "Record safe note",
      ownerRole: "operator",
      targetMinutes: severity === "critical" ? 15 : 45,
    },
  ];
  if (severity === "critical" || source === "policy") {
    steps.push({
      description: "Escalate to founder or engineering lead if customer-facing access, policy or data safety is affected.",
      label: "Escalate owner",
      ownerRole: source === "policy" ? "founder" : "engineering",
      targetMinutes: severity === "critical" ? 15 : 60,
    });
  }
  if (source === "access" || source === "security") {
    steps.push({
      description: "Verify account role, grant state and repeated blocked attempts before approving or revoking access.",
      label: "Review access state",
      ownerRole: "security",
      targetMinutes: severity === "critical" ? 10 : 30,
    });
  }
  return steps.slice(0, 6);
}

function matchesQuery(incident: AdminIncident, query: AdminIncidentQuery) {
  if (query.assigned === "assigned" && !incident.assignedToUserHash) return false;
  if (query.assigned === "unassigned" && incident.assignedToUserHash) return false;
  if (query.escalationLevel && incident.escalationLevel !== query.escalationLevel) return false;
  if (query.severity && incident.severity !== query.severity) return false;
  if (query.slaStatus && incident.slaStatus !== query.slaStatus) return false;
  if (query.source && incident.source !== query.source) return false;
  if (query.status && incident.status !== query.status) return false;
  return true;
}

function summarizeIncidents(incidents: AdminIncident[]) {
  const total = incidents.length;
  const assigned = incidents.filter((incident) => Boolean(incident.assignedToUserHash)).length;
  const breached = incidents.filter((incident) => incident.slaStatus === "breached").length;
  const openIncidents = incidents.filter((incident) => incident.status === "open");
  const now = Date.now();
  const oldestOpenMinutes = openIncidents.reduce((max, incident) => {
    const firstSeenAt = Date.parse(incident.firstSeenAt);
    if (Number.isNaN(firstSeenAt)) return max;
    return Math.max(max, Math.max(0, Math.floor((now - firstSeenAt) / 60_000)));
  }, 0);
  const percent = (count: number) => total === 0 ? 0 : Math.round((count / total) * 100);

  return {
    acknowledged: incidents.filter((incident) => incident.status === "acknowledged").length,
    access: incidents.filter((incident) => incident.source === "access").length,
    assigned,
    assignmentCoveragePct: percent(assigned),
    atRisk: incidents.filter((incident) => incident.slaStatus === "at_risk").length,
    audit: incidents.filter((incident) => incident.source === "audit").length,
    breachRatePct: percent(breached),
    breached,
    critical: incidents.filter((incident) => incident.severity === "critical").length,
    engineeringEscalations: incidents.filter((incident) => incident.escalationLevel === "engineering").length,
    escalated: incidents.filter((incident) => incident.escalationLevel !== "none").length,
    executiveEscalations: incidents.filter((incident) => incident.escalationLevel === "executive").length,
    high: incidents.filter((incident) => incident.severity === "high").length,
    leadEscalations: incidents.filter((incident) => incident.escalationLevel === "lead").length,
    open: incidents.filter((incident) => incident.status === "open").length,
    openCritical: openIncidents.filter((incident) => incident.severity === "critical").length,
    oldestOpenMinutes,
    policy: incidents.filter((incident) => incident.source === "policy").length,
    resolved: incidents.filter((incident) => incident.status === "resolved").length,
    runtime: incidents.filter((incident) => incident.source === "runtime").length,
    security: incidents.filter((incident) => incident.source === "security").length,
    total,
    unassigned: total - assigned,
  };
}

function formatIncidentsCsv(incidents: AdminIncident[]) {
  const header = [
    "id",
    "status",
    "severity",
    "source",
    "slaStatus",
    "escalationLevel",
    "assignedToUserHash",
    "count",
    "route",
    "title",
    "dueAt",
    "lastSeenAt",
  ];
  const rows = incidents.map((incident) => [
    incident.id,
    incident.status,
    incident.severity,
    incident.source,
    incident.slaStatus,
    incident.escalationLevel,
    incident.assignedToUserHash ?? "",
    String(incident.count),
    incident.route ?? "",
    incident.title,
    incident.dueAt,
    incident.lastSeenAt,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
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
