import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminSupplierDocumentAuditApiError,
  createAdminSupplierDocumentAuditApiClient,
  type AdminSupplierDocumentAuditKind,
  type AdminSupplierDocumentAuditListResponse,
  type AdminSupplierDocumentAuditQuery,
} from "@/lib/admin-supplier-document-audit-api";
import type { BuyerSession } from "@/lib/buyer-session";

export type AdminSupplierDocumentAuditState =
  | {
      data: null;
      error: null;
      status: "disabled";
    }
  | {
      data: null;
      error: AdminSupplierDocumentAuditApiError | null;
      status: "session_required";
    }
  | {
      data: null;
      error: AdminSupplierDocumentAuditApiError;
      status: "forbidden";
    }
  | {
      data: AdminSupplierDocumentAuditListResponse | null;
      error: null;
      status: "loading";
    }
  | {
      data: AdminSupplierDocumentAuditListResponse;
      error: null;
      status: "ready";
    }
  | {
      data: AdminSupplierDocumentAuditListResponse | null;
      error: Error;
      status: "error";
    };

const disabledState: AdminSupplierDocumentAuditState = {
  data: null,
  error: null,
  status: "disabled",
};

const sessionRequiredState: AdminSupplierDocumentAuditState = {
  data: null,
  error: null,
  status: "session_required",
};

export function useAdminSupplierDocumentAudit(
  session: BuyerSession | null,
  kind: AdminSupplierDocumentAuditKind,
  query: AdminSupplierDocumentAuditQuery,
) {
  const client = useMemo(() => createAdminSupplierDocumentAuditApiClient({ session }), [session]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<AdminSupplierDocumentAuditState>(() => {
    if (!client.enabled) return disabledState;
    if (!session?.id || !session.userId) return sessionRequiredState;
    return {
      data: null,
      error: null,
      status: "loading",
    };
  });

  const queryKey = JSON.stringify({
    buyerUserId: query.buyerUserId?.trim() ?? "",
    kind,
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
    status: query.status ?? "all",
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

    void client.list(kind, query)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, status: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AdminSupplierDocumentAuditApiError) {
          if (error.code === "admin_role_required") {
            setState({ data: null, error, status: "forbidden" });
            return;
          }
          if (error.code === "admin_supplier_document_audit_session_required") {
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
  }, [client, kind, queryKey, refreshToken, session?.id, session?.userId]);

  return {
    ...state,
    refresh,
  };
}
