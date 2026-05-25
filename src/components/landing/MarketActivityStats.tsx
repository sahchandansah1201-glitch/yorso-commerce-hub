import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Counter-strip with aggregated 24h marketplace activity. Sits above the
 * MarketplaceActivity feed on the homepage. Numbers are mock estimates —
 * the subtitle explicitly labels them as estimate-based, per the access &
 * honesty rules in AGENTS.md.
 */
const MarketActivityStats = () => {
  const { t } = useLanguage();
  return (
    <section
      aria-label={t.marketStats_title}
      className="border-y border-border bg-muted/30 py-8"
      data-testid="market-activity-stats"
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="font-heading text-base font-semibold text-foreground md:text-lg">
            {t.marketStats_title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{t.marketStats_subtitle}</p>
        </div>
        <ul className="mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
          {t.marketStats_items.map((item) => (
            <li
              key={item.label}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <p className="font-heading text-xl font-bold text-foreground md:text-2xl">
                {item.value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default MarketActivityStats;
