import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SUPPLIER_ACCESS_CHANGE_EVENT,
  type SupplierAccessChangeDetail,
} from "@/lib/supplier-access-requests";
import { useLanguage } from "@/i18n/LanguageContext";

interface SupplierAccessRefreshBannerProps {
  onRefresh?: () => void;
  supplierId: string | null | undefined;
}

const shouldShowRefreshNotice = (
  supplierId: string | null | undefined,
  detail: SupplierAccessChangeDetail | undefined,
) => {
  if (!supplierId || !detail) return false;
  if (detail.supplierId !== supplierId) return false;
  if (detail.status !== "approved") return false;
  return detail.source === "backend_notification" || detail.source === "mock_progression";
};

export const SupplierAccessRefreshBanner = ({
  onRefresh,
  supplierId,
}: SupplierAccessRefreshBannerProps) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onSupplierAccessChange = (event: Event) => {
      const detail = (event as CustomEvent<SupplierAccessChangeDetail | undefined>).detail;
      if (shouldShowRefreshNotice(supplierId, detail)) setVisible(true);
    };
    window.addEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onSupplierAccessChange);
    return () => {
      window.removeEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onSupplierAccessChange);
    };
  }, [supplierId]);

  if (!visible) return null;

  return (
    <div
      data-testid="supplier-access-refresh-banner"
      role="status"
      aria-live="polite"
      className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4 text-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{t.supplier_accessRefresh_title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t.supplier_accessRefresh_body}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {onRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              data-testid="supplier-access-refresh-now"
              onClick={() => {
                onRefresh();
                setVisible(false);
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {t.supplier_accessRefresh_cta}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5"
            data-testid="supplier-access-refresh-dismiss"
            onClick={() => setVisible(false)}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t.supplier_accessRefresh_dismiss}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierAccessRefreshBanner;
