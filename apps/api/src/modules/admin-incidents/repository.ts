import type {
  AdminIncidentExecutionSource,
  AdminIncidentExecutionStatus,
  AdminIncidentEscalationLevel,
  AdminIncidentStatus,
  AdminIncidentTimelineEventType,
  AdminIncidentTrendActionDecision,
  AdminIncidentTrendActionKind,
  AdminIncidentExecutionOwnerRole,
  AdminIncidentExecutionPriority,
} from "../../../../../packages/contracts/dist/index.js";

export interface AdminIncidentAcknowledgement {
  acknowledgedAt: string;
  acknowledgedByUserId: string;
  assignedAt: string | null;
  assignedToUserId: string | null;
  escalatedAt: string | null;
  escalationLevel: AdminIncidentEscalationLevel;
  incidentId: string;
  note: string | null;
  resolvedAt: string | null;
  status: Extract<AdminIncidentStatus, "acknowledged" | "resolved">;
  updatedAt: string;
}

export interface AdminIncidentAcknowledgementInput {
  acknowledgedByUserId: string;
  incidentId: string;
  note?: string | null;
  status: Extract<AdminIncidentStatus, "acknowledged" | "resolved">;
}

export interface AdminIncidentWorkflowStateInput extends AdminIncidentAcknowledgementInput {
  assignedToUserId?: string | null;
  escalationLevel?: AdminIncidentEscalationLevel;
}

export interface AdminIncidentWorkflowEvent {
  actorUserId: string;
  assignedToUserId: string | null;
  escalationLevel: AdminIncidentEscalationLevel | null;
  eventId: string;
  incidentId: string;
  note: string | null;
  occurredAt: string;
  status: AdminIncidentStatus | null;
  type: AdminIncidentTimelineEventType;
}

export interface AdminIncidentWorkflowEventInput {
  actorUserId: string;
  assignedToUserId?: string | null;
  escalationLevel?: AdminIncidentEscalationLevel | null;
  incidentId: string;
  note?: string | null;
  status?: AdminIncidentStatus | null;
  type: AdminIncidentTimelineEventType;
}

export interface AdminIncidentExecutionRecord {
  assignedToUserId: string | null;
  blockedReason: string | null;
  completedAt: string | null;
  evidenceNote: string | null;
  incidentId: string;
  itemId: string;
  note: string | null;
  source: AdminIncidentExecutionSource;
  status: AdminIncidentExecutionStatus;
  updatedAt: string;
  updatedByUserId: string;
}

export interface AdminIncidentExecutionRecordInput {
  assignedToUserId?: string | null;
  blockedReason?: string | null;
  evidenceNote?: string | null;
  incidentId: string;
  itemId: string;
  note?: string | null;
  source: AdminIncidentExecutionSource;
  status: AdminIncidentExecutionStatus;
  updatedByUserId: string;
}

export interface AdminIncidentTrendActionDecisionRecord {
  acceptedAt: string | null;
  actionId: string;
  decidedByUserId: string;
  dismissedAt: string | null;
  kind: AdminIncidentTrendActionKind;
  loadScore: number;
  note: string | null;
  ownerRole: AdminIncidentExecutionOwnerRole;
  priority: AdminIncidentExecutionPriority;
  relatedIncidentIds: string[];
  route: string | null;
  signal: string;
  status: Extract<AdminIncidentTrendActionDecision, "accepted" | "dismissed">;
  title: string;
  updatedAt: string;
}

export interface AdminIncidentTrendActionDecisionInput {
  actionId: string;
  decidedByUserId: string;
  kind: AdminIncidentTrendActionKind;
  loadScore: number;
  note?: string | null;
  ownerRole: AdminIncidentExecutionOwnerRole;
  priority: AdminIncidentExecutionPriority;
  relatedIncidentIds: string[];
  route?: string | null;
  signal: string;
  status: Extract<AdminIncidentTrendActionDecision, "accepted" | "dismissed">;
  title: string;
}

