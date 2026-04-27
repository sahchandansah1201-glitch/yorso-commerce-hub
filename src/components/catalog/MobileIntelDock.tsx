import { useState } from "react";
import { ChevronDown, ChevronUp, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  offer: SeafoodOffer | null;
}

const dirIcon = (d: TrendDirection) => {
  if (d === "up") return <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />;
  if (d === "down") return <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />;
};

const fmtPct = (pct: number) => (pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`);

/**
 * Mobile/tablet sticky dock that surfaces the THREE most-decision-relevant intel
 * blocks (Price trend → Market signals → News) for the selected offer, directly
 * above the offer list. On desktop (xl+) the right sticky panel covers this,
 * so this dock is hidden via `xl:hidden` from the parent.
 *
 * UX contract:
 *  - Visible by default (collapsed=false) so analytics is one tap away.
 *  - User can collapse via the toggle; stays collapsed until they expand again.
 *  - Tied to currently selected offer (mini-card header shows which offer).
 */
const MobileIntelDock = ({ offer }: Props) => {
  const { t, lang } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  if (!offer) return null;

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
    <aside
      aria-label={t.catalog_panel_dock_aria}
      data-testid="catalog-mobile-intel-dock"
      className="sticky top-16 z-20 -mx-4 mb-3 border-y border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:mx-0 sm:rounded-lg sm:border sm:px-3"
    >
      {/* Mini-card header: which offer this analytics belongs to + toggle */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          {offer.gallery?.[0]?.src ? (
            <img
              src={offer.gallery[0].src}
              alt={offer.gallery[0].alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-foreground">
            {offer.productName}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {offer.originFlag} {offer.origin} · {offer.commercial.incoterm}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls="catalog-mobile-intel-body"
          className="h-7 shrink-0 px-2 text-[11px] font-semibold"
          data-testid="catalog-mobile-intel-toggle"
        >
          {collapsed ? t.catalog_panel_dock_show : t.catalog_panel_dock_hide}
          {collapsed ? (
            <ChevronDown className="ml-1 h-3 w-3" aria-hidden />
          ) : (
            <ChevronUp className="ml-1 h-3 w-3" aria-hidden />
          )}
        </Button>
      </div>

      {!collapsed && (
        <div
          id="catalog-mobile-intel-body"
          className="mt-2 grid gap-2 sm:grid-cols-3"
        >
          {/* 1. Price trend */}
          {trend && (
            <section
              className="rounded-md border border-border bg-card p-2"
              data-testid="catalog-dock-price-trend"
            >
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_intel_priceTrend_title}
              </h3>
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

          {/* 2. Market signals */}
          {signals.length > 0 && (
            <section
              className="rounded-md border border-border bg-card p-2"
              data-testid="catalog-dock-market-signals"
            >
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_intel_signals_title}
              </h3>
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

          {/* 3. News */}
          {relevantNews.length > 0 && (
            <section
              className="rounded-md border border-border bg-card p-2"
              data-testid="catalog-dock-news"
            >
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.catalog_panel_news_title}
              </h3>
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
      )}
    </aside>
  );
};

export default MobileIntelDock;
