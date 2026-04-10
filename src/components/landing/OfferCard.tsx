import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, MapPin, Lock, Snowflake, Leaf, Thermometer } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";

interface OfferCardProps {
  offer: SeafoodOffer;
}

const formatIcon = {
  Frozen: Snowflake,
  Fresh: Leaf,
  Chilled: Thermometer,
};

const certColors: Record<string, string> = {
  HACCP: "bg-muted text-muted-foreground",
  MSC: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ASC: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  BAP: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  BRC: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
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

        {/* Species / Latin name */}
        <p className="mt-0.5 text-xs italic text-muted-foreground">
          {offer.latinName}
        </p>

        {/* Origin + MOQ row */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{offer.originFlag} {offer.origin}</span>
          </div>
          <span className="font-medium">{offer.moq}</span>
        </div>

        {/* Certifications */}
        <div className="mt-2 flex flex-wrap gap-1">
          {offer.certifications.map((cert) => (
            <span
              key={cert}
              className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${certColors[cert] || "bg-muted text-muted-foreground"}`}
            >
              {cert}
            </span>
          ))}
          <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {offer.packaging}
          </span>
        </div>

        {/* Supplier — hidden, requires approval */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground select-none">Supplier hidden</span>
          </div>
          {offer.isVerified && (
            <Badge variant="secondary" className="gap-0.5 px-1.5 py-0 text-[10px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>

        {/* Price — blurred range, login to reveal */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold text-foreground blur-[5px] select-none pointer-events-none">
              {offer.priceRange}
            </span>
            <span className="text-xs text-muted-foreground">{offer.priceUnit}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-primary">
            <Lock className="h-3 w-3" />
            <span className="font-medium">Register to see prices</span>
          </div>
        </div>

        {/* CTA */}
        <Button variant="outline" size="sm" className="mt-3 w-full text-xs font-semibold transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          Request Price & Contact
        </Button>
      </div>
    </div>
  );
};

export default OfferCard;
