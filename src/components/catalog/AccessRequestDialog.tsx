import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { submitAccessRequest, type AccessRequestScope } from "@/lib/catalog-requests";
import analytics from "@/lib/analytics";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SCOPES: AccessRequestScope[] = ["prices", "suppliers", "intelligence"];
type Scope = AccessRequestScope;

export const AccessRequestDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useLanguage();
  const [scopes, setScopes] = useState<Record<Scope, boolean>>({
    prices: true,
    suppliers: true,
    intelligence: false,
  });
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Reset success state when dialog re-opens for a new request.
  useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  const toggle = (s: Scope) => setScopes((prev) => ({ ...prev, [s]: !prev[s] }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = SCOPES.filter((s) => scopes[s]);
    submitAccessRequest({
      scopes: selected,
      note: note.trim() || undefined,
    });
    analytics.track("catalog_access_request_submit", {
      scopes: selected,
      hasNote: note.trim().length > 0,
    });
    setSubmitted(true);
  };

  const scopeLabels: Record<Scope, string> = {
    prices: t.catalog_access_request_scope_prices,
    suppliers: t.catalog_access_request_scope_suppliers,
    intelligence: t.catalog_access_request_scope_intelligence,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="access-request-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">{t.catalog_access_request_title}</DialogTitle>
          <DialogDescription>{t.catalog_access_request_subtitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {t.catalog_access_request_scope_label}
            </legend>
            <div className="space-y-2">
              {SCOPES.map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-card px-3 py-2 hover:border-primary/40"
                >
                  <Checkbox
                    checked={scopes[s]}
                    onCheckedChange={() => toggle(s)}
                    data-testid={`access-request-scope-${s}`}
                  />
                  <span className="text-sm text-foreground">{scopeLabels[s]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="access-request-note">{t.catalog_access_request_note_label}</Label>
            <Textarea
              id="access-request-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.catalog_access_request_note_placeholder}
              rows={4}
              data-testid="access-request-note"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.catalog_access_request_cancel}
            </Button>
            <Button
              type="submit"
              className="font-semibold"
              disabled={!Object.values(scopes).some(Boolean)}
              data-testid="access-request-submit"
            >
              {t.catalog_access_request_submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccessRequestDialog;
