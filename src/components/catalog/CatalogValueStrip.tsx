import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Users, LineChart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import {
  useAccessRequest,
  clearAccessRequest,
  type AccessRequestScope,
} from "@/lib/catalog-requests";
import { useCatalogRecoveryVisible } from "./catalog-recovery-visibility";
import AccessRequestDialog from "./AccessRequestDialog";

/**
 * Subtle, capability-led value strip shown only when the buyer has not yet
 * unlocked full procurement access. Never labels the user (no "guest",
 * "anonymous", "demo"). Speaks in next-step value: prices, supplier access,
 * intelligence. Hidden entirely for qualified buyers.
 *
 * Behavior:
 *  - anonymous_locked: CTA links to /register
 *  - registered_locked: CTA opens an access-request dialog (frontend mock).
 *    After submission, the strip switches to a pending state showing what
 *    was requested. It NEVER auto-qualifies the user.
 *  - qualified_unlocked: hidden
 *
 * Видимость управляется общим `useCatalogRecoveryVisible` —
 * единым источником правды для всех recovery-CTA каталога
 * (см. `catalog-recovery-visibility.tsx`).
 */
export const CatalogValueStrip = () => {
  const { t } = useLanguage();
  const { level } = useAccessLevel();
  const accessRequest = useAccessRequest();
  const [dialogOpen, setDialogOpen] = useState(false);
  const visible = useCatalogRecoveryVisible();

  if (!visible) return null;
  // Доп. защита: pending-state ниже завязан на registered, а CTA — на anonymous.
  // Если уровень не anonymous_locked, recovery-блок всё равно не показываем.
  if (level !== "anonymous_locked") return null;

  const isRegistered = false as boolean;

  const scopeLabel: Record<AccessRequestScope, string> = {
    prices: t.catalog_access_request_scope_prices,
    suppliers: t.catalog_access_request_scope_suppliers,
    intelligence: t.catalog_access_request_scope_intelligence,
  };

  // Pending state for registered buyers who already submitted a request.
  if (isRegistered && accessRequest) {
    return (
      <div
        className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
        data-testid="catalog-value-strip-pending"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {t.catalog_access_request_pending_title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t.catalog_access_request_pending_body}
            </p>
            {accessRequest.scopes.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t.catalog_access_request_pending_scopes}
                </span>{" "}
                {accessRequest.scopes.map((s) => scopeLabel[s]).join(" · ")}
              </p>
            )}
          </div>
        </div>
        {import.meta.env.DEV && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              clearAccessRequest();
              toast(t.catalog_access_request_canceled_toast);
            }}
            data-testid="catalog-value-strip-cancel"
          >
            {t.catalog_access_request_cancel_pending}
          </Button>
        )}
      </div>
    );
  }

  const ctaLabel = isRegistered ? t.catalog_value_ctaQualify : t.catalog_value_ctaSignup;

  const capabilities = [
    { icon: Lock, label: t.catalog_value_cap_prices },
    { icon: Users, label: t.catalog_value_cap_suppliers },
    { icon: LineChart, label: t.catalog_value_cap_intelligence },
  ];

  const button = (
    <Button
      size="sm"
      className="gap-1.5 font-semibold"
      onClick={isRegistered ? () => setDialogOpen(true) : undefined}
      data-testid="catalog-value-strip-cta"
    >
      {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <>
      <div
        className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        data-testid="catalog-value-strip"
      >
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {capabilities.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="font-medium text-foreground">{label}</span>
            </li>
          ))}
        </ul>
        {isRegistered ? button : <Link to="/register">{button}</Link>}
      </div>

      {isRegistered && (
        <AccessRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
    </>
  );
};

export default CatalogValueStrip;
