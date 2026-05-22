import {
  adminIncidentAcknowledgeRequestSchema,
  adminIncidentAcknowledgeResponseSchema,
  adminIncidentBulkWorkflowRequestSchema,
  adminIncidentBulkWorkflowResponseSchema,
  adminIncidentDetailResponseSchema,
  adminIncidentExportQuerySchema,
  adminIncidentExportResponseSchema,
  adminIncidentExecutionExportQuerySchema,
  adminIncidentExecutionQueueBulkUpdateRequestSchema,
  adminIncidentExecutionQueueBulkUpdateResponseSchema,
  adminIncidentExecutionQueueExportQuerySchema,
  adminIncidentExecutionQueueResponseSchema,
  adminIncidentExecutionResponseSchema,
  adminIncidentExecutionUpdateRequestSchema,
  adminIncidentExecutionUpdateResponseSchema,
  adminIncidentCorrelationQuerySchema,
  adminIncidentCorrelationResponseSchema,
  adminIncidentHandoffQuerySchema,
  adminIncidentHandoffResponseSchema,
  adminIncidentListResponseSchema,
  adminIncidentPostmortemQuerySchema,
  adminIncidentPostmortemResponseSchema,
  adminIncidentQuerySchema,
  adminIncidentRemediationPlanResponseSchema,
  adminIncidentWorkloadExportQuerySchema,
  adminIncidentWorkloadForecastQuerySchema,
  adminIncidentWorkloadForecastResponseSchema,
  adminIncidentWorkloadResponseSchema,
  adminIncidentWorkflowRequestSchema,
  adminIncidentWorkflowResponseSchema,
  type AdminAuditEvent,
  type AdminIncident,
  type AdminIncidentAcknowledgeResponse,
  type AdminIncidentDetailResponse,
  type AdminIncidentEscalationLevel,
  type AdminIncidentExecutionItem,
  type AdminIncidentExecutionQueueItem,
  type AdminIncidentExecutionResponse,
  type AdminIncidentExecutionSource,
  type AdminIncidentExecutionStatus,
  type AdminIncidentExecutionQueueQuery,
  type AdminIncidentExecutionUpdateResponse,
  type AdminIncidentCorrelationResponse,
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
  type AdminIncidentWorkloadCapacityRisk,
  type AdminIncidentWorkloadForecastOwner,
  type AdminIncidentWorkloadForecastResponse,
  type AdminIncidentWorkloadOwner,
  type AdminIncidentWorkloadQuery,
  type AdminIncidentWorkloadResponse,
  type AdminIncidentWorkflowRequest,
  type AdminIncidentWorkflowResponse,
} from "../../../../../packages/contracts/dist/index.js";
import { auditHash } from "../../audit.js";
import type { AdminAuditService } from "../admin-audit/service.js";
import type { AdminRuntimeService } from "../admin-runtime/service.js";
import type {
  AdminIncidentAcknowledgement,
  AdminIncidentExecutionRecord,
  AdminIncidentRepository,
  AdminIncidentWorkflowEvent,
} from "./repository.js";