export interface AdminIncidentRepository {
  appendEvent(input: AdminIncidentWorkflowEventInput): Promise<AdminIncidentWorkflowEvent>;
  getAcknowledgement(incidentId: string): Promise<AdminIncidentAcknowledgement | null>;
  getExecutionRecord(incidentId: string, itemId: string): Promise<AdminIncidentExecutionRecord | null>;
  listAcknowledgements(incidentIds: string[]): Promise<Map<string, AdminIncidentAcknowledgement>>;
  listExecutionRecords(incidentIds: string[]): Promise<Map<string, AdminIncidentExecutionRecord[]>>;
  listEvents(incidentIds: string[]): Promise<Map<string, AdminIncidentWorkflowEvent[]>>;
  listTrendActionDecisions(actionIds: string[]): Promise<Map<string, AdminIncidentTrendActionDecisionRecord>>;
  upsertTrendActionDecision(input: AdminIncidentTrendActionDecisionInput): Promise<AdminIncidentTrendActionDecisionRecord>;
  upsertExecutionRecord(input: AdminIncidentExecutionRecordInput): Promise<AdminIncidentExecutionRecord>;
  upsertAcknowledgement(input: AdminIncidentAcknowledgementInput): Promise<AdminIncidentAcknowledgement>;
  upsertWorkflowState(input: AdminIncidentWorkflowStateInput): Promise<AdminIncidentAcknowledgement>;
}

export class MemoryAdminIncidentRepository implements AdminIncidentRepository {
  private readonly records = new Map<string, AdminIncidentAcknowledgement>();
  private readonly events = new Map<string, AdminIncidentWorkflowEvent[]>();
  private readonly executionItems = new Map<string, AdminIncidentExecutionRecord>();
  private readonly trendActions = new Map<string, AdminIncidentTrendActionDecisionRecord>();

  async appendEvent(input: AdminIncidentWorkflowEventInput) {
    const event: AdminIncidentWorkflowEvent = {
      actorUserId: input.actorUserId,
      assignedToUserId: input.assignedToUserId ?? null,
      escalationLevel: input.escalationLevel ?? null,
      eventId: `evt_${this.events.size + 1}_${Date.now()}`,
      incidentId: input.incidentId,
      note: input.note?.trim() || null,
      occurredAt: new Date().toISOString(),
      status: input.status ?? null,
      type: input.type,
    };
    const existing = this.events.get(input.incidentId) ?? [];
    this.events.set(input.incidentId, [...existing, event]);
    return { ...event };
  }

  async getAcknowledgement(incidentId: string) {
    const record = this.records.get(incidentId);
    return record ? { ...record } : null;
  }

  async getExecutionRecord(incidentId: string, itemId: string) {
    const record = this.executionItems.get(executionKey(incidentId, itemId));
    return record ? { ...record } : null;
  }

  async listAcknowledgements(incidentIds: string[]) {
    const output = new Map<string, AdminIncidentAcknowledgement>();
    for (const id of incidentIds) {
      const record = this.records.get(id);
      if (record) output.set(id, { ...record });
    }
    return output;
  }

  async listEvents(incidentIds: string[]) {
    const output = new Map<string, AdminIncidentWorkflowEvent[]>();
    for (const id of incidentIds) {
      const events = this.events.get(id);
      if (events) output.set(id, events.map((event) => ({ ...event })));
    }
    return output;
  }

  async listExecutionRecords(incidentIds: string[]) {
    const wanted = new Set(incidentIds);
    const output = new Map<string, AdminIncidentExecutionRecord[]>();
    for (const record of this.executionItems.values()) {
      if (!wanted.has(record.incidentId)) continue;
      const current = output.get(record.incidentId) ?? [];
      current.push({ ...record });
      output.set(record.incidentId, current);
    }
    for (const records of output.values()) {
      records.sort((a, b) => a.itemId.localeCompare(b.itemId));
    }
    return output;
  }

