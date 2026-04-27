import {
  Activity,
  ExternalLink,
  FileCheck2,
  FileX2,
  Lock,
  Minus,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import {
  countryNews,
  getCountryImpact,
  getMarketSignals,
  getPriceTrend,
  type CountryNewsItem,
  type NewsRelevanceReason,
  type TrendDirection,
} from "@/data/mockIntelligence";
import type { SeafoodOffer } from "@/data/mockOffers";
import { cn } from "@/lib/utils";
import { formatDaysAgo, getIntelText } from "@/i18n/translations";
import analytics from "@/lib/analytics";

interface Props {
  offer: SeafoodOffer | null;
  isCompared?: boolean;
  onCompareToggle?: (offerId: string) => void;
  compareDisabled?: boolean;
}

const dirIcon = (d: TrendDirection) => {
  if (d === "up") return <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />;
  if (d === "down") return <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
};

const fmtPct = (pct: number) => (pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`);

const Sparkline = ({ values }: { values: number[] }) => {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 140;
  const h = 36;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-primary" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

/**
 * Mock document readiness, derived deterministically from offer characteristics.
 * Backend-readiness: replace with /offers/:id/document-readiness response.
 */
const getDocumentReadiness = (offer: SeafoodOffer) => {
  const certs = offer.certifications ?? [];
  const has = (k: string) => certs.some((c) => c.toUpperCase().includes(k));
  return [
    { key: "health", ready: true },
    { key: "haccp", ready: has("HACCP") || certs.length >= 2 },
    { key: "catch", ready: offer.category !== "Squid & Octopus" },
    { key: "cert", ready: certs.length > 0 },
    { key: "packing", ready: true },
    { key: "traceability", ready: !!offer.traceability || certs.length >= 1 },
  ] as const;
};

const NeutralState = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-card/60 p-4">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Activity className="h-4 w-4 text-primary" aria-hidden />
        {t.catalog_panel_neutral_title}
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        {t.catalog_panel_neutral_body}
      </p>
    </div>
  );
};

const reasonLabel = (
  t: ReturnType<typeof useLanguage>["t"],
  reason: NewsRelevanceReason,
): string => {
  switch (reason) {
    case "price": return t.catalog_news_reason_price;
    case "availability": return t.catalog_news_reason_availability;
    case "logistics": return t.catalog_news_reason_logistics;
    case "compliance": return t.catalog_news_reason_compliance;
    case "supplier_risk": return t.catalog_news_reason_supplier_risk;
  }
};

export const SelectedOfferPanel = ({
  offer,
  isCompared = false,
  onCompareToggle,
  compareDisabled = false,
}: Props) => {
  const { t, lang } = useLanguage();
  const { level } = useAccessLevel();

  const trend = offer ? getPriceTrend(offer.category) : null;
  const impact = offer ? getCountryImpact(offer.category) : [];
  const signals = offer ? getMarketSignals(offer.category) : [];

  // Country-scoped news: prioritize supplier and origin country, then competitors/demand
  const relevantNews = useMemo<CountryNewsItem[]>(() => {
    if (!offer) return [];
    const offerCountries = new Set([offer.origin, offer.supplier.country]);
    const directly = countryNews.filter(
      (n) => n.category === offer.category && offerCountries.has(n.countryName),
    );
    const others = countryNews.filter(
      (n) => n.category === offer.category && !offerCountries.has(n.countryName),
    );
    return [...directly, ...others];
  }, [offer]);

  const isAnon = level === "anonymous_locked";
  const isReg = level === "registered_locked";
  const isQual = level === "qualified_unlocked";

  // Emit landed-cost view event once per offer mount/change.
  // Backend-readiness: replace with a real landed-cost lookup when API exists.
  const lastTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!offer) return;
    if (lastTrackedRef.current === offer.id) return;
    lastTrackedRef.current = offer.id;
    analytics.track("catalog_landed_cost_view", {
      offerId: offer.id,
      category: offer.category,
      origin: offer.origin,
      supplierCountry: offer.supplier.country,
      accessLevel: level,
    });
  }, [offer, level]);

  return (
    <aside
      className="space-y-3"
      aria-label={t.catalog_panel_aria}
      data-testid="catalog-selected-panel"
      data-access-level={level}
    >
      {!offer ? (
        <NeutralState />
      ) : (
        <>
          {/* 1. Offer summary */}
          <section className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.catalog_panel_summary_title}
              </p>
              {onCompareToggle && (
                <Button
                  type="button"
                  size="sm"
                  variant={isCompared ? "default" : "outline"}
                  aria-pressed={isCompared}
                  disabled={!isCompared && compareDisabled}
                  onClick={() => onCompareToggle(offer.id)}
                  className="h-6 shrink-0 px-2 text-[10px] font-semibold"
                  data-testid="catalog-panel-compare-toggle"
                >
                  {isCompared ? <X className="h-3 w-3" /> : <Scale className="h-3 w-3" />}
                  {isCompared ? t.catalog_panel_compare_remove : t.catalog_panel_compare_add}
                </Button>
              )}
            </div>
            <h3 className="mt-1 font-heading text-sm font-bold leading-tight text-foreground">
              {offer.productName}
            </h3>
            <p className="mt-0.5 text-[11px] italic text-muted-foreground">{offer.latinName}</p>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-muted-foreground">{t.catalog_panel_summary_origin}</span>
              <span className="font-medium text-foreground">
                {offer.originFlag} {offer.origin}
              </span>
              <span className="text-muted-foreground">{t.catalog_panel_summary_supplier}</span>
              <span className="font-medium text-foreground">
                {offer.supplier.countryFlag} {offer.supplier.country}
              </span>
              <span className="text-muted-foreground">{t.catalog_panel_summary_basis}</span>
              <span className="font-medium text-foreground">
                {offer.commercial.incoterm} · {offer.commercial.shipmentPort?.split(",")[0] ?? "—"}
              </span>
            </div>
          </section>

          {/* 2. Price movement */}
          {trend && (
            <section className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.catalog_intel_priceTrend_title}
                </h3>
                <Sparkline values={trend.series.map((p) => p.index)} />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-heading text-xl font-bold text-foreground">
                  {trend.currentIndex}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.catalog_intel_priceTrend_index}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                {([
                  { k: "d7", label: t.catalog_intel_priceTrend_d7, locked: false },
                  { k: "d30", label: t.catalog_intel_priceTrend_d30, locked: false },
                  { k: "d90", label: t.catalog_intel_priceTrend_d90, locked: !isQual },
                ] as const).map((row) => {
                  const data = trend[row.k];
                  return (
                    <div key={row.k} className="rounded-md bg-muted/40 p-1.5">
                      <p className="text-[10px] text-muted-foreground">{row.label}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-foreground">
                        {row.locked ? (
                          <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />
                        ) : (
                          <>
                            {dirIcon(data.dir)} {fmtPct(data.pct)}
                          </>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
              {(isReg || isQual) && (
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  {getIntelText(lang, `intel_trend_${trend.category}_explanation`, trend.explanation)}
                </p>
              )}
            </section>
          )}

          {/* Market signals (moved up to sit right after Price trend) */}
          {signals.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-3">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_intel_signals_title}
              </h3>
              <ul className="mt-2 space-y-1.5 text-[11px]">
                {signals.slice(0, isAnon ? 2 : signals.length).map((s) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                        s.severity === "alert"
                          ? "bg-destructive"
                          : s.severity === "watch"
                            ? "bg-primary"
                            : "bg-muted-foreground",
                      )}
                      aria-hidden
                    />
                    <span className="leading-snug text-foreground">{getIntelText(lang, `intel_signal_${s.id}_text`, s.text)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 3. Product-relevant news (country-scoped) */}
          {relevantNews.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-3">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_panel_news_title}
              </h3>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {t.catalog_panel_news_subtitle
                  .replace("{origin}", offer.origin)
                  .replace("{supplier}", offer.supplier.country)}
              </p>
              <ul className="mt-2 space-y-2.5">
                {relevantNews.slice(0, isAnon ? 1 : isReg ? 3 : 5).map((n) => {
                  const isPrimary =
                    n.countryName === offer.origin || n.countryName === offer.supplier.country;
                  return (
                    <li key={n.id} className="text-xs">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span aria-hidden>{n.countryFlag}</span>
                        <span className="font-semibold text-foreground">{n.countryName}</span>
                        {isPrimary && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                            {t.catalog_panel_news_primary}
                          </span>
                        )}
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-foreground">
                          {reasonLabel(t, n.relevanceReason)}
                        </span>
                        <span>· {formatDaysAgo(lang, n.daysAgo)}</span>
                      </div>
                      <p className="mt-0.5 font-medium leading-snug text-foreground">
                        {getIntelText(lang, `intel_news_${n.id}_headline`, n.headline)}
                      </p>
                      {(isReg || isQual) && (
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                          {getIntelText(lang, `intel_news_${n.id}_summary`, n.summary)}
                        </p>
                      )}
                      {isQual && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
                          <ExternalLink className="h-3 w-3" aria-hidden /> {n.source}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 4. Countries affecting price (highlight offer's countries) */}
          {impact.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-3">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_intel_impact_title}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {impact
                  .slice(0, isAnon ? 3 : impact.length)
                  .map((c) => {
                    const matches =
                      c.countryName === offer.origin || c.countryName === offer.supplier.country;
                    return (
                      <li
                        key={c.countryCode}
                        className={cn(
                          "rounded-md p-1.5 text-xs",
                          matches ? "bg-primary/5 ring-1 ring-primary/20" : "",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span aria-hidden>{c.countryFlag}</span>
                            <span className="font-semibold text-foreground">{c.countryName}</span>
                          </span>
                          {isQual ? (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              {c.impactPct}%
                            </span>
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />
                          )}
                        </div>
                        {(isReg || isQual) && (
                          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                            {getIntelText(lang, `intel_impact_${offer.category}_${c.countryCode}_reason`, c.reason)}
                          </p>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </section>
          )}

          {/* 5. Document readiness */}
          <section className="rounded-lg border border-border bg-card p-3">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.catalog_panel_docs_title}
            </h3>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
              {getDocumentReadiness(offer).map((d) => {
                const labelKey = `catalog_panel_doc_${d.key}` as const;
                const label = (t as unknown as Record<string, string>)[labelKey] ?? d.key;
                return (
                  <li
                    key={d.key}
                    className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-1.5 py-1"
                  >
                    {d.ready ? (
                      <FileCheck2 className="h-3 w-3 text-primary" aria-hidden />
                    ) : (
                      <FileX2 className="h-3 w-3 text-muted-foreground" aria-hidden />
                    )}
                    <span
                      className={cn(
                        d.ready ? "text-foreground" : "text-muted-foreground",
                        "leading-tight",
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {t.catalog_panel_docs_disclaimer}
            </p>
          </section>

          {/* 6. Supplier trust summary */}
          <section className="rounded-lg border border-border bg-card p-3">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.catalog_panel_supplier_title}
            </h3>
            <ul className="mt-2 space-y-1 text-[11px]">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.catalog_panel_supplier_verification}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <ShieldCheck className="h-3 w-3 text-primary" aria-hidden />
                  {offer.supplier.isVerified
                    ? t.catalog_panel_supplier_verified
                    : t.catalog_panel_supplier_unverified}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.catalog_panel_supplier_response}</span>
                <span className="font-semibold text-foreground">{offer.supplier.responseTime}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.catalog_panel_supplier_since}</span>
                <span className="font-semibold text-foreground">{offer.supplier.inBusinessSince}</span>
              </li>
            </ul>
          </section>

        </>
      )}
    </aside>
  );
};

export default SelectedOfferPanel;
