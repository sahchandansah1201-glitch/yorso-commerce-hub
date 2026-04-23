import { Link } from "react-router-dom";
import { Lock, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";

export const AccessLevelBanner = () => {
  const { t } = useLanguage();
  const { level, setQualified } = useAccessLevel();

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
