import {
  adminAuditExportQuerySchema,
  adminAuditListResponseSchema,
  adminAuditQuerySchema,
  type AdminAuditExportQuery,
  type AdminAuditListResponse,
  type AdminAuditQuery,
} from "../../../../../packages/contracts/dist/index.js";
import type { ApiConfig } from "../../config.js";
import type { AdminAuditRepository } from "./repository.js";

export class AdminAuditService {
  private readonly exportMaxWindowDays: number;

  constructor(
    private readonly repository: AdminAuditRepository,
    options: Pick<ApiConfig, "adminAuditExportMaxWindowDays"> | { adminAuditExportMaxWindowDays?: number } = {},
  ) {
    this.exportMaxWindowDays = options.adminAuditExportMaxWindowDays ?? 31;
  }

  async listAuditEvents(payload: unknown, requestId: string): Promise<AdminAuditListResponse> {
    const query = adminAuditQuerySchema.parse(payload);
    validateTimeRange(query, { exportMaxWindowDays: this.exportMaxWindowDays, isExport: false });
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
    validateTimeRange(query, { exportMaxWindowDays: this.exportMaxWindowDays, isExport: true });
    return await this.repository.listAuditEvents(query);
  }

  parseListQuery(payload: unknown): AdminAuditQuery {
    const query = adminAuditQuerySchema.parse(payload);
    validateTimeRange(query, { exportMaxWindowDays: this.exportMaxWindowDays, isExport: false });
    return query;
  }

  parseExportQuery(payload: unknown): AdminAuditExportQuery {
    const query = adminAuditExportQuerySchema.parse(payload);
    validateTimeRange(query, { exportMaxWindowDays: this.exportMaxWindowDays, isExport: true });
    return query;
  }
}

export class AdminAuditQueryError extends Error {
  constructor(
    readonly code: "admin_audit_invalid_time_range" | "admin_audit_export_window_too_large",
    message: string,
  ) {
    super(message);
    this.name = "AdminAuditQueryError";
  }
}

function validateTimeRange(
  query: Pick<AdminAuditQuery, "from" | "to">,
  options: { exportMaxWindowDays: number; isExport: boolean },
) {
  if (!query.from || !query.to) return;
  const fromMs = Date.parse(query.from);
  const toMs = Date.parse(query.to);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return;
  if (fromMs > toMs) {
    throw new AdminAuditQueryError("admin_audit_invalid_time_range", "Audit `from` must be before or equal to `to`.");
  }
  if (!options.isExport) return;
  const maxWindowMs = options.exportMaxWindowDays * 24 * 60 * 60 * 1000;
  if (toMs - fromMs > maxWindowMs) {
    throw new AdminAuditQueryError(
      "admin_audit_export_window_too_large",
      `Audit export window must be ${options.exportMaxWindowDays} days or less.`,
    );
  }
}
