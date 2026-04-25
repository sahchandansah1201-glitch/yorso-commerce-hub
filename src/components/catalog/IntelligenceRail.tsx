import { useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, Lock, ExternalLink, AlertTriangle, Eye, Activity, ChevronRight, Bell, BellOff,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import { useWatchedSignals } from "@/lib/watched-signals";
import analytics from "@/lib/analytics";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getPriceTrend,
  getCountryNews,
  getCountryImpact,
  getMarketSignals,
  type MarketSignal,
  type TrendDirection,
  type Volatility,
  type CountryRole,
} from "@/data/mockIntelligence";

interface Props {
  /** Selected category drives intelligence focus. If null, "all" is shown. */
  category: string | null;
}

const dirIcon = (d: TrendDirection) => {
  if (d === "up") return <TrendingUp className="h-3.5 w-3.5 text-primary" />;
  if (d === "down") return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const fmtPct = (pct: number) => (pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`);

const Sparkline = ({ values }: { values: number[] }) => {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-primary" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

const roleKey = (role: CountryRole) =>
  ({
    supplier_country: "catalog_intel_impact_role_supplier_country",
    origin_country: "catalog_intel_impact_role_origin_country",
    export_port: "catalog_intel_impact_role_export_port",
    competing_producer: "catalog_intel_impact_role_competing_producer",
    demand_driver: "catalog_intel_impact_role_demand_driver",
  } as const)[role];

const volatilityKey = (v: Volatility) =>
  ({
    low: "catalog_intel_priceTrend_vol_low",
    medium: "catalog_intel_priceTrend_vol_medium",
    high: "catalog_intel_priceTrend_vol_high",
  } as const)[v];

const kindKey = (k: MarketSignal["kind"]) =>
  ({
    supply: "catalog_intel_signal_supply",
    demand: "catalog_intel_signal_demand",
    logistics: "catalog_intel_signal_logistics",
    regulation: "catalog_intel_signal_regulation",
  } as const)[k];

const severityKey = (s: MarketSignal["severity"]) =>
  ({
    info: "catalog_intel_signal_severity_info",
    watch: "catalog_intel_signal_severity_watch",
    alert: "catalog_intel_signal_severity_alert",
  } as const)[s];

const SignalIcon = ({ severity, className }: { severity: MarketSignal["severity"]; className?: string }) => {
  if (severity === "alert") return <AlertTriangle className={className} aria-hidden />;
  if (severity === "watch") return <Eye className={className} aria-hidden />;
  return <Activity className={className} aria-hidden />;
};

const severityTooltipKey = (s: MarketSignal["severity"]) =>
  ({
    info: "catalog_intel_signal_severity_info_tooltip",
    watch: "catalog_intel_signal_severity_watch_tooltip",
    alert: "catalog_intel_signal_severity_alert_tooltip",
  } as const)[s];

/** Returns true for severities that support a follow toggle. */
const isWatchable = (sev: MarketSignal["severity"]) => sev === "watch" || sev === "alert";

export const IntelligenceRail = ({ category }: Props) => {
  const { t } = useLanguage();
  const { level } = useAccessLevel();
  const { isWatched, toggleWatch } = useWatchedSignals();
  const [openSignal, setOpenSignal] = useState<MarketSignal | null>(null);

  const handleToggleWatch = (s: MarketSignal, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const wasWatched = isWatched(s.id);
    toggleWatch(s.id);
    analytics.track(wasWatched ? "signal_unfollow" : "signal_follow", {
      signalId: s.id,
      severity: s.severity,
      kind: s.kind,
    });
  };

  // For "all", default to Salmon as feature category for the demo
  const effectiveCategory = category ?? "Salmon";
  const trend = getPriceTrend(effectiveCategory);
  const news = getCountryNews(effectiveCategory);
  const impact = getCountryImpact(effectiveCategory);
  const signals = getMarketSignals(effectiveCategory);

  const isAnon = level === "anonymous_locked";
  const isReg = level === "registered_locked";
  const isQual = level === "qualified_unlocked";

  return (
    <aside className="space-y-4" aria-label={t.catalog_intel_title} data-testid="catalog-intel-rail" data-access-level={level}>
      <header className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.catalog_intel_title}</h2>
        <span className="text-[11px] text-muted-foreground">{effectiveCategory}</span>
      </header>

      {/* Access-aware preface */}
      {isAnon && (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Lock className="h-3.5 w-3.5" /> {t.catalog_intel_lockedTitle}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t.catalog_intel_lockedBody}</p>
        </div>
      )}
      {isReg && (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Eye className="h-3.5 w-3.5" /> {t.catalog_intel_partialTitle}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t.catalog_intel_partialBody}</p>
        </div>
      )}

      {/* Price trend */}
      {trend && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.catalog_intel_priceTrend_title}
            </h3>
            <Sparkline values={trend.series.map((p) => p.index)} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-foreground">{trend.currentIndex}</span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.catalog_intel_priceTrend_index}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-muted-foreground">{t.catalog_intel_priceTrend_d7}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-foreground">
                {dirIcon(trend.d7.dir)} {fmtPct(trend.d7.pct)}
              </p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-muted-foreground">{t.catalog_intel_priceTrend_d30}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-foreground">
                {dirIcon(trend.d30.dir)} {fmtPct(trend.d30.pct)}
              </p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-muted-foreground">{t.catalog_intel_priceTrend_d90}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-foreground">
                {isQual ? <>{dirIcon(trend.d90.dir)} {fmtPct(trend.d90.pct)}</> : <Lock className="h-3 w-3 text-muted-foreground" />}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {t.catalog_intel_priceTrend_volatility}: <span className="font-semibold text-foreground">{t[volatilityKey(trend.volatility)]}</span>
          </p>
          {(isQual || isReg) && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{trend.explanation}</p>
          )}
        </section>
      )}

      {/* Country news */}
      {news.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.catalog_intel_news_title}
          </h3>
          <ul className="mt-3 space-y-3">
            {news.slice(0, isAnon ? 1 : isReg ? 2 : 5).map((n) => (
              <li key={n.id} className="text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span aria-hidden>{n.countryFlag}</span>
                  <span className="font-semibold text-foreground">{n.countryName}</span>
                  <span>· {n.publishedAt}</span>
                </div>
                <p className="mt-0.5 font-medium leading-snug text-foreground">{n.headline}</p>
                {(isReg || isQual) && (
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{n.summary}</p>
                )}
                {isQual && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
                    <ExternalLink className="h-3 w-3" /> {n.source}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Market signals */}
      {signals.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.catalog_intel_signals_title}
          </h3>
          <ul className="mt-3 space-y-1">
            {signals.slice(0, isAnon ? 2 : signals.length).map((s) => {
              const hasDetails = Boolean(s.context || s.meaning || (s.actions && s.actions.length > 0));
              const watchable = isWatchable(s.severity);
              const watching = watchable && isWatched(s.id);
              return (
                <li
                  key={s.id}
                  className="group flex items-start gap-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
                >
                  <button
                    type="button"
                    onClick={() => hasDetails && setOpenSignal(s)}
                    disabled={!hasDetails}
                    aria-label={hasDetails ? `${s.text} — ${t.catalog_intel_signal_drawer_openHint}` : s.text}
                    className="flex flex-1 items-start gap-2 text-left text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm disabled:cursor-default"
                  >
                    <span
                      role="img"
                      aria-label={`${t[severityKey(s.severity)]} — ${t[severityTooltipKey(s.severity)]}`}
                      title={`${t[severityKey(s.severity)]} — ${t[severityTooltipKey(s.severity)]}`}
                      className="mt-0.5 inline-flex shrink-0"
                    >
                      <SignalIcon
                        severity={s.severity}
                        className={`h-3.5 w-3.5 ${
                          s.severity === "alert"
                            ? "text-destructive"
                            : s.severity === "watch"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </span>
                    <span className="flex-1 leading-snug text-foreground">{s.text}</span>
                    {hasDetails && (
                      <ChevronRight
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                      />
                    )}
                  </button>
                  {watchable && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleWatch(s, e)}
                      aria-pressed={watching}
                      aria-label={
                        watching
                          ? t.catalog_intel_signal_watch_aria_unfollow
                          : t.catalog_intel_signal_watch_aria_follow
                      }
                      title={
                        watching
                          ? t.catalog_intel_signal_watch_action_unfollow
                          : t.catalog_intel_signal_watch_action_follow
                      }
                      className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        watching
                          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                      }`}
                    >
                      {watching ? <Bell className="h-3 w-3" aria-hidden /> : <BellOff className="h-3 w-3" aria-hidden />}
                      <span>
                        {watching
                          ? t.catalog_intel_signal_watch_action_unfollow
                          : t.catalog_intel_signal_watch_action_follow}
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Countries affecting price */}
      {impact.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.catalog_intel_impact_title}
          </h3>
          <ul className="mt-3 space-y-2">
            {impact.slice(0, isAnon ? 3 : isReg ? 4 : impact.length).map((c) => (
              <li key={c.countryCode} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden>{c.countryFlag}</span>
                    <span className="font-semibold text-foreground">{c.countryName}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">· {t[roleKey(c.role)]}</span>
                  </span>
                  {isQual ? (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {c.impactPct}%
                    </span>
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                {(isReg || isQual) && (
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{c.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={openSignal !== null} onOpenChange={(o) => !o && setOpenSignal(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {openSignal && (
            <>
              <SheetHeader className="text-left">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    title={t[severityTooltipKey(openSignal.severity)]}
                    aria-label={`${t[severityKey(openSignal.severity)]} — ${t[severityTooltipKey(openSignal.severity)]}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      openSignal.severity === "alert"
                        ? "bg-destructive/10 text-destructive"
                        : openSignal.severity === "watch"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <SignalIcon severity={openSignal.severity} className="h-3 w-3" />
                    {t[severityKey(openSignal.severity)]}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t[kindKey(openSignal.kind)]}
                  </span>
                  {openSignal.publishedAt && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      · {t.catalog_intel_signal_drawer_published}: {openSignal.publishedAt}
                    </span>
                  )}
                </div>
                <SheetTitle className="font-heading text-base leading-snug">{openSignal.text}</SheetTitle>
                {openSignal.context && (
                  <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
                    {openSignal.context}
                  </SheetDescription>
                )}
                {isWatchable(openSignal.severity) && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleToggleWatch(openSignal)}
                      aria-pressed={isWatched(openSignal.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isWatched(openSignal.id)
                          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {isWatched(openSignal.id) ? (
                        <>
                          <Bell className="h-3.5 w-3.5" aria-hidden />
                          {t.catalog_intel_signal_watch_action_unfollow}
                        </>
                      ) : (
                        <>
                          <BellOff className="h-3.5 w-3.5" aria-hidden />
                          {t.catalog_intel_signal_watch_action_follow}
                        </>
                      )}
                    </button>
                    {isWatched(openSignal.id) && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {t.catalog_intel_signal_watch_following}
                      </p>
                    )}
                  </div>
                )}
              </SheetHeader>

              {openSignal.meaning && (
                <section className="mt-6 rounded-lg border border-border bg-card p-4">
                  <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.catalog_intel_signal_drawer_meaning}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{openSignal.meaning}</p>
                </section>
              )}

              {openSignal.actions && openSignal.actions.length > 0 && (
                <section className="mt-4 rounded-lg border border-border bg-card p-4">
                  <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.catalog_intel_signal_drawer_actions}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {openSignal.actions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                        <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </aside>
  );
};

export default IntelligenceRail;
