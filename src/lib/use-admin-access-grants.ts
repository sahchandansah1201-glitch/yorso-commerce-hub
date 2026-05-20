import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminAccessGrantsApiError,
  createAdminAccessGrantsApiClient,
  type AdminAccessGrantItem,
  type AdminAccessGrantListResponse,
  type AdminAccessGrantQuery,
  type AdminAccessGrantStatusFilter,
} from "@/lib/admin-access-grants-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminAccessGrantsState =
  | {
      status: "disabled";
      data: null;
      error: null;
    }
  | {
      status: "session_required";
      data: null;
      error: AdminAccessGrantsApiError | null;
    }
  | {
      status: "forbidden";
      data: null;
      error: AdminAccessGrantsApiError;
    }
  | {
      status: "loading";
      data: AdminAccessGrantListResponse | null;
      error: null;
    }
  | {
      status: "ready";
      data: AdminAccessGrantListResponse;
      error: null;
    }
  | {
      status: "error";
      data: AdminAccessGrantListResponse | null;
      error: Error;
    };

const disabledState: AdminAccessGrantsState = {
  status: "disabled",
  data: null,
  error: null,
};

const sessionRequiredState: AdminAccessGrantsState = {
  status: "session_required",
  data: null,
  error: null,
};

export function useAdminAccessGrants(
  session: BuyerSession | null,
  query: AdminAccessGrantQuery,
) {
  const client = useMemo(() => createAdminAccessGrantsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminAccessGrantsState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { status: "loading", data: null, error: null };
  });
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const queryKey = JSON.stringify({
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
    q: query.q?.trim() ?? "",
    status: query.status ?? "active",
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const revoke = useCallback(
    async (grantId: string, reason?: string) => {
      setRevokingId(grantId);
      try {
        await client.revoke(grantId, reason);
        refresh();
      } finally {
        setRevokingId(null);
      }
    },
    [client, refresh],
  );

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
      error: null,
    }));

    void client.list(query)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AdminAccessGrantsApiError) {
          if (error.code === "admin_role_required") {
            setState({ status: "forbidden", data: null, error });
            return;
          }
          if (error.code === "admin_access_grants_session_required") {
            setState({ status: "session_required", data: null, error });
            return;
          }
        }
        setState((current) => ({
          status: "error",
          data: current.status === "ready" || current.status === "loading" ? current.data : null,
          error: error instanceof Error ? error : new Error(String(error)),
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
    revoke,
    revokingId,
  };
}

export type { AdminAccessGrantItem, AdminAccessGrantStatusFilter };
