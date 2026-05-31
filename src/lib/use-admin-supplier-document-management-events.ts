import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminSupplierDocumentManagementEventsApiError,
  createAdminSupplierDocumentManagementEventsApiClient,
  type AdminSupplierDocumentManagementEventsListResponse,
  type AdminSupplierDocumentManagementEventsQuery,
} from "@/lib/admin-supplier-document-management-events-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminSupplierDocumentManagementEventsState =
  | {
      data: null;
      error: null;
      status: "disabled";
    }
  | {
      data: null;
      error: AdminSupplierDocumentManagementEventsApiError | null;
      status: "session_required";
    }
  | {
      data: null;
      error: AdminSupplierDocumentManagementEventsApiError;
      status: "forbidden";
    }
  | {
      data: AdminSupplierDocumentManagementEventsListResponse | null;
      error: null;
      status: "loading";
    }
  | {
      data: AdminSupplierDocumentManagementEventsListResponse;
      error: null;
      status: "ready";
    }
  | {
      data: AdminSupplierDocumentManagementEventsListResponse | null;
      error: Error;
      status: "error";
    };

const disabledState: AdminSupplierDocumentManagementEventsState = {
  data: null,
  error: null,
  status: "disabled",
};

const sessionRequiredState: AdminSupplierDocumentManagementEventsState = {
  data: null,
  error: null,
  status: "session_required",
};

export function useAdminSupplierDocumentManagementEvents(
  session: BuyerSession | null,
  query: AdminSupplierDocumentManagementEventsQuery,
) {
  const client = useMemo(() => createAdminSupplierDocumentManagementEventsApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminSupplierDocumentManagementEventsState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return {
      data: null,
      error: null,
      status: "loading",
    };
  });

  const queryKey = JSON.stringify({
    action: query.action ?? "all",
    actorUserId: query.actorUserId?.trim() ?? "",
    documentId: query.documentId?.trim() ?? "",
    limit: query.limit ?? 50,
    offset: query.offset ?? 0,
    supplierId: query.supplierId?.trim() ?? "",
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

    void client.list(query)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, status: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AdminSupplierDocumentManagementEventsApiError) {
          if (error.code === "admin_role_required") {
            setState({ data: null, error, status: "forbidden" });
            return;
          }
          if (error.code === "admin_supplier_document_management_events_session_required") {
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
    refresh,
  };
}
