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
import { useLanguage } from "@/i18n/LanguageContext";

export const SupplierApprovalNotifier = () => {
  const location = useLocation();
  const { t } = useLanguage();
  useEffect(() => {
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
    tick();
    const interval = window.setInterval(tick, 2000);
    return () => window.clearInterval(interval);
  }, [location.pathname, t]);
  return null;
};
