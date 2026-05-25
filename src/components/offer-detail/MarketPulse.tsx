import { Activity, Eye, MessageSquareReply, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { pulseInt } from "@/lib/pulse-seed";

interface Props {
  offerId: string;
}

/**
 * Market Pulse mini-block for the offer-detail intelligence column. Surfaces
 * deterministic offer-scoped mock signals (viewers, RFQs, response time, price
 * moves) right next to the price-access CTA. All values are labelled as
 * estimates — never present as live backend data.
 */
const MarketPulse = ({ offerId }: Props) => {
  const { t } = useLanguage();

  const viewing = pulseInt(offerId, "mp-view", 3, 14);
  const rfqs = pulseInt(offerId, "mp-rfq", 4, 28);
  const responseHours = pulseInt(offerId, "mp-resp", 2, 8);
  const priceMoves = pulseInt(offerId, "mp-price", 1, 6);

  const rows = [
    { icon: Eye, text: t.marketPulse_viewing.replace("{n}", String(viewing)) },
    { icon: MessageSquareReply, text: t.marketPulse_rfqs.replace("{n}", String(rfqs)) },
    { icon: Activity, text: t.marketPulse_response.replace("{time}", `~${responseHours}h`) },
    { icon: TrendingUp, text: t.marketPulse_priceMoves.replace("{n}", String(priceMoves)) },
  ];

  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      data-testid="offer-market-pulse"
      aria-labelledby="offer-market-pulse-heading"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <h4
          id="offer-market-pulse-heading"
          className="font-heading text-sm font-semibold text-foreground"
        >
          {t.marketPulse_title}
        </h4>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.text}
            className="flex items-start gap-2 text-xs text-foreground"
          >
            <r.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] italic text-muted-foreground">
        {t.marketPulse_estimate}
      </p>
    </section>
  );
};

export default MarketPulse;
