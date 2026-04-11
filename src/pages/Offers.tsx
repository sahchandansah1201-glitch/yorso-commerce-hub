import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import OfferCard from "@/components/landing/OfferCard";
import { mockOffers, categories } from "@/data/mockOffers";
import analytics from "@/lib/analytics";

const Offers = () => {
  useEffect(() => {
    analytics.track("offers_list_view");
  }, []);

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
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to homepage
          </Button>
        </Link>

        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">All Wholesale Offers</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse {mockOffers.length}+ live offers from verified suppliers worldwide.</p>

        <div className="mt-6 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-10" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat.name} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              {cat.icon} {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockOffers.map((offer) => (
            <Link key={offer.id} to={`/offers/${offer.id}`} onClick={() => analytics.track("live_offer_card_click", { offerId: offer.id, product: offer.productName })}>
              <OfferCard offer={offer} />
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">Showing all available offers. Register to see full supplier details and pricing.</p>
          <Link to="/register">
            <Button className="mt-4 gap-2 font-semibold">
              Register Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Offers;
