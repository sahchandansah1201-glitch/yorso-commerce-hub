/**
 * Supplier access adapter.
 *
 * This is the bridge between the current frontend-only Supplier Access Flow
 * and the new backend access foundation:
 *
 * - when `VITE_YORSO_API_URL` is configured, use the self-hosted YORSO API;
 * - when the self-hosted API is not configured, keep the current prototype flow
 *   working through Supabase/localStorage fallback;
 * - never expose supplier identity here. This adapter only carries status.
 */
import type { Json } from "@/integrations/supabase/types";
import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountApiBaseUrl,
  getConfiguredAccountUserId,
} from "@/lib/account-api";
import { buyerSession } from "@/lib/buyer-session";
import {
  clearSupplierAccessRequest,
  createSupplierAccessRequest,
  getSupplierAccessRequest,
  persistSupplierAccessRequest,
  type SupplierAccessRequest,
  type SupplierAccessStatus,
} from "@/lib/supplier-access-requests";

type BackendSupplierAccessStatus =
  | "sent"
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

interface SupplierAccessRequestRow {
  id: string;
  supplier_id: string;
  status: BackendSupplierAccessStatus;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
}

interface BackendSupplierAccessRequest {
  id: string;
  supplierId: string;
  status: BackendSupplierAccessStatus;
  intent: "exact_price";
  message: string;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
}

interface BackendSupplierAccessResponse {
  ok: true;
  request: BackendSupplierAccessRequest | null;
  accessGranted: boolean;
  requestId: string;
}

export interface BackendSupplierAccessNotification {
  id: string;
  supplierId: string;
  type: "price_access_approved";
  title: string;
  body: string;
  status: "unread" | "read";
  createdAt: string;
  readAt: string | null;
}

interface BackendSupplierAccessNotificationsResponse {
  ok: true;
  notifications: BackendSupplierAccessNotification[];
  requestId: string;
}

interface BackendSupplierAccessNotificationsAckResponse {
  ok: true;
  notifications: BackendSupplierAccessNotification[];
  markedReadCount: number;
  requestId: string;
}

export interface SupplierAccessApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  userId?: string;
  sessionId?: string;
}

type SupabaseClient = typeof import("@/integrations/supabase/client")["supabase"];
type SupabaseAccessClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: SupplierAccessRequestRow | null;
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
          data: SupplierAccessRequestRow | null;
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

const asAccessClient = (supabase: SupabaseClient): SupabaseAccessClient =>
  supabase as unknown as SupabaseAccessClient;

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

const jsonHeaders = (headers?: HeadersInit) => {
  const next = new Headers(headers);
  next.set("content-type", "application/json");
  return next;
};

const mapBackendApiStatus = (
  status: BackendSupplierAccessStatus,
): SupplierAccessStatus => {
  if (status === "sent" || status === "pending" || status === "approved") return status;
  return "pending";
};

const mapBackendApiRequest = (
  row: BackendSupplierAccessRequest,
): SupplierAccessRequest => persistSupplierAccessRequest(
  {
    supplierId: row.supplierId,
    intent: "exact_price",
    status: mapBackendApiStatus(row.status),
    sentAt: row.createdAt,
    pendingAt:
      row.status === "pending" || row.status === "approved"
        ? row.updatedAt
        : undefined,
    approvedAt:
      row.status === "approved" ? row.decidedAt ?? row.updatedAt : undefined,
    reasons: ["exact_price"],
    message: row.message,
  },
  { source: "backend_read" },
);

