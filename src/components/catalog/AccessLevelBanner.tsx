import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import { mockOffers } from "@/data/mockOffers";

// Mock: which supplier "approved" the price access. In real backend
// this would come from the approval payload itself.
const MOCK_APPROVING_COMPANY = mockOffers[0]?.supplierName ?? "Nordic Seafood AS";

export const AccessLevelBanner = () => {
  const { t } = useLanguage();
  const { level, setQualified } = useAccessLevel();
  const prevLevel = useRef(level);

  // Notify the buyer once when supplier access flips to qualified_unlocked.
  useEffect(() => {
    if (
      prevLevel.current !== "qualified_unlocked" &&
      level === "qualified_unlocked"
    ) {
      toast.success(t.catalog_access_granted_toast_title, {
        description: t.catalog_access_granted_toast_body.replace(
          "{company}",
          MOCK_APPROVING_COMPANY,
        ),
        duration: 6000,
      });
    }
    prevLevel.current = level;
  }, [level, t]);

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
          onClick={() => setQualified(true)}
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
