import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  countryNews,
  getMarketSignals,
  getPriceTrend,
  type CountryNewsItem,
  type TrendDirection,
} from "@/data/mockIntelligence";
import type { SeafoodOffer } from "@/data/mockOffers";
import { cn } from "@/lib/utils";
import { formatDaysAgo, getIntelText } from "@/i18n/translations";

interface Props {
  offer: SeafoodOffer;
}

const dirIcon = (d: TrendDirection) => {
  if (d === "up") return <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />;
  if (d === "down") return <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
};

const fmtPct = (pct: number) => (pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`);

/**
 * Inline analytics panel for an offer card.
 * Shows the same three blocks as the global intel dock
 * (price trend → market signals → news), tied to this specific offer.
 */
const OfferAnalyticsPanel = ({ offer }: Props) => {
  const { t, lang } = useLanguage();

  const trend = getPriceTrend(offer.category);
  const signals = getMarketSignals(offer.category);
  const offerCountries = new Set([offer.origin, offer.supplier.country]);
  const directly = countryNews.filter(
    (n) => n.category === offer.category && offerCountries.has(n.countryName),
  );
  const others = countryNews.filter(
    (n) => n.category === offer.category && !offerCountries.has(n.countryName),
  );
  const relevantNews: CountryNewsItem[] = [...directly, ...others].slice(0, 3);

  return (
    <div
      className="grid gap-2 sm:grid-cols-3"
      data-testid="catalog-row-analytics-body"
    >
      {trend && (
        <section
          className="rounded-md border border-border bg-card p-2"
          data-testid="catalog-row-price-trend"
        >
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.catalog_intel_priceTrend_title}
          </h4>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-heading text-base font-bold text-foreground">
              {trend.currentIndex}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
              {t.catalog_intel_priceTrend_index}
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
            <div className="rounded bg-muted/40 p-1">
              <p className="text-muted-foreground">{t.catalog_intel_priceTrend_d7}</p>
              <p className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                {dirIcon(trend.d7.dir)} {fmtPct(trend.d7.pct)}
              </p>
            </div>
            <div className="rounded bg-muted/40 p-1">
              <p className="text-muted-foreground">{t.catalog_intel_priceTrend_d30}</p>
              <p className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                {dirIcon(trend.d30.dir)} {fmtPct(trend.d30.pct)}
              </p>
            </div>
          </div>
        </section>
      )}

      {signals.length > 0 && (
        <section
          className="rounded-md border border-border bg-card p-2"
          data-testid="catalog-row-market-signals"
        >
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.catalog_intel_signals_title}
          </h4>
          <ul className="mt-1.5 space-y-1 text-[10px]">
            {signals.slice(0, 2).map((s) => (
              <li key={s.id} className="flex items-start gap-1.5">
                <span
                  className={cn(
                    "mt-1 h-1 w-1 shrink-0 rounded-full",
                    s.severity === "alert"
                      ? "bg-destructive"
                      : s.severity === "watch"
                        ? "bg-primary"
                        : "bg-muted-foreground",
                  )}
                  aria-hidden
                />
                <span className="leading-snug text-foreground line-clamp-2">
                  {getIntelText(lang, `intel_signal_${s.id}_text`, s.text)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relevantNews.length > 0 && (
        <section
          className="rounded-md border border-border bg-card p-2"
          data-testid="catalog-row-news"
        >
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.catalog_panel_news_title}
          </h4>
          <ul className="mt-1.5 space-y-1.5 text-[10px]">
            {relevantNews.slice(0, 2).map((n) => (
              <li key={n.id}>
                <div className="flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground">
                  <span aria-hidden>{n.countryFlag}</span>
                  <span className="font-semibold text-foreground">{n.countryName}</span>
                  <span>· {formatDaysAgo(lang, n.daysAgo)}</span>
                </div>
                <p className="mt-0.5 font-medium leading-snug text-foreground line-clamp-2">
                  {getIntelText(lang, `intel_news_${n.id}_headline`, n.headline)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default OfferAnalyticsPanel;
