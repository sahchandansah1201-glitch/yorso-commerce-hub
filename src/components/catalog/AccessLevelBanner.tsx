import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import { simulateSupplierApproval } from "@/lib/supplier-approval";

// Per-tab dedup: remember which approval payload (by approvedAt) we've
// already announced so re-mounts and duplicate webhook deliveries don't
// re-fire the toast.
const ANNOUNCED_KEY = "yorso_qualification_announced_at";

const wasAnnounced = (approvedAt: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ANNOUNCED_KEY) === approvedAt;
  } catch {
    return false;
  }
};

const markAnnounced = (approvedAt: string) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ANNOUNCED_KEY, approvedAt);
  } catch {
    /* ignore */
  }
};

export const AccessLevelBanner = () => {
  const { t } = useLanguage();
  const { level, qualification } = useAccessLevel();
  const announcedRef = useRef<string | null>(null);

  // Notify the buyer when supplier access flips to qualified_unlocked.
  // Dedup logic:
  //   - Skip if this exact approval payload (same approvedAt) was already
  //     announced in this tab — handles re-mounts and re-deliveries.
  //   - Skip if we already announced this payload during the current
  //     component lifetime — handles rapid state thrashing.
  useEffect(() => {
    if (level !== "qualified_unlocked" || !qualification) return;
    const { approvedAt, companyName } = qualification;
    if (announcedRef.current === approvedAt) return;
    if (wasAnnounced(approvedAt)) {
      announcedRef.current = approvedAt;
      return;
    }

    const trimmed = companyName?.trim();
    const description = trimmed
      ? t.catalog_access_granted_toast_body.replace("{company}", trimmed)
      : t.catalog_access_granted_toast_body_fallback;

    toast.success(t.catalog_access_granted_toast_title, {
      description,
      duration: 6000,
    });
    markAnnounced(approvedAt);
    announcedRef.current = approvedAt;
  }, [level, qualification, t]);

  if (level === "qualified_unlocked") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="font-heading text-sm font-semibold text-foreground">{t.catalog_access_qual_title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.catalog_access_qual_body}</p>
        </div>
      </div>
    );
  }

  if (level === "registered_locked") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start">
        <KeyRound className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="flex-1">
          <p className="font-heading text-sm font-semibold text-foreground">{t.catalog_access_reg_title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.catalog_access_reg_body}</p>
        </div>
        <Button
          size="sm"
          className="font-semibold"
          onClick={() => simulateSupplierApproval({ delayMs: 0 })}
          data-testid="catalog-request-qualification"
        >
          {t.catalog_access_reg_cta}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start">
      <Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="flex-1">
        <p className="font-heading text-sm font-semibold text-foreground">{t.catalog_access_anon_title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.catalog_access_anon_body}</p>
      </div>
      <Link to="/register">
        <Button size="sm" className="font-semibold">
          {t.catalog_access_anon_cta}
        </Button>
      </Link>
    </div>
  );
};

export default AccessLevelBanner;
