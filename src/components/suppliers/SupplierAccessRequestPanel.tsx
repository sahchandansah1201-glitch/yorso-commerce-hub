/**
 * SupplierAccessRequestPanel
 *
 * Inline frontend-only access-request form rendered on Supplier Profile
 * for registered_locked buyers. Replaces the previous toast-only CTA.
 *
 * Constraints:
 * - Never reveals supplier companyName — receives maskedName only.
 * - Persists state via sessionStorage (see lib/supplier-access-requests).
 * - Validates that at least one reason is selected before submit.
 */
import { useId, useState } from "react";
import { CheckCircle2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ALL_REASONS,
  REASON_LABEL,
  saveSupplierAccessRequest,
  type SupplierAccessReason,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import { toast } from "@/hooks/use-toast";

interface BuyerSummary {
  identifier?: string;
  company?: string;
  country?: string;
}

interface Props {
  supplierId: string;
  supplierMaskedName: string;
  buyer: BuyerSummary;
  onSent: (req: SupplierAccessRequest) => void;
  onCancel: () => void;
}

export const SupplierAccessRequestPanel = ({
  supplierId,
  supplierMaskedName,
  buyer,
  onSent,
  onCancel,
}: Props) => {
  const [reasons, setReasons] = useState<SupplierAccessReason[]>([
    "exact_price",
  ]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const formId = useId();

  const toggleReason = (r: SupplierAccessReason) => {
    setReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reasons.length === 0) {
      setError("Select at least one reason for the access request.");
      return;
    }
    const saved = saveSupplierAccessRequest(supplierId, {
      reasons,
      message: message.trim(),
    });
    toast({
      title: "Access request sent",
      description:
        "Supplier review is pending in this prototype. We will notify you when access changes.",
    });
    onSent(saved);
  };

  const buyerHasDetails = !!(buyer.identifier || buyer.company || buyer.country);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      aria-labelledby={`${formId}-title`}
      className="space-y-4 rounded-md border border-border bg-background p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3
            id={`${formId}-title`}
            className="font-heading text-sm font-semibold text-foreground"
          >
            Request supplier access
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Supplier:{" "}
            <span className="font-medium text-foreground">
              {supplierMaskedName}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Close access request form"
          className="h-7 w-7"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="rounded border border-border bg-muted/40 p-3 text-xs text-foreground/80">
        <p className="font-medium uppercase tracking-wider text-[10px] text-muted-foreground">
          Buyer summary
        </p>
        {buyerHasDetails ? (
          <ul className="mt-1.5 space-y-0.5">
            {buyer.identifier && (
              <li>
                <span className="text-muted-foreground">Account: </span>
                <span className="font-medium text-foreground">
                  {buyer.identifier}
                </span>
              </li>
            )}
            {buyer.company && (
              <li>
                <span className="text-muted-foreground">Company: </span>
                <span className="font-medium text-foreground">
                  {buyer.company}
                </span>
              </li>
            )}
            {buyer.country && (
              <li>
                <span className="text-muted-foreground">Country: </span>
                <span className="font-medium text-foreground">
                  {buyer.country}
                </span>
              </li>
            )}
          </ul>
        ) : (
          <p className="mt-1.5">
            Buyer profile details will be completed during qualification.
          </p>
        )}
      </div>

      <fieldset
        className="space-y-2"
        aria-describedby={error ? errorId : undefined}
      >
        <legend className="text-xs font-medium text-foreground">
          What are you requesting?
        </legend>
        <ul className="space-y-1.5">
          {ALL_REASONS.map((r) => {
            const checked = reasons.includes(r);
            const id = `${formId}-reason-${r}`;
            return (
              <li key={r} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggleReason(r)}
                />
                <Label
                  htmlFor={id}
                  className="cursor-pointer text-sm font-normal text-foreground"
                >
                  {REASON_LABEL[r]}
                </Label>
              </li>
            );
          })}
        </ul>
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </fieldset>

      <div>
        <Label
          htmlFor={`${formId}-message`}
          className="text-xs font-medium text-foreground"
        >
          Message <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={`${formId}-message`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the supplier what you buy, target volume, destination market, and timing."
          className="mt-1.5 min-h-[88px] text-sm"
          maxLength={600}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2">
          <Send className="h-4 w-4" aria-hidden />
          Send access request
        </Button>
      </div>
    </form>
  );
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
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-emerald-200 bg-emerald-50 p-4"
    >
      <div className="flex items-start gap-2">
        <CheckCircle2
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">
            Access request sent
          </p>
          <p className="mt-1 text-xs text-emerald-900/80">
            Supplier review is pending in this prototype. You will see updated
            access on{" "}
            <span className="font-medium">{supplierMaskedName}</span> once the
            supplier responds.
          </p>
          <dl className="mt-3 space-y-1 text-[11px] text-emerald-900/80">
            <div>
              <dt className="inline text-emerald-900/60">Reasons: </dt>
              <dd className="inline font-medium">
                {request.reasons.map((r) => REASON_LABEL[r]).join(", ")}
              </dd>
            </div>
            <div>
              <dt className="inline text-emerald-900/60">Sent: </dt>
              <dd className="inline font-medium">{sentDate}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
