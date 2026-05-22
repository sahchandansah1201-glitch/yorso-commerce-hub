import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  type AdminIncidentExecutionQueueBulkUpdateInput,
  type AdminIncidentExecutionQueueItem,
  type AdminIncidentExecutionQueueQuery,
  type AdminIncidentExecutionQueueResponse,
} from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentExecutionQueueState =
  | { data: null; error: null; status: "disabled" }
  | { data: null; error: AdminIncidentsApiError | null; status: "session_required" }
  | { data: null; error: AdminIncidentsApiError; status: "forbidden" }
  | { data: AdminIncidentExecutionQueueResponse | null; error: null; status: "loading" }
  | { data: AdminIncidentExecutionQueueResponse; error: null; status: "ready" }
  | { data: AdminIncidentExecutionQueueResponse | null; error: Error; status: "error" };

const disabledState: AdminIncidentExecutionQueueState = { data: null, error: null, status: "disabled" };
const sessionRequiredState: AdminIncidentExecutionQueueState = { data: null, error: null, status: "session_required" };

export function useAdminIncidentExecutionQueue(
  session: BuyerSession | null,
  query: AdminIncidentExecutionQueueQuery,
) {
  const client = useMemo(() => createAdminIncidentsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [mutating, setMutating] = useState(false);
  const [state, setState] = useState<AdminIncidentExecutionQueueState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { data: null, error: null, status: "loading" };
  });

  const queryKey = JSON.stringify({
    assigned: query.assigned ?? "all",
    incidentSeverity: query.incidentSeverity ?? "all",
    incidentSlaStatus: query.incidentSlaStatus ?? "all",
    incidentStatus: query.incidentStatus ?? "all",
    limit: query.limit ?? 50,
    offset: query.offset ?? 0,
    overdueOnly: Boolean(query.overdueOnly),
    ownerRole: query.ownerRole ?? "all",
    priority: query.priority ?? "all",
    source: query.source ?? "all",
    status: query.status ?? "all",
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const bulkUpdate = useCallback(async (input: AdminIncidentExecutionQueueBulkUpdateInput) => {
    setMutating(true);
    try {
      const result = await client.bulkUpdateExecutionQueue(input);
      setState((current) => {
        if (!current.data) return current;
        return replaceQueueItems(current.data, result.updatedItems);
      });
      return result;
    } finally {
      setMutating(false);
    }
  }, [client]);

  const exportJson = useCallback(() => client.executionQueueExportJson(query), [client, query]);
  const exportCsv = useCallback(() => client.executionQueueExportCsv(query), [client, query]);

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

    void client.executionQueue(query)
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
    bulkUpdate,
    exportCsv,
    exportJson,
    mutating,
    refresh,
  };
}

function replaceQueueItems(
  data: AdminIncidentExecutionQueueResponse,
  replacements: AdminIncidentExecutionQueueItem[],
): AdminIncidentExecutionQueueState {
  const replacementMap = new Map(replacements.map((item) => [`${item.incidentId}\n${item.itemId}`, item]));
  const items = data.items.map((item) => replacementMap.get(`${item.incidentId}\n${item.itemId}`) ?? item);
  return {
    data: {
      ...data,
      items,
      summary: summarizeLocalQueue(items, data.summary),
    },
    error: null,
    status: "ready",
  };
}

function summarizeLocalQueue(
  items: AdminIncidentExecutionQueueItem[],
  previous: AdminIncidentExecutionQueueResponse["summary"],
) {
  return {
    ...previous,
    assigned: items.filter((item) => Boolean(item.assignedToUserHash)).length,
    blocked: items.filter((item) => item.status === "blocked").length,
    done: items.filter((item) => item.status === "done").length,
    inProgress: items.filter((item) => item.status === "in_progress").length,
    open: items.filter((item) => item.status === "open").length,
    overdue: items.filter((item) => item.overdue).length,
    skipped: items.filter((item) => item.status === "skipped").length,
    total: items.length,
    unassigned: items.filter((item) => !item.assignedToUserHash).length,
  };
}
