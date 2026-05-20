import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import type { AdminAuditEvent } from "../../../../../packages/contracts/dist/index.js";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext, JsonBodyReadOptions } from "../../http.js";
import { getRequestUrl, methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import type { MetricsRegistry } from "../../metrics.js";
import { resolveAuthenticatedAccountSession, sendAccountSessionError, type AccountSessionError } from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import { AdminAuditQueryError, type AdminAuditService } from "./service.js";

export async function handleAdminAuditRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AdminAuditService,
  authService: AuthService,
  url: URL,
  auditSink: AuditSink,
  metricsRegistry: MetricsRegistry,
  jsonBodyOptions: JsonBodyReadOptions = {},
) {
  if (
    url.pathname !== "/v1/admin/audit-events" &&
    url.pathname !== "/v1/admin/audit-events/export" &&
    url.pathname !== "/v1/admin/audit-events/retention"
  ) {
    return false;
  }

  if (url.pathname === "/v1/admin/audit-events/retention" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }

  if (url.pathname !== "/v1/admin/audit-events/retention" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditAdminRead(auditSink, context, request, url.pathname, session, "blocked", "admin_role_required", 403);
      observeAdminAudit(metricsRegistry, url.pathname, "blocked", "admin_role_required");
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    if (url.pathname === "/v1/admin/audit-events/retention") {
      const body = await readJsonBody(request, jsonBodyOptions);
      const result = await service.runRetention(body, context.requestId);
      auditAdminRead(auditSink, context, request, url.pathname, session, "success", null, 200);
      observeAdminAudit(metricsRegistry, url.pathname, "success", null, result.batchSize, result.deletedCount);
      sendJson(response, 200, result);
      return true;
    }

    if (url.pathname === "/v1/admin/audit-events/export") {
      const query = service.parseExportQuery(queryPayload(url));
      const page = await service.exportAuditEvents(query);
      auditAdminRead(auditSink, context, request, url.pathname, session, "success", null, 200);
      observeAdminAudit(metricsRegistry, url.pathname, "success", null, query.limit, page.events.length);
      if (query.format === "csv") {
        response.writeHead(200, {
          "cache-control": "no-store",
          "content-disposition": "attachment; filename=\"yorso-audit-events.csv\"",
          "content-type": "text/csv; charset=utf-8",
          "x-next-cursor": page.nextCursor ?? "",
        });
        response.end(formatAuditEventsCsv(page.events));
        return true;
      }
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": "attachment; filename=\"yorso-audit-events.jsonl\"",
        "content-type": "application/x-ndjson; charset=utf-8",
        "x-next-cursor": page.nextCursor ?? "",
      });
      response.end(page.events.map((event) => JSON.stringify(event)).join("\n") + (page.events.length ? "\n" : ""));
      return true;
    }

    const result = await service.listAuditEvents(queryPayload(url), context.requestId);
    auditAdminRead(auditSink, context, request, url.pathname, session, "success", null, 200);
    observeAdminAudit(metricsRegistry, url.pathname, "success", null, result.limit, result.events.length);
    sendJson(response, 200, result);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditAdminRead(auditSink, context, request, url.pathname, session, "failure", error.code, 401);
      observeAdminAudit(metricsRegistry, url.pathname, "failure", error.code);
      sendAccountSessionError(response, context, error);
      return true;
    }
    if (error instanceof ZodError) {
      auditAdminRead(auditSink, context, request, url.pathname, session, "failure", "validation_error", 400);
      observeAdminAudit(metricsRegistry, url.pathname, "failure", "validation_error");
      sendValidationError(response, context, error);
      return true;
    }
    if (error instanceof Error && error.message === "invalid_audit_cursor") {
      auditAdminRead(auditSink, context, request, url.pathname, session, "failure", "invalid_audit_cursor", 400);
      observeAdminAudit(metricsRegistry, url.pathname, "failure", "invalid_audit_cursor");
      sendError(response, 400, "invalid_audit_cursor", "Audit cursor is invalid.", context);
      return true;
    }
    if (error instanceof AdminAuditQueryError) {
      auditAdminRead(auditSink, context, request, url.pathname, session, "failure", error.code, 400);
      observeAdminAudit(metricsRegistry, url.pathname, "failure", error.code);
      sendError(response, 400, error.code, error.message, context);
      return true;
    }
    throw error;
  }
}

function queryPayload(url: URL) {
  return Object.fromEntries(url.searchParams.entries());
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}

function auditAdminRead(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  route: string,
  session: { userId: string; sessionId: string } | undefined,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: route.endsWith("/export")
      ? "admin.audit_events.export"
      : route.endsWith("/retention")
        ? "admin.audit_events.retention"
        : "admin.audit_events.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceType: "api_audit_events",
    route,
    sessionId: session?.sessionId,
    statusCode,
  });
}

function observeAdminAudit(
  metricsRegistry: MetricsRegistry,
  route: string,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  limit?: number,
  resultCount?: number,
) {
  metricsRegistry.observeAdminAudit({
    operation: route.endsWith("/export") ? "export" : route.endsWith("/retention") ? "retention" : "list",
    outcome,
    reason,
    limit,
    resultCount,
  });
}

const csvColumns = [
  "auditId",
  "occurredAt",
  "requestId",
  "correlationId",
  "action",
  "outcome",
  "httpMethod",
  "route",
  "statusCode",
  "actorUserHash",
  "sessionHash",
  "resourceType",
  "resourceHash",
  "reason",
] as const;

export function formatAuditEventsCsv(events: AdminAuditEvent[]) {
  const rows = [
    csvColumns.join(","),
    ...events.map((event) => csvColumns.map((column) => csvCell(event[column])).join(",")),
  ];
  return `${rows.join("\n")}\n`;
}

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, "\"\"")}"`;
}