export class AdminIncidentError extends Error {
  constructor(
    readonly code: "admin_incident_not_found" | "admin_incident_execution_item_not_found",
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

  async getIncidentExecution(
    incidentId: string,
    requestId: string,
  ): Promise<AdminIncidentExecutionResponse> {
    const detail = await this.getIncident(incidentId, requestId);
    const records = (await this.repository.listExecutionRecords([incidentId])).get(incidentId) ?? [];
    return buildIncidentExecution(detail.incident, detail.timeline, records, requestId);
  }

  async exportIncidentExecution(incidentId: string, payload: unknown, requestId: string) {
    const query = adminIncidentExecutionExportQuerySchema.parse(payload);
    const execution = await this.getIncidentExecution(incidentId, requestId);
    if (query.format === "csv") {
      return {
        body: formatIncidentExecutionCsv(execution.items),
        contentType: "text/csv; charset=utf-8",
        fileName: `${safeFileSlug(incidentId)}-execution.csv`,
      };
    }
    return {
      body: JSON.stringify(execution),
      contentType: "application/json; charset=utf-8",
      fileName: `${safeFileSlug(incidentId)}-execution.json`,
    };
  }

  async listIncidentExecutionQueue(
    payload: unknown,
    requestId: string,
  ) {
    const query = adminIncidentExecutionQueueExportQuerySchema.parse(payload);
    const items = await this.deriveExecutionQueueItems(requestId);
    const filtered = items.filter((item) => matchesExecutionQueueQuery(item, query));
    const page = filtered.slice(query.offset, query.offset + query.limit);

    return adminIncidentExecutionQueueResponseSchema.parse({
      generatedAt: new Date().toISOString(),
      items: page,
      limit: query.limit,
      ok: true,
      offset: query.offset,
      requestId,
      summary: summarizeExecutionQueueItems(filtered),
    });
  }

  async exportIncidentExecutionQueue(payload: unknown, requestId: string) {
    const query = adminIncidentExecutionQueueExportQuerySchema.parse(payload);
    const response = await this.listIncidentExecutionQueue(payload, requestId);
    if (query.format === "csv") {
      return {
        body: formatIncidentExecutionQueueCsv(response.items),
        contentType: "text/csv; charset=utf-8",
        fileName: "yorso-admin-incident-execution-queue.csv",
      };
    }
    return {
      body: JSON.stringify(response),
      contentType: "application/json; charset=utf-8",
      fileName: "yorso-admin-incident-execution-queue.json",
    };
  }

  async getIncidentExecutionWorkload(
    payload: unknown,
    requestId: string,
  ): Promise<AdminIncidentWorkloadResponse> {
    const query = adminIncidentWorkloadExportQuerySchema.parse(payload);
    const items = await this.deriveExecutionQueueItems(requestId);
    const filtered = items.filter((item) => matchesWorkloadQuery(item, query));
    const hotIncidents = buildWorkloadHotIncidents(filtered).slice(query.offset, query.offset + query.limit);

    return adminIncidentWorkloadResponseSchema.parse({
      generatedAt: new Date().toISOString(),
      hotIncidents,
      limit: query.limit,
      offset: query.offset,
      ok: true,
      owners: buildWorkloadOwners(filtered),
      requestId,
      sourceMix: buildWorkloadMix(filtered, "incidentSource"),
      statusMix: buildWorkloadMix(filtered, "status"),
      summary: summarizeWorkloadItems(filtered),
    });
  }

  async exportIncidentExecutionWorkload(payload: unknown, requestId: string) {
    const query = adminIncidentWorkloadExportQuerySchema.parse(payload);
    const response = await this.getIncidentExecutionWorkload(payload, requestId);
    if (query.format === "csv") {
      return {
        body: formatIncidentExecutionWorkloadCsv(response),
        contentType: "text/csv; charset=utf-8",
        fileName: "yorso-admin-incident-execution-workload.csv",
      };
    }
    return {
      body: JSON.stringify(response),
      contentType: "application/json; charset=utf-8",
      fileName: "yorso-admin-incident-execution-workload.json",
    };
  }

  async getIncidentExecutionWorkloadForecast(
    payload: unknown,
    requestId: string,
  ): Promise<AdminIncidentWorkloadForecastResponse> {
    const query = adminIncidentWorkloadForecastQuerySchema.parse(payload);
    const items = await this.deriveExecutionQueueItems(requestId);
    const filtered = items.filter((item) => matchesWorkloadQuery(item, query));
    const owners = buildWorkloadOwners(filtered);
    const forecastOwners = buildWorkloadForecastOwners(owners, query.horizonHours);
    const highestRisk = forecastOwners
      .slice()
      .sort((a, b) => capacityRiskWeight(b.capacityRisk) - capacityRiskWeight(a.capacityRisk)
        || b.projectedOverdue - a.projectedOverdue
        || b.projectedOpen - a.projectedOpen)[0] ?? null;

    return adminIncidentWorkloadForecastResponseSchema.parse({
      assumptions: workloadForecastAssumptions(query.horizonHours),
      generatedAt: new Date().toISOString(),
      horizonHours: query.horizonHours,
      ok: true,
      owners: forecastOwners,
      requestId,
      summary: {
        capacityRisk: highestRisk?.capacityRisk ?? "low",
        highestRiskOwnerRole: highestRisk?.ownerRole ?? null,
        projectedOpen: forecastOwners.reduce((total, owner) => total + owner.projectedOpen, 0),
        projectedOverdue: forecastOwners.reduce((total, owner) => total + owner.projectedOverdue, 0),
        recommendedAction: workloadForecastSummaryAction(highestRisk),
      },
    });
  }

  async getIncidentCorrelation(
    incidentId: string,
    payload: unknown,
    requestId: string,
  ): Promise<AdminIncidentCorrelationResponse> {
    const query = adminIncidentCorrelationQuerySchema.parse(payload);
    const detail = await this.getIncident(incidentId, requestId);
    const execution = await this.getIncidentExecution(incidentId, requestId);
    const auditPage = await this.auditService.listAuditEvents({ limit: "100" }, requestId);
    const auditEvents = auditPage.events
      .filter((event) => matchesIncidentAuditSignal(detail.incident, event))
      .slice(0, query.limit);

    const signals = [
      ...auditEvents.map((event) => auditCorrelationSignal(event)),
      ...detail.timeline.slice(-query.limit).map((event) => timelineCorrelationSignal(event)),
      ...execution.items
        .filter((item) => item.status !== "done" && item.status !== "skipped")
        .slice(0, query.limit)
        .map((item) => executionCorrelationSignal(item)),
    ]
      .sort(compareCorrelationSignals)
      .slice(0, query.limit);

    return adminIncidentCorrelationResponseSchema.parse({
      auditEvents,
      executionItems: execution.items,
      generatedAt: new Date().toISOString(),
      incident: detail.incident,
      ok: true,
      recommendedNextSteps: incidentCorrelationNextSteps(detail.incident, execution.items, auditEvents),
      requestId,
      signals,
      summary: {
        auditEvents: auditEvents.length,
        blockedItems: execution.items.filter((item) => item.status === "blocked").length,
        doneItems: execution.items.filter((item) => item.status === "done").length,
        openItems: execution.items.filter((item) => item.status === "open" || item.status === "in_progress").length,
        timelineEvents: detail.timeline.length,
      },
      timeline: detail.timeline,
    });
  }

  async bulkUpdateIncidentExecutionQueue(
    payload: unknown,
    actorUserId: string,
    requestId: string,
  ) {
    const request = adminIncidentExecutionQueueBulkUpdateRequestSchema.parse(payload);
    const incidents = await this.deriveIncidents(requestId);
    const incidentMap = new Map(incidents.map((incident) => [incident.id, incident]));
    const requested = dedupeExecutionRefs(request.items);
    const failed: Array<{
      code: "admin_incident_not_found" | "admin_incident_execution_item_not_found";
      incidentId: string;
      itemId: string;
    }> = [];

    for (const ref of requested) {
      const incident = incidentMap.get(ref.incidentId);
      if (!incident) {
        failed.push({ code: "admin_incident_not_found", incidentId: ref.incidentId, itemId: ref.itemId });
        continue;
      }
      const records = (await this.repository.listExecutionRecords([ref.incidentId])).get(ref.incidentId) ?? [];
      const execution = buildIncidentExecution(incident, incident.timelinePreview, records, requestId);
      const item = execution.items.find((candidate) => candidate.itemId === ref.itemId);
      if (!item) {
        failed.push({
          code: "admin_incident_execution_item_not_found",
          incidentId: ref.incidentId,
          itemId: ref.itemId,
        });
        continue;
      }
      await this.repository.upsertExecutionRecord({
        assignedToUserId: request.assignedToUserId,
        blockedReason: request.blockedReason,
        evidenceNote: request.evidenceNote,
        incidentId: ref.incidentId,
        itemId: ref.itemId,
        note: request.note,
        source: item.source,
        status: request.status,
        updatedByUserId: actorUserId,
      });
      await this.repository.appendEvent({
        actorUserId,
        incidentId: ref.incidentId,
        note: executionTimelineNote(item, request.status, request.note, request.evidenceNote, request.blockedReason),
        status: incident.status,
        type: "commented",
      });
    }

    const refreshed = await this.deriveExecutionQueueItems(requestId);
    const updatedItems = requested
      .map((ref) => refreshed.find((item) => item.incidentId === ref.incidentId && item.itemId === ref.itemId))
      .filter((item): item is AdminIncidentExecutionQueueItem => Boolean(item));

    return adminIncidentExecutionQueueBulkUpdateResponseSchema.parse({
      failed,
      ok: true as const,
      requestId,
      succeeded: Math.max(0, requested.length - failed.length),
      updatedItems,
    });
  }

  async updateIncidentExecutionItem(
    incidentId: string,
    itemId: string,
    payload: unknown,
    actorUserId: string,
    requestId: string,
  ): Promise<AdminIncidentExecutionUpdateResponse> {
    const request = adminIncidentExecutionUpdateRequestSchema.parse(payload);
    const detail = await this.getIncident(incidentId, requestId);
    const currentRecords = (await this.repository.listExecutionRecords([incidentId])).get(incidentId) ?? [];
    const currentExecution = buildIncidentExecution(detail.incident, detail.timeline, currentRecords, requestId);
    const currentItem = currentExecution.items.find((item) => item.itemId === itemId);
    if (!currentItem) {
      throw new AdminIncidentError(
        "admin_incident_execution_item_not_found",
        "Admin incident execution item was not found.",
      );
    }

    const record = await this.repository.upsertExecutionRecord({
      assignedToUserId: request.assignedToUserId,
      blockedReason: request.blockedReason,
      evidenceNote: request.evidenceNote,
      incidentId,
      itemId,
      note: request.note,
      source: currentItem.source,
      status: request.status,
      updatedByUserId: actorUserId,
    });
    await this.repository.appendEvent({
      actorUserId,
      incidentId,
      note: executionTimelineNote(currentItem, request.status, request.note, request.evidenceNote, request.blockedReason),
      status: detail.incident.status,
      type: "commented",
    });
    const refreshedRecords = upsertExecutionRecord(currentRecords, record);
    const refreshed = buildIncidentExecution(detail.incident, detail.timeline, refreshedRecords, requestId);
    const updatedItem = refreshed.items.find((item) => item.itemId === itemId);
    if (!updatedItem) {
      throw new AdminIncidentError(
        "admin_incident_execution_item_not_found",
        "Admin incident execution item was not found after update.",
      );
    }
    return adminIncidentExecutionUpdateResponseSchema.parse({
      ...refreshed,
      updatedItem,
    });
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

  private async deriveExecutionQueueItems(requestId: string): Promise<AdminIncidentExecutionQueueItem[]> {
    const incidents = await this.deriveIncidents(requestId);
    const incidentIds = incidents.map((incident) => incident.id);
    const records = await this.repository.listExecutionRecords(incidentIds);
    return incidents
      .flatMap((incident) => {
        const execution = buildIncidentExecution(
          incident,
          incident.timelinePreview,
          records.get(incident.id) ?? [],
          requestId,
        );
        return execution.items.map((item) => toExecutionQueueItem(incident, item));
      })
      .sort(compareExecutionQueueItems);
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

function buildIncidentExecution(
  incident: AdminIncident,
  timeline: AdminIncidentTimelineEvent[],
  records: AdminIncidentExecutionRecord[],
  requestId: string,
): AdminIncidentExecutionResponse {
  const recordMap = new Map(records.map((record) => [record.itemId, record]));
  const items = executionBaseItems(incident, timeline).map((item) => mergeExecutionRecord(item, recordMap.get(item.itemId)));
  return adminIncidentExecutionResponseSchema.parse({
    generatedAt: new Date().toISOString(),
    incident,
    items,
    ok: true,
    requestId,
    summary: summarizeExecutionItems(items),
  });
}

function toExecutionQueueItem(
  incident: AdminIncident,
  item: AdminIncidentExecutionItem,
): AdminIncidentExecutionQueueItem {
  const targetDueAt = executionTargetDueAt(incident, item);
  const terminal = item.status === "done" || item.status === "skipped";
  return {
    ...item,
    incidentDueAt: incident.dueAt,
    incidentId: incident.id,
    incidentSeverity: incident.severity,
    incidentSlaStatus: incident.slaStatus,
    incidentSource: incident.source,
    incidentStatus: incident.status,
    incidentTitle: incident.title,
    overdue: !terminal && Date.now() > Date.parse(targetDueAt),
    targetDueAt,
  };
}

function executionTargetDueAt(incident: AdminIncident, item: AdminIncidentExecutionItem) {
  const firstSeen = Date.parse(incident.firstSeenAt);
  const base = Number.isNaN(firstSeen) ? Date.parse(incident.dueAt) : firstSeen;
  return new Date(base + item.targetMinutes * 60_000).toISOString();
}

function matchesExecutionQueueQuery(
  item: AdminIncidentExecutionQueueItem,
  query: AdminIncidentExecutionQueueQuery,
) {
  if (query.assigned === "assigned" && !item.assignedToUserHash) return false;
  if (query.assigned === "unassigned" && item.assignedToUserHash) return false;
  if (query.incidentSeverity && item.incidentSeverity !== query.incidentSeverity) return false;
  if (query.incidentSlaStatus && item.incidentSlaStatus !== query.incidentSlaStatus) return false;
  if (query.incidentStatus && item.incidentStatus !== query.incidentStatus) return false;
  if (query.overdueOnly && !item.overdue) return false;
  if (query.ownerRole && item.ownerRole !== query.ownerRole) return false;
  if (query.priority && item.priority !== query.priority) return false;
  if (query.source && item.source !== query.source) return false;
  if (query.status && item.status !== query.status) return false;
  return true;
}

function summarizeExecutionQueueItems(items: AdminIncidentExecutionQueueItem[]) {
  return {
    ...summarizeExecutionItems(items),
    assigned: items.filter((item) => Boolean(item.assignedToUserHash)).length,
    overdue: items.filter((item) => item.overdue).length,
    unassigned: items.filter((item) => !item.assignedToUserHash).length,
  };
}

function compareExecutionQueueItems(left: AdminIncidentExecutionQueueItem, right: AdminIncidentExecutionQueueItem) {
  return Number(right.overdue) - Number(left.overdue) ||
    executionPriorityRank[left.priority] - executionPriorityRank[right.priority] ||
    severityRank[left.incidentSeverity] - severityRank[right.incidentSeverity] ||
    left.targetDueAt.localeCompare(right.targetDueAt) ||
    left.incidentId.localeCompare(right.incidentId) ||
    left.itemId.localeCompare(right.itemId);
}

function matchesWorkloadQuery(
  item: AdminIncidentExecutionQueueItem,
  query: AdminIncidentWorkloadQuery,
) {
  if (!query.includeResolved && item.incidentStatus === "resolved") return false;
  if (query.overdueOnly && !item.overdue) return false;
  if (query.ownerRole && item.ownerRole !== query.ownerRole) return false;
  if (query.priority && item.priority !== query.priority) return false;
  if (query.source && item.incidentSource !== query.source) return false;
  if (query.status && item.status !== query.status) return false;
  return true;
}

function buildWorkloadOwners(items: AdminIncidentExecutionQueueItem[]) {
  return (["operator", "engineering", "security", "founder"] as const).map((ownerRole) => {
    const ownerItems = items.filter((item) => item.ownerRole === ownerRole);
    return {
      assigned: ownerItems.filter((item) => Boolean(item.assignedToUserHash)).length,
      blocked: ownerItems.filter((item) => item.status === "blocked").length,
      breachedIncidents: new Set(ownerItems.filter((item) => item.incidentSlaStatus === "breached").map((item) => item.incidentId)).size,
      done: ownerItems.filter((item) => item.status === "done").length,
      immediate: ownerItems.filter((item) => item.priority === "immediate").length,
      inProgress: ownerItems.filter((item) => item.status === "in_progress").length,
      loadScore: workloadScore(ownerItems),
      oldestTargetMinutes: oldestTargetMinutes(ownerItems),
      open: ownerItems.filter((item) => item.status === "open").length,
      overdue: ownerItems.filter((item) => item.overdue).length,
      ownerRole,
      skipped: ownerItems.filter((item) => item.status === "skipped").length,
      total: ownerItems.length,
      unassigned: ownerItems.filter((item) => !item.assignedToUserHash).length,
    };
  });
}

function buildWorkloadHotIncidents(items: AdminIncidentExecutionQueueItem[]) {
  const grouped = new Map<string, AdminIncidentExecutionQueueItem[]>();
  for (const item of items) {
    const current = grouped.get(item.incidentId) ?? [];
    current.push(item);
    grouped.set(item.incidentId, current);
  }

  return [...grouped.values()]
    .map((group) => {
      const first = group[0];
      const ownerCounts = (["operator", "engineering", "security", "founder"] as const)
        .map((ownerRole) => ({
          ownerRole,
          total: group.filter((item) => item.ownerRole === ownerRole).length,
        }))
        .sort((left, right) => right.total - left.total || left.ownerRole.localeCompare(right.ownerRole));
      const dueDates = group
        .filter((item) => item.status !== "done" && item.status !== "skipped")
        .map((item) => item.targetDueAt)
        .sort();
      return {
        blockedItems: group.filter((item) => item.status === "blocked").length,
        dueAt: first.incidentDueAt,
        immediateItems: group.filter((item) => item.priority === "immediate").length,
        incidentId: first.incidentId,
        loadScore: workloadScore(group),
        nextTargetDueAt: dueDates[0] ?? null,
        openItems: group.filter((item) => item.status === "open" || item.status === "in_progress").length,
        overdueItems: group.filter((item) => item.overdue).length,
        severity: first.incidentSeverity,
        slaStatus: first.incidentSlaStatus,
        source: first.incidentSource,
        status: first.incidentStatus,
        title: first.incidentTitle,
        topOwnerRole: ownerCounts[0]?.total ? ownerCounts[0].ownerRole : null,
        unassignedItems: group.filter((item) => !item.assignedToUserHash).length,
      };
    })
    .sort((left, right) =>
      right.loadScore - left.loadScore ||
      severityRank[left.severity] - severityRank[right.severity] ||
      (left.nextTargetDueAt ?? left.dueAt).localeCompare(right.nextTargetDueAt ?? right.dueAt) ||
      left.incidentId.localeCompare(right.incidentId),
    );
}

function buildWorkloadMix(
  items: AdminIncidentExecutionQueueItem[],
  key: "incidentSource" | "status",
) {
  const grouped = new Map<string, AdminIncidentExecutionQueueItem[]>();
  for (const item of items) {
    const groupKey = String(item[key]);
    const current = grouped.get(groupKey) ?? [];
    current.push(item);
    grouped.set(groupKey, current);
  }
  return [...grouped.entries()]
    .map(([groupKey, groupItems]) => ({
      blocked: groupItems.filter((item) => item.status === "blocked").length,
      done: groupItems.filter((item) => item.status === "done").length,
      inProgress: groupItems.filter((item) => item.status === "in_progress").length,
      key: groupKey,
      open: groupItems.filter((item) => item.status === "open").length,
      overdue: groupItems.filter((item) => item.overdue).length,
      total: groupItems.length,
    }))
    .sort((left, right) => right.total - left.total || left.key.localeCompare(right.key));
}

function summarizeWorkloadItems(items: AdminIncidentExecutionQueueItem[]) {
  return {
    assigned: items.filter((item) => Boolean(item.assignedToUserHash)).length,
    blocked: items.filter((item) => item.status === "blocked").length,
    done: items.filter((item) => item.status === "done").length,
    hotIncidentCount: new Set(items.map((item) => item.incidentId)).size,
    inProgress: items.filter((item) => item.status === "in_progress").length,
    loadScore: workloadScore(items),
    open: items.filter((item) => item.status === "open").length,
    overdue: items.filter((item) => item.overdue).length,
    total: items.length,
    unassigned: items.filter((item) => !item.assignedToUserHash).length,
  };
}

function buildWorkloadForecastOwners(
  owners: AdminIncidentWorkloadOwner[],
  horizonHours: number,
): AdminIncidentWorkloadForecastOwner[] {
  const horizonMultiplier = Math.max(1, Math.ceil(horizonHours / 24));
  return owners.map((owner) => {
    const projectedOpen = owner.open + owner.inProgress + Math.ceil(owner.immediate * horizonMultiplier * 0.5);
    const projectedOverdue = owner.overdue + owner.breachedIncidents + Math.ceil(owner.blocked * 0.5);
    const risk = capacityRiskFor(owner.loadScore, projectedOpen, projectedOverdue);
    return {
      capacityRisk: risk,
      currentOpen: owner.open + owner.inProgress,
      currentOverdue: owner.overdue,
      currentScore: owner.loadScore,
      ownerRole: owner.ownerRole,
      projectedOpen,
      projectedOverdue,
      recommendedAction: workloadForecastOwnerAction(owner.ownerRole, risk, projectedOverdue),
    };
  });
}

function capacityRiskFor(
  score: number,
  projectedOpen: number,
  projectedOverdue: number,
): AdminIncidentWorkloadCapacityRisk {
  if (score >= 140 || projectedOverdue >= 5 || projectedOpen >= 12) return "critical";
  if (score >= 80 || projectedOverdue >= 3 || projectedOpen >= 8) return "high";
  if (score >= 35 || projectedOverdue >= 1 || projectedOpen >= 4) return "moderate";
  return "low";
}

function capacityRiskWeight(risk: AdminIncidentWorkloadCapacityRisk) {
  return risk === "critical" ? 4 : risk === "high" ? 3 : risk === "moderate" ? 2 : 1;
}

function workloadForecastOwnerAction(
  ownerRole: AdminIncidentWorkloadOwner["ownerRole"],
  risk: AdminIncidentWorkloadCapacityRisk,
  projectedOverdue: number,
) {
  if (risk === "critical") {
    return `Move a second ${ownerRole} to the queue and resolve ${projectedOverdue} overdue item(s) before new intake.`;
  }
  if (risk === "high") {
    return `Protect ${ownerRole} focus time and clear overdue or blocked items before widening scope.`;
  }
  if (risk === "moderate") {
    return `Keep ${ownerRole} queue under review and assign unowned immediate work.`;
  }
  return `No extra ${ownerRole} capacity action is required within the forecast window.`;
}

function workloadForecastSummaryAction(owner: AdminIncidentWorkloadForecastOwner | null) {
  if (!owner) return "No incident execution capacity action is required.";
  if (owner.capacityRisk === "critical") {
    return `Critical capacity risk: rebalance ${owner.ownerRole} workload before accepting more incident work.`;
  }
  if (owner.capacityRisk === "high") {
    return `High capacity risk: clear ${owner.ownerRole} overdue work before starting new remediation items.`;
  }
  if (owner.capacityRisk === "moderate") {
    return `Moderate capacity risk: monitor ${owner.ownerRole} workload and assign unowned work.`;
  }
  return "Current execution workload is within the bounded admin capacity envelope.";
}

function workloadForecastAssumptions(horizonHours: number) {
  return [
    `Forecast window: ${horizonHours} hour(s).`,
    "Projection uses current bounded execution items only; it does not scan unbounded logs.",
    "Overdue, blocked, immediate and breached-SLA work increase capacity risk.",
    "Resolved and skipped execution items are excluded from pressure scoring.",
  ];
}

function workloadScore(items: AdminIncidentExecutionQueueItem[]) {
  return items.reduce((score, item) => {
    if (item.status === "done" || item.status === "skipped") return score;
    return score +
      (item.overdue ? 8 : 0) +
      (item.priority === "immediate" ? 5 : item.priority === "next" ? 2 : 1) +
      (item.status === "blocked" ? 4 : item.status === "in_progress" ? 2 : 1) +
      (item.incidentSlaStatus === "breached" ? 6 : item.incidentSlaStatus === "at_risk" ? 3 : 0) +
      (item.assignedToUserHash ? 0 : 2);
  }, 0);
}

function oldestTargetMinutes(items: AdminIncidentExecutionQueueItem[]) {
  const now = Date.now();
  return items.reduce((oldest, item) => {
    if (item.status === "done" || item.status === "skipped") return oldest;
    const target = Date.parse(item.targetDueAt);
    if (Number.isNaN(target)) return oldest;
    return Math.max(oldest, Math.max(0, Math.floor((now - target) / 60_000)));
  }, 0);
}

function dedupeExecutionRefs(items: Array<{ incidentId: string; itemId: string }>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.incidentId}\n${item.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function executionBaseItems(
  incident: AdminIncident,
  timeline: AdminIncidentTimelineEvent[],
): AdminIncidentExecutionItem[] {
  const remediation = buildIncidentRemediationPlan(incident, "00000000-0000-4000-8000-000000000104");
  const postmortem = buildIncidentPostmortem(incident, timeline, "00000000-0000-4000-8000-000000000104");
  const remediationItems = remediation.steps.map((step, index) => ({
    assignedToUserHash: null,
    blockedReason: null,
    completedAt: null,
    description: step.description,
    evidenceNote: null,
    evidenceRequired: step.evidenceRequired,
    itemId: executionItemId("remediation", index, step.title),
    note: null,
    ownerRole: step.ownerRole,
    priority: step.priority,
    source: "remediation_step" as const,
    status: "open" as const,
    targetMinutes: step.targetMinutes,
    title: step.title,
    updatedAt: null,
    updatedByUserHash: null,
  }));
  const verificationItems = remediation.verificationChecks.slice(0, 6).map((check, index) => ({
    assignedToUserHash: null,
    blockedReason: null,
    completedAt: null,
    description: check,
    evidenceNote: null,
    evidenceRequired: "Record the verification result before resolving the incident.",
    itemId: executionItemId("verify", index, check),
    note: null,
    ownerRole: "operator" as const,
    priority: "next" as const,
    source: "verification_check" as const,
    status: "open" as const,
    targetMinutes: 20,
    title: check.slice(0, 120),
    updatedAt: null,
    updatedByUserHash: null,
  }));
  const rollbackItems = remediation.rollbackPlan.slice(0, 4).map((step, index) => ({
    assignedToUserHash: null,
    blockedReason: null,
    completedAt: null,
    description: step,
    evidenceNote: null,
    evidenceRequired: "If rollback is needed, record the triggering metric and final state.",
    itemId: executionItemId("rollback", index, step),
    note: null,
    ownerRole: "engineering" as const,
    priority: "follow_up" as const,
    source: "rollback_step" as const,
    status: "open" as const,
    targetMinutes: 45,
    title: step.slice(0, 120),
    updatedAt: null,
    updatedByUserHash: null,
  }));
  const postmortemItems = postmortem.actionItems.map((item, index) => ({
    assignedToUserHash: null,
    blockedReason: null,
    completedAt: null,
    description: item.evidenceRequired,
    evidenceNote: null,
    evidenceRequired: item.evidenceRequired,
    itemId: executionItemId("postmortem", index, item.title),
    note: null,
    ownerRole: item.ownerRole,
    priority: item.priority,
    source: "postmortem_action" as const,
    status: "open" as const,
    targetMinutes: item.targetHours * 60,
    title: item.title,
    updatedAt: null,
    updatedByUserHash: null,
  }));
  const preventionItems = postmortem.preventionChecks.slice(0, 4).map((check, index) => ({
    assignedToUserHash: null,
    blockedReason: null,
    completedAt: null,
    description: check,
    evidenceNote: null,
    evidenceRequired: "Link the guard, metric, smoke or documented operational check.",
    itemId: executionItemId("prevent", index, check),
    note: null,
    ownerRole: "engineering" as const,
    priority: "follow_up" as const,
    source: "prevention_check" as const,
    status: "open" as const,
    targetMinutes: 120,
    title: check.slice(0, 120),
    updatedAt: null,
    updatedByUserHash: null,
  }));
  return [
    ...remediationItems,
    ...verificationItems,
    ...rollbackItems,
    ...postmortemItems,
    ...preventionItems,
  ].slice(0, 32);
}

function mergeExecutionRecord(
  item: AdminIncidentExecutionItem,
  record: AdminIncidentExecutionRecord | undefined,
): AdminIncidentExecutionItem {
  if (!record) return item;
  return {
    ...item,
    assignedToUserHash: record.assignedToUserId ? auditHash(record.assignedToUserId) : null,
    blockedReason: record.blockedReason,
    completedAt: record.completedAt,
    evidenceNote: record.evidenceNote,
    note: record.note,
    status: record.status,
    updatedAt: record.updatedAt,
    updatedByUserHash: auditHash(record.updatedByUserId),
  };
}

function summarizeExecutionItems(items: AdminIncidentExecutionItem[]) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.status === "open") summary.open += 1;
      if (item.status === "in_progress") summary.inProgress += 1;
      if (item.status === "blocked") summary.blocked += 1;
      if (item.status === "done") summary.done += 1;
      if (item.status === "skipped") summary.skipped += 1;
      return summary;
    },
    { blocked: 0, done: 0, inProgress: 0, open: 0, skipped: 0, total: 0 },
  );
}

function upsertExecutionRecord(
  records: AdminIncidentExecutionRecord[],
  next: AdminIncidentExecutionRecord,
) {
  const output = records.filter((record) => record.itemId !== next.itemId);
  output.push(next);
  return output;
}

function executionTimelineNote(
  item: AdminIncidentExecutionItem,
  status: AdminIncidentExecutionStatus,
  note?: string,
  evidenceNote?: string,
  blockedReason?: string,
) {
  const details = [
    `Execution ${status}: ${item.title}`,
    note ? `note ${note}` : null,
    evidenceNote ? `evidence ${evidenceNote}` : null,
    blockedReason ? `blocked ${blockedReason}` : null,
  ].filter(Boolean);
  return details.join(". ").slice(0, 500);
}

function executionItemId(prefix: string, index: number, title: string) {
  return `${prefix}:${String(index + 1).padStart(2, "0")}:${safeFileSlug(title).slice(0, 72)}`;
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

function matchesIncidentAuditSignal(incident: AdminIncident, event: AdminAuditEvent) {
  if (incident.relatedAuditIds.includes(event.auditId)) return true;
  if (incident.route && event.route === incident.route) return true;
  if (event.resourceType === "admin_incident" && event.resourceHash) return true;
  if (incident.source === "security" && event.action.includes("auth")) return true;
  if (incident.source === "access" && event.route?.startsWith("/v1/access")) return true;
  return false;
}

function auditCorrelationSignal(event: AdminAuditEvent) {
  return {
    actorUserHash: event.actorUserHash,
    evidence: [
      { label: "action", value: event.action },
      { label: "outcome", value: event.outcome },
      { label: "status", value: String(event.statusCode ?? "none") },
    ],
    label: `Audit ${event.outcome}: ${event.action}`,
    occurredAt: event.occurredAt,
    priority: event.statusCode && event.statusCode >= 500 ? "immediate" as const : "next" as const,
    route: event.route,
    source: "audit_event" as const,
    status: event.reason ?? event.outcome,
  };
}

function timelineCorrelationSignal(event: AdminIncidentTimelineEvent) {
  return {
    actorUserHash: event.actorUserHash,
    evidence: [
      { label: "type", value: event.type },
      { label: "status", value: event.status ?? "none" },
      { label: "escalation", value: event.escalationLevel ?? "none" },
    ],
    label: `Timeline ${event.type}`,
    occurredAt: event.occurredAt,
    priority: event.type === "escalated" ? "immediate" as const : "next" as const,
    route: null,
    source: "timeline_event" as const,
    status: event.status,
  };
}

function executionCorrelationSignal(item: AdminIncidentExecutionItem) {
  return {
    actorUserHash: item.updatedByUserHash,
    evidence: [
      { label: "owner", value: item.ownerRole },
      { label: "source", value: item.source },
      { label: "required", value: item.evidenceRequired },
    ],
    label: `Execution ${item.status}: ${item.title}`,
    occurredAt: item.updatedAt,
    priority: item.priority,
    route: null,
    source: "execution_item" as const,
    status: item.status,
  };
}

type CorrelationSignalDraft =
  | ReturnType<typeof auditCorrelationSignal>
  | ReturnType<typeof timelineCorrelationSignal>
  | ReturnType<typeof executionCorrelationSignal>;

function compareCorrelationSignals(left: CorrelationSignalDraft, right: CorrelationSignalDraft) {
  const leftTime = left.occurredAt ?? "";
  const rightTime = right.occurredAt ?? "";
  return rightTime.localeCompare(leftTime) ||
    (left.priority ? executionPriorityRank[left.priority] : 9) - (right.priority ? executionPriorityRank[right.priority] : 9) ||
    left.label.localeCompare(right.label);
}

function incidentCorrelationNextSteps(
  incident: AdminIncident,
  executionItems: AdminIncidentExecutionItem[],
  auditEvents: AdminAuditEvent[],
) {
  const steps = [
    "Compare the latest audit event with the current execution blocker before changing runtime state.",
    "Record a sanitized operator note before resolving or escalating this incident.",
  ];
  if (executionItems.some((item) => item.status === "blocked")) {
    steps.push("Resolve or reassign blocked execution items before closing the incident.");
  }
  if (auditEvents.some((event) => event.statusCode && event.statusCode >= 500)) {
    steps.push("Check readiness and metrics before restarting or scaling workers.");
  }
  if (!incident.assignedToUserHash) {
    steps.push("Assign an owner hash so the incident is not stranded during handoff.");
  }
  if (incident.slaStatus === "breached") {
    steps.push("Add an explicit SLA breach note and escalation owner.");
  }
  return steps.slice(0, 8);
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

function formatIncidentExecutionWorkloadCsv(response: AdminIncidentWorkloadResponse) {
  const header = [
    "incidentId",
    "loadScore",
    "severity",
    "source",
    "status",
    "slaStatus",
    "topOwnerRole",
    "openItems",
    "blockedItems",
    "overdueItems",
    "unassignedItems",
    "nextTargetDueAt",
    "title",
  ];
  const rows = response.hotIncidents.map((incident) => [
    incident.incidentId,
    String(incident.loadScore),
    incident.severity,
    incident.source,
    incident.status,
    incident.slaStatus,
    incident.topOwnerRole ?? "",
    String(incident.openItems),
    String(incident.blockedItems),
    String(incident.overdueItems),
    String(incident.unassignedItems),
    incident.nextTargetDueAt ?? "",
    incident.title,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function formatIncidentExecutionCsv(items: AdminIncidentExecutionItem[]) {
  const header = [
    "itemId",
    "status",
    "source",
    "priority",
    "ownerRole",
    "targetMinutes",
    "updatedByUserHash",
    "completedAt",
    "title",
    "evidenceRequired",
    "evidenceNote",
    "blockedReason",
  ];
  const rows = items.map((item) => [
    item.itemId,
    item.status,
    item.source,
    item.priority,
    item.ownerRole,
    String(item.targetMinutes),
    item.updatedByUserHash ?? "",
    item.completedAt ?? "",
    item.title,
    item.evidenceRequired,
    item.evidenceNote ?? "",
    item.blockedReason ?? "",
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function formatIncidentExecutionQueueCsv(items: AdminIncidentExecutionQueueItem[]) {
  const header = [
    "incidentId",
    "itemId",
    "status",
    "priority",
    "source",
    "ownerRole",
    "overdue",
    "targetDueAt",
    "incidentSeverity",
    "incidentSlaStatus",
    "assignedToUserHash",
    "updatedByUserHash",
    "title",
    "incidentTitle",
  ];
  const rows = items.map((item) => [
    item.incidentId,
    item.itemId,
    item.status,
    item.priority,
    item.source,
    item.ownerRole,
    item.overdue ? "true" : "false",
    item.targetDueAt,
    item.incidentSeverity,
    item.incidentSlaStatus,
    item.assignedToUserHash ?? "",
    item.updatedByUserHash ?? "",
    item.title,
    item.incidentTitle,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

const executionPriorityRank: Record<AdminIncidentExecutionQueueItem["priority"], number> = {
  immediate: 0,
  next: 1,
  follow_up: 2,
};

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
