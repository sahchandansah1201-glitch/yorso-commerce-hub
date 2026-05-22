import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
} from "@/lib/account-api";
import { buyerSession, type BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentSeverity = "critical" | "high" | "medium" | "low";
export type AdminIncidentSource = "runtime" | "audit" | "access" | "security" | "policy";
export type AdminIncidentStatus = "open" | "acknowledged" | "resolved";
export type AdminIncidentAssignmentFilter = "assigned" | "unassigned";
export type AdminIncidentEscalationLevel = "none" | "lead" | "engineering" | "executive";
export type AdminIncidentExportFormat = "json" | "csv";
export type AdminIncidentHandoffFormat = "json" | "markdown";
export type AdminIncidentPostmortemFormat = "json" | "markdown";
export type AdminIncidentSlaStatus = "ok" | "at_risk" | "breached";
export type AdminIncidentExecutionSource =
  | "remediation_step"
  | "verification_check"
  | "rollback_step"
  | "capacity_note"
  | "postmortem_action"
  | "prevention_check";
export type AdminIncidentExecutionStatus = "open" | "in_progress" | "blocked" | "done" | "skipped";
export type AdminIncidentExecutionPriority = "immediate" | "next" | "follow_up";
export type AdminIncidentTimelineEventType =
  | "created"
  | "acknowledged"
  | "assigned"
  | "commented"
  | "escalated"
  | "resolved";

export interface AdminIncidentTimelineEvent {
  actorUserHash: string | null;
  assignedToUserHash: string | null;
  escalationLevel: AdminIncidentEscalationLevel | null;
  eventId: string;
  note: string | null;
  occurredAt: string;
  status: AdminIncidentStatus | null;
  type: AdminIncidentTimelineEventType;
}

export interface AdminIncidentRunbookStep {
  description: string;
  label: string;
  ownerRole: "operator" | "engineering" | "security" | "founder";
  targetMinutes: number;
}

export interface AdminIncident {
  acknowledgedAt: string | null;
  acknowledgedByUserHash: string | null;
  assignedAt: string | null;
  assignedToUserHash: string | null;
  count: number;
  description: string;
  dueAt: string;
  escalatedAt: string | null;
  escalationLevel: AdminIncidentEscalationLevel;
  evidence: Array<{ label: string; value: string }>;
  firstSeenAt: string;
  id: string;
  lastSeenAt: string;
  note: string | null;
  recommendedActions: string[];
  relatedAuditIds: string[];
  route: string | null;
  runbook: AdminIncidentRunbookStep[];
  severity: AdminIncidentSeverity;
  slaStatus: AdminIncidentSlaStatus;
  source: AdminIncidentSource;
  status: AdminIncidentStatus;
  timelinePreview: AdminIncidentTimelineEvent[];
  title: string;
}

export interface AdminIncidentSummary {
  acknowledged: number;
  access: number;
  assigned: number;
  assignmentCoveragePct: number;
  atRisk: number;
  audit: number;
  breachRatePct: number;
  breached: number;
  critical: number;
  engineeringEscalations: number;
  escalated: number;
  executiveEscalations: number;
  high: number;
  leadEscalations: number;
  open: number;
  openCritical: number;
  oldestOpenMinutes: number;
  policy: number;
  resolved: number;
  runtime: number;
  security: number;
  total: number;
  unassigned: number;
}

export interface AdminIncidentListResponse {
  incidents: AdminIncident[];
  limit: number;
  offset: number;
  ok: true;
  requestId: string;
  summary: AdminIncidentSummary;
}

export interface AdminIncidentQuery {
  assigned?: AdminIncidentAssignmentFilter | "all";
  escalationLevel?: AdminIncidentEscalationLevel | "all";
  limit?: number;
  offset?: number;
  severity?: AdminIncidentSeverity | "all";
  slaStatus?: AdminIncidentSlaStatus | "all";
  source?: AdminIncidentSource | "all";
  status?: AdminIncidentStatus | "all";
}

export interface AdminIncidentExportQuery extends AdminIncidentQuery {
  format?: AdminIncidentExportFormat;
}

export interface AdminIncidentAcknowledgeInput {
  note?: string;
  status?: Extract<AdminIncidentStatus, "acknowledged" | "resolved">;
}

export interface AdminIncidentWorkflowInput {
  action: "assign" | "comment" | "escalate" | "resolve";
  assignedToUserId?: string;
  escalationLevel?: AdminIncidentEscalationLevel;
  note?: string;
}

export interface AdminIncidentBulkWorkflowInput extends AdminIncidentWorkflowInput {
  incidentIds: string[];
}

export interface AdminIncidentAcknowledgeResponse {
  incident: AdminIncident;
  ok: true;
  requestId: string;
  timeline: AdminIncidentTimelineEvent[];
}

export type AdminIncidentWorkflowResponse = AdminIncidentAcknowledgeResponse;

export interface AdminIncidentBulkWorkflowResponse {
  failed: Array<{ code: "admin_incident_not_found"; incidentId: string }>;
  incidents: AdminIncident[];
  ok: true;
  requestId: string;
  succeeded: number;
}

export interface AdminIncidentExportResponse {
  count: number;
  generatedAt: string;
  incidents: AdminIncident[];
  ok: true;
  requestId: string;
}

export interface AdminIncidentDetailResponse {
  incident: AdminIncident;
  ok: true;
  requestId: string;
  timeline: AdminIncidentTimelineEvent[];
}

export interface AdminIncidentHandoffSection {
  body: string[];
  title: string;
}

export interface AdminIncidentHandoffResponse {
  checklist: Array<{ detail: string; label: string; status: "ready" | "needs_attention" }>;
  generatedAt: string;
  handoffId: string;
  incident: AdminIncident;
  ok: true;
  requestId: string;
  sections: AdminIncidentHandoffSection[];
  timeline: AdminIncidentTimelineEvent[];
}

export interface AdminIncidentRemediationPlanStep {
  description: string;
  evidenceRequired: string;
  ownerRole: "operator" | "engineering" | "security" | "founder";
  priority: "immediate" | "next" | "follow_up";
  targetMinutes: number;
  title: string;
}

export interface AdminIncidentRemediationPlanResponse {
  capacityNotes: string[];
  generatedAt: string;
  incident: AdminIncident;
  ok: true;
  requestId: string;
  rollbackPlan: string[];
  steps: AdminIncidentRemediationPlanStep[];
  verificationChecks: string[];
}

export interface AdminIncidentPostmortemActionItem {
  evidenceRequired: string;
  ownerRole: "operator" | "engineering" | "security" | "founder";
  priority: "immediate" | "next" | "follow_up";
  targetHours: number;
  title: string;
}

export interface AdminIncidentPostmortemResponse {
  actionItems: AdminIncidentPostmortemActionItem[];
  capacityReview: string[];
  executiveSummary: string;
  generatedAt: string;
  impactSummary: string[];
  incident: AdminIncident;
  ok: true;
  postmortemId: string;
  preventionChecks: string[];
  requestId: string;
  rootCauseHypotheses: string[];
  timeline: AdminIncidentTimelineEvent[];
}

export interface AdminIncidentExecutionItem {
  assignedToUserHash: string | null;
  blockedReason: string | null;
  completedAt: string | null;
  description: string;
  evidenceNote: string | null;
  evidenceRequired: string;
  itemId: string;
  note: string | null;
  ownerRole: "operator" | "engineering" | "security" | "founder";
  priority: AdminIncidentExecutionPriority;
  source: AdminIncidentExecutionSource;
  status: AdminIncidentExecutionStatus;
  targetMinutes: number;
  title: string;
  updatedAt: string | null;
  updatedByUserHash: string | null;
}

export interface AdminIncidentExecutionSummary {
  blocked: number;
  done: number;
  inProgress: number;
  open: number;
  skipped: number;
  total: number;
}

export interface AdminIncidentExecutionResponse {
  generatedAt: string;
  incident: AdminIncident;
  items: AdminIncidentExecutionItem[];
  ok: true;
  requestId: string;
  summary: AdminIncidentExecutionSummary;
}

export interface AdminIncidentExecutionUpdateInput {
  assignedToUserId?: string;
  blockedReason?: string;
  evidenceNote?: string;
  note?: string;
  status: AdminIncidentExecutionStatus;
}

export interface AdminIncidentExecutionUpdateResponse extends AdminIncidentExecutionResponse {
  updatedItem: AdminIncidentExecutionItem;
}

export interface AdminIncidentsApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  session?: BuyerSession | null;
  sessionId?: string;
  userId?: string;
}

