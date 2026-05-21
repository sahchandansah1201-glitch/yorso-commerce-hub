import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  type AdminIncidentAcknowledgeInput,
  type AdminIncidentListResponse,
  type AdminIncidentQuery,
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
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
    severity: query.severity ?? "all",
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
        return {
          data: {
            ...current.data,
            incidents: current.data.incidents.map((incident) =>
              incident.id === result.incident.id ? result.incident : incident,
            ),
            summary: {
              ...current.data.summary,
              acknowledged: input.status === "resolved"
                ? current.data.summary.acknowledged
                : current.data.summary.acknowledged + 1,
              open: Math.max(0, current.data.summary.open - 1),
              resolved: input.status === "resolved"
                ? current.data.summary.resolved + 1
                : current.data.summary.resolved,
            },
          },
          error: null,
          status: "ready",
        };
      });
      return result;
    } finally {
      setMutatingId(null);
    }
  }, [client]);

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
    mutatingId,
    refresh,
  };
}
