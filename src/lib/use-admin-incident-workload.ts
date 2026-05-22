import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  type AdminIncidentCorrelationResponse,
  type AdminIncidentWorkloadQuery,
  type AdminIncidentWorkloadForecastResponse,
  type AdminIncidentWorkloadResponse,
} from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentWorkloadState =
  | { data: null; error: null; status: "disabled" }
  | { data: null; error: AdminIncidentsApiError | null; status: "session_required" }
  | { data: null; error: AdminIncidentsApiError; status: "forbidden" }
  | { data: AdminIncidentWorkloadResponse | null; error: null; status: "loading" }
  | { data: AdminIncidentWorkloadResponse; error: null; status: "ready" }
  | { data: AdminIncidentWorkloadResponse | null; error: Error; status: "error" };

const disabledState: AdminIncidentWorkloadState = { data: null, error: null, status: "disabled" };
const sessionRequiredState: AdminIncidentWorkloadState = { data: null, error: null, status: "session_required" };

export function useAdminIncidentWorkload(
  session: BuyerSession | null,
  query: AdminIncidentWorkloadQuery,
) {
  const client = useMemo(() => createAdminIncidentsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [correlation, setCorrelation] = useState<{
    data: AdminIncidentCorrelationResponse | null;
    error: Error | null;
    status: "idle" | "loading" | "ready" | "error";
  }>({ data: null, error: null, status: "idle" });
  const [forecast, setForecast] = useState<{
    data: AdminIncidentWorkloadForecastResponse | null;
    error: Error | null;
    status: "idle" | "loading" | "ready" | "error";
  }>({ data: null, error: null, status: "idle" });
  const [state, setState] = useState<AdminIncidentWorkloadState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { data: null, error: null, status: "loading" };
  });

  const queryKey = JSON.stringify({
    includeResolved: Boolean(query.includeResolved),
    limit: query.limit ?? 20,
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

  const exportJson = useCallback(() => client.executionWorkloadExportJson(query), [client, query]);
  const exportCsv = useCallback(() => client.executionWorkloadExportCsv(query), [client, query]);

  const loadCorrelation = useCallback(async (incidentId: string, limit = 25) => {
    setCorrelation((current) => ({ data: current.data, error: null, status: "loading" }));
    try {
      const data = await client.correlation(incidentId, limit);
      setCorrelation({ data, error: null, status: "ready" });
      return data;
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error(String(error));
      setCorrelation({ data: null, error: nextError, status: "error" });
      throw nextError;
    }
  }, [client]);

  const loadForecast = useCallback(async (horizonHours = 24) => {
    setForecast((current) => ({ data: current.data, error: null, status: "loading" }));
    try {
      const data = await client.executionWorkloadForecast({ ...query, horizonHours });
      setForecast({ data, error: null, status: "ready" });
      return data;
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error(String(error));
      setForecast({ data: null, error: nextError, status: "error" });
      throw nextError;
    }
  }, [client, query]);

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

    void client.executionWorkload(query)
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
    correlation,
    exportCsv,
    exportJson,
    forecast,
    loadCorrelation,
    loadForecast,
    refresh,
  };
}
