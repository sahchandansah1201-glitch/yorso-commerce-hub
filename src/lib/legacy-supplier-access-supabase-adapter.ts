/**
 * Legacy Supabase supplier-access adapter.
 *
 * Supabase is not the production backend for YORSO. This adapter is kept only
 * for prototype/reference flows that still read or write the temporary
 * `supplier_access_requests` table and access-event RPC. Production supplier
 * access should go through `supplier-access-api.ts` and the self-hosted YORSO
 * API.
 */

import {
  isSupabaseConfigured,
  supabase,
} from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  persistSupplierAccessRequest,
  type SupplierAccessRequest,
  type SupplierAccessStatus,
} from "@/lib/supplier-access-requests";

type LegacySupplierAccessStatus =
  | "sent"
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

interface LegacySupplierAccessRequestRow {
  id: string;
  supplier_id: string;
  status: LegacySupplierAccessStatus;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
}

type SupabaseClient = typeof supabase;
type SupabaseAccessClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: LegacySupplierAccessRequestRow | null;
            error: unknown;
          }>;
        };
      };
    };
    insert: (values: {
      buyer_user_id: string;
      supplier_id: string;
      status: "sent";
      message: string;
    }) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: LegacySupplierAccessRequestRow | null;
          error: unknown;
        }>;
      };
    };
  };
  rpc: (
    functionName: string,
    args: {
      p_supplier_access_request_id: string;
      p_event_type: "supplier_access_requested";
      p_metadata: Json;
    },
  ) => Promise<unknown>;
};

const asAccessClient = (client: SupabaseClient): SupabaseAccessClient =>
  client as unknown as SupabaseAccessClient;

const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
};

const mapLegacyStatus = (
  status: LegacySupplierAccessStatus,
): SupplierAccessStatus | null => {
  if (status === "sent" || status === "pending" || status === "approved") {
    return status;
  }

  // Rejected/revoked UI copy is not part of the current one-click flow yet.
  // Keep the profile locked and let backend state override stale local approval.
  return "pending";
};

const mapLegacyRequest = (
  row: LegacySupplierAccessRequestRow,
): SupplierAccessRequest | null => {
  const status = mapLegacyStatus(row.status);
  if (!status) return null;

  const request: SupplierAccessRequest = {
    supplierId: row.supplier_id,
    intent: "exact_price",
    status,
    sentAt: row.created_at,
    pendingAt:
      status === "pending" || status === "approved"
        ? row.updated_at
        : undefined,
    approvedAt: status === "approved" ? row.decided_at ?? row.updated_at : undefined,
    reasons: ["exact_price"],
    message: "",
  };

  return persistSupplierAccessRequest(request, { notify: false, source: "backend_read" });
};

const selectSupplierAccessRequest = async (
  supplierId: string,
  buyerUserId: string,
): Promise<SupplierAccessRequest | null> => {
  const { data, error } = await asAccessClient(supabase)
    .from("supplier_access_requests")
    .select("id,supplier_id,status,created_at,updated_at,decided_at")
    .eq("supplier_id", supplierId)
    .eq("buyer_user_id", buyerUserId)
    .maybeSingle();

  if (error || !data) return null;
  return mapLegacyRequest(data);
};

const logSupplierAccessRequestEvent = async (
  requestId: string,
) => {
  try {
    await asAccessClient(supabase).rpc("log_supplier_access_event", {
      p_supplier_access_request_id: requestId,
      p_event_type: "supplier_access_requested",
      p_metadata: { source: "legacy_supplier_access_supabase_adapter" } satisfies Json,
    });
  } catch {
    // Audit logging must not break the buyer request flow.
  }
};

export const isLegacySupplierAccessSupabaseConfigured = (): boolean =>
  isSupabaseConfigured;

export const readLegacySupplierAccessRequest = async (
  supplierId: string,
): Promise<SupplierAccessRequest | null> => {
  if (!isLegacySupplierAccessSupabaseConfigured()) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  return selectSupplierAccessRequest(supplierId, userId);
};

export const requestLegacySupplierAccess = async (
  supplierId: string,
): Promise<SupplierAccessRequest | null> => {
  if (!isLegacySupplierAccessSupabaseConfigured()) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const existing = await selectSupplierAccessRequest(supplierId, userId);
  if (existing) return existing;

  try {
    const { data, error } = await asAccessClient(supabase)
      .from("supplier_access_requests")
      .insert({
        buyer_user_id: userId,
        supplier_id: supplierId,
        status: "sent",
        message: "",
      })
      .select("id,supplier_id,status,created_at,updated_at,decided_at")
      .single();

    if (!error && data) {
      await logSupplierAccessRequestEvent(data.id);
      return mapLegacyRequest(data);
    }
  } catch {
    // Local mock fallback remains the final resilience layer.
  }

  return null;
};
