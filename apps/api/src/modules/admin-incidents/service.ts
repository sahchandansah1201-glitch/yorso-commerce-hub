import {
  adminIncidentAcknowledgeRequestSchema,
  adminIncidentAcknowledgeResponseSchema,
  adminIncidentBulkWorkflowRequestSchema,
  adminIncidentBulkWorkflowResponseSchema,
  adminIncidentDetailResponseSchema,
  adminIncidentExportQuerySchema,
  adminIncidentExportResponseSchema,
  adminIncidentHandoffQuerySchema,
  adminIncidentHandoffResponseSchema,
  adminIncidentListResponseSchema,
  adminIncidentPostmortemQuerySchema,
  adminIncidentPostmortemResponseSchema,
  adminIncidentQuerySchema,
  adminIncidentRemediationPlanResponseSchema,
  adminIncidentWorkflowRequestSchema,
  adminIncidentWorkflowResponseSchema,
  type AdminAuditEvent,
  type AdminIncident,
  type AdminIncidentAcknowledgeResponse,
  type AdminIncidentDetailResponse,
  type AdminIncidentEscalationLevel,
  type AdminIncidentHandoffResponse,
  type AdminIncidentListResponse,
  type AdminIncidentPostmortemResponse,
  type AdminIncidentQuery,
  type AdminIncidentRemediationPlanResponse,
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

  async exportIncidentHandoff(incidentId: string, payload: unknown, requestId: string) {
    const query = adminIncidentHandoffQuerySchema.parse(payload);
    const detail = await this.getIncident(incidentId, requestId);
    const handoff = buildIncidentHandoff(detail.incident, detail.timeline, requestId);
    if (query.format === "markdown") {
      return {
        body: formatIncidentHandoffMarkdown(handoff),
        contentType: "text/markdown; charset=utf-8",
        fileName: `${safeFileSlug(detail.incident.id)}-handoff.md`,
      };
    }
    return {
      body: JSON.stringify(handoff),
      contentType: "application/json; charset=utf-8",
      fileName: `${safeFileSlug(detail.incident.id)}-handoff.json`,
    };
  }

  async getIncidentRemediationPlan(
    incidentId: string,
    requestId: string,
  ): Promise<AdminIncidentRemediationPlanResponse> {
    const detail = await this.getIncident(incidentId, requestId);
    return buildIncidentRemediationPlan(detail.incident, requestId);
  }

  async exportIncidentPostmortem(incidentId: string, payload: unknown, requestId: string) {
    const query = adminIncidentPostmortemQuerySchema.parse(payload);
    const detail = await this.getIncident(incidentId, requestId);
    const postmortem = buildIncidentPostmortem(detail.incident, detail.timeline, requestId);
    if (query.format === "markdown") {
      return {
        body: formatIncidentPostmortemMarkdown(postmortem),
        contentType: "text/markdown; charset=utf-8",
        fileName: `${safeFileSlug(detail.incident.id)}-postmortem.md`,
      };
    }
    return {
      body: JSON.stringify(postmortem),
      contentType: "application/json; charset=utf-8",
      fileName: `${safeFileSlug(detail.incident.id)}-postmortem.json`,
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

function buildIncidentHandoff(
  incident: AdminIncident,
  timeline: AdminIncidentTimelineEvent[],
  requestId: string,
): AdminIncidentHandoffResponse {
  const evidence = incident.evidence.map((item) => `${item.label}: ${item.value}`);
  const timelineLines = timeline.map((event) => {
    const parts = [
      event.type,
      event.status ? `status ${event.status}` : null,
      event.escalationLevel ? `escalation ${event.escalationLevel}` : null,
      event.assignedToUserHash ? `assignee ${event.assignedToUserHash}` : null,
      event.note ? `note ${event.note}` : null,
      event.actorUserHash ? `actor ${event.actorUserHash}` : null,
    ].filter(Boolean);
    return `${event.occurredAt}: ${parts.join(", ")}`;
  });

  return adminIncidentHandoffResponseSchema.parse({
    checklist: incidentHandoffChecklist(incident, timeline),
    generatedAt: new Date().toISOString(),
    handoffId: `handoff:${incident.id}`,
    incident,
    ok: true,
    requestId,
    sections: [
      {
        body: [
          `Status: ${incident.status}`,
          `Severity: ${incident.severity}`,
          `SLA: ${incident.slaStatus}`,
          `Source: ${incident.source}`,
          `Route: ${incident.route ?? "none"}`,
        ],
        title: "Incident snapshot",
      },
      {
        body: incident.recommendedActions,
        title: "Recommended next actions",
      },
      {
        body: incident.runbook.map((step) => `${step.label}: ${step.description} Owner ${step.ownerRole}, target ${step.targetMinutes} min.`),
        title: "Runbook",
      },
      {
        body: evidence.length > 0 ? evidence : ["No evidence items attached."],
        title: "Evidence",
      },
      {
        body: timelineLines.length > 0 ? timelineLines : ["No timeline events recorded yet."],
        title: "Sanitized timeline",
      },
    ],
    timeline,
  });
}

function buildIncidentRemediationPlan(
  incident: AdminIncident,
  requestId: string,
): AdminIncidentRemediationPlanResponse {
  const sourceSteps = remediationStepsForIncident(incident);
  return adminIncidentRemediationPlanResponseSchema.parse({
    capacityNotes: remediationCapacityNotes(incident),
    generatedAt: new Date().toISOString(),
    incident,
    ok: true,
    requestId,
    rollbackPlan: remediationRollbackPlan(incident),
    steps: sourceSteps,
    verificationChecks: remediationVerificationChecks(incident),
  });
}

function buildIncidentPostmortem(
  incident: AdminIncident,
  timeline: AdminIncidentTimelineEvent[],
  requestId: string,
): AdminIncidentPostmortemResponse {
  return adminIncidentPostmortemResponseSchema.parse({
    actionItems: incidentPostmortemActionItems(incident),
    capacityReview: incidentPostmortemCapacityReview(incident),
    executiveSummary: incidentPostmortemExecutiveSummary(incident),
    generatedAt: new Date().toISOString(),
    impactSummary: incidentPostmortemImpactSummary(incident),
    incident,
    ok: true,
    postmortemId: `postmortem:${incident.id}`,
    preventionChecks: incidentPostmortemPreventionChecks(incident),
    requestId,
    rootCauseHypotheses: incidentPostmortemRootCauseHypotheses(incident),
    timeline,
  });
}

function incidentHandoffChecklist(
  incident: AdminIncident,
  timeline: AdminIncidentTimelineEvent[],
) {
  return [
    {
      detail: incident.assignedToUserHash
        ? `Assigned to ${incident.assignedToUserHash}.`
        : "No assigned operator hash is present.",
      label: "Owner assigned",
      status: incident.assignedToUserHash ? "ready" : "needs_attention",
    },
    {
      detail: incident.escalationLevel === "none"
        ? "No escalation is recorded."
        : `Escalated to ${incident.escalationLevel}.`,
      label: "Escalation reviewed",
      status: incident.severity === "critical" && incident.escalationLevel === "none" ? "needs_attention" : "ready",
    },
    {
      detail: `${incident.evidence.length} bounded evidence item(s) available.`,
      label: "Evidence bounded",
      status: incident.evidence.length > 0 ? "ready" : "needs_attention",
    },
    {
      detail: `${timeline.length} sanitized timeline event(s) available.`,
      label: "Timeline sanitized",
      status: timeline.every((event) => !event.note?.includes("@")) ? "ready" : "needs_attention",
    },
  ] as const;
}

function remediationStepsForIncident(incident: AdminIncident) {
  const base = incident.runbook.slice(0, 4).map((step, index) => ({
    description: step.description,
    evidenceRequired: index === 0
      ? "Attach the admin page, route or metric snapshot used to confirm impact."
      : "Record the check result in the incident timeline before handoff.",
    ownerRole: step.ownerRole,
    priority: index === 0 ? "immediate" : "next",
    targetMinutes: step.targetMinutes,
    title: step.label,
  }));

  const sourceSpecific = incident.source === "security"
    ? [
      {
        description: "Review recent auth security events for repeated blocked attempts from the same hash group.",
        evidenceRequired: "Record the event count, status class and whether rate limiting was triggered.",
        ownerRole: "security" as const,
        priority: "immediate" as const,
        targetMinutes: 15,
        title: "Confirm security blast radius",
      },
    ]
    : incident.source === "runtime"
      ? [
        {
          description: "Compare readiness, request error counters and worker health before scaling or restarting.",
          evidenceRequired: "Capture /v1/admin/runtime/diagnostics and /metrics before action.",
          ownerRole: "engineering" as const,
          priority: "immediate" as const,
          targetMinutes: 20,
          title: "Validate runtime health",
        },
      ]
      : [
        {
          description: "Open the audit route and confirm whether the blocked or failed action is expected.",
          evidenceRequired: "Capture route, status class, outcome and reason from the audit page.",
          ownerRole: "operator" as const,
          priority: "immediate" as const,
          targetMinutes: 15,
          title: "Validate audit evidence",
        },
      ];

  const followUp = [
    {
      description: "Write a final timeline note with resolution result, remaining risk and next owner.",
      evidenceRequired: "Timeline contains a closing note without emails, session ids or secrets.",
      ownerRole: "operator" as const,
      priority: "follow_up" as const,
      targetMinutes: 60,
      title: "Close the operator loop",
    },
  ];

  return [...sourceSpecific, ...base, ...followUp].slice(0, 8);
}

function remediationVerificationChecks(incident: AdminIncident) {
  const checks = [
    "Confirm the incident status changed only after the operator note was recorded.",
    "Confirm browser-visible payloads contain hashed actor identifiers only.",
    "Confirm no email, session id, auth token or raw user id appears in handoff output.",
  ];
  if (incident.route) checks.push(`Recheck ${incident.route} with the same status or role scenario.`);
  if (incident.slaStatus === "breached") checks.push("Record an explicit breach reason and escalation owner.");
  return checks.slice(0, 8);
}

function remediationRollbackPlan(incident: AdminIncident) {
  const rollback = [
    "Do not delete audit or incident timeline evidence during remediation.",
    "If a mitigation causes customer-facing errors, revert the last runtime/configuration change before retrying.",
  ];
  if (incident.source === "access") {
    rollback.push("If access grants were changed incorrectly, revoke the grant and verify catalog masking before re-approval.");
  }
  if (incident.source === "runtime" || incident.severity === "critical") {
    rollback.push("If worker restart increases errors, drain traffic and restore the previous worker pool size.");
  }
  rollback.push("After rollback, create a new timeline comment with observed impact and next owner.");
  return rollback.slice(0, 6);
}

function remediationCapacityNotes(incident: AdminIncident) {
  const notes = [
    "The admin incident detail path is a low-QPS operator control-plane surface, not a buyer hot path.",
    "Do not add polling to the incident detail page; operators refresh explicitly during active response.",
    "Keep handoff and remediation payloads bounded so incident response remains stable at the 10,000 concurrent-user baseline.",
  ];
  if (incident.source === "runtime") {
    notes.push("Runtime remediation must prefer backpressure and readiness checks before increasing worker concurrency.");
  }
  if (incident.source === "audit" || incident.source === "security") {
    notes.push("Audit/security investigations must use indexed filters and bounded exports instead of full-table scans.");
  }
  return notes.slice(0, 6);
}

function incidentPostmortemExecutiveSummary(incident: AdminIncident) {
  const route = incident.route ? ` on ${incident.route}` : "";
  return `${incident.title}${route} was derived from ${incident.source} signals with ${incident.severity} severity, ${incident.slaStatus} SLA status and ${incident.count} related event(s). This draft is intentionally bounded for operator review: it includes hashed identifiers only, no emails, no raw session ids and no customer secrets.`;
}

function incidentPostmortemImpactSummary(incident: AdminIncident) {
  const impact = [
    `Incident source: ${incident.source}.`,
    `Observed event count: ${incident.count}.`,
    `Current status: ${incident.status}.`,
    `SLA status: ${incident.slaStatus}.`,
  ];
  if (incident.route) impact.push(`Affected route: ${incident.route}.`);
  if (incident.assignedToUserHash) impact.push(`Current owner hash: ${incident.assignedToUserHash}.`);
  return impact.slice(0, 8);
}

function incidentPostmortemRootCauseHypotheses(incident: AdminIncident) {
  const generic = [
    "The incident may be caused by a role, policy or runtime state that changed faster than the operator workflow reflected.",
    "The current evidence is sufficient for triage, but root cause must remain a hypothesis until validated against audit and runtime telemetry.",
  ];
  if (incident.source === "runtime") {
    return [
      "Runtime dependency degradation, worker pressure or readiness drift may have caused the incident.",
      "Request guardrails may have correctly rejected unsafe traffic, but the operator must verify customer-facing impact.",
      ...generic,
    ].slice(0, 6);
  }
  if (incident.source === "security") {
    return [
      "Repeated auth failures or blocked actor patterns may indicate account abuse, credential stuffing or misconfigured client retries.",
      "Rate limiting may be operating correctly, but repeated attempts require security review before expanding access.",
      ...generic,
    ].slice(0, 6);
  }
  if (incident.source === "access") {
    return [
      "Access grant state, request decision state or notification acknowledgement may be inconsistent for the affected actor.",
      "Catalog unlock logic may be correctly denying access, but operator approval state must be verified before manual override.",
      ...generic,
    ].slice(0, 6);
  }
  return [
    "The incident may be a legitimate blocked admin action, stale session, role mismatch or invalid request shape.",
    "Audit evidence should be compared with runtime metrics before classifying it as product defect or expected enforcement.",
    ...generic,
  ].slice(0, 6);
}

function incidentPostmortemActionItems(incident: AdminIncident) {
  const fromRunbook = incident.runbook.slice(0, 4).map((step, index) => ({
    evidenceRequired: `Attach evidence that "${step.label}" was completed without exposing raw identifiers.`,
    ownerRole: step.ownerRole,
    priority: index === 0 ? "immediate" as const : "next" as const,
    targetHours: Math.max(1, Math.ceil(step.targetMinutes / 60)),
    title: step.label,
  }));
  const followUp = [
    {
      evidenceRequired: "Timeline contains final operator note, owner hash and remaining risk.",
      ownerRole: "operator" as const,
      priority: "follow_up" as const,
      targetHours: 24,
      title: "Close incident narrative",
    },
    {
      evidenceRequired: "Guard, smoke or metric added for the incident class.",
      ownerRole: "engineering" as const,
      priority: incident.severity === "critical" ? "immediate" as const : "next" as const,
      targetHours: incident.severity === "critical" ? 4 : 48,
      title: "Add regression guard",
    },
    {
      evidenceRequired: "Capacity note confirms the change remains safe for 10,000 concurrent users.",
      ownerRole: "engineering" as const,
      priority: "follow_up" as const,
      targetHours: 72,
      title: "Update capacity review",
    },
  ];
  return [...fromRunbook, ...followUp].slice(0, 10);
}

function incidentPostmortemPreventionChecks(incident: AdminIncident) {
  const checks = [
    "Verify this incident class has a smoke marker or contract test before closing the postmortem.",
    "Verify exported postmortem and handoff payloads contain hashed identifiers only.",
    "Verify the remediation did not add polling or unbounded queries to operator surfaces.",
  ];
  if (incident.route) checks.push(`Verify ${incident.route} remains covered by auth, role and validation guards.`);
  if (incident.slaStatus === "breached") checks.push("Add a prevention item for SLA breach detection and escalation ownership.");
  if (incident.source === "runtime") checks.push("Confirm readiness and metrics alarms would detect recurrence before customer impact.");
  return checks.slice(0, 8);
}

function incidentPostmortemCapacityReview(incident: AdminIncident) {
  const review = [
    "Admin incident postmortem generation is an explicit operator action, not a polling loop.",
    "Payloads are derived from bounded incident, timeline and audit summaries, so they do not scan customer hot-path tables.",
    "Exports are intentionally small and suitable for control-plane use under the 10,000 concurrent-user baseline.",
  ];
  if (incident.source === "audit" || incident.source === "security") {
    review.push("Audit-driven postmortems must use indexed route, status and type filters before future expansion.");
  }
  if (incident.source === "runtime") {
    review.push("Runtime postmortems must include readiness, request guardrail and metrics evidence before worker changes.");
  }
  return review.slice(0, 8);
}

function formatIncidentHandoffMarkdown(handoff: AdminIncidentHandoffResponse) {
  const lines = [
    `# Incident handoff: ${handoff.incident.title}`,
    "",
    `Generated: ${handoff.generatedAt}`,
    `Incident ID: ${handoff.incident.id}`,
    `Request ID: ${handoff.requestId}`,
    "",
    "## Handoff checklist",
    "",
    ...handoff.checklist.map((item) => `- ${item.label}: ${item.status}. ${item.detail}`),
    "",
    ...handoff.sections.flatMap((section) => [
      `## ${section.title}`,
      "",
      ...section.body.map((line) => `- ${line}`),
      "",
    ]),
  ];
  return `${lines.join("\n").trim()}\n`;
}

function formatIncidentPostmortemMarkdown(postmortem: AdminIncidentPostmortemResponse) {
  const lines = [
    `# Incident postmortem draft: ${postmortem.incident.title}`,
    "",
    `Generated: ${postmortem.generatedAt}`,
    `Incident ID: ${postmortem.incident.id}`,
    `Request ID: ${postmortem.requestId}`,
    "",
    "## Executive summary",
    "",
    postmortem.executiveSummary,
    "",
    "## Impact summary",
    "",
    ...postmortem.impactSummary.map((item) => `- ${item}`),
    "",
    "## Root-cause hypotheses",
    "",
    ...postmortem.rootCauseHypotheses.map((item) => `- ${item}`),
    "",
    "## Action items",
    "",
    ...postmortem.actionItems.map((item) =>
      `- ${item.title}: ${item.ownerRole}, ${item.priority}, ${item.targetHours}h. Evidence: ${item.evidenceRequired}`,
    ),
    "",
    "## Prevention checks",
    "",
    ...postmortem.preventionChecks.map((item) => `- ${item}`),
    "",
    "## Capacity review",
    "",
    ...postmortem.capacityReview.map((item) => `- ${item}`),
  ];
  return `${lines.join("\n").trim()}\n`;
}

function safeFileSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "incident";
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
