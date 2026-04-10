import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, MapPin } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";

interface OfferCardProps {
  offer: SeafoodOffer;
}

const OfferCard = ({ offer }: OfferCardProps) => {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
      {/* Image — 4:3 ratio, ~58% visual weight */}
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
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Product name */}
        <h3 className="font-heading text-sm font-semibold leading-tight text-foreground line-clamp-2">
          {offer.productName}
        </h3>

        {/* Species / Latin name */}
        <p className="mt-0.5 text-xs italic text-muted-foreground">
          {offer.latinName}
        </p>

        {/* Origin */}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{offer.originFlag} {offer.origin}</span>
        </div>

        {/* Supplier */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{offer.supplierName}</span>
          {offer.isVerified && (
            <Badge variant="secondary" className="gap-0.5 px-1.5 py-0 text-[10px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>

        {/* Price + MOQ */}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-base font-bold text-foreground">
              {offer.priceRange}
            </span>
            <span className="text-xs text-muted-foreground">{offer.priceUnit}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{offer.moq}</p>
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
