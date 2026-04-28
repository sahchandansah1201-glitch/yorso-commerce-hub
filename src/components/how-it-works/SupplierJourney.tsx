import { UserPlus, ShieldCheck, Search, Inbox, FileSignature, Sparkles, RefreshCw, ArrowRight, TrendingUp } from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

const ICONS = [UserPlus, ShieldCheck, Search, Inbox, FileSignature, Sparkles, RefreshCw];

const SupplierJourney = () => {
  const t = useHowItWorks();
  return (
    <section id="supplier-journey" aria-label={t.sj_eyebrow} className="border-b border-border bg-background py-16 md:py-24">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            {t.sj_eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t.sj_title}</h2>
          <p className="mt-3 text-muted-foreground">{t.sj_subtitle}</p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-2 rounded-xl border border-border bg-card p-3 text-xs sm:grid-cols-3">
          <div className="rounded-md bg-[hsl(var(--success))]/10 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--success))]">{t.sj_def_verified_label}</div>
            <div className="mt-0.5 text-foreground/80">{t.sj_def_verified_body}</div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.sj_def_featured_label}</div>
            <div className="mt-0.5 text-foreground/80">{t.sj_def_featured_body}</div>
          </div>
          <div className="rounded-md bg-primary/10 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">{t.sj_def_premium_label}</div>
            <div className="mt-0.5 text-foreground/80">{t.sj_def_premium_body}</div>
          </div>
        </div>

        <ol className="relative mt-12">
          <span aria-hidden className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-px bg-border md:block lg:left-1/2" />
          {t.sj_steps.map((step, idx) => {
            const Icon = ICONS[idx] ?? UserPlus;
            const isLeft = idx % 2 === 0;
            return (
              <li key={step.title} className="relative mb-8 last:mb-0 md:pl-14 lg:pl-0">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm md:left-0 lg:left-1/2 lg:-translate-x-1/2">
                  <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
                </div>
                <div className={["rounded-xl border border-border bg-card p-5 md:p-6", "lg:w-[calc(50%-2.5rem)]", isLeft ? "lg:mr-auto lg:pr-7" : "lg:ml-auto lg:pl-7"].join(" ")}>
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.bj_step} {String(idx + 1).padStart(2, "0")}</span>
                    <h3 className="font-heading text-lg font-bold leading-snug text-foreground md:text-xl">{step.title}</h3>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-background/60 p-3 ring-1 ring-border/60">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.sj_supplierDoes}</dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">{step.supplier}</dd>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3 ring-1 ring-primary/15">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-primary">{t.sj_yorsoProvides}</dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">{step.yorso}</dd>
                    </div>
                    <div className="rounded-lg bg-[hsl(var(--success))]/5 p-3 ring-1 ring-[hsl(var(--success))]/20">
                      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                        <TrendingUp className="h-3 w-3" />
                        {t.sj_outcome}
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-foreground/85">{step.outcome}</dd>
                    </div>
                  </dl>
                  {step.concept && (
                    <div className="mt-4 flex items-start gap-2 border-t border-border/60 pt-3">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs italic text-muted-foreground">{step.concept}</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default SupplierJourney;
