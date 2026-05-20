import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminAccessReviewApiError,
  createAdminAccessReviewApiClient,
  type AdminAccessReviewItem,
  type AdminAccessReviewListResponse,
  type AdminAccessReviewQuery,
  type AdminAccessReviewStatusFilter,
} from "@/lib/admin-access-review-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminAccessReviewState =
  | {
      status: "disabled";
      data: null;
      error: null;
    }
  | {
      status: "session_required";
      data: null;
      error: AdminAccessReviewApiError | null;
    }
  | {
      status: "forbidden";
      data: null;
      error: AdminAccessReviewApiError;
    }
  | {
      status: "loading";
      data: AdminAccessReviewListResponse | null;
      error: null;
    }
  | {
      status: "ready";
      data: AdminAccessReviewListResponse;
      error: null;
    }
  | {
      status: "error";
      data: AdminAccessReviewListResponse | null;
      error: Error;
    };

const disabledState: AdminAccessReviewState = {
  status: "disabled",
  data: null,
  error: null,
};

const sessionRequiredState: AdminAccessReviewState = {
  status: "session_required",
  data: null,
  error: null,
};

export function useAdminAccessReview(
  session: BuyerSession | null,
  query: AdminAccessReviewQuery,
) {
  const client = useMemo(() => createAdminAccessReviewApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminAccessReviewState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return { status: "loading", data: null, error: null };
  });
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const queryKey = JSON.stringify({
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
    q: query.q?.trim() ?? "",
    status: query.status ?? "open",
  });

  const refresh = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const decide = useCallback(
    async (requestId: string, status: "pending" | "approved" | "rejected" | "revoked") => {
      setDecidingId(requestId);
      try {
        await client.decide(requestId, status);
        refresh();
      } finally {
        setDecidingId(null);
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
        if (error instanceof AdminAccessReviewApiError) {
          if (error.code === "admin_role_required") {
            setState({ status: "forbidden", data: null, error });
            return;
          }
          if (error.code === "admin_access_review_session_required") {
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
    decide,
    decidingId,
    refresh,
  };
}

export type { AdminAccessReviewItem, AdminAccessReviewStatusFilter };
