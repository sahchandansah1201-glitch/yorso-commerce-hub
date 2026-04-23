import { Link } from "react-router-dom";
import { ArrowRight, Lock, Users, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";

/**
 * Subtle, capability-led value strip shown only when the buyer has not yet
 * unlocked full procurement access. Never labels the user (no "guest",
 * "anonymous", "demo"). Speaks in next-step value: prices, supplier access,
 * intelligence. Hidden entirely for qualified buyers.
 */
export const CatalogValueStrip = () => {
  const { t } = useLanguage();
  const { level, setQualified } = useAccessLevel();

  if (level === "qualified_unlocked") return null;

  const isRegistered = level === "registered_locked";
  const ctaLabel = isRegistered ? t.catalog_value_ctaQualify : t.catalog_value_ctaSignup;
  const ctaHref = isRegistered ? null : "/register";

  const capabilities = [
    { icon: Lock, label: t.catalog_value_cap_prices },
    { icon: Users, label: t.catalog_value_cap_suppliers },
    { icon: LineChart, label: t.catalog_value_cap_intelligence },
  ];

  const button = (
    <Button
      size="sm"
      className="gap-1.5 font-semibold"
      onClick={isRegistered ? () => setQualified(true) : undefined}
      data-testid="catalog-value-strip-cta"
    >
      {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
    </Button>
  );

  return (
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
      {ctaHref ? <Link to={ctaHref}>{button}</Link> : button}
    </div>
  );
};

export default CatalogValueStrip;