export type AdminIncidentsApiErrorCode =
  | "admin_incidents_api_disabled"
  | "admin_incidents_session_required"
  | "admin_role_required"
  | "admin_incidents_http_error"
  | "admin_incidents_invalid_response";

export class AdminIncidentsApiError extends Error {
  code: AdminIncidentsApiErrorCode;
  status: number;

  constructor(code: AdminIncidentsApiErrorCode, message: string, status = 0) {
    super(message);
    this.name = "AdminIncidentsApiError";
    this.code = code;
    this.status = status;
  }
}

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const queryString = (query: AdminIncidentExportQuery = {}) => {
  const params = new URLSearchParams();
  if (query.format) params.set("format", query.format);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  if (query.assigned && query.assigned !== "all") params.set("assigned", query.assigned);
  if (query.escalationLevel && query.escalationLevel !== "all") params.set("escalationLevel", query.escalationLevel);
  if (query.severity && query.severity !== "all") params.set("severity", query.severity);
  if (query.slaStatus && query.slaStatus !== "all") params.set("slaStatus", query.slaStatus);
  if (query.source && query.source !== "all") params.set("source", query.source);
  if (query.status && query.status !== "all") params.set("status", query.status);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export function createAdminIncidentsApiClient(options: AdminIncidentsApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAccountApiBaseUrl());
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const session = options.session ?? buyerSession.getSession();
  const userId = options.userId?.trim() || session?.userId?.trim() || "";
  const sessionId = options.sessionId?.trim() || session?.id?.trim() || "";

  const headers = (contentType = false) => {
    const next = new Headers({ accept: "application/json" });
    if (contentType) next.set("content-type", "application/json");
    if (userId) next.set(ACCOUNT_USER_ID_HEADER, userId);
    if (sessionId) next.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
    return next;
  };

  const assertSession = () => {
    if (!baseUrl) {
      throw new AdminIncidentsApiError(
        "admin_incidents_api_disabled",
        "Self-hosted API URL is not configured.",
      );
    }
    if (!userId || !sessionId) {
      throw new AdminIncidentsApiError(
        "admin_incidents_session_required",
        "Self-hosted admin session is required.",
        401,
      );
    }
  };

  return {
    enabled: Boolean(baseUrl),
    async acknowledge(incidentId: string, input: AdminIncidentAcknowledgeInput = {}) {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/acknowledge`, {
        body: JSON.stringify(input),
        headers: headers(true),
        method: "POST",
      });
      const body = await readJson(response) as AdminIncidentAcknowledgeResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertAcknowledgeShape(body);
    },
    async workflow(incidentId: string, input: AdminIncidentWorkflowInput) {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/workflow`, {
        body: JSON.stringify(input),
        headers: headers(true),
        method: "POST",
      });
      const body = await readJson(response) as AdminIncidentWorkflowResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertAcknowledgeShape(body);
    },
    async bulkWorkflow(input: AdminIncidentBulkWorkflowInput) {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents/workflow/bulk`, {
        body: JSON.stringify(input),
        headers: headers(true),
        method: "POST",
      });
      const body = await readJson(response) as AdminIncidentBulkWorkflowResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertBulkWorkflowShape(body);
    },
    async detail(incidentId: string): Promise<AdminIncidentDetailResponse> {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}`, {
        headers: headers(),
        method: "GET",
      });
      const body = await readJson(response) as AdminIncidentDetailResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertDetailShape(body);
    },
    async list(query: AdminIncidentQuery = {}): Promise<AdminIncidentListResponse> {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents${queryString(query)}`, {
        headers: headers(),
        method: "GET",
      });
      const body = await readJson(response) as AdminIncidentListResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertListShape(body);
    },
    async handoffJson(incidentId: string): Promise<AdminIncidentHandoffResponse> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/handoff?format=json`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      const body = await readJson(response) as AdminIncidentHandoffResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertHandoffShape(body);
    },
    async handoffMarkdown(incidentId: string): Promise<string> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/handoff?format=markdown`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      if (!response.ok) {
        const body = await readJson(response) as { error?: { code?: string; message?: string } };
        throw mapError(body, response.status);
      }
      return response.text();
    },
    async remediation(incidentId: string): Promise<AdminIncidentRemediationPlanResponse> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/remediation`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      const body = await readJson(response) as AdminIncidentRemediationPlanResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertRemediationShape(body);
    },
    async postmortemJson(incidentId: string): Promise<AdminIncidentPostmortemResponse> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/postmortem?format=json`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      const body = await readJson(response) as AdminIncidentPostmortemResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertPostmortemShape(body);
    },
    async postmortemMarkdown(incidentId: string): Promise<string> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/postmortem?format=markdown`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      if (!response.ok) {
        const body = await readJson(response) as { error?: { code?: string; message?: string } };
        throw mapError(body, response.status);
      }
      return response.text();
    },
    async execution(incidentId: string): Promise<AdminIncidentExecutionResponse> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/execution`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      const body = await readJson(response) as AdminIncidentExecutionResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertExecutionShape(body);
    },
    async executionExportJson(incidentId: string): Promise<AdminIncidentExecutionResponse> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/execution/export?format=json`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      const body = await readJson(response) as AdminIncidentExecutionResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertExecutionShape(body);
    },
    async executionExportCsv(incidentId: string): Promise<string> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/execution/export?format=csv`,
        {
          headers: headers(),
          method: "GET",
        },
      );
      if (!response.ok) {
        const body = await readJson(response) as { error?: { code?: string; message?: string } };
        throw mapError(body, response.status);
      }
      return response.text();
    },
    async updateExecutionItem(
      incidentId: string,
      itemId: string,
      input: AdminIncidentExecutionUpdateInput,
    ): Promise<AdminIncidentExecutionUpdateResponse> {
      assertSession();
      const response = await fetchImpl(
        `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incidentId)}/execution/${encodeURIComponent(itemId)}`,
        {
          body: JSON.stringify(input),
          headers: headers(true),
          method: "POST",
        },
      );
      const body = await readJson(response) as AdminIncidentExecutionUpdateResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertExecutionUpdateShape(body);
    },
    async exportJson(query: AdminIncidentQuery = {}): Promise<AdminIncidentExportResponse> {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents/export${queryString({ ...query, format: "json" })}`, {
        headers: headers(),
        method: "GET",
      });
      const body = await readJson(response) as AdminIncidentExportResponse & { error?: { code?: string; message?: string } };
      if (!response.ok) throw mapError(body, response.status);
      return assertExportShape(body);
    },
    async exportCsv(query: AdminIncidentQuery = {}): Promise<string> {
      assertSession();
      const response = await fetchImpl(`${baseUrl}/v1/admin/incidents/export${queryString({ ...query, format: "csv" })}`, {
        headers: headers(),
        method: "GET",
      });
      if (!response.ok) {
        const body = await readJson(response) as { error?: { code?: string; message?: string } };
        throw mapError(body, response.status);
      }
      return response.text();
    },
  };
}

