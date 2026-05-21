import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminOperationsApiError,
  createAdminOperationsApiClient,
  type AdminOperationsOverview,
} from "@/lib/admin-operations-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminOperationsOverviewState =
  | {
      data: null;
      error: null;
      status: "disabled";
    }
  | {
      data: null;
      error: AdminOperationsApiError | null;
      status: "session_required";
    }
  | {
      data: null;
      error: AdminOperationsApiError;
      status: "forbidden";
    }
  | {
      data: AdminOperationsOverview | null;
      error: null;
      status: "loading";
    }
  | {
      data: AdminOperationsOverview;
      error: null;
      status: "ready";
    }
  | {
      data: AdminOperationsOverview | null;
      error: Error;
      status: "error";
    };

const disabledState: AdminOperationsOverviewState = {
  data: null,
  error: null,
  status: "disabled",
};

const sessionRequiredState: AdminOperationsOverviewState = {
  data: null,
  error: null,
  status: "session_required",
};

export function useAdminOperationsOverview(session: BuyerSession | null) {
  const client = useMemo(() => createAdminOperationsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminOperationsOverviewState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { data: null, error: null, status: "loading" };
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

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

    void client.overview()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, status: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AdminOperationsApiError) {
          if (error.code === "admin_role_required") {
            setState({ data: null, error, status: "forbidden" });
            return;
          }
          if (error.code === "admin_operations_session_required") {
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
  }, [client, refreshToken, session?.id, session?.userId]);

  return {
    ...state,
    refresh,
  };
}
