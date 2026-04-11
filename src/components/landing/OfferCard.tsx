import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, MapPin, Snowflake, Leaf, Thermometer } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";

interface OfferCardProps {
  offer: SeafoodOffer;
}

const formatIcon = {
  Frozen: Snowflake,
  Fresh: Leaf,
  Chilled: Thermometer,
};

const OfferCard = ({ offer }: OfferCardProps) => {
  const FormatIcon = formatIcon[offer.format];

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
      {/* Image — 4:3 ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={offer.image}
          alt={offer.productName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* Freshness badge */}
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            <Clock className="h-3 w-3 text-primary" />
            {offer.freshness}
          </span>
        </div>
        {/* Format badge */}
        <div className="absolute right-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur-sm">
            <FormatIcon className="h-3 w-3" />
            {offer.format}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Product name */}
        <h3 className="font-heading text-sm font-semibold leading-tight text-foreground line-clamp-2">
          {offer.productName}
        </h3>
        <p className="mt-0.5 text-[11px] italic text-muted-foreground">{offer.latinName}</p>

        {/* Origin + MOQ row */}
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{offer.originFlag} {offer.origin}</span>
          </div>
          <span className="font-medium">{offer.moq}</span>
        </div>

        {/* Supplier */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground truncate">{offer.supplierName}</span>
          {offer.isVerified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        {/* Price — visible */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold text-foreground">
              {offer.priceRange}
            </span>
            <span className="text-xs text-muted-foreground">{offer.priceUnit}</span>
          </div>
        </div>

        {/* CTA */}
        <Button variant="outline" size="sm" className="mt-3 w-full text-xs font-semibold transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          View Offer
        </Button>
      </div>
    </div>
  );
};

export default OfferCard;
