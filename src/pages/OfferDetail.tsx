import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShieldCheck, MapPin, Clock, Snowflake, Leaf, Thermometer } from "lucide-react";
import { mockOffers } from "@/data/mockOffers";
import analytics from "@/lib/analytics";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

const OfferDetail = () => {
  const { id } = useParams();
  const offer = mockOffers.find((o) => o.id === id);

  useEffect(() => {
    if (offer) analytics.track("offer_detail_view", { offerId: offer.id, product: offer.productName });
  }, [offer]);

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Offer not found</h1>
          <Link to="/offers"><Button className="mt-4">Browse all offers</Button></Link>
        </div>
      </div>
    );
  }

  const FormatIcon = formatIcon[offer.format];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">YORSO</Link>
          <div className="flex items-center gap-3">
            <Link to="/signin"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm" className="font-semibold">Register Free</Button></Link>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <Link to="/offers">
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> All offers
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              src={offer.image}
              alt={offer.productName}
              className="h-full w-full object-cover aspect-[4/3]"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                <FormatIcon className="h-3 w-3" /> {offer.format}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                <Clock className="h-3 w-3" /> {offer.freshness}
              </span>
            </div>

            <h1 className="mt-4 font-heading text-2xl font-bold text-foreground md:text-3xl">{offer.productName}</h1>
            <p className="mt-1 text-sm italic text-muted-foreground">{offer.latinName}</p>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {offer.originFlag} {offer.origin}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-bold text-foreground">{offer.priceRange}</span>
                <span className="text-sm text-muted-foreground">{offer.priceUnit}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{offer.moq}</p>
              <p className="mt-1 text-sm text-muted-foreground">Packaging: {offer.packaging}</p>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{offer.supplierName}</span>
                {offer.isVerified && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
              {offer.certifications.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {offer.certifications.map((c) => (
                    <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{c}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Link to="/register">
                <Button className="w-full gap-2 font-semibold" size="lg"
                  onClick={() => analytics.track("register_cta_offer_detail", { offerId: offer.id })}>
                  Register to Contact Supplier <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-center text-xs text-muted-foreground">Free registration · No credit card required · Direct supplier contact</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OfferDetail;
