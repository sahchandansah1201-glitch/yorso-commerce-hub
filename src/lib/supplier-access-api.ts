/**
 * Supplier access adapter.
 *
 * This is the bridge between the current frontend-only Supplier Access Flow
 * and the new backend access foundation:
 *
 * - when `VITE_YORSO_API_URL` is configured, use the self-hosted YORSO API;
 * - when the self-hosted API is not configured, keep the localStorage preview
 *   mock so the buyer flow remains usable in local/static demos;
 * - never fall back to hosted auth, RLS or prototype tables;
 * - never expose supplier identity here. This adapter only carries status.
 */
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
  options?: { notify?: boolean; source?: "backend_read" | "local_request" },
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
  { notify: options?.notify, source: options?.source ?? "backend_read" },
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
          { notify: false, source: "backend_read" },
        );
      }
      return response.request
        ? mapBackendApiRequest(response.request, { notify: false, source: "backend_read" })
        : null;
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
      return mapBackendApiRequest(response.request, { notify: false, source: "local_request" });
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
      clearSupplierAccessRequest(supplierId);
      return null;
    }
  }

  return getSupplierAccessRequest(supplierId);
};

export const requestSupplierAccess = async (
  supplierId: string,
): Promise<SupplierAccessRequest> => {
  const selfHosted = createSupplierAccessApiClient();
  if (selfHosted.enabled) {
    return selfHosted.request(supplierId);
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
