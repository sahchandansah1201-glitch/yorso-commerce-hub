import { Search, ShieldCheck, FileSignature, GitCompare, LineChart, FileBadge, Truck, Users, ClipboardCheck, Box, Globe2, Inbox, Activity, Sparkles, RefreshCw, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

const BUYER_ICONS: LucideIcon[] = [Search, ShieldCheck, FileSignature, GitCompare, LineChart, FileBadge, Truck, Users, ClipboardCheck];
const SUPPLIER_ICONS: LucideIcon[] = [Box, ShieldCheck, Globe2, Inbox, Activity, Sparkles, TrendingUp, RefreshCw, Sparkles];
const SUPPLIER_TONES: ("verified" | "premium" | undefined)[] = [undefined, "verified", undefined, undefined, undefined, undefined, undefined, undefined, "premium"];

const tagClass = (tone: "verified" | "premium") => tone === "verified" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-primary/10 text-primary";

const ValueGrids = () => {
  const t = useHowItWorks();
  const buyerItems = t.vg_buyer_items.map((it, i) => ({ ...it, icon: BUYER_ICONS[i] ?? Search }));
  const supplierItems = t.vg_supplier_items.map((it, i) => ({ ...it, icon: SUPPLIER_ICONS[i] ?? Box, tone: SUPPLIER_TONES[i] }));

  return (
    <section id="outcomes" aria-label={t.vg_eyebrow} className="border-b border-border bg-background py-16 md:py-24">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{t.vg_eyebrow}</span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t.vg_title}</h2>
          <p className="mt-3 text-muted-foreground">{t.vg_subtitle}</p>
        </div>

        <div className="mt-12">
          <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.vg_buyer_eyebrow}</p>
              <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">{t.vg_buyer_title}</h3>
            </div>
            <span className="text-xs text-muted-foreground">{t.vg_buyer_count}</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {buyerItems.map((it) => {
              const Icon = it.icon;
              return (
                <article key={it.title} className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="font-heading text-sm font-bold leading-snug text-foreground">{it.title}</h4>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{it.body}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-14">
          <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.vg_supplier_eyebrow}</p>
              <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">{t.vg_supplier_title}</h3>
            </div>
            <span className="text-xs text-muted-foreground">{t.vg_supplier_count}</span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {supplierItems.map((it) => {
              const Icon = it.icon;
              return (
                <article key={it.title} className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="font-heading text-sm font-bold leading-snug text-foreground">{it.title}</h4>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{it.body}</p>
                  {it.tagLabel && it.tone && (
                    <span className={`mt-3 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tagClass(it.tone)}`}>
                      {it.tagLabel}
                    </span>
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-6 grid gap-2 rounded-xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground sm:grid-cols-3">
            <p>{t.vg_legend_verified}</p>
            <p>{t.vg_legend_sponsored}</p>
            <p>{t.vg_legend_premium}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueGrids;
