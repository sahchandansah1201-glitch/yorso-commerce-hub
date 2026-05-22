import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { auditFromRequest, type AuditSink } from "../../audit.js";
import type { ApiRequestContext, JsonBodyReadOptions } from "../../http.js";
import { methodNotAllowed, readJsonBody, sendError, sendJson, sendValidationError } from "../../http.js";
import {
  resolveAuthenticatedAccountSession,
  sendAccountSessionError,
  type AccountSessionError,
} from "../auth/session.js";
import type { AuthService } from "../auth/service.js";
import { AdminIncidentError, type AdminIncidentService } from "./service.js";

const listRoute = "/v1/admin/incidents";
const exportRoute = "/v1/admin/incidents/export";
const executionQueueRoute = "/v1/admin/incidents/execution-queue";
const executionQueueExportRoute = "/v1/admin/incidents/execution-queue/export";
const executionQueueBulkRoute = "/v1/admin/incidents/execution-queue/bulk";
const executionWorkloadRoute = "/v1/admin/incidents/execution-workload";
const executionWorkloadExportRoute = "/v1/admin/incidents/execution-workload/export";
const executionWorkloadForecastRoute = "/v1/admin/incidents/execution-workload/forecast";
const trendsRoute = "/v1/admin/incidents/trends";
const trendsExportRoute = "/v1/admin/incidents/trends/export";
const trendsAnomaliesRoute = "/v1/admin/incidents/trends/anomalies";
const trendsBriefingRoute = "/v1/admin/incidents/trends/briefing";
const bulkWorkflowRoute = "/v1/admin/incidents/workflow/bulk";
const detailPrefix = "/v1/admin/incidents/";
const ackSuffix = "/acknowledge";
const executionSuffix = "/execution";
const executionExportSuffix = "/execution/export";
const handoffSuffix = "/handoff";
const postmortemSuffix = "/postmortem";
const remediationSuffix = "/remediation";
const correlationSuffix = "/correlation";
const workflowSuffix = "/workflow";