export const isAdminIncidentsApiConfigured = () => createAdminIncidentsApiClient().enabled;

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function mapError(body: { error?: { code?: string; message?: string } }, status: number) {
  const code = body.error?.code;
  if (code === "admin_role_required") {
    return new AdminIncidentsApiError("admin_role_required", "Admin role is required.", status);
  }
  if (code === "account_session_required" || code === "account_session_invalid") {
    return new AdminIncidentsApiError(
      "admin_incidents_session_required",
      body.error?.message ?? "Self-hosted admin session is required.",
      status,
    );
  }
  return new AdminIncidentsApiError(
    "admin_incidents_http_error",
    body.error?.message ?? `Admin incidents request failed with ${status}.`,
    status,
  );
}

function assertListShape(response: AdminIncidentListResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.incidents) ||
    typeof response.limit !== "number" ||
    typeof response.offset !== "number" ||
    typeof response.summary?.open !== "number" ||
    typeof response.summary?.critical !== "number" ||
    typeof response.summary?.breached !== "number" ||
    typeof response.summary?.assignmentCoveragePct !== "number" ||
    typeof response.summary?.breachRatePct !== "number" ||
    typeof response.summary?.oldestOpenMinutes !== "number"
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incidents list response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}

function assertAcknowledgeShape(response: AdminIncidentAcknowledgeResponse) {
  if (response?.ok !== true || !response.incident?.id || !Array.isArray(response.timeline)) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident acknowledgement response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}

