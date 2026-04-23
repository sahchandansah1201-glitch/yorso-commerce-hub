import { TrendingUp, TrendingDown, Minus, Lock, ExternalLink, AlertTriangle, Eye, Activity } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import {
  getPriceTrend,
  getCountryNews,
  getCountryImpact,
  getMarketSignals,
  type TrendDirection,
  type Volatility,
  type CountryRole,
} from "@/data/mockIntelligence";

interface Props {
  /** Selected category drives intelligence focus. If null, "all" is shown. */
  category: string | null;
}

const dirIcon = (d: TrendDirection) => {
  if (d === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (d === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
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

export const IntelligenceRail = ({ category }: Props) => {
  const { t } = useLanguage();
  const { level } = useAccessLevel();

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

      {/* Market signals */}
      {signals.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.catalog_intel_signals_title}
          </h3>
          <ul className="mt-3 space-y-2">
            {signals.slice(0, isAnon ? 2 : signals.length).map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-xs">
                {s.severity === "alert" ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden />
                ) : s.severity === "watch" ? (
                  <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                ) : (
                  <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="leading-snug text-foreground">{s.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
};

export default IntelligenceRail;
