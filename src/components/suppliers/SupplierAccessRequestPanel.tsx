/**
 * SupplierAccessRequestPanel — one-click frontend-only access flow.
 *
 * The previous version asked the buyer to pick reasons. In v1 we removed
 * that step: a registered_locked buyer presses one CTA and the request
 * is created with `intent: "exact_price"`. This file exports two
 * components used by SupplierProfile:
 *
 *   SupplierAccessRequestPanel  - the unsent state (CTA + supporting copy)
 *   SupplierAccessRequestSent   - the sent / pending / approved status card
 *
 * No supplier company name is exposed before approval.
 *
 * All visible and accessibility strings are localized via useLanguage().
 * No hardcoded English copy may live in this file.
 */
import { CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSupplierAccessRequest,
  type SupplierAccessRequest,
  type SupplierAccessStatus,
} from "@/lib/supplier-access-requests";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface PanelProps {
  supplierId: string;
  supplierMaskedName: string;
  onSent: (req: SupplierAccessRequest) => void;
}

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
};

const formatSentDate = (iso: string, lang: string): string => {
  try {
    const locale = LOCALE_MAP[lang] ?? "en-US";
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const SupplierAccessRequestPanel = ({
  supplierId,
  supplierMaskedName,
  onSent,
}: PanelProps) => {
  const { t } = useLanguage();
  const handleClick = () => {
    const saved = createSupplierAccessRequest(supplierId);
    toast({
      title: t.supplier_accessPanel_toastTitle,
      description: t.supplier_accessPanel_toastDesc,
    });
    onSent(saved);
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-4">
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {t.supplier_accessPanel_title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.supplier_accessPanel_supplierLabel}:{" "}
          <span className="font-medium text-foreground">
            {supplierMaskedName}
          </span>
        </p>
      </div>
      <p className="text-xs leading-relaxed text-foreground/80">
        {t.supplier_accessPanel_explainer}
      </p>
      <Button
        type="button"
        onClick={handleClick}
        className="w-full gap-2"
        data-testid="supplier-request-price-access"
      >
        <Send className="h-4 w-4" aria-hidden />
        {t.supplier_accessPanel_cta}
      </Button>
    </div>
  );
};

const STATUS_TONE: Record<SupplierAccessStatus, string> = {
  sent: "border-border bg-muted/40 text-foreground",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

interface SentProps {
  request: SupplierAccessRequest;
  supplierMaskedName: string;
}

export const SupplierAccessRequestSent = ({
  request,
  supplierMaskedName,
}: SentProps) => {
  const { t, lang } = useLanguage();
  const sentDate = formatSentDate(request.sentAt, lang);

  const statusLabel: Record<SupplierAccessStatus, string> = {
    sent: t.supplier_accessPanel_status_sent,
    pending: t.supplier_accessPanel_status_pending,
    approved: t.supplier_accessPanel_status_approved,
  };
  const nextStep: Record<SupplierAccessStatus, string> = {
    sent: t.supplier_accessPanel_nextStep_sent,
    pending: t.supplier_accessPanel_nextStep_pending,
    approved: t.supplier_accessPanel_nextStep_approved,
  };

  const Icon =
    request.status === "approved"
      ? CheckCircle2
      : request.status === "pending"
        ? Loader2
        : Clock;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="supplier-access-request-status"
      data-status={request.status}
      className={`rounded-md border p-4 ${STATUS_TONE[request.status]}`}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
            request.status === "pending" ? "animate-spin" : ""
          }`}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{statusLabel[request.status]}</p>
          <p className="mt-1 text-xs opacity-90">{nextStep[request.status]}</p>
          <p className="sr-only">{t.supplier_accessPanel_srSent}</p>
          <dl className="mt-3 space-y-1 text-[11px] opacity-80">
            <div>
              <dt className="inline opacity-70">
                {t.supplier_accessPanel_supplierLabel}:{" "}
              </dt>
              <dd className="inline font-medium">{supplierMaskedName}</dd>
            </div>
            <div>
              <dt className="inline opacity-70">
                {t.supplier_accessPanel_sentLabel}:{" "}
              </dt>
              <dd className="inline font-medium">{sentDate}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