function assertDetailShape(response: AdminIncidentDetailResponse) {
  if (response?.ok !== true || !response.incident?.id || !Array.isArray(response.timeline)) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident detail response failed the self-hosted contract.",
      200,
    );
  }
  return response;
}

function assertBulkWorkflowShape(response: AdminIncidentBulkWorkflowResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.incidents) ||
    !Array.isArray(response.failed) ||
    typeof response.succeeded !== "number"
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incidents bulk workflow response was invalid.",
    );
  }
  return response;
}

function assertExportShape(response: AdminIncidentExportResponse) {
  if (
    response?.ok !== true ||
    !Array.isArray(response.incidents) ||
    typeof response.count !== "number" ||
    typeof response.generatedAt !== "string"
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incidents export response was invalid.",
      200,
    );
  }
  return response;
}

function assertHandoffShape(response: AdminIncidentHandoffResponse) {
  if (
    response?.ok !== true ||
    !response.incident?.id ||
    !Array.isArray(response.checklist) ||
    typeof response.generatedAt !== "string" ||
    !Array.isArray(response.sections) ||
    !Array.isArray(response.timeline)
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident handoff response was invalid.",
      200,
    );
  }
  return response;
}

function assertRemediationShape(response: AdminIncidentRemediationPlanResponse) {
  if (
    response?.ok !== true ||
    !response.incident?.id ||
    !Array.isArray(response.steps) ||
    !Array.isArray(response.verificationChecks) ||
    !Array.isArray(response.rollbackPlan) ||
    !Array.isArray(response.capacityNotes)
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident remediation response was invalid.",
      200,
    );
  }
  return response;
}

