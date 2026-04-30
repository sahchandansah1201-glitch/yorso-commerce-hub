/**
 * SupplierAccessRequestPanel — one-click frontend-only access flow.
 *
 * The previous version asked the buyer to pick reasons. In v1 we removed
 * that step: a registered_locked buyer presses one CTA and the request
 * is created with `intent: "exact_price"`. This file now exports two
 * components used by SupplierProfile:
 *
 *   SupplierAccessRequestPanel  - the unsent state (CTA + supporting copy)
 *   SupplierAccessRequestSent   - the sent / pending / approved status card
 *
 * No supplier company name is exposed before approval.
 */
import { CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSupplierAccessRequest,
  type SupplierAccessRequest,
  type SupplierAccessStatus,
} from "@/lib/supplier-access-requests";
import { toast } from "@/hooks/use-toast";

interface PanelProps {
  supplierId: string;
  supplierMaskedName: string;
  onSent: (req: SupplierAccessRequest) => void;
}

export const SupplierAccessRequestPanel = ({
  supplierId,
  supplierMaskedName,
  onSent,
}: PanelProps) => {
  const handleClick = () => {
    const saved = createSupplierAccessRequest(supplierId);
    toast({
      title: "Access request sent",
      description:
        "Supplier review is pending. You will be notified when access is granted.",
    });
    onSent(saved);
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-4">
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground">
          Request price access
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Supplier:{" "}
          <span className="font-medium text-foreground">
            {supplierMaskedName}
          </span>
        </p>
      </div>
      <p className="text-xs leading-relaxed text-foreground/80">
        The supplier reviews your buyer profile before sharing exact prices,
        contact channel, and full catalog.
      </p>
      <Button
        type="button"
        onClick={handleClick}
        className="w-full gap-2"
        data-testid="supplier-request-price-access"
      >
        <Send className="h-4 w-4" aria-hidden />
        Request price access
      </Button>
    </div>
  );
};

const STATUS_LABEL: Record<SupplierAccessStatus, string> = {
  sent: "Request sent",
  pending: "Supplier review pending",
  approved: "Price access approved",
};

const NEXT_STEP: Record<SupplierAccessStatus, string> = {
  sent: "We forwarded your request. The supplier will respond shortly.",
  pending:
    "The supplier is reviewing your buyer profile. You will be notified when access is granted.",
  approved:
    "You can now view exact prices and supplier details on this profile.",
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
  const sentDate = (() => {
    try {
      return new Date(request.sentAt).toLocaleString();
    } catch {
      return request.sentAt;
    }
  })();
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
          <p className="text-sm font-semibold">
            {STATUS_LABEL[request.status]}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {NEXT_STEP[request.status]}
          </p>
          <p className="sr-only">Access request sent</p>
          <dl className="mt-3 space-y-1 text-[11px] opacity-80">
            <div>
              <dt className="inline opacity-70">Supplier: </dt>
              <dd className="inline font-medium">{supplierMaskedName}</dd>
            </div>
            <div>
              <dt className="inline opacity-70">Sent: </dt>
              <dd className="inline font-medium">{sentDate}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
