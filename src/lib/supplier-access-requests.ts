/**
 * Frontend-only persistence for supplier access requests.
 *
 * Storage: localStorage (so the one-time approval notification survives
 * tab close and the buyer's "next visit"). Stored under a single key:
 *
 *   yorso_supplier_access_requests = {
 *     [supplierId]: SupplierAccessRequest
 *   }
 *
 * Status progression (mock, frontend only):
 *   sent -> pending -> approved
 *
 * Intent is always "exact_price" — the one-click flow no longer asks
 * the buyer to choose reasons. Legacy fields (`reasons`, `message`) are
 * preserved when present so older sessionStorage records do not crash
 * the UI.
 */

export const SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY =
  "yorso_supplier_access_requests";

/** Legacy reason enum kept for backward compatibility only. */
export type SupplierAccessReason =
  | "exact_price"
  | "supplier_contact"
  | "documents"
  | "full_catalog";

export type SupplierAccessIntent = "exact_price";

export type SupplierAccessStatus = "sent" | "pending" | "approved";

export interface SupplierAccessRequest {
  status: SupplierAccessStatus;
  intent: SupplierAccessIntent;
  supplierId: string;
  sentAt: string;
  pendingAt?: string;
  approvedAt?: string;
  /** When the mock approval is due to flip status to "approved". */
  mockApproveAt?: string;
  /** When the buyer has acknowledged the approval notification. */
  notificationSeenAt?: string;
  /** Legacy fields retained for backward compatibility. */
  reasons?: SupplierAccessReason[];
  message?: string;
}

type Store = Record<string, SupplierAccessRequest>;

/** Mock progression delays. Kept short so the demo flow is observable. */
export const MOCK_PENDING_DELAY_MS = 1500;
export const MOCK_APPROVE_DELAY_MS = 6000;

const isBrowser = (): boolean => typeof window !== "undefined";

/** Read-then-migrate: prefer localStorage, fall back to legacy sessionStorage. */
const readRaw = (): string | null => {
  if (!isBrowser()) return null;
  try {
    const ls = localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY);
    if (ls) return ls;
    const ss = sessionStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY);
    if (ss) {
      // Migrate to localStorage so future visits see it.
      try {
        localStorage.setItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY, ss);
      } catch {
        /* ignore */
      }
      return ss;
    }
    return null;
  } catch {
    return null;
  }
};

const sanitize = (raw: unknown, supplierId: string): SupplierAccessRequest | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<SupplierAccessRequest> & { status?: unknown };
  const status: SupplierAccessStatus =
    r.status === "pending" || r.status === "approved" ? r.status : "sent";
  const sentAt =
    typeof r.sentAt === "string" && !Number.isNaN(Date.parse(r.sentAt))
      ? r.sentAt
      : new Date().toISOString();
  return {
    status,
    intent: "exact_price",
    supplierId: typeof r.supplierId === "string" ? r.supplierId : supplierId,
    sentAt,
    pendingAt: typeof r.pendingAt === "string" ? r.pendingAt : undefined,
    approvedAt: typeof r.approvedAt === "string" ? r.approvedAt : undefined,
    mockApproveAt: typeof r.mockApproveAt === "string" ? r.mockApproveAt : undefined,
    notificationSeenAt:
      typeof r.notificationSeenAt === "string" ? r.notificationSeenAt : undefined,
    reasons: Array.isArray(r.reasons)
      ? (r.reasons.filter((x) => typeof x === "string") as SupplierAccessReason[])
      : undefined,
    message: typeof r.message === "string" ? r.message : undefined,
  };
};

const safeRead = (): Store => {
  try {
    const raw = readRaw();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Store = {};
    for (const [supplierId, value] of Object.entries(parsed)) {
      const sane = sanitize(value, supplierId);
      if (sane) out[supplierId] = sane;
    }
    return out;
  } catch {
    return {};
  }
};

const safeWrite = (store: Store) => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    /* storage unavailable */
  }
  // Mirror to sessionStorage so legacy code paths (and existing tests
  // that read sessionStorage) keep observing the same state.
  try {
    sessionStorage.setItem(
      SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    /* ignore */
  }
};

export const getAllSupplierAccessRequests = (): Store => safeRead();

export const getSupplierAccessRequest = (
  supplierId: string | undefined,
): SupplierAccessRequest | null => {
  if (!supplierId) return null;
  const store = safeRead();
  return store[supplierId] ?? null;
};

/** Create a new "sent" request with a scheduled mock approval time. */
export const createSupplierAccessRequest = (
  supplierId: string,
  options?: { now?: number; approveDelayMs?: number },
): SupplierAccessRequest => {
  const now = options?.now ?? Date.now();
  const approveDelayMs = options?.approveDelayMs ?? MOCK_APPROVE_DELAY_MS;
  const record: SupplierAccessRequest = {
    status: "sent",
    intent: "exact_price",
    supplierId,
    sentAt: new Date(now).toISOString(),
    mockApproveAt: new Date(now + approveDelayMs).toISOString(),
    // Keep legacy fields populated so older readers still find them.
    reasons: ["exact_price"],
    message: "",
  };
  const store = safeRead();
  store[supplierId] = record;
  safeWrite(store);
  return record;
};

/** Persist an updated request (used by the approval helper). */
export const updateSupplierAccessRequest = (
  supplierId: string,
  patch: Partial<SupplierAccessRequest>,
): SupplierAccessRequest | null => {
  const store = safeRead();
  const existing = store[supplierId];
  if (!existing) return null;
  const updated: SupplierAccessRequest = { ...existing, ...patch };
  store[supplierId] = updated;
  safeWrite(store);
  return updated;
};

export const REASON_LABEL: Record<SupplierAccessReason, string> = {
  exact_price: "Exact price access",
  supplier_contact: "Supplier contact",
  documents: "Documents",
  full_catalog: "Full catalog",
};

export const ALL_REASONS: SupplierAccessReason[] = [
  "exact_price",
  "supplier_contact",
  "documents",
  "full_catalog",
];

/**
 * Legacy alias retained so existing imports continue to compile. Forwards
 * to `createSupplierAccessRequest` and ignores the old reason/message
 * inputs (intent is always exact_price in the one-click flow).
 */
export const saveSupplierAccessRequest = (
  supplierId: string,
  _input?: { reasons?: SupplierAccessReason[]; message?: string },
): SupplierAccessRequest => createSupplierAccessRequest(supplierId);