function assertPostmortemShape(response: AdminIncidentPostmortemResponse) {
  if (
    response?.ok !== true ||
    !response.incident?.id ||
    typeof response.executiveSummary !== "string" ||
    !Array.isArray(response.impactSummary) ||
    !Array.isArray(response.rootCauseHypotheses) ||
    !Array.isArray(response.actionItems) ||
    !Array.isArray(response.preventionChecks) ||
    !Array.isArray(response.capacityReview) ||
    !Array.isArray(response.timeline)
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident postmortem response was invalid.",
      200,
    );
  }
  return response;
}

function assertExecutionShape(response: AdminIncidentExecutionResponse) {
  if (
    response?.ok !== true ||
    !response.incident?.id ||
    !Array.isArray(response.items) ||
    typeof response.summary?.total !== "number" ||
    typeof response.summary?.open !== "number" ||
    typeof response.summary?.done !== "number"
  ) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident execution response was invalid.",
      200,
    );
  }
  return response;
}

function assertExecutionUpdateShape(response: AdminIncidentExecutionUpdateResponse) {
  assertExecutionShape(response);
  if (!response.updatedItem?.itemId) {
    throw new AdminIncidentsApiError(
      "admin_incidents_invalid_response",
      "Admin incident execution update response was invalid.",
      200,
    );
  }
  return response;
}
