/**
 * App-level boot effect: on every mount (route change / initial visit),
 * advance any pending mock supplier-access approvals and surface a
 * one-time toast notification per newly-approved supplier.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getPendingApprovalNotifications,
  markNotificationSeen,
  processSupplierAccessRequests,
} from "@/lib/supplier-access-approval";
import { toast } from "@/hooks/use-toast";

export const SupplierApprovalNotifier = () => {
  const location = useLocation();
  useEffect(() => {
    processSupplierAccessRequests();
    const pending = getPendingApprovalNotifications();
    for (const n of pending) {
      toast({
        title: "Price access approved",
        description:
          "You can now view exact prices and supplier details.",
      });
      markNotificationSeen(n.supplierId);
    }
    // Re-check periodically while the app is open, so an approval that
    // becomes due during a long session also surfaces a notification.
    const interval = window.setInterval(() => {
      processSupplierAccessRequests();
      const due = getPendingApprovalNotifications();
      for (const n of due) {
        toast({
          title: "Price access approved",
          description:
            "You can now view exact prices and supplier details.",
        });
        markNotificationSeen(n.supplierId);
      }
    }, 2000);
    return () => window.clearInterval(interval);
    // location.pathname intentionally re-runs the boot scan on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return null;
};
