import { Clock, ShieldX, ClipboardCheck, LineChart, PackageCheck, Inbox, ThumbsUp, Sparkles, Eye, RefreshCw, TrendingUp, UserPlus, Repeat, ShieldCheck, FlaskConical, ArrowRight, Minus, Check } from "lucide-react";
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

        {/* Buyer worksheet — Before vs With Yorso */}
        <section aria-label={t.bo_saves_eyebrow} className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <header className="flex flex-col gap-3 border-b border-border bg-background/60 px-5 py-4 md:flex-row md:items-end md:justify-between md:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{t.bo_saves_eyebrow}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <FlaskConical className="h-3 w-3" />
                  {t.pdp_exampleBadge}
                </span>
              </div>
              <h3 className="mt-1 font-heading text-base font-bold leading-snug text-foreground md:text-lg">{t.bo_saves_title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.bo_saves_subtitle}</p>
            </div>
          </header>

          {/* Desktop / tablet table */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="w-[34%] px-6 py-3">{t.bo_saves_col_metric}</th>
                  <th className="w-[33%] px-6 py-3">{t.bo_saves_col_before}</th>
                  <th className="w-[33%] px-6 py-3">{t.bo_saves_col_with}</th>
                </tr>
              </thead>
              <tbody>
                {t.bo_saves_rows.map((row, i) => (
                  <tr key={row.metric} className={`border-b border-border/60 last:border-0 ${i % 2 === 1 ? "bg-background/30" : ""}`}>
                    <td className="px-6 py-3 align-top font-semibold text-foreground">{row.metric}</td>
                    <td className="px-6 py-3 align-top text-muted-foreground">
                      <span className="inline-flex items-start gap-2">
                        <Minus className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span>{row.before}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3 align-top text-foreground/90">
                      <span className="inline-flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--success))]" />
                        <span>{row.with}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <ul className="divide-y divide-border md:hidden">
            {t.bo_saves_rows.map((row) => (
              <li key={row.metric} className="px-5 py-4">
                <p className="font-heading text-sm font-bold leading-snug text-foreground">{row.metric}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                  <div className="rounded-md border border-border/60 bg-background/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.bo_saves_col_before}</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{row.before}</p>
                  </div>
                  <div className="flex justify-center text-muted-foreground/50">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-md border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]">{t.bo_saves_col_with}</p>
                    <p className="mt-1 leading-relaxed text-foreground/90">{row.with}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="border-t border-border bg-background/60 px-5 py-3 text-[11px] italic leading-relaxed text-muted-foreground md:px-6">
            {t.bo_saves_footnote}
          </p>
        </section>

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
              {buyer.map((o, idx) => {
                const Icon = o.icon;
                return (
                  <article
                    key={o.title}
                    className="flex gap-4 rounded-xl border border-border bg-card p-4 md:p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums text-primary/70">
                        Outcome {String(idx + 1).padStart(2, "0")}
                      </span>
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
