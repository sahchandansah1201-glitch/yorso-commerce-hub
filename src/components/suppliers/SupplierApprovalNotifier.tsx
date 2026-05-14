/**
 * App-level boot effect:
 * - advances local mock supplier-access approvals without network traffic;
 * - syncs backend approval notifications from the self-hosted API;
 * - surfaces a one-time toast per newly-approved supplier.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  drainApprovalNotifications,
  processSupplierAccessRequests,
} from "@/lib/supplier-access-approval";
import {
  acknowledgeSupplierAccessNotifications,
  readSupplierAccessNotifications,
} from "@/lib/supplier-access-api";
import {
  BACKEND_NOTIFICATION_POLL_MS,
  MOCK_ACCESS_TICK_MS,
  applyBackendSupplierAccessNotifications,
} from "@/lib/supplier-approval-notifications";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

export const SupplierApprovalNotifier = () => {
  const location = useLocation();
  const { t } = useLanguage();
  useEffect(() => {
    let cancelled = false;
    let backendSyncInFlight = false;
    const showApprovalToast = () => {
      toast({
        title: t.supplierApprovalToast_title,
        description: t.supplierApprovalToast_desc,
      });
    };
    const tick = () => {
      processSupplierAccessRequests();
      drainApprovalNotifications(showApprovalToast);
    };
    const syncBackendNotifications = async () => {
      if (backendSyncInFlight) return;
      backendSyncInFlight = true;
      try {
        const notifications = await readSupplierAccessNotifications();
        if (cancelled) return;
        applyBackendSupplierAccessNotifications(notifications, showApprovalToast);
        const notificationIds = notifications
          .filter(
            (notification) =>
              notification.type === "price_access_approved" &&
              notification.status === "unread",
          )
          .map((notification) => notification.id);
        if (notificationIds.length > 0) {
          await acknowledgeSupplierAccessNotifications(notificationIds);
        }
      } finally {
        backendSyncInFlight = false;
      }
    };
    const syncBackendNotificationsWhenVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void syncBackendNotifications();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      tick();
      void syncBackendNotifications();
    };
    tick();
    syncBackendNotificationsWhenVisible();
    window.addEventListener("visibilitychange", handleVisibilityChange);
    const mockInterval = window.setInterval(tick, MOCK_ACCESS_TICK_MS);
    const backendInterval = window.setInterval(
      syncBackendNotificationsWhenVisible,
      BACKEND_NOTIFICATION_POLL_MS,
    );
    return () => {
      cancelled = true;
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(mockInterval);
      window.clearInterval(backendInterval);
    };
  }, [location.pathname, t]);
  return null;
};
