import { LineChart, ShieldCheck, GitCompare, Calculator, AlertTriangle, ListChecks, History, FileDown, CheckCircle2, Minus, TrendingUp, FlaskConical } from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

/**
 * Procurement Decision Proof — иллюстративный пример досье решения о закупке.
 *
 * Все числовые значения здесь — пример (не реальная статистика маркетплейса).
 * Бейдж pdp_exampleBadge и сводная плашка pdp_summary делают это явным:
 * сначала цифры, потом пояснение.
 *
 * Mobile-safety:
 *   - Внешний grid использует `min-w-0` на каждом article, чтобы child-таблицы
 *     не растягивали страницу.
 *   - Таблица сравнения офферов лежит внутри собственного скролл-контейнера,
 *     горизонтальный скролл локален, страница на 390px не имеет overflow.
 */

const benchmark = { selectedPrice: 1.92, marketLow: 1.78, marketAvg: 1.95, marketHigh: 2.18 };
const EVIDENCE_STATES: ("verified" | "partial")[] = ["verified", "verified", "verified", "partial", "partial"];
const RISK_LEVELS: ("stable" | "low" | "medium")[] = ["stable", "low", "medium", "low"];
const OFFER_PRICES = ["1.92", "1.88", "2.04"];
const OFFER_MOQ = ["24 t", "20 t", "12 t"];
const OFFER_LEAD = ["14 d", "21 d", "10 d"];
const OFFER_SELECTED = [true, false, false];
const OFFER_DELTA = ["−1.5%", "−3.6%", "+4.6%"]; // относительно market avg
const LANDED_VALUES = ["1.78 USD/kg", "0.09 USD/kg", "0.02 USD/kg", "0.03 USD/kg", "1.92 USD/kg"];
const LANDED_HIGHLIGHT = [false, false, false, false, true];

