import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  type AdminIncidentTrendActionQueueBulkDecisionInput,
  type AdminIncidentTrendActionQueueBulkDecisionResponse,
  type AdminIncidentTrendActionQueueQuery,
  type AdminIncidentTrendActionQueueResponse,
} from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentTrendActionQueueState =
  | { data: null; error: null; status: "disabled" }
  | { data: null; error: AdminIncidentsApiError | null; status: "session_required" }
  | { data: null; error: AdminIncidentsApiError; status: "forbidden" }
  | { data: AdminIncidentTrendActionQueueResponse | null; error: null; status: "loading" }
  | { data: AdminIncidentTrendActionQueueResponse; error: null; status: "ready" }
  | { data: AdminIncidentTrendActionQueueResponse | null; error: Error; status: "error" };

const disabledState: AdminIncidentTrendActionQueueState = { data: null, error: null, status: "disabled" };
const sessionRequiredState: AdminIncidentTrendActionQueueState = { data: null, error: null, status: "session_required" };

export function useAdminIncidentTrendActionQueue(
  session: BuyerSession | null,
  query: AdminIncidentTrendActionQueueQuery,
) {
  const client = useMemo(() => createAdminIncidentsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminIncidentTrendActionQueueState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { data: null, error: null, status: "loading" };
  });

  const queryKey = JSON.stringify({
    decision: query.decision ?? "all",
    granularity: query.granularity ?? "day",
    includeResolved: Boolean(query.includeResolved),
    kind: query.kind ?? "all",
    limit: query.limit ?? 50,
    offset: query.offset ?? 0,
    ownerRole: query.ownerRole ?? "all",
    priority: query.priority ?? "all",
    severity: query.severity ?? "all",
    source: query.source ?? "all",
    status: query.status ?? "all",
    window: query.window ?? "7d",
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const exportJson = useCallback(() => client.trendActionQueueExportJson(query), [client, query]);
  const exportCsv = useCallback(() => client.trendActionQueueExportCsv(query), [client, query]);

  const bulkDecide = useCallback(async (
    input: AdminIncidentTrendActionQueueBulkDecisionInput,
  ): Promise<AdminIncidentTrendActionQueueBulkDecisionResponse> => {
    const result = await client.bulkDecideTrendActions(input, query);
    setState((current) => {
      if (!current.data) return current;
      const updates = new Map(result.updatedActions.map((action) => [action.actionId, action]));
      const actions = current.data.actions.map((action) => updates.get(action.actionId) ?? action);
      return {
        data: {
          ...current.data,
          actions,
          summary: {
            ...current.data.summary,
            accepted: actions.filter((action) => action.status === "accepted").length,
            dismissed: actions.filter((action) => action.status === "dismissed").length,
            proposed: actions.filter((action) => action.status === "proposed").length,
          },
        },
        error: null,
        status: "ready",
      };
    });
    refresh();
    return result;
  }, [client, query, refresh]);

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

    void client.trendActionQueue(query)
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
    bulkDecide,
    exportCsv,
    exportJson,
    refresh,
    state,
  };
}
