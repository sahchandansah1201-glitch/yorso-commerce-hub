import { Clock, ShieldX, ClipboardCheck, LineChart, PackageCheck, Inbox, ThumbsUp, Sparkles, Eye, RefreshCw, TrendingUp, UserPlus, Repeat, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

const BUYER_ICONS: LucideIcon[] = [Clock, ShieldX, ClipboardCheck, LineChart, PackageCheck];
const SUPPLIER_ICONS: LucideIcon[] = [Inbox, ThumbsUp, Sparkles, Eye, RefreshCw];
const GOAL_ICONS: LucideIcon[] = [TrendingUp, UserPlus, Repeat, ShieldCheck];

const BusinessOutcomes = () => {
  const t = useHowItWorks();
  const buyer = t.bo_buyer_items.map((o, i) => ({ ...o, icon: BUYER_ICONS[i] ?? Clock }));
  const supplier = t.bo_supplier_items.map((o, i) => ({ ...o, icon: SUPPLIER_ICONS[i] ?? Inbox }));
  const goals = t.bo_goals.map((g, i) => ({ ...g, icon: GOAL_ICONS[i] ?? TrendingUp }));

  return (
    <section
      id="business-outcomes"
      aria-label={t.bo_eyebrow}
      className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24"
    >
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t.bo_eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t.bo_title}
          </h2>
          <p className="mt-3 text-muted-foreground">{t.bo_subtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Buyer outcomes — dominant */}
          <div className="lg:col-span-3">
            <header className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {t.bo_buyer_eyebrow}
              </p>
              <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                {t.bo_buyer_title}
              </h3>
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
              {buyer.map((o) => {
                const Icon = o.icon;
                return (
                  <article
                    key={o.title}
                    className="flex gap-4 rounded-xl border border-border bg-card p-4 md:p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold leading-snug text-foreground">
                        {o.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Supplier outcomes — secondary, compact */}
          <aside className="lg:col-span-2">
            <header className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.bo_supplier_eyebrow}
              </p>
              <h3 className="font-heading text-base font-bold text-foreground md:text-lg">
                {t.bo_supplier_title}
              </h3>
            </header>
            <ul className="space-y-2">
              {supplier.map((o) => {
                const Icon = o.icon;
                return (
                  <li
                    key={o.title}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5"
                  >
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-snug text-foreground/90">
                        {o.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {o.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        <div className="mt-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t.bo_goals_eyebrow}
            </p>
            <h3 className="mt-1 font-heading text-lg font-bold text-foreground md:text-xl">
              {t.bo_goals_title}
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">{t.bo_goals_subtitle}</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.label}
                  className="rounded-xl border border-dashed border-border bg-card/60 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-heading text-sm font-bold text-foreground">{g.label}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{g.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessOutcomes;