export function createSupplierAccessApiClient(
  options: SupplierAccessApiClientOptions = {},
) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAccountApiBaseUrl());
  const fetchImpl = options.fetchImpl ?? fetch;
  const accountUserId = options.userId?.trim() || getConfiguredAccountUserId();
  const sessionId = options.sessionId?.trim() || buyerSession.getSession()?.id || "";

  const accountHeaders = (headers?: HeadersInit) => {
    const next = jsonHeaders(headers);
    next.set(ACCOUNT_USER_ID_HEADER, accountUserId);
    if (sessionId) next.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
    return next;
  };

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    if (!baseUrl) throw new Error("supplier_access_api_disabled");
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: accountHeaders(init?.headers),
    });
    const body = await response.json() as T & { error?: { code?: string } };
    if (!response.ok) throw new Error(body.error?.code ?? `supplier_access_api_${response.status}`);
    return body;
  };

  return {
    enabled: Boolean(baseUrl),
    async read(supplierId: string): Promise<SupplierAccessRequest | null> {
      const response = await request<BackendSupplierAccessResponse>(
        `/v1/access/suppliers/${encodeURIComponent(supplierId)}/request`,
      );
      if (!response.request && response.accessGranted) {
        const at = new Date().toISOString();
        return persistSupplierAccessRequest(
          {
            supplierId,
            intent: "exact_price",
            status: "approved",
            sentAt: at,
            pendingAt: at,
            approvedAt: at,
            reasons: ["exact_price"],
            message: "",
          },
          { source: "backend_read" },
        );
      }
      return response.request ? mapBackendApiRequest(response.request) : null;
    },
    async request(supplierId: string): Promise<SupplierAccessRequest> {
      const response = await request<BackendSupplierAccessResponse>(
        `/v1/access/suppliers/${encodeURIComponent(supplierId)}/request`,
        {
          method: "POST",
          body: JSON.stringify({ message: "" }),
        },
      );
      if (!response.request) throw new Error("supplier_access_api_empty_request");
      return mapBackendApiRequest(response.request);
    },
    async notifications() {
      const response = await request<BackendSupplierAccessNotificationsResponse>(
        "/v1/access/notifications",
      );
      return response.notifications;
    },
    async acknowledgeNotifications(notificationIds: string[]) {
      if (notificationIds.length === 0) return [];
      const response = await request<BackendSupplierAccessNotificationsAckResponse>(
        "/v1/access/notifications",
        {
          method: "PATCH",
          body: JSON.stringify({ notificationIds }),
        },
      );
      return response.notifications;
    },
  };
}

export const isSupplierAccessApiConfigured = () =>
  createSupplierAccessApiClient().enabled;

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
  status: BackendSupplierAccessStatus,
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

  return persistSupplierAccessRequest(request, { source: "backend_read" });
};

const selectSupplierAccessRequest = async (
  supabase: SupabaseClient,
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
  return mapBackendRequest(data as SupplierAccessRequestRow);
};

const logSupplierAccessRequestEvent = async (
  supabase: SupabaseClient,
  requestId: string,
) => {
  try {
    await asAccessClient(supabase).rpc("log_supplier_access_event", {
      p_supplier_access_request_id: requestId,
      p_event_type: "supplier_access_requested",
      p_metadata: { source: "supplier_access_api" } satisfies Json,
    });
  } catch {
    // Audit logging must not break the buyer request flow.
  }
};

export const readSupplierAccessRequest = async (
  supplierId: string | undefined,
): Promise<SupplierAccessRequest | null> => {
  if (!supplierId) return null;

  const selfHosted = createSupplierAccessApiClient();
  if (selfHosted.enabled) {
    try {
      const backendRequest = await selfHosted.read(supplierId);
      if (backendRequest) return backendRequest;
      clearSupplierAccessRequest(supplierId);
      return null;
    } catch {
      // Keep preview resilient: prototype fallback continues below.
    }
  }

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
  const selfHosted = createSupplierAccessApiClient();
  if (selfHosted.enabled) {
    try {
      return await selfHosted.request(supplierId);
    } catch {
      // Keep preview resilient: prototype fallback continues below.
    }
  }

  const supabase = await getSupabaseClient();
  const userId = supabase ? await getCurrentUserId(supabase) : null;

  if (supabase && userId) {
    const existing = await selectSupplierAccessRequest(supabase, supplierId, userId);
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
        await logSupplierAccessRequestEvent(
          supabase,
          (data as SupplierAccessRequestRow).id,
        );
        const mapped = mapBackendRequest(data as SupplierAccessRequestRow);
        if (mapped) return mapped;
      }
    } catch {
      // Fall through to local mock fallback.
    }
  }

  return createSupplierAccessRequest(supplierId);
};

export const readSupplierAccessNotifications = async () => {
  const selfHosted = createSupplierAccessApiClient();
  if (!selfHosted.enabled) return [];
  try {
    return await selfHosted.notifications();
  } catch {
    return [];
  }
};

export const acknowledgeSupplierAccessNotifications = async (
  notificationIds: string[],
) => {
  if (notificationIds.length === 0) return [];

  const selfHosted = createSupplierAccessApiClient();
  if (!selfHosted.enabled) return [];
  try {
    return await selfHosted.acknowledgeNotifications(notificationIds);
  } catch {
    return [];
  }
};
