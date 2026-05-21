import type {
  AdminIncidentStatus,
} from "../../../../../packages/contracts/dist/index.js";

export interface AdminIncidentAcknowledgement {
  acknowledgedAt: string;
  acknowledgedByUserId: string;
  incidentId: string;
  note: string | null;
  status: Extract<AdminIncidentStatus, "acknowledged" | "resolved">;
  updatedAt: string;
}

export interface AdminIncidentAcknowledgementInput {
  acknowledgedByUserId: string;
  incidentId: string;
  note?: string | null;
  status: Extract<AdminIncidentStatus, "acknowledged" | "resolved">;
}

export interface AdminIncidentRepository {
  getAcknowledgement(incidentId: string): Promise<AdminIncidentAcknowledgement | null>;
  listAcknowledgements(incidentIds: string[]): Promise<Map<string, AdminIncidentAcknowledgement>>;
  upsertAcknowledgement(input: AdminIncidentAcknowledgementInput): Promise<AdminIncidentAcknowledgement>;
}

export class MemoryAdminIncidentRepository implements AdminIncidentRepository {
  private readonly records = new Map<string, AdminIncidentAcknowledgement>();

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

  async upsertAcknowledgement(input: AdminIncidentAcknowledgementInput) {
    const now = new Date().toISOString();
    const existing = this.records.get(input.incidentId);
    const record: AdminIncidentAcknowledgement = {
      acknowledgedAt: existing?.acknowledgedAt ?? now,
      acknowledgedByUserId: input.acknowledgedByUserId,
      incidentId: input.incidentId,
      note: input.note?.trim() || null,
      status: input.status,
      updatedAt: now,
    };
    this.records.set(record.incidentId, record);
    return { ...record };
  }
}
