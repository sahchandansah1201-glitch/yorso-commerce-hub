/**
 * App-level boot effect: on every mount and on route changes, advance
 * any pending mock supplier-access approvals and surface a one-time
 * toast notification per newly-approved supplier.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  drainApprovalNotifications,
  processSupplierAccessRequests,
} from "@/lib/supplier-access-approval";
import { setQualified } from "@/lib/access-level";
import { readSupplierAccessNotifications } from "@/lib/supplier-access-api";
import { persistSupplierAccessRequest } from "@/lib/supplier-access-requests";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

const BACKEND_NOTIFICATION_SEEN_KEY = "yorso_backend_access_notifications_seen";

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

export const SupplierApprovalNotifier = () => {
  const location = useLocation();
  const { t } = useLanguage();
  useEffect(() => {
    let cancelled = false;
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
      const notifications = await readSupplierAccessNotifications();
      if (cancelled || notifications.length === 0) return;

      const seen = readSeenBackendNotifications();
      let changed = false;

      for (const notification of notifications) {
        if (notification.type !== "price_access_approved" || seen.has(notification.id)) continue;

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
        changed = true;
      }

      if (changed) writeSeenBackendNotifications(seen);
    };
    tick();
    void syncBackendNotifications();
    const interval = window.setInterval(() => {
      tick();
      void syncBackendNotifications();
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [location.pathname, t]);
  return null;
};
