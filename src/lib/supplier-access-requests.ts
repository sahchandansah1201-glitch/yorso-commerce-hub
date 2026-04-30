/**
 * Frontend-only persistence for supplier access requests.
 *
 * Stored in sessionStorage under a single key:
 *   yorso_supplier_access_requests = {
 *     [supplierId]: {
 *       status: "sent",
 *       reasons: string[],
 *       message: string,
 *       sentAt: string (ISO)
 *     }
 *   }
 *
 * No backend, no real review — just a per-supplier "request sent" marker
 * that survives refreshes within the same session.
 */

export const SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY =
  "yorso_supplier_access_requests";

export type SupplierAccessReason =
  | "exact_price"
  | "supplier_contact"
  | "documents"
  | "full_catalog";

export interface SupplierAccessRequest {
  status: "sent";
  reasons: SupplierAccessReason[];
  message: string;
  sentAt: string;
}

type Store = Record<string, SupplierAccessRequest>;

const safeRead = (): Store => {
  try {
    const raw = sessionStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Store;
    return {};
  } catch {
    return {};
  }
};

const safeWrite = (store: Store) => {
  try {
    sessionStorage.setItem(
      SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    // storage unavailable — silent fail
  }
};

export const getSupplierAccessRequest = (
  supplierId: string | undefined,
): SupplierAccessRequest | null => {
  if (!supplierId) return null;
  const store = safeRead();
  return store[supplierId] ?? null;
};

export const saveSupplierAccessRequest = (
  supplierId: string,
  input: { reasons: SupplierAccessReason[]; message: string },
): SupplierAccessRequest => {
  const record: SupplierAccessRequest = {
    status: "sent",
    reasons: input.reasons,
    message: input.message,
    sentAt: new Date().toISOString(),
  };
  const store = safeRead();
  store[supplierId] = record;
  safeWrite(store);
  return record;
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
