import { Link } from "react-router-dom";
import {
  Clock, Snowflake, Leaf, Thermometer, Package, MapPin, Scale, Lock, ArrowRight,
} from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { getAvailabilityTier } from "@/lib/visibility";
import analytics from "@/lib/analytics";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

const StockBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    "In Stock": "bg-success/10 text-success",
    Limited: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "Pre-order": "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] || colors["In Stock"]}`}>
      {status}
    </span>
  );
};

const SpecRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 py-1">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

interface Props {
  offer: SeafoodOffer;
}

const OfferSummary = ({ offer }: Props) => {
  const { t } = useLanguage();
  const FormatIcon = formatIcon[offer.format];
  const tier = getAvailabilityTier(offer);
  const availabilityLabel =
    tier === "container"
      ? t.card_availability_container
      : tier === "limited"
      ? t.card_availability_limited
      : t.card_availability_pallet;

  // Incoterm codes only — no port, no exact price, no lead time
  const incotermCodes = Array.from(new Set(offer.deliveryBasisOptions.map((b) => b.code)));

  return (
    <div className="space-y-5">
      {/* Product identity */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            <FormatIcon className="h-3 w-3" /> {offer.format}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {offer.freshness}
          </span>
          <StockBadge status={offer.commercial.stockStatus} />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground md:text-2xl leading-tight">{offer.productName}</h1>
        <p className="mt-1 text-sm italic text-muted-foreground">{offer.latinName}</p>
      </div>

      {/* Public product specs — no commercial intelligence */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Cut type" value={offer.cutType} />
        <SpecRow icon={<MapPin className="h-3.5 w-3.5" />} label="Origin" value={`${offer.originFlag} ${offer.origin}`} />
        <SpecRow icon={<Package className="h-3.5 w-3.5" />} label="Packaging" value={offer.packaging} />
        <SpecRow icon={<Scale className="h-3.5 w-3.5" />} label="Availability" value={availabilityLabel} />
      </div>

      {/* Locked Commercial Terms — guest view */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="font-heading text-sm font-semibold text-foreground">
            {t.offer_locked_priceTitle}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Incoterm codes only — no ports, no exact prices */}
          {incotermCodes.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-2">Incoterms supported</p>
              <div className="flex flex-wrap gap-1.5">
                {incotermCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.offer_locked_helper}
          </p>

          <Link
            to="/register"
            className="block"
            onClick={() =>
              analytics.track("register_to_unlock_click", {
                surface: "detail",
                offerId: offer.id,
              })
            }
          >
            <Button className="w-full gap-2 font-semibold" size="lg">
              {t.offer_locked_priceCta} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Public availability indicators — non-commercial */}
      <div className="flex flex-wrap gap-3 text-xs">
        {offer.sampleAvailable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-success">
            ✓ Sample available
          </span>
        )}
        {offer.inspectionAvailable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-success">
            ✓ Pre-shipment inspection
          </span>
        )}
      </div>
    </div>
  );
};

export default OfferSummary;
