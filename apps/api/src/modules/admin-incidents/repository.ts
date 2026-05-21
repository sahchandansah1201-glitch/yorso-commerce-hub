import type {
  AdminIncidentEscalationLevel,
  AdminIncidentStatus,
  AdminIncidentTimelineEventType,
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

export interface AdminIncidentRepository {
  appendEvent(input: AdminIncidentWorkflowEventInput): Promise<AdminIncidentWorkflowEvent>;
  getAcknowledgement(incidentId: string): Promise<AdminIncidentAcknowledgement | null>;
  listAcknowledgements(incidentIds: string[]): Promise<Map<string, AdminIncidentAcknowledgement>>;
  listEvents(incidentIds: string[]): Promise<Map<string, AdminIncidentWorkflowEvent[]>>;
  upsertAcknowledgement(input: AdminIncidentAcknowledgementInput): Promise<AdminIncidentAcknowledgement>;
  upsertWorkflowState(input: AdminIncidentWorkflowStateInput): Promise<AdminIncidentAcknowledgement>;
}

export class MemoryAdminIncidentRepository implements AdminIncidentRepository {
  private readonly records = new Map<string, AdminIncidentAcknowledgement>();
  private readonly events = new Map<string, AdminIncidentWorkflowEvent[]>();

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
