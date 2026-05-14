import { setQualified } from "@/lib/access-level";
import { persistSupplierAccessRequest } from "@/lib/supplier-access-requests";

export const BACKEND_NOTIFICATION_SEEN_KEY = "yorso_backend_access_notifications_seen";
export const MOCK_ACCESS_TICK_MS = 2_000;
export const BACKEND_NOTIFICATION_POLL_MS = 60_000;

export interface SupplierApprovalNotification {
  id: string;
  supplierId: string;
  type: "price_access_approved";
  title: string;
  body: string;
  status: "unread" | "read";
  createdAt: string;
  readAt: string | null;
}

const readSeenBackendNotifications = (): Set<string> => {
  try {
    const raw = localStorage.getItem(BACKEND_NOTIFICATION_SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
};

const writeSeenBackendNotifications = (seen: Set<string>) => {
  try {
    localStorage.setItem(BACKEND_NOTIFICATION_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
};

export const applyBackendSupplierAccessNotifications = (
  notifications: SupplierApprovalNotification[],
  showApprovalToast: () => void,
): number => {
  if (notifications.length === 0) return 0;

  const seen = readSeenBackendNotifications();
  let applied = 0;

  for (const notification of notifications) {
    if (notification.type !== "price_access_approved" || seen.has(notification.id)) {
      continue;
    }

    const approvedAt = notification.createdAt;
    persistSupplierAccessRequest({
      supplierId: notification.supplierId,
      intent: "exact_price",
      status: "approved",
      sentAt: approvedAt,
      pendingAt: approvedAt,
      approvedAt,
      reasons: ["exact_price"],
      message: "",
    });
    setQualified(true, "");
    showApprovalToast();
    seen.add(notification.id);
    applied += 1;
  }

  if (applied > 0) writeSeenBackendNotifications(seen);
  return applied;
};