const ProcurementDecisionProof = () => {
  const t = useHowItWorks();
  const range = benchmark.marketHigh - benchmark.marketLow;
  const pos = ((benchmark.selectedPrice - benchmark.marketLow) / range) * 100;
  const avgPos = ((benchmark.marketAvg - benchmark.marketLow) / range) * 100;

  const stateBadge = (s: "verified" | "partial") => s === "verified"
    ? <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--success))]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--success))]"><CheckCircle2 className="h-3 w-3" /> {t.pdp_state_verified}</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"><Minus className="h-3 w-3" /> {t.pdp_state_partial}</span>;

  const riskColor = (level: "low" | "medium" | "stable") => level === "low" ? "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10" : level === "stable" ? "text-foreground/70 bg-muted" : "text-primary bg-primary/10";
  const riskLabel = (level: "low" | "medium" | "stable") => level === "low" ? t.pdp_risk_low : level === "stable" ? t.pdp_risk_stable : t.pdp_risk_medium;

  return (
    <section aria-label={t.pdp_eyebrow} className="border-b border-border bg-[hsl(var(--cool-gray))] py-16 md:py-24">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.pdp_eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t.pdp_title}</h2>
          <p className="mt-3 text-muted-foreground">{t.pdp_subtitle}</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* File header */}
          <div className="flex flex-col gap-3 border-b border-border bg-background/60 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.pdp_fileEyebrow}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <FlaskConical className="h-3 w-3" />
                  {t.pdp_exampleBadge}
                </span>
              </div>
              <h3 className="mt-1 break-words font-heading text-base font-bold text-foreground md:text-lg">{t.pdp_fileTitle}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80"><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />{t.pdp_decisionRecorded}</span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80"><FileDown className="h-3.5 w-3.5" />{t.pdp_exportable}</span>
            </div>
          </div>

          {/* Numeric summary strip — numbers first, label second */}
          <ul className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {t.pdp_summary.map((m) => (
              <li key={m.label} className="flex min-w-0 flex-col gap-1 bg-card px-4 py-3">
                <span className="font-heading text-xl font-bold leading-none tabular-nums text-primary md:text-2xl">{m.value}</span>
                <span className="text-[10px] font-medium leading-snug text-muted-foreground md:text-[11px]">{m.label}</span>
              </li>
            ))}
          </ul>

          {/* Cards grid. Each article must have min-w-0 so inner tables stay contained */}
          <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
            <article className="min-w-0 bg-card p-5 md:p-6">
              <header className="flex items-center gap-2"><LineChart className="h-4 w-4 text-primary" /><h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">{t.pdp_priceBenchmark}</h4></header>
              <p className="mt-3 text-2xl font-bold text-foreground">{benchmark.selectedPrice.toFixed(2)} <span className="text-sm font-medium text-muted-foreground">USD/kg, CFR</span></p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-[hsl(var(--success))]"><TrendingUp className="h-3 w-3 rotate-180" />{(((benchmark.marketAvg - benchmark.selectedPrice) / benchmark.marketAvg) * 100).toFixed(1)}% {t.pdp_belowAvg}</p>
              <div className="mt-5">
                <div className="relative h-1.5 rounded-full bg-muted">
                  <span className="absolute top-1/2 -translate-y-1/2 h-3 w-px bg-foreground/40" style={{ left: `${avgPos}%` }} aria-hidden />
                  <span className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-card bg-primary shadow" style={{ left: `${pos}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>{t.pdp_low} {benchmark.marketLow.toFixed(2)}</span>
                  <span>{t.pdp_avg} {benchmark.marketAvg.toFixed(2)}</span>
                  <span>{t.pdp_high} {benchmark.marketHigh.toFixed(2)}</span>
                </div>
              </div>
            </article>

            <article className="min-w-0 bg-card p-5 md:p-6">
              <header className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">{t.pdp_supplierEvidence}</h4></header>
              <ul className="mt-3 space-y-2">
                {t.pdp_evidence.map((e, i) => (
                  <li key={e.label} className="flex items-center justify-between gap-2 text-xs text-foreground/85">
                    <span className="min-w-0 truncate">{e.label}</span>
                    <span className="shrink-0">{stateBadge(EVIDENCE_STATES[i] ?? "verified")}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] italic text-muted-foreground">{t.pdp_evidenceFootnote}</p>
            </article>

            <article className="min-w-0 bg-card p-5 md:p-6">
              <header className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" /><h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">{t.pdp_riskSummary}</h4></header>
              <ul className="mt-3 space-y-2.5">
                {t.pdp_risks.map((r, i) => {
                  const lvl = RISK_LEVELS[i] ?? "low";
                  return (
                    <li key={r.label} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-medium text-foreground">{r.label}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${riskColor(lvl)}`}>{riskLabel(lvl)}</span>
                      </div>
                      <p className="mt-0.5 text-muted-foreground">{r.note}</p>
                    </li>
                  );
                })}
              </ul>
            </article>

            {/* Offer comparison: scroll lives inside this card only */}
            <article className="min-w-0 bg-card p-5 md:p-6 lg:col-span-2">
              <header className="flex items-center gap-2"><GitCompare className="h-4 w-4 text-primary" /><h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">{t.pdp_offerComparison}</h4></header>
              <div className="mt-3 w-full overflow-x-auto rounded-md border border-border/60">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background/60 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-2.5 py-2">{t.pdp_th.supplier}</th>
                      <th className="px-2.5 py-2">{t.pdp_th.country}</th>
                      <th className="px-2.5 py-2 text-right">{t.pdp_th.price}</th>
                      <th className="px-2.5 py-2 text-right">vs avg</th>
                      <th className="px-2.5 py-2 text-right">{t.pdp_th.moq}</th>
                      <th className="px-2.5 py-2 text-right">{t.pdp_th.lead}</th>
                      <th className="px-2.5 py-2">{t.pdp_th.payment}</th>
                      <th className="px-2.5 py-2">{t.pdp_th.incoterms}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.pdp_offers.map((o, i) => {
                      const delta = OFFER_DELTA[i] ?? "";
                      const deltaCls = delta.startsWith("−") ? "text-[hsl(var(--success))]" : delta.startsWith("+") ? "text-primary" : "text-muted-foreground";
                      return (
                        <tr key={o.supplier} className={`border-b border-border/60 last:border-0 ${OFFER_SELECTED[i] ? "bg-primary/5" : ""}`}>
                          <td className="px-2.5 py-2 font-semibold text-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              {OFFER_SELECTED[i] && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                              {o.supplier}
                            </span>
                          </td>
                          <td className="px-2.5 py-2 text-foreground/80">{o.country}</td>
                          <td className="px-2.5 py-2 text-right font-mono tabular-nums text-foreground">{OFFER_PRICES[i]}</td>
                          <td className={`px-2.5 py-2 text-right font-mono tabular-nums ${deltaCls}`}>{delta}</td>
                          <td className="px-2.5 py-2 text-right font-mono tabular-nums text-foreground/80">{OFFER_MOQ[i]}</td>
                          <td className="px-2.5 py-2 text-right font-mono tabular-nums text-foreground/80">{OFFER_LEAD[i]}</td>
                          <td className="px-2.5 py-2 text-foreground/80">{o.payment}</td>
                          <td className="px-2.5 py-2 text-foreground/80">{o.incoterms}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="min-w-0 bg-card p-5 md:p-6">
              <header className="flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /><h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">{t.pdp_landedCost}</h4></header>
              <ul className="mt-3 divide-y divide-border/60">
                {t.pdp_landedCostRows.map((row, i) => (
                  <li key={row.label} className={`flex items-center justify-between gap-3 py-2 text-xs ${LANDED_HIGHLIGHT[i] ? "font-bold text-foreground" : "text-foreground/80"}`}>
                    <span className="min-w-0 truncate">{row.label}</span>
                    <span className="shrink-0 font-mono tabular-nums">{LANDED_VALUES[i]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] italic text-muted-foreground">{t.pdp_landedFootnote}</p>
            </article>

            <article className="min-w-0 bg-card p-5 md:p-6">
              <header className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /><h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">{t.pdp_alternatives}</h4></header>
              <ul className="mt-3 space-y-2.5">
                {t.pdp_alternativeItems.map((a) => (
                  <li key={a.label} className="text-xs">
                    <p className="font-semibold text-foreground">{a.label}</p>
                    <p className="text-muted-foreground">{a.reason}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="min-w-0 bg-card p-5 md:p-6 lg:col-span-2">
              <header className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><h4 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">{t.pdp_auditTrail}</h4></header>
              <ol className="mt-3 space-y-2">
                {t.pdp_auditItems.map((a, i) => (
                  <li key={a.date + a.event} className="flex items-start gap-3 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs">
                    <span className="w-5 shrink-0 font-mono text-[10px] font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span className="w-14 shrink-0 font-mono font-semibold text-muted-foreground">{a.date}</span>
                    <span className="min-w-0 flex-1 break-words text-foreground/85">{a.event}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>

          <div className="flex flex-col gap-2 border-t border-border bg-background/60 px-5 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
            <p>{t.pdp_footerNote}</p>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
              <FileDown className="h-3.5 w-3.5" />
              {t.pdp_exportPdf}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcurementDecisionProof;