  async listTrendActionDecisions(actionIds: string[]) {
    const output = new Map<string, AdminIncidentTrendActionDecisionRecord>();
    for (const id of actionIds) {
      const record = this.trendActions.get(id);
      if (record) output.set(id, cloneTrendDecision(record));
    }
    return output;
  }

  async upsertTrendActionDecision(input: AdminIncidentTrendActionDecisionInput) {
    const now = new Date().toISOString();
    const existing = this.trendActions.get(input.actionId);
    const record: AdminIncidentTrendActionDecisionRecord = {
      acceptedAt: input.status === "accepted" ? existing?.acceptedAt ?? now : existing?.acceptedAt ?? null,
      actionId: input.actionId,
      decidedByUserId: input.decidedByUserId,
      dismissedAt: input.status === "dismissed" ? existing?.dismissedAt ?? now : null,
      kind: input.kind,
      loadScore: input.loadScore,
      note: input.note?.trim() || existing?.note || null,
      ownerRole: input.ownerRole,
      priority: input.priority,
      relatedIncidentIds: [...input.relatedIncidentIds],
      route: input.route ?? null,
      signal: input.signal,
      status: input.status,
      title: input.title,
      updatedAt: now,
    };
    this.trendActions.set(record.actionId, record);
    return cloneTrendDecision(record);
  }

  async upsertExecutionRecord(input: AdminIncidentExecutionRecordInput) {
    const now = new Date().toISOString();
    const key = executionKey(input.incidentId, input.itemId);
    const existing = this.executionItems.get(key);
    const record: AdminIncidentExecutionRecord = {
      assignedToUserId: input.assignedToUserId ?? existing?.assignedToUserId ?? null,
      blockedReason: input.blockedReason?.trim() || existing?.blockedReason || null,
      completedAt: input.status === "done"
        ? existing?.completedAt ?? now
        : input.status === "skipped"
          ? existing?.completedAt ?? now
          : null,
      evidenceNote: input.evidenceNote?.trim() || existing?.evidenceNote || null,
      incidentId: input.incidentId,
      itemId: input.itemId,
      note: input.note?.trim() || existing?.note || null,
      source: input.source,
      status: input.status,
      updatedAt: now,
      updatedByUserId: input.updatedByUserId,
    };
    this.executionItems.set(key, record);
    return { ...record };
  }

  async upsertAcknowledgement(input: AdminIncidentAcknowledgementInput) {
    return this.upsertWorkflowState(input);
  }

  async upsertWorkflowState(input: AdminIncidentWorkflowStateInput) {
    const now = new Date().toISOString();
    const existing = this.records.get(input.incidentId);
    const record: AdminIncidentAcknowledgement = {
      acknowledgedAt: existing?.acknowledgedAt ?? now,
      acknowledgedByUserId: input.acknowledgedByUserId,
      assignedAt: input.assignedToUserId
        ? existing?.assignedToUserId === input.assignedToUserId
          ? existing.assignedAt
          : now
        : existing?.assignedAt ?? null,
      assignedToUserId: input.assignedToUserId ?? existing?.assignedToUserId ?? null,
      escalatedAt: input.escalationLevel && input.escalationLevel !== "none"
        ? existing?.escalationLevel === input.escalationLevel
          ? existing.escalatedAt
          : now
        : existing?.escalatedAt ?? null,
      escalationLevel: input.escalationLevel && input.escalationLevel !== "none"
        ? input.escalationLevel
        : existing?.escalationLevel ?? "none",
      incidentId: input.incidentId,
      note: input.note?.trim() || null,
      resolvedAt: input.status === "resolved" ? existing?.resolvedAt ?? now : existing?.resolvedAt ?? null,
      status: input.status,
      updatedAt: now,
    };
    this.records.set(record.incidentId, record);
    return { ...record };
  }
}

const executionKey = (incidentId: string, itemId: string) => `${incidentId}\u0000${itemId}`;

function cloneTrendDecision(record: AdminIncidentTrendActionDecisionRecord): AdminIncidentTrendActionDecisionRecord {
  return {
    ...record,
    relatedIncidentIds: [...record.relatedIncidentIds],
  };
}
