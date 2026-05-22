import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  type AdminIncidentDetailResponse,
  type AdminIncidentExecutionResponse,
  type AdminIncidentExecutionUpdateInput,
  type AdminIncidentHandoffResponse,
  type AdminIncidentPostmortemResponse,
  type AdminIncidentRemediationPlanResponse,
  type AdminIncidentWorkflowInput,
} from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentDetailState =
  | { data: null; error: null; status: "disabled" }
  | { data: null; error: AdminIncidentsApiError | null; status: "session_required" }
  | { data: null; error: AdminIncidentsApiError; status: "forbidden" }
  | { data: AdminIncidentDetailResponse | null; error: null; status: "loading" }
  | { data: AdminIncidentDetailResponse; error: null; status: "ready" }
  | { data: AdminIncidentDetailResponse | null; error: Error; status: "error" };

const disabledState: AdminIncidentDetailState = { data: null, error: null, status: "disabled" };
const sessionRequiredState: AdminIncidentDetailState = { data: null, error: null, status: "session_required" };

export function useAdminIncidentDetail(session: BuyerSession | null, incidentId: string | undefined) {
  const client = useMemo(() => createAdminIncidentsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [mutating, setMutating] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState<string | null>(null);
  const [handoffJson, setHandoffJson] = useState<AdminIncidentHandoffResponse | null>(null);
  const [handoffMarkdown, setHandoffMarkdown] = useState<string | null>(null);
  const [remediationPlan, setRemediationPlan] = useState<AdminIncidentRemediationPlanResponse | null>(null);
  const [remediationStatus, setRemediationStatus] = useState<string | null>(null);
  const [postmortemJson, setPostmortemJson] = useState<AdminIncidentPostmortemResponse | null>(null);
  const [postmortemMarkdown, setPostmortemMarkdown] = useState<string | null>(null);
  const [postmortemStatus, setPostmortemStatus] = useState<string | null>(null);
  const [execution, setExecution] = useState<AdminIncidentExecutionResponse | null>(null);
  const [executionCsv, setExecutionCsv] = useState<string | null>(null);
  const [executionExportJson, setExecutionExportJson] = useState<AdminIncidentExecutionResponse | null>(null);
  const [executionExportStatus, setExecutionExportStatus] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [state, setState] = useState<AdminIncidentDetailState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { data: null, error: null, status: "loading" };
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const workflow = useCallback(async (input: AdminIncidentWorkflowInput) => {
    if (!incidentId) return null;
    setMutating(true);
    try {
      const result = await client.workflow(incidentId, input);
      setState({
        data: {
          incident: result.incident,
          ok: true,
          requestId: result.requestId,
          timeline: result.timeline,
        },
        error: null,
        status: "ready",
      });
      return result;
    } finally {
      setMutating(false);
    }
  }, [client, incidentId]);

  const acknowledge = useCallback(async (status: "acknowledged" | "resolved", note?: string) => {
    if (!incidentId) return null;
    setMutating(true);
    try {
      const result = await client.acknowledge(incidentId, { note, status });
      setState({
        data: {
          incident: result.incident,
          ok: true,
          requestId: result.requestId,
          timeline: result.timeline,
        },
        error: null,
        status: "ready",
      });
      return result;
    } finally {
      setMutating(false);
    }
  }, [client, incidentId]);

  const exportHandoffJson = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.handoffJson(incidentId);
    setHandoffJson(result);
    setHandoffStatus(`JSON ${result.sections.length}`);
    return result;
  }, [client, incidentId]);

  const exportHandoffMarkdown = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.handoffMarkdown(incidentId);
    setHandoffMarkdown(result);
    setHandoffStatus(`Markdown ${result.split("\n").filter(Boolean).length}`);
    return result;
  }, [client, incidentId]);

  const loadRemediationPlan = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.remediation(incidentId);
    setRemediationPlan(result);
    setRemediationStatus(`${result.steps.length} steps, ${result.verificationChecks.length} checks`);
    return result;
  }, [client, incidentId]);

  const exportPostmortemJson = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.postmortemJson(incidentId);
    setPostmortemJson(result);
    setPostmortemStatus(`JSON ${result.actionItems.length}`);
    return result;
  }, [client, incidentId]);

  const exportPostmortemMarkdown = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.postmortemMarkdown(incidentId);
    setPostmortemMarkdown(result);
    setPostmortemStatus(`Markdown ${result.split("\n").filter(Boolean).length}`);
    return result;
  }, [client, incidentId]);

  const loadExecution = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.execution(incidentId);
    setExecution(result);
    setExecutionStatus(`${result.summary.done}/${result.summary.total} done`);
    return result;
  }, [client, incidentId]);

  const exportExecutionJson = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.executionExportJson(incidentId);
    setExecutionExportJson(result);
    setExecutionExportStatus(`JSON ${result.items.length}`);
    return result;
  }, [client, incidentId]);

  const exportExecutionCsv = useCallback(async () => {
    if (!incidentId) return null;
    const result = await client.executionExportCsv(incidentId);
    setExecutionCsv(result);
    setExecutionExportStatus(`CSV ${result.split("\n").filter(Boolean).length}`);
    return result;
  }, [client, incidentId]);

  const updateExecutionItem = useCallback(async (itemId: string, input: AdminIncidentExecutionUpdateInput) => {
    if (!incidentId) return null;
    setMutating(true);
    try {
      const result = await client.updateExecutionItem(incidentId, itemId, input);
      setExecution(result);
      setExecutionStatus(`${result.summary.done}/${result.summary.total} done`);
      return result;
    } finally {
      setMutating(false);
    }
  }, [client, incidentId]);

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
    if (!incidentId) {
      setState({ data: null, error: new Error("Incident id is required."), status: "error" });
      return () => {
        cancelled = true;
      };
    }

    setState((current) => ({
      data: current.status === "ready" || current.status === "loading" ? current.data : null,
      error: null,
      status: "loading",
    }));

    void client.detail(incidentId)
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
  }, [client, incidentId, refreshToken, session?.id, session?.userId]);

  return {
    ...state,
    acknowledge,
    exportHandoffJson,
    exportHandoffMarkdown,
    exportPostmortemJson,
    exportPostmortemMarkdown,
    handoffJson,
    handoffMarkdown,
    handoffStatus,
    execution,
    executionCsv,
    executionExportJson,
    executionExportStatus,
    executionStatus,
    exportExecutionCsv,
    exportExecutionJson,
    loadExecution,
    loadRemediationPlan,
    mutating,
    postmortemJson,
    postmortemMarkdown,
    postmortemStatus,
    refresh,
    remediationPlan,
    remediationStatus,
    updateExecutionItem,
    workflow,
  };
}
