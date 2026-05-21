import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  type AdminIncident,
  type AdminIncidentAcknowledgeInput,
  type AdminIncidentBulkWorkflowInput,
  type AdminIncidentListResponse,
  type AdminIncidentQuery,
  type AdminIncidentSummary,
  type AdminIncidentWorkflowInput,
} from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentsState =
  | { data: null; error: null; status: "disabled" }
  | { data: null; error: AdminIncidentsApiError | null; status: "session_required" }
  | { data: null; error: AdminIncidentsApiError; status: "forbidden" }
  | { data: AdminIncidentListResponse | null; error: null; status: "loading" }
  | { data: AdminIncidentListResponse; error: null; status: "ready" }
  | { data: AdminIncidentListResponse | null; error: Error; status: "error" };

const disabledState: AdminIncidentsState = { data: null, error: null, status: "disabled" };
const sessionRequiredState: AdminIncidentsState = { data: null, error: null, status: "session_required" };

export function useAdminIncidents(session: BuyerSession | null, query: AdminIncidentQuery) {
  const client = useMemo(() => createAdminIncidentsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [state, setState] = useState<AdminIncidentsState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { data: null, error: null, status: "loading" };
  });

  const queryKey = JSON.stringify({
    assigned: query.assigned ?? "all",
    escalationLevel: query.escalationLevel ?? "all",
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
    severity: query.severity ?? "all",
    slaStatus: query.slaStatus ?? "all",
    source: query.source ?? "all",
    status: query.status ?? "open",
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const acknowledge = useCallback(async (incidentId: string, input: AdminIncidentAcknowledgeInput = {}) => {
    setMutatingId(incidentId);
    try {
      const result = await client.acknowledge(incidentId, input);
      setState((current) => {
        if (!current.data) return current;
        return replaceIncidentState(current.data, result.incident);
      });
      return result;
    } finally {
      setMutatingId(null);
    }
  }, [client]);

  const workflow = useCallback(async (incidentId: string, input: AdminIncidentWorkflowInput) => {
    setMutatingId(incidentId);
    try {
      const result = await client.workflow(incidentId, input);
      setState((current) => {
        if (!current.data) return current;
        return replaceIncidentState(current.data, result.incident);
      });
      return result;
    } finally {
      setMutatingId(null);
    }
  }, [client]);

  const bulkWorkflow = useCallback(async (input: AdminIncidentBulkWorkflowInput) => {
    setMutatingId("bulk");
    try {
      const result = await client.bulkWorkflow(input);
      setState((current) => {
        if (!current.data) return current;
        return replaceIncidentStates(current.data, result.incidents);
      });
      return result;
    } finally {
      setMutatingId(null);
    }
  }, [client]);

  const exportJson = useCallback(async () => client.exportJson(query), [client, query]);
  const exportCsv = useCallback(async () => client.exportCsv(query), [client, query]);

  useEffect(() => {
    let cancelled = false;
    if (!client.enabled) {
      setState(disabledState);
      return () => {
        cancelled = true;
      };
    }
    if (!session?.id || !session.userId) {
      setState(sessionRequiredState);
      return () => {
        cancelled = true;
      };
    }

    setState((current) => ({
      data: current.status === "ready" || current.status === "loading" ? current.data : null,
      error: null,
      status: "loading",
    }));

    void client.list(query)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, status: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AdminIncidentsApiError) {
          if (error.code === "admin_role_required") {
            setState({ data: null, error, status: "forbidden" });
            return;
          }
          if (error.code === "admin_incidents_session_required") {
            setState({ data: null, error, status: "session_required" });
            return;
          }
        }
        setState((current) => ({
          data: current.status === "ready" || current.status === "loading" ? current.data : null,
          error: error instanceof Error ? error : new Error(String(error)),
          status: "error",
        }));
      });

    return () => {
      cancelled = true;
    };
    // queryKey intentionally stabilizes query object identity for effect deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, queryKey, refreshToken, session?.id, session?.userId]);

  return {
    ...state,
    acknowledge,
    bulkWorkflow,
    exportCsv,
    exportJson,
    mutatingId,
    refresh,
    workflow,
  };
}

function replaceIncidentState(data: AdminIncidentListResponse, replacement: AdminIncident): AdminIncidentsState {
  return replaceIncidentStates(data, [replacement]);
}

function replaceIncidentStates(data: AdminIncidentListResponse, replacements: AdminIncident[]): AdminIncidentsState {
  const replacementMap = new Map(replacements.map((incident) => [incident.id, incident]));
  const incidents = data.incidents.map((incident) => replacementMap.get(incident.id) ?? incident);
  return {
    data: {
      ...data,
      incidents,
      summary: summarizeLocalIncidents(incidents, data.summary),
    },
    error: null,
    status: "ready",
  };
}

function summarizeLocalIncidents(
  incidents: AdminIncident[],
  previous: AdminIncidentSummary,
): AdminIncidentSummary {
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
    ...previous,
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
    open: openIncidents.length,
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
