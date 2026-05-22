import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminIncidentsApiError,
  createAdminIncidentsApiClient,
  type AdminIncidentTrendAnomaliesResponse,
  type AdminIncidentTrendBriefingResponse,
  type AdminIncidentTrendQuery,
  type AdminIncidentTrendResponse,
} from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminIncidentTrendsState =
  | { data: null; error: null; status: "disabled" }
  | { data: null; error: AdminIncidentsApiError | null; status: "session_required" }
  | { data: null; error: AdminIncidentsApiError; status: "forbidden" }
  | { data: AdminIncidentTrendResponse | null; error: null; status: "loading" }
  | { data: AdminIncidentTrendResponse; error: null; status: "ready" }
  | { data: AdminIncidentTrendResponse | null; error: Error; status: "error" };

const disabledState: AdminIncidentTrendsState = { data: null, error: null, status: "disabled" };
const sessionRequiredState: AdminIncidentTrendsState = { data: null, error: null, status: "session_required" };

export function useAdminIncidentTrends(
  session: BuyerSession | null,
  query: AdminIncidentTrendQuery,
) {
  const client = useMemo(() => createAdminIncidentsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [anomalies, setAnomalies] = useState<{
    data: AdminIncidentTrendAnomaliesResponse | null;
    error: Error | null;
    status: "idle" | "loading" | "ready" | "error";
  }>({ data: null, error: null, status: "idle" });
  const [briefing, setBriefing] = useState<{
    data: AdminIncidentTrendBriefingResponse | null;
    error: Error | null;
    status: "idle" | "loading" | "ready" | "error";
  }>({ data: null, error: null, status: "idle" });
  const [state, setState] = useState<AdminIncidentTrendsState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { data: null, error: null, status: "loading" };
  });

  const queryKey = JSON.stringify({
    granularity: query.granularity ?? "day",
    includeResolved: Boolean(query.includeResolved),
    limit: query.limit ?? 30,
    severity: query.severity ?? "all",
    source: query.source ?? "all",
    status: query.status ?? "all",
    window: query.window ?? "7d",
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const exportJson = useCallback(() => client.trendsExportJson(query), [client, query]);
  const exportCsv = useCallback(() => client.trendsExportCsv(query), [client, query]);

  const loadAnomalies = useCallback(async () => {
    setAnomalies((current) => ({ data: current.data, error: null, status: "loading" }));
    try {
      const data = await client.trendAnomalies(query);
      setAnomalies({ data, error: null, status: "ready" });
      return data;
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error(String(error));
      setAnomalies({ data: null, error: nextError, status: "error" });
      throw nextError;
    }
  }, [client, query]);

  const loadBriefing = useCallback(async () => {
    setBriefing((current) => ({ data: current.data, error: null, status: "loading" }));
    try {
      const data = await client.trendBriefing(query);
      setBriefing({ data, error: null, status: "ready" });
      return data;
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error(String(error));
      setBriefing({ data: null, error: nextError, status: "error" });
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

    void client.trends(query)
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
    anomalies,
    briefing,
    exportCsv,
    exportJson,
    loadAnomalies,
    loadBriefing,
    refresh,
  };
}
