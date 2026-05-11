/**
 * Supplier access adapter.
 *
 * This is the bridge between the current frontend-only Supplier Access Flow
 * and the new backend access foundation:
 *
 * - when a real Supabase auth user exists, read/write `supplier_access_requests`;
 * - otherwise keep the current localStorage mock flow working;
 * - never expose supplier identity here. This adapter only carries status.
 */
import type { Tables } from "@/integrations/supabase/types";
import {
  createSupplierAccessRequest,
  getSupplierAccessRequest,
  persistSupplierAccessRequest,
  type SupplierAccessRequest,
  type SupplierAccessStatus,
} from "@/lib/supplier-access-requests";

type SupplierAccessRequestRow = Pick<
  Tables<"supplier_access_requests">,
  "supplier_id" | "status" | "created_at" | "updated_at" | "decided_at"
>;

type SupabaseClient = typeof import("@/integrations/supabase/client")["supabase"];

const isSupabaseConfigured = (): boolean =>
  Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

const getSupabaseClient = async (): Promise<SupabaseClient | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const mod = await import("@/integrations/supabase/client");
    return mod.supabase;
  } catch {
    return null;
  }
};

const getCurrentUserId = async (
  supabase: SupabaseClient,
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
};

const mapBackendStatus = (
  status: Tables<"supplier_access_requests">["status"],
): SupplierAccessStatus | null => {
  if (status === "sent" || status === "pending" || status === "approved") {
    return status;
  }
  // Rejected/revoked UI copy is not part of the current one-click flow yet.
  // Keep the profile locked and let backend state override stale local approval.
  return "pending";
};

const mapBackendRequest = (
  row: SupplierAccessRequestRow,
): SupplierAccessRequest | null => {
  const status = mapBackendStatus(row.status);
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

  return persistSupplierAccessRequest(request);
};

const selectSupplierAccessRequest = async (
  supabase: SupabaseClient,
  supplierId: string,
  buyerUserId: string,
): Promise<SupplierAccessRequest | null> => {
  const { data, error } = await supabase
    .from("supplier_access_requests")
    .select("supplier_id,status,created_at,updated_at,decided_at")
    .eq("supplier_id", supplierId)
    .eq("buyer_user_id", buyerUserId)
    .maybeSingle();

  if (error || !data) return null;
  return mapBackendRequest(data as SupplierAccessRequestRow);
};

export const readSupplierAccessRequest = async (
  supplierId: string | undefined,
): Promise<SupplierAccessRequest | null> => {
  if (!supplierId) return null;

  const supabase = await getSupabaseClient();
  const userId = supabase ? await getCurrentUserId(supabase) : null;
  if (supabase && userId) {
    const backendRequest = await selectSupplierAccessRequest(
      supabase,
      supplierId,
      userId,
    );
    if (backendRequest) return backendRequest;
  }

  return getSupplierAccessRequest(supplierId);
};

export const requestSupplierAccess = async (
  supplierId: string,
): Promise<SupplierAccessRequest> => {
  const supabase = await getSupabaseClient();
  const userId = supabase ? await getCurrentUserId(supabase) : null;

  if (supabase && userId) {
    const existing = await selectSupplierAccessRequest(supabase, supplierId, userId);
    if (existing) return existing;

    try {
      const { data, error } = await supabase
        .from("supplier_access_requests")
        .insert({
          buyer_user_id: userId,
          supplier_id: supplierId,
          status: "sent",
          message: "",
        })
        .select("supplier_id,status,created_at,updated_at,decided_at")
        .single();

      if (!error && data) {
        const mapped = mapBackendRequest(data as SupplierAccessRequestRow);
        if (mapped) return mapped;
      }
    } catch {
      // Fall through to local mock fallback.
    }
  }

  return createSupplierAccessRequest(supplierId);
};
