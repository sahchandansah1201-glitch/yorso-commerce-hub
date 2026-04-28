import { Building2, Box, Globe2, FileBadge, FileText, LineChart, MessageSquare, ListChecks, CheckCircle2, MinusCircle, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

type EvidenceState = "verified" | "missing" | "promoted" | "neutral";
const ICONS = [Building2, Box, Globe2, FileBadge, FileText, LineChart, ListChecks, MessageSquare];
const STATES: EvidenceState[] = ["verified", "verified", "verified", "missing", "verified", "neutral", "verified", "verified"];

const TrustStack = () => {
  const t = useHowItWorks();
  const stateMeta: Record<EvidenceState, { label: string; icon: LucideIcon; cls: string; ringCls: string }> = {
    verified: { label: t.ts_state_verified, icon: CheckCircle2, cls: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10", ringCls: "ring-[hsl(var(--success))]/20" },
    missing: { label: t.ts_state_missing, icon: MinusCircle, cls: "text-muted-foreground bg-muted", ringCls: "ring-border" },
    promoted: { label: t.ts_state_promoted, icon: Megaphone, cls: "text-primary bg-primary/10", ringCls: "ring-primary/15" },
    neutral: { label: t.ts_state_neutral, icon: ListChecks, cls: "text-foreground/70 bg-background", ringCls: "ring-border" },
  };

  const layers = t.ts_layers.map((l, i) => ({ ...l, icon: ICONS[i] ?? Building2, state: STATES[i] ?? "neutral" }));

  return (
    <section id="trust-layer" aria-label={t.ts_eyebrow} className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <FileBadge className="h-3.5 w-3.5" />
            {t.ts_eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t.ts_title}</h2>
          <p className="mt-3 text-muted-foreground">{t.ts_subtitle}</p>
        </div>

        <ol className="mx-auto mt-12 max-w-4xl space-y-2">
          {layers.slice().reverse().map((layer, idx) => {
            const Icon = layer.icon;
            const meta = stateMeta[layer.state];
            const StateIcon = meta.icon;
            const layerNumber = layers.length - idx;
            return (
              <li key={layer.title} className={`group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 ring-1 ${meta.ringCls} md:flex-row md:items-center md:gap-5 md:p-5`}>
                <div className="flex items-center gap-3 md:w-1/3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.ts_layer} {String(layerNumber).padStart(2, "0")}</div>
                    <h3 className="font-heading text-sm font-bold text-foreground md:text-base">{layer.title}</h3>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-foreground/80 md:flex-1">{layer.body}</p>
                <div className="md:w-[260px] md:shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.cls}`}>
                    <StateIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{layer.evidence}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mx-auto mt-8 grid max-w-4xl gap-2 rounded-xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground sm:grid-cols-3">
          <p>{t.ts_legend_verified}</p>
          <p>{t.ts_legend_missing}</p>
          <p>{t.ts_legend_promoted}</p>
        </div>
      </div>
    </section>
  );
};

export default TrustStack;
