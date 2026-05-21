import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminAuditApiError,
  createAdminAuditApiClient,
  type AdminAuditListResponse,
  type AdminAuditQuery,
} from "@/lib/admin-audit-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminAuditEventsState =
  | {
      data: null;
      error: null;
      exportUrl: "";
      status: "disabled";
    }
  | {
      data: null;
      error: AdminAuditApiError | null;
      exportUrl: "";
      status: "session_required";
    }
  | {
      data: null;
      error: AdminAuditApiError;
      exportUrl: "";
      status: "forbidden";
    }
  | {
      data: AdminAuditListResponse | null;
      error: null;
      exportUrl: string;
      status: "loading";
    }
  | {
      data: AdminAuditListResponse;
      error: null;
      exportUrl: string;
      status: "ready";
    }
  | {
      data: AdminAuditListResponse | null;
      error: Error;
      exportUrl: string;
      status: "error";
    };

const disabledState: AdminAuditEventsState = {
  data: null,
  error: null,
  exportUrl: "",
  status: "disabled",
};

const sessionRequiredState: AdminAuditEventsState = {
  data: null,
  error: null,
  exportUrl: "",
  status: "session_required",
};

const auditExportQuery = (query: AdminAuditQuery): AdminAuditQuery => ({
  ...query,
  limit: 1000,
});

export function useAdminAuditEvents(session: BuyerSession | null, query: AdminAuditQuery) {
  const client = useMemo(() => createAdminAuditApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminAuditEventsState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return {
      data: null,
      error: null,
      exportUrl: client.exportUrl(auditExportQuery(query)),
      status: "loading",
    };
  });

  const queryKey = JSON.stringify({
    limit: query.limit ?? 25,
    outcome: query.outcome ?? "all",
    route: query.route?.trim() ?? "",
    statusClass: query.statusClass ?? "all",
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

    const exportUrl = client.exportUrl(auditExportQuery(query));
    setState((current) => ({
      data: current.status === "ready" || current.status === "loading" ? current.data : null,
      error: null,
      exportUrl,
      status: "loading",
    }));

    void client.list(query)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, exportUrl, status: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AdminAuditApiError) {
          if (error.code === "admin_role_required") {
            setState({ data: null, error, exportUrl: "", status: "forbidden" });
            return;
          }
          if (error.code === "admin_audit_session_required") {
            setState({ data: null, error, exportUrl: "", status: "session_required" });
            return;
          }
        }
        setState((current) => ({
          data: current.status === "ready" || current.status === "loading" ? current.data : null,
          error: error instanceof Error ? error : new Error(String(error)),
          exportUrl,
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
    refresh,
  };
}
