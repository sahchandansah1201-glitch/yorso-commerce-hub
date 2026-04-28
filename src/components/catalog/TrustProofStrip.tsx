import { ShieldCheck, Activity, Lock, LineChart, FileCheck, LifeBuoy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";

type ProofItem = {
  id: string;
  icon: typeof ShieldCheck;
  label: string;
  hint: string;
  anchor: string;
};

/**
 * Compact "Trust" proof-strip displayed above the procurement workspace.
 * Each item is anchored to a concrete on-page section so a buyer can jump
 * straight to the underlying evidence (verification copy, alerts panel,
 * access controls, intelligence panel, document signals, support form).
 *
 * Pure UI / scrolling — no business logic, no access changes.
 */
const TrustProofStrip = () => {
  const { t } = useLanguage();

  const items: ProofItem[] = [
    {
      id: "verification",
      icon: ShieldCheck,
      label: t.catalog_trust_verification_label,
      hint: t.catalog_trust_verification_hint,
      anchor: "catalog-anchor-access",
    },
    {
      id: "activity",
      icon: Activity,
      label: t.catalog_trust_activity_label,
      hint: t.catalog_trust_activity_hint,
      anchor: "catalog-anchor-alerts",
    },
    {
      id: "access",
      icon: Lock,
      label: t.catalog_trust_access_label,
      hint: t.catalog_trust_access_hint,
      anchor: "catalog-anchor-access",
    },
    {
      id: "signals",
      icon: LineChart,
      label: t.catalog_trust_signals_label,
      hint: t.catalog_trust_signals_hint,
      anchor: "catalog-anchor-intelligence",
    },
    {
      id: "documents",
      icon: FileCheck,
      label: t.catalog_trust_documents_label,
      hint: t.catalog_trust_documents_hint,
      anchor: "catalog-anchor-filters",
    },
    {
      id: "recovery",
      icon: LifeBuoy,
      label: t.catalog_trust_recovery_label,
      hint: t.catalog_trust_recovery_hint,
      anchor: "catalog-anchor-recovery",
    },
  ];

  const handleJump = (item: ProofItem) => {
    const el = document.getElementById(item.anchor);
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    analytics.track("catalog_trust_proof_click", {
      itemId: item.id,
      anchor: item.anchor,
    });
  };

  return (
    <section
      aria-labelledby="catalog-trust-title"
      className="rounded-lg border border-border bg-card px-4 py-4"
      data-testid="catalog-trust-proof-strip"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2
            id="catalog-trust-title"
            className="font-heading text-base font-bold text-foreground"
          >
            {t.catalog_trust_subtitle}
          </h2>
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleJump(item)}
                className="group flex h-full w-full flex-col items-start gap-1.5 rounded-md border border-transparent bg-muted/40 px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus-visible:border-primary focus-visible:bg-primary/5"
                data-testid={`catalog-trust-proof-${item.id}`}
                aria-describedby={`catalog-trust-hint-${item.id}`}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {item.label}
                </span>
                <span
                  id={`catalog-trust-hint-${item.id}`}
                  className="text-[11px] leading-snug text-muted-foreground group-hover:text-foreground/80"
                >
                  {item.hint}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TrustProofStrip;
