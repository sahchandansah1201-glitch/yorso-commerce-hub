import {
  Activity,
  ExternalLink,
  FileCheck2,
  FileX2,
  Lock,
  Minus,
  Package,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import {
  getCountryImpact,
  getMarketSignals,
  type TrendDirection,
} from "@/data/mockIntelligence";
import {
  getDocumentReadiness,
  getLandedCostEstimate,
  getOfferPriceDetail,
  getOfferRelevantNews,
  getSupplierRisk,
  type NewsRelevanceReason,
  type DocumentStatus,
} from "@/data/mockProcurement";
import type { SeafoodOffer } from "@/data/mockOffers";
import { cn } from "@/lib/utils";

interface Props {
  offer: SeafoodOffer | null;
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

const reasonKey = (r: NewsRelevanceReason) =>
  ({
    affects_price: "catalog_panel_news_reason_price",
    affects_availability: "catalog_panel_news_reason_availability",
    affects_logistics: "catalog_panel_news_reason_logistics",
    affects_compliance: "catalog_panel_news_reason_compliance",
    affects_supplier_risk: "catalog_panel_news_reason_supplier_risk",
  } as const)[r];

const docStatusKey = (s: DocumentStatus) =>
  ({
    verified: "catalog_panel_docs_status_verified",
    pending: "catalog_panel_docs_status_pending",
    supplier_provided: "catalog_panel_docs_status_supplier",
  } as const)[s];

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

export const SelectedOfferPanel = ({ offer }: Props) => {
  const { t } = useLanguage();
  const { level } = useAccessLevel();

  const detail = useMemo(() => (offer ? getOfferPriceDetail(offer) : null), [offer]);
  const news = useMemo(() => (offer ? getOfferRelevantNews(offer) : []), [offer]);
  const impact = offer ? getCountryImpact(offer.category) : [];
  const signals = offer ? getMarketSignals(offer.category) : [];
  const docs = offer ? getDocumentReadiness(offer) : [];
  const supplier = offer ? getSupplierRisk(offer) : null;
  const landed = useMemo(
    () => (offer ? getLandedCostEstimate(offer, level) : null),
    [offer, level],
  );

  const isAnon = level === "anonymous_locked";
  const isReg = level === "registered_locked";
  const isQual = level === "qualified_unlocked";

  return (
    <aside
      className="space-y-3"
      aria-label={t.catalog_panel_aria}
      data-testid="catalog-selected-panel"
      data-access-level={level}
    >
      {!offer || !detail ? (
        <NeutralState />
      ) : (
        <>
          {/* 1. Offer summary */}
          <section className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t.catalog_panel_summary_title}
            </p>
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
              <span className="text-muted-foreground">{t.catalog_panel_summary_format}</span>
              <span className="font-medium text-foreground">
                {offer.format} · {offer.cutType.split(",")[0]}
              </span>
            </div>
          </section>

          {/* 2. Offer-specific price movement */}
          <section className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_panel_price_title}
              </h3>
              <Sparkline values={detail.series.map((p) => p.index)} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-heading text-xl font-bold text-foreground">
                {detail.contextIndex}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.catalog_panel_price_offerIndex}
              </span>
              <span
                className={cn(
                  "ml-auto text-[10px] font-semibold",
                  detail.vsBenchmarkPct > 0
                    ? "text-primary"
                    : detail.vsBenchmarkPct < 0
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              >
                {fmtPct(detail.vsBenchmarkPct)} {t.catalog_panel_price_vsBenchmark}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
              {([
                { k: "d7", label: t.catalog_intel_priceTrend_d7, locked: false },
                { k: "d30", label: t.catalog_intel_priceTrend_d30, locked: false },
                { k: "d90", label: t.catalog_intel_priceTrend_d90, locked: !isQual },
              ] as const).map((row) => {
                const data = detail[row.k];
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
            {detail.contextFactors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {detail.contextFactors.slice(0, 4).map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] text-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
            {(isReg || isQual) && detail.explanation && (
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {detail.explanation}
              </p>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
              {detail.lastUpdated}
              {isQual && <> · {detail.sourceLabel}</>}
            </p>
          </section>

          {/* 3. Offer-specific news with reason */}
          {news.length > 0 && (
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
                {news.slice(0, isAnon ? 1 : isReg ? 3 : 5).map((n) => {
                  const isPrimary =
                    n.role === "supplier_country" || n.role === "origin_country";
                  const reasonLabel =
                    (t as unknown as Record<string, string>)[reasonKey(n.reason)] ?? "";
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
                        <span>· {n.publishedAt}</span>
                      </div>
                      <p className="mt-0.5 font-medium leading-snug text-foreground">
                        {n.headline}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {reasonLabel}
                      </p>
                      {(isReg || isQual) && (
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                          {n.summary}
                        </p>
                      )}
                      {isQual && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          <ExternalLink className="h-3 w-3" aria-hidden /> {n.source}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 4. Countries affecting price */}
          {impact.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-3">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_intel_impact_title}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {impact.slice(0, isAnon ? 3 : impact.length).map((c) => {
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
                          {c.reason}
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
            <ul className="mt-2 grid grid-cols-1 gap-1.5 text-[11px]">
              {docs.map((d) => {
                const labelKey = `catalog_panel_doc_${d.key}` as const;
                const label =
                  (t as unknown as Record<string, string>)[labelKey] ?? d.key;
                const statusLabel =
                  (t as unknown as Record<string, string>)[docStatusKey(d.status)] ?? d.status;
                return (
                  <li
                    key={d.key}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-1.5 py-1"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {d.status === "verified" ? (
                        <FileCheck2 className="h-3 w-3 text-primary" aria-hidden />
                      ) : d.status === "supplier_provided" ? (
                        <FileCheck2 className="h-3 w-3 text-muted-foreground" aria-hidden />
                      ) : (
                        <FileX2 className="h-3 w-3 text-muted-foreground" aria-hidden />
                      )}
                      <span className="text-foreground">{label}</span>
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide",
                        d.status === "verified"
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {statusLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {t.catalog_panel_docs_disclaimer}
            </p>
          </section>

          {/* 6. Supplier risk/trust summary */}
          {supplier && (
            <section className="rounded-lg border border-border bg-card p-3">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_panel_supplier_title}
              </h3>
              <ul className="mt-2 space-y-1 text-[11px]">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t.catalog_panel_supplier_verification}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <ShieldCheck className="h-3 w-3 text-primary" aria-hidden />
                    {supplier.verification === "verified"
                      ? t.catalog_panel_supplier_verified
                      : t.catalog_panel_supplier_unverified}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t.catalog_panel_supplier_response}
                  </span>
                  <span className="font-semibold text-foreground">{supplier.responseTime}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t.catalog_panel_supplier_since}
                  </span>
                  <span className="font-semibold text-foreground">
                    {supplier.inBusinessSince}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t.catalog_panel_supplier_docReadiness}
                  </span>
                  <span className="font-semibold text-foreground">
                    {supplier.documentReadinessPct}%
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t.catalog_panel_supplier_countryRisk}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      supplier.countryRisk === "low"
                        ? "bg-primary/10 text-primary"
                        : supplier.countryRisk === "elevated"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-foreground",
                    )}
                  >
                    {(t as unknown as Record<string, string>)[
                      `catalog_panel_supplier_risk_${supplier.countryRisk}`
                    ] ?? supplier.countryRisk}
                  </span>
                </li>
              </ul>
            </section>
          )}

          {/* 7. Landed cost estimate */}
          {landed && (
            <section className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.catalog_panel_landed_title}
                </h3>
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  {t.catalog_panel_landed_estimateBadge}
                </span>
              </div>
              {landed.numericVisible && landed.totalPerKg > 0 ? (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-heading text-xl font-bold text-foreground">
                      {landed.currency} {landed.totalPerKg.toFixed(2)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t.catalog_panel_landed_perKg}
                    </span>
                  </div>
                  <ul className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                    <li className="flex items-center justify-between rounded-md bg-muted/40 px-1.5 py-1">
                      <span className="text-muted-foreground">
                        {t.catalog_panel_landed_unit}
                      </span>
                      <span className="font-semibold text-foreground">
                        {landed.unitPrice.toFixed(2)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-md bg-muted/40 px-1.5 py-1">
                      <span className="text-muted-foreground">
                        {t.catalog_panel_landed_freight}
                      </span>
                      <span className="font-semibold text-foreground">
                        {landed.freight.toFixed(2)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-md bg-muted/40 px-1.5 py-1">
                      <span className="text-muted-foreground">
                        {t.catalog_panel_landed_duty}
                      </span>
                      <span className="font-semibold text-foreground">
                        {landed.duty.toFixed(2)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between rounded-md bg-muted/40 px-1.5 py-1">
                      <span className="text-muted-foreground">
                        {t.catalog_panel_landed_handling}
                      </span>
                      <span className="font-semibold text-foreground">
                        {(landed.insurance + landed.handling).toFixed(2)}
                      </span>
                    </li>
                  </ul>
                </>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-semibold text-foreground">
                    {landed.currency} {landed.rangeLow.toFixed(2)}–{landed.rangeHigh.toFixed(2)}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {t.catalog_panel_landed_perKg}
                  </span>
                </div>
              )}
              <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                {t.catalog_panel_landed_disclaimer}
              </p>
            </section>
          )}

          {/* 8. Market signals */}
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
                    <span className="leading-snug text-foreground">{s.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </aside>
  );
};

export default SelectedOfferPanel;
