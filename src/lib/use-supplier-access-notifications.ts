import { useCallback, useEffect, useMemo, useState } from "react";
import {
  acknowledgeSupplierAccessNotifications,
  isSupplierAccessApiConfigured,
  readSupplierAccessNotifications,
  type BackendSupplierAccessNotification,
} from "@/lib/supplier-access-api";
import {
  getAllApprovalNotifications,
  getPendingApprovalNotifications,
  markNotificationSeen,
  type ApprovalNotification,
} from "@/lib/supplier-access-approval";
import {
  SUPPLIER_ACCESS_CHANGE_EVENT,
  type SupplierAccessChangeDetail,
} from "@/lib/supplier-access-requests";

export type SupplierAccessNotificationFeedStatus =
  | "idle"
  | "loading"
  | "ready"
  | "local"
  | "error";

export type SupplierAccessNotificationFeedItem =
  BackendSupplierAccessNotification & {
    source: "self_hosted" | "local_mock";
  };

export interface SupplierAccessNotificationsFeed {
  notifications: SupplierAccessNotificationFeedItem[];
  unreadCount: number;
  status: SupplierAccessNotificationFeedStatus;
  usingSelfHostedApi: boolean;
  refresh: () => Promise<void>;
  markRead: (notificationIds: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export interface UseSupplierAccessNotificationsOptions {
  /**
   * Header usage keeps this false so every page boot does not create an extra
   * notification request at 10,000 concurrent users. Opening the center still
   * refreshes explicitly.
   */
  autoLoad?: boolean;
}

const LOCAL_NOTIFICATION_PREFIX = "local-access-approved:";

const localNotificationId = (notification: ApprovalNotification) =>
  `${LOCAL_NOTIFICATION_PREFIX}${notification.supplierId}:${notification.approvedAt}`;

const localApprovalToFeedItem = (
  notification: ApprovalNotification,
): SupplierAccessNotificationFeedItem => ({
  id: localNotificationId(notification),
  supplierId: notification.supplierId,
  type: "price_access_approved",
  title: "Price access approved",
  body: "The supplier approved your request. Exact prices and supplier details are now available.",
  status: notification.seen ? "read" : "unread",
  createdAt: notification.approvedAt,
  readAt: notification.seen ? notification.approvedAt : null,
  source: "local_mock",
});

const localApprovalNotifications = (): SupplierAccessNotificationFeedItem[] =>
  getAllApprovalNotifications()
    .map(localApprovalToFeedItem)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const markLocalNotificationsRead = (notificationIds: string[]) => {
  const idSet = new Set(notificationIds);
  for (const notification of getPendingApprovalNotifications()) {
    if (idSet.has(localNotificationId(notification))) {
      markNotificationSeen(notification.supplierId);
    }
  }
};

export const useSupplierAccessNotifications = (
  options: UseSupplierAccessNotificationsOptions = {},
): SupplierAccessNotificationsFeed => {
  const autoLoad = options.autoLoad ?? true;
  const apiConfigured = isSupplierAccessApiConfigured();
  const [status, setStatus] = useState<SupplierAccessNotificationFeedStatus>("idle");
  const [notifications, setNotifications] = useState<SupplierAccessNotificationFeedItem[]>([]);

  const loadLocal = useCallback(() => {
    setNotifications(localApprovalNotifications());
    setStatus("local");
  }, []);

  const refresh = useCallback(async () => {
    if (!apiConfigured) {
      loadLocal();
      return;
    }

    setStatus((current) => (current === "ready" ? current : "loading"));
    try {
      const backendNotifications = await readSupplierAccessNotifications();
      setNotifications(
        backendNotifications.map((notification) => ({
          ...notification,
          source: "self_hosted" as const,
        })),
      );
      setStatus("ready");
    } catch {
      loadLocal();
      setStatus("error");
    }
  }, [apiConfigured, loadLocal]);

  const markRead = useCallback(
    async (notificationIds: string[]) => {
      const uniqueIds = [...new Set(notificationIds)].filter(Boolean);
      if (uniqueIds.length === 0) return;

      if (!apiConfigured) {
        markLocalNotificationsRead(uniqueIds);
        loadLocal();
        return;
      }

      const acknowledged = await acknowledgeSupplierAccessNotifications(uniqueIds);
      const acknowledgedById = new Map(
        acknowledged.map((notification) => [notification.id, notification]),
      );
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => {
          const updated = acknowledgedById.get(notification.id);
          if (updated) return { ...updated, source: "self_hosted" as const };
          if (!uniqueIds.includes(notification.id)) return notification;
          return {
            ...notification,
            status: "read",
            readAt: notification.readAt ?? readAt,
          };
        }),
      );
    },
    [apiConfigured, loadLocal],
  );

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((notification) => notification.status === "unread")
      .map((notification) => notification.id);
    await markRead(unreadIds);
  }, [markRead, notifications]);

  useEffect(() => {
    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, refresh]);

  useEffect(() => {
    const onSupplierAccessChange = (event: Event) => {
      const detail = (event as CustomEvent<SupplierAccessChangeDetail | undefined>).detail;
      if (!detail || detail.status !== "approved") return;
      void refresh();
    };
    window.addEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onSupplierAccessChange);
    return () => {
      window.removeEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onSupplierAccessChange);
    };
  }, [refresh]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status === "unread").length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    status,
    usingSelfHostedApi: apiConfigured,
    refresh,
    markRead,
    markAllRead,
  };
};