export async function handleAdminIncidentRoute(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiRequestContext,
  service: AdminIncidentService,
  authService: AuthService,
  url: URL,
  auditSink: AuditSink,
  jsonBodyOptions: JsonBodyReadOptions = {},
) {
  const match = routeMatch(url.pathname);
  if (!match) return false;

  if (match.kind === "list" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "export" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionQueue" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionQueueExport" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionQueueBulk" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }
  if (match.kind === "executionWorkload" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionWorkloadExport" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionWorkloadForecast" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "trends" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "trendsExport" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "trendsAnomalies" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "trendsBriefing" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "detail" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "correlation" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "handoff" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "remediation" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "postmortem" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "execution" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionExport" && request.method !== "GET") {
    methodNotAllowed(response, context, "GET");
    return true;
  }
  if (match.kind === "executionItem" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }
  if (match.kind === "acknowledge" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }
  if (match.kind === "workflow" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }
  if (match.kind === "bulkWorkflow" && request.method !== "POST") {
    methodNotAllowed(response, context, "POST");
    return true;
  }

  let session: Awaited<ReturnType<typeof resolveAuthenticatedAccountSession>> | undefined;
  try {
    session = await resolveAuthenticatedAccountSession(request, authService, context);
    if (!(await authService.hasRole(session.userId, "admin"))) {
      auditIncidentRoute(auditSink, context, request, match, session, "blocked", "admin_role_required", 403);
      sendError(response, 403, "admin_role_required", "Admin role is required.", context);
      return true;
    }

    if (match.kind === "list") {
      const payload = await service.listIncidents(Object.fromEntries(url.searchParams.entries()), context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "export") {
      const payload = await service.exportIncidents(Object.fromEntries(url.searchParams.entries()), context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "executionQueue") {
      const payload = await service.listIncidentExecutionQueue(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "executionQueueExport") {
      const payload = await service.exportIncidentExecutionQueue(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "detail") {
      const payload = await service.getIncident(match.incidentId, context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "executionWorkload") {
      const payload = await service.getIncidentExecutionWorkload(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "executionWorkloadExport") {
      const payload = await service.exportIncidentExecutionWorkload(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "executionWorkloadForecast") {
      const payload = await service.getIncidentExecutionWorkloadForecast(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "correlation") {
      const payload = await service.getIncidentCorrelation(
        match.incidentId,
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "trends") {
      const payload = await service.getIncidentTrends(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "trendsExport") {
      const payload = await service.exportIncidentTrends(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "trendsAnomalies") {
      const payload = await service.getIncidentTrendAnomalies(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "trendsBriefing") {
      const payload = await service.getIncidentTrendBriefing(
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "handoff") {
      const payload = await service.exportIncidentHandoff(
        match.incidentId,
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "remediation") {
      const payload = await service.getIncidentRemediationPlan(match.incidentId, context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "postmortem") {
      const payload = await service.exportIncidentPostmortem(
        match.incidentId,
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }
    if (match.kind === "execution") {
      const payload = await service.getIncidentExecution(match.incidentId, context.requestId);
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      sendJson(response, 200, payload);
      return true;
    }
    if (match.kind === "executionExport") {
      const payload = await service.exportIncidentExecution(
        match.incidentId,
        Object.fromEntries(url.searchParams.entries()),
        context.requestId,
      );
      auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="${payload.fileName}"`,
        "content-type": payload.contentType,
      });
      response.end(payload.body);
      return true;
    }

    const body = await readJsonBody(request, jsonBodyOptions);
    const payload = match.kind === "bulkWorkflow"
      ? await service.bulkUpdateIncidentWorkflow(body, session.userId, context.requestId)
      : match.kind === "executionQueueBulk"
        ? await service.bulkUpdateIncidentExecutionQueue(body, session.userId, context.requestId)
      : match.kind === "executionItem"
        ? await service.updateIncidentExecutionItem(match.incidentId, match.itemId, body, session.userId, context.requestId)
      : match.kind === "workflow"
        ? await service.updateIncidentWorkflow(match.incidentId, body, session.userId, context.requestId)
        : await service.acknowledgeIncident(match.incidentId, body, session.userId, context.requestId);
    auditIncidentRoute(auditSink, context, request, match, session, "success", null, 200);
    sendJson(response, 200, payload);
    return true;
  } catch (error) {
    if (isAccountSessionError(error)) {
      auditIncidentRoute(auditSink, context, request, match, session, "failure", error.code, 401);
      sendAccountSessionError(response, context, error);
      return true;
    }
    if (error instanceof ZodError) {
      auditIncidentRoute(auditSink, context, request, match, session, "failure", "validation_error", 400);
      sendValidationError(response, context, error);
      return true;
    }
    if (error instanceof AdminIncidentError) {
      auditIncidentRoute(auditSink, context, request, match, session, "failure", error.code, 404);
      sendError(response, 404, error.code, error.message, context);
      return true;
    }
    throw error;
  }
}

type IncidentRouteMatch =
  | { kind: "list"; route: string }
  | { kind: "export"; route: string }
  | { kind: "executionQueue"; route: string }
  | { kind: "executionQueueExport"; route: string }
  | { kind: "executionQueueBulk"; route: string }
  | { kind: "executionWorkload"; route: string }
  | { kind: "executionWorkloadExport"; route: string }
  | { kind: "executionWorkloadForecast"; route: string }
  | { kind: "trends"; route: string }
  | { kind: "trendsExport"; route: string }
  | { kind: "trendsAnomalies"; route: string }
  | { kind: "trendsBriefing"; route: string }
  | { kind: "bulkWorkflow"; route: string }
  | { incidentId: string; kind: "detail"; route: string }
  | { incidentId: string; kind: "acknowledge"; route: string }
  | { incidentId: string; kind: "correlation"; route: string }
  | { incidentId: string; kind: "handoff"; route: string }
  | { incidentId: string; kind: "postmortem"; route: string }
  | { incidentId: string; kind: "remediation"; route: string }
  | { incidentId: string; kind: "execution"; route: string }
  | { incidentId: string; kind: "executionExport"; route: string }
  | { incidentId: string; itemId: string; kind: "executionItem"; route: string }
  | { incidentId: string; kind: "workflow"; route: string };

function routeMatch(pathname: string): IncidentRouteMatch | null {
  if (pathname === listRoute) return { kind: "list", route: listRoute };
  if (pathname === exportRoute) return { kind: "export", route: exportRoute };
  if (pathname === executionQueueRoute) return { kind: "executionQueue", route: executionQueueRoute };
  if (pathname === executionQueueExportRoute) return { kind: "executionQueueExport", route: executionQueueExportRoute };
  if (pathname === executionQueueBulkRoute) return { kind: "executionQueueBulk", route: executionQueueBulkRoute };
  if (pathname === executionWorkloadForecastRoute) {
    return { kind: "executionWorkloadForecast", route: executionWorkloadForecastRoute };
  }
  if (pathname === trendsRoute) return { kind: "trends", route: trendsRoute };
  if (pathname === trendsExportRoute) return { kind: "trendsExport", route: trendsExportRoute };
  if (pathname === trendsAnomaliesRoute) return { kind: "trendsAnomalies", route: trendsAnomaliesRoute };
  if (pathname === trendsBriefingRoute) return { kind: "trendsBriefing", route: trendsBriefingRoute };
  if (pathname === executionWorkloadRoute) return { kind: "executionWorkload", route: executionWorkloadRoute };
  if (pathname === executionWorkloadExportRoute) return { kind: "executionWorkloadExport", route: executionWorkloadExportRoute };
  if (pathname === bulkWorkflowRoute) return { kind: "bulkWorkflow", route: bulkWorkflowRoute };
  if (!pathname.startsWith(detailPrefix)) return null;
  const rest = pathname.slice(detailPrefix.length);
  if (!rest) return null;
  if (rest.endsWith(ackSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -ackSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "acknowledge", route: `${detailPrefix}:incidentId${ackSuffix}` };
  }
  if (rest.endsWith(handoffSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -handoffSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "handoff", route: `${detailPrefix}:incidentId${handoffSuffix}` };
  }
  if (rest.endsWith(correlationSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -correlationSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "correlation", route: `${detailPrefix}:incidentId${correlationSuffix}` };
  }
  if (rest.endsWith(remediationSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -remediationSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "remediation", route: `${detailPrefix}:incidentId${remediationSuffix}` };
  }
  if (rest.endsWith(postmortemSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -postmortemSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "postmortem", route: `${detailPrefix}:incidentId${postmortemSuffix}` };
  }
  if (rest.endsWith(executionSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -executionSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "execution", route: `${detailPrefix}:incidentId${executionSuffix}` };
  }
  if (rest.endsWith(executionExportSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -executionExportSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "executionExport", route: `${detailPrefix}:incidentId${executionExportSuffix}` };
  }
  const executionItemMarker = `${executionSuffix}/`;
  if (rest.includes(executionItemMarker)) {
    const [incidentPart, itemPart] = rest.split(executionItemMarker);
    const incidentId = decodeURIComponent(incidentPart.replace(/\/$/, ""));
    const itemId = decodeURIComponent(itemPart ?? "");
    if (!incidentId || !itemId) return null;
    return {
      incidentId,
      itemId,
      kind: "executionItem",
      route: `${detailPrefix}:incidentId${executionSuffix}/:itemId`,
    };
  }
  if (rest.endsWith(workflowSuffix)) {
    const incidentId = decodeURIComponent(rest.slice(0, -workflowSuffix.length).replace(/\/$/, ""));
    if (!incidentId) return null;
    return { incidentId, kind: "workflow", route: `${detailPrefix}:incidentId${workflowSuffix}` };
  }
  return { incidentId: decodeURIComponent(rest), kind: "detail", route: `${detailPrefix}:incidentId` };
}

function isAccountSessionError(error: unknown): error is AccountSessionError {
  return error instanceof Error && error.name === "AccountSessionError";
}

function auditIncidentRoute(
  auditSink: AuditSink,
  context: ApiRequestContext,
  request: IncomingMessage,
  match: IncidentRouteMatch,
  session: { userId: string; sessionId: string } | undefined,
  outcome: "success" | "failure" | "blocked",
  reason: string | null,
  statusCode: number,
) {
  auditFromRequest(auditSink, context, request, {
    action: match.kind === "acknowledge"
      ? "admin.incidents.acknowledge"
      : match.kind === "executionQueue"
        ? "admin.incidents.execution_queue.read"
      : match.kind === "executionQueueExport"
        ? "admin.incidents.execution_queue.export"
      : match.kind === "executionQueueBulk"
        ? "admin.incidents.execution_queue.bulk_update"
      : match.kind === "executionWorkload"
        ? "admin.incidents.execution_workload.read"
      : match.kind === "executionWorkloadExport"
        ? "admin.incidents.execution_workload.export"
      : match.kind === "executionWorkloadForecast"
        ? "admin.incidents.execution_workload.forecast"
      : match.kind === "trends"
        ? "admin.incidents.trends.read"
      : match.kind === "trendsExport"
        ? "admin.incidents.trends.export"
      : match.kind === "trendsAnomalies"
        ? "admin.incidents.trends.anomalies"
      : match.kind === "trendsBriefing"
        ? "admin.incidents.trends.briefing"
      : match.kind === "bulkWorkflow"
        ? "admin.incidents.workflow.bulk"
      : match.kind === "workflow"
        ? "admin.incidents.workflow.update"
      : match.kind === "export"
        ? "admin.incidents.export"
      : match.kind === "execution"
        ? "admin.incidents.execution.read"
      : match.kind === "executionExport"
        ? "admin.incidents.execution.export"
      : match.kind === "executionItem"
        ? "admin.incidents.execution.update"
      : match.kind === "handoff"
        ? "admin.incidents.handoff.export"
      : match.kind === "correlation"
        ? "admin.incidents.correlation.read"
      : match.kind === "postmortem"
        ? "admin.incidents.postmortem.export"
      : match.kind === "remediation"
        ? "admin.incidents.remediation.read"
      : match.kind === "detail"
        ? "admin.incidents.detail.read"
        : "admin.incidents.list.read",
    actorUserId: session?.userId,
    outcome,
    reason,
    resourceId: "incidentId" in match ? match.incidentId : null,
    resourceType: "admin_incident",
    route: match.route,
    sessionId: session?.sessionId,
    statusCode,
  });
}
