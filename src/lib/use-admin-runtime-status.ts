import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminRuntimeApiError,
  createAdminRuntimeApiClient,
  type AdminRuntimeDiagnostics,
  type AdminRuntimeStatus,
} from "@/lib/admin-runtime-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminRuntimeStatusState =
  | {
      status: "disabled";
      data: null;
      diagnostics: null;
      error: null;
    }
  | {
      status: "session_required";
      data: null;
      diagnostics: null;
      error: AdminRuntimeApiError | null;
    }
  | {
      status: "forbidden";
      data: null;
      diagnostics: null;
      error: AdminRuntimeApiError;
    }
  | {
      status: "loading";
      data: AdminRuntimeStatus | null;
      diagnostics: AdminRuntimeDiagnostics | null;
      error: null;
    }
  | {
      status: "ready";
      data: AdminRuntimeStatus;
      diagnostics: AdminRuntimeDiagnostics;
      error: null;
    }
  | {
      status: "error";
      data: AdminRuntimeStatus | null;
      diagnostics: AdminRuntimeDiagnostics | null;
      error: Error;
    };

const disabledState: AdminRuntimeStatusState = {
  status: "disabled",
  data: null,
  diagnostics: null,
  error: null,
};

const sessionRequiredState: AdminRuntimeStatusState = {
  status: "session_required",
  data: null,
  diagnostics: null,
  error: null,
};

export function useAdminRuntimeStatus(session: BuyerSession | null) {
  const client = useMemo(() => createAdminRuntimeApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminRuntimeStatusState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { status: "loading", data: null, diagnostics: null, error: null };
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
      status: "loading",
      data: current.status === "ready" || current.status === "loading" ? current.data : null,
      diagnostics: current.status === "ready" || current.status === "loading" ? current.diagnostics : null,
      error: null,
    }));

    void Promise.all([client.status(), client.diagnostics()])
      .then(([data, diagnostics]) => {
        if (!cancelled) setState({ status: "ready", data, diagnostics, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AdminRuntimeApiError) {
          if (error.code === "admin_role_required") {
            setState({ status: "forbidden", data: null, diagnostics: null, error });
            return;
          }
          if (error.code === "admin_runtime_session_required") {
            setState({ status: "session_required", data: null, diagnostics: null, error });
            return;
          }
        }
        setState({
          status: "error",
          data: null,
          diagnostics: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
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
