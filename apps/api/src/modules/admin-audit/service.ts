import {
  adminAuditExportQuerySchema,
  adminAuditListResponseSchema,
  adminAuditQuerySchema,
  type AdminAuditExportQuery,
  type AdminAuditListResponse,
  type AdminAuditQuery,
} from "../../../../../packages/contracts/dist/index.js";
import type { AdminAuditRepository } from "./repository.js";

export class AdminAuditService {
  constructor(private readonly repository: AdminAuditRepository) {}

  async listAuditEvents(payload: unknown, requestId: string): Promise<AdminAuditListResponse> {
    const query = adminAuditQuerySchema.parse(payload);
    const page = await this.repository.listAuditEvents(query);
    return adminAuditListResponseSchema.parse({
      ok: true,
      events: page.events,
      limit: query.limit,
      nextCursor: page.nextCursor,
      requestId,
    });
  }

  async exportAuditEvents(payload: unknown) {
    const query = adminAuditExportQuerySchema.parse(payload);
    return await this.repository.listAuditEvents(query);
  }

  parseListQuery(payload: unknown): AdminAuditQuery {
    return adminAuditQuerySchema.parse(payload);
  }

  parseExportQuery(payload: unknown): AdminAuditExportQuery {
    return adminAuditExportQuerySchema.parse(payload);
  }
}
