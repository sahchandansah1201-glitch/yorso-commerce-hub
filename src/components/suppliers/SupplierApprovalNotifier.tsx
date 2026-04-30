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
import { toast } from "@/hooks/use-toast";

const showApprovalToast = () => {
  toast({
    title: "Price access approved",
    description: "You can now view exact prices and supplier details.",
  });
};

export const SupplierApprovalNotifier = () => {
  const location = useLocation();
  useEffect(() => {
    const tick = () => {
      processSupplierAccessRequests();
      drainApprovalNotifications(showApprovalToast);
    };
    tick();
    const interval = window.setInterval(tick, 2000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return null;
};
