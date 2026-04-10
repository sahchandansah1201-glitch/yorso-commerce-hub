import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import OfferCard from "./OfferCard";
import { mockOffers } from "@/data/mockOffers";

const LiveOffers = () => {
  const visibleOffers = mockOffers.slice(0, 8);

  return (
    <section id="offers" className="bg-background py-12 md:py-16">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <span className="text-sm font-medium text-primary">Live Marketplace</span>
            </div>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Wholesale Offers
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fresh listings from verified suppliers worldwide — updated continuously
            </p>
          </div>
          <Button variant="ghost" className="hidden gap-1 text-sm font-medium text-primary hover:text-primary md:flex">
            View all offers
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleOffers.slice(0, 4).map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {/* Second row — desktop only */}
        <div className="mt-4 hidden grid-cols-4 gap-4 lg:grid">
          {visibleOffers.slice(4, 8).map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center md:hidden">
          <Button variant="outline" className="gap-1 font-semibold">
            View All Offers
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LiveOffers;
