import {
  ShieldCheck,
  Package,
  FileCheck2,
  Clock,
  MessageSquare,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

const ICONS = [ShieldCheck, Package, FileCheck2, Clock, MessageSquare, AlertCircle, Megaphone];

type ChipKind = "verified" | "promotion" | "neutral";
const chipKind = (concept?: string): ChipKind => {
  const c = (concept ?? "").toLowerCase();
  if (c.includes("promotion") || c.includes("promoted")) return "promotion";
  if (c.includes("verified")) return "verified";
  return "neutral";
};

const SupplierJourney = () => {
  const t = useHowItWorks();

  const chipStyles: Record<ChipKind, string> = {
    verified: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    promotion: "bg-primary/10 text-primary",
    neutral: "bg-muted text-muted-foreground",
  };
  const chipLabel: Record<ChipKind, string> = {
    verified: t.sj_def_verified_label,
    promotion: t.sj_def_featured_label,
    neutral: "Context",
  };

  return (
    <section
      id="supplier-journey"
      aria-label={t.sj_eyebrow}
      className="border-b border-border bg-background py-16 md:py-20"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.sj_eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t.sj_title}
          </h2>
          <p className="mt-3 text-muted-foreground">{t.sj_subtitle}</p>
        </div>

        {/* Legend: Verified / Featured / Premium — never mixed */}
        <div className="mx-auto mt-8 grid max-w-4xl gap-2 rounded-xl border border-border bg-card p-3 text-xs sm:grid-cols-3">
          <div className="rounded-md bg-[hsl(var(--success))]/10 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--success))]">
              {t.sj_def_verified_label}
            </div>
            <div className="mt-0.5 text-foreground/80">{t.sj_def_verified_body}</div>
          </div>
          <div className="rounded-md bg-primary/10 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {t.sj_def_featured_label}
            </div>
            <div className="mt-0.5 text-foreground/80">{t.sj_def_featured_body}</div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t.sj_def_premium_label}
            </div>
            <div className="mt-0.5 text-foreground/80">{t.sj_def_premium_body}</div>
          </div>
        </div>

        {/* Buyer-facing supply proof stack */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {t.sj_steps.map((step, idx) => {
            const Icon = ICONS[idx] ?? ShieldCheck;
            const kind = chipKind(step.concept);
            return (
              <article
                key={step.title}
                className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    </div>
                    <span className="font-heading text-[11px] font-bold uppercase tracking-wider tabular-nums text-muted-foreground">
                      Evidence {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${chipStyles[kind]}`}
                  >
                    {chipLabel[kind]}
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-base font-bold leading-snug text-foreground">
                  {step.title}
                </h3>

                <dl className="mt-4 space-y-3 text-xs">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.sj_supplierDoes}
                    </dt>
                    <dd className="mt-1 leading-relaxed text-foreground/85">{step.supplier}</dd>
                  </div>
                  <div className="border-t border-border/60 pt-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.sj_yorsoProvides}
                    </dt>
                    <dd className="mt-1 leading-relaxed text-foreground/85">{step.yorso}</dd>
                  </div>
                  <div className="border-t border-border/60 pt-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                      {t.sj_outcome}
                    </dt>
                    <dd className="mt-1 leading-relaxed text-foreground">{step.outcome}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SupplierJourney;
