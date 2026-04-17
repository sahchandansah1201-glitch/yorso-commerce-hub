import { Button } from "@/components/ui/button";
import { Clock, MapPin, Snowflake, Leaf, Thermometer, ShieldCheck, Lock } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import { getAvailabilityTier, getSupplierRegion } from "@/lib/visibility";

interface OfferCardProps {
  offer: SeafoodOffer;
}

const formatIcon = {
  Frozen: Snowflake,
  Fresh: Leaf,
  Chilled: Thermometer,
};

const translateFreshness = (raw: string, t: { card_listedToday: string; card_updatedAgo: string }) => {
  if (/listed today/i.test(raw)) return t.card_listedToday;
  const m = raw.match(/Updated\s+(.+?)\s+ago/i);
  if (m) return (t.card_updatedAgo as string).replace("{time}", m[1]);
  return raw;
};

const OfferCard = ({ offer }: OfferCardProps) => {
  const { t } = useLanguage();
  const FormatIcon = formatIcon[offer.format];
  const formatLabels = { Frozen: t.card_frozen, Fresh: t.card_fresh, Chilled: t.card_chilled };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={offer.image}
          alt={offer.productName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            <Clock className="h-3 w-3 text-primary" />
            {translateFreshness(offer.freshness, t)}
          </span>
        </div>
        <div className="absolute right-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur-sm">
            <FormatIcon className="h-3 w-3" />
            {formatLabels[offer.format]}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-sm font-semibold leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">
          {offer.productName}
        </h3>
        <p className="mt-0.5 text-[11px] italic text-muted-foreground">{offer.latinName}</p>

        <div className="mt-1.5 flex items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{offer.originFlag} {offer.origin}</span>
          </div>
        </div>

        {/* Anonymous supplier trust row — no name, region only */}
        <div className="mt-2 flex items-center gap-1.5 text-xs min-h-[2rem]">
          {offer.isVerified && (
            <ShieldCheck
              className="h-3.5 w-3.5 shrink-0 text-success"
              aria-label={t.card_verified}
            />
          )}
          <span className="font-medium text-foreground line-clamp-2 leading-snug">
            {(offer.isVerified ? t.card_supplierAnonymousVerified : t.card_supplierAnonymous).replace(
              "{region}",
              getSupplierRegion(offer.supplier?.country)
            )}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-heading text-sm font-semibold text-foreground">
                {t.card_priceOnRequest}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {(() => {
                const tier = getAvailabilityTier(offer);
                if (tier === "container") return t.card_availability_container;
                if (tier === "limited") return t.card_availability_limited;
                return t.card_availability_pallet;
              })()}
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="mt-3 w-full text-xs font-semibold transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {t.card_viewOffer}
        </Button>
      </div>
    </div>
  );
};

export default OfferCard;
