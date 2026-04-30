/**
 * Mock approval pipeline for supplier access requests.
 *
 * Frontend-only. On every app boot (and on each Supplier Profile mount)
 * we scan persisted access requests:
 *   - "sent" requests are bumped to "pending" immediately so the buyer
 *     sees a state change after submitting.
 *   - "pending" requests whose `mockApproveAt` has elapsed are flipped
 *     to "approved", we apply the existing qualified-access mechanism,
 *     and we queue a one-time toast notification for the buyer.
 *
 * The notification is queued in localStorage so it survives the buyer
 * closing the tab and coming back later.
 */
import {
  getAllSupplierAccessRequests,
  updateSupplierAccessRequest,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import { setQualified } from "@/lib/access-level";

export const APPROVAL_NOTIFICATIONS_KEY =
  "yorso_supplier_access_notifications";

export interface ApprovalNotification {
  supplierId: string;
  approvedAt: string;
  seen: boolean;
}

type NotificationStore = Record<string, ApprovalNotification>;

const isBrowser = (): boolean => typeof window !== "undefined";

const readNotifications = (): NotificationStore => {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(APPROVAL_NOTIFICATIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as NotificationStore;
  } catch {
    return {};
  }
};

const writeNotifications = (store: NotificationStore) => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(APPROVAL_NOTIFICATIONS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
};

export const queueApprovalNotification = (supplierId: string, approvedAt: string) => {
  const store = readNotifications();
  if (store[supplierId]?.seen) return;
  store[supplierId] = { supplierId, approvedAt, seen: false };
  writeNotifications(store);
};

export const getPendingApprovalNotifications = (): ApprovalNotification[] => {
  const store = readNotifications();
  return Object.values(store).filter((n) => !n.seen);
};

export const markNotificationSeen = (supplierId: string) => {
  const store = readNotifications();
  if (!store[supplierId]) return;
  store[supplierId] = { ...store[supplierId], seen: true };
  writeNotifications(store);
};

export interface ProcessResult {
  changedAny: boolean;
  newlyApproved: SupplierAccessRequest[];
}

/**
 * Advance request status based on elapsed time. Safe to call as often
 * as you like; it is idempotent for already-approved requests.
 */
export const processSupplierAccessRequests = (
  options?: { now?: number },
): ProcessResult => {
  const now = options?.now ?? Date.now();
  const all = getAllSupplierAccessRequests();
  const newlyApproved: SupplierAccessRequest[] = [];
  let changedAny = false;

  for (const req of Object.values(all)) {
    if (req.status === "approved") continue;

    if (req.status === "sent") {
      const updated = updateSupplierAccessRequest(req.supplierId, {
        status: "pending",
        pendingAt: new Date(now).toISOString(),
      });
      if (updated) changedAny = true;
    }

    const dueAt = req.mockApproveAt ? Date.parse(req.mockApproveAt) : NaN;
    if (!Number.isNaN(dueAt) && now >= dueAt) {
      const approvedAt = new Date(now).toISOString();
      const updated = updateSupplierAccessRequest(req.supplierId, {
        status: "approved",
        approvedAt,
        pendingAt: req.pendingAt ?? new Date(now).toISOString(),
      });
      if (updated) {
        changedAny = true;
        newlyApproved.push(updated);
        // Apply qualified access (companyName resolved by caller via
        // mockSuppliers; we keep this helper free of that dependency).
        setQualified(true, "");
        queueApprovalNotification(req.supplierId, approvedAt);
      }
    }
  }

  return { changedAny, newlyApproved };
};

/**
 * Drain pending approval notifications. Calls the provided notify
 * callback exactly once per supplier and marks each one as seen so it
 * never fires again.
 */
export const drainApprovalNotifications = (
  notify: (n: ApprovalNotification) => void,
): ApprovalNotification[] => {
  const pending = getPendingApprovalNotifications();
  for (const n of pending) {
    notify(n);
    markNotificationSeen(n.supplierId);
  }
  return pending;
};
