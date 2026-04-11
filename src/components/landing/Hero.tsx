import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, ShieldCheck, Package, Globe, Users } from "lucide-react";
import { marketplaceStats } from "@/data/mockOffers";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-accent pb-14 pt-20 md:pb-20 md:pt-28">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-accent-foreground md:text-4xl lg:text-5xl">
            Verified Suppliers. Transparent Prices.
            <span className="block text-primary">Full Control Over Your Sourcing.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-accent-foreground/70 md:text-lg">
            Source wholesale seafood from {marketplaceStats.verifiedSuppliers} verified suppliers
            across {marketplaceStats.countries} countries — with direct contacts, real prices,
            and zero commissions.
          </p>

          {/* Search / Intent Capture */}
          <div className="mx-auto mt-8 max-w-lg">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products — e.g. salmon fillet, vannamei shrimp..."
                  className="h-12 rounded-lg border-accent-foreground/20 bg-accent-foreground/5 pl-10 text-sm text-accent-foreground placeholder:text-accent-foreground/40 focus-visible:ring-primary"
                />
              </div>
              <Button size="lg" className="h-12 gap-1.5 px-5 font-semibold">
                Search
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-accent-foreground/50">
              Popular: Atlantic Salmon · Vannamei Shrimp · Cod Loin · King Crab
            </p>
          </div>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full gap-2 font-semibold sm:w-auto">
              Register Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="w-full gap-2 border-accent-foreground/20 bg-transparent text-accent-foreground hover:bg-accent-foreground/5 sm:w-auto">
              Explore Live Offers
            </Button>
          </div>

          {/* Compact proof signals */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-accent-foreground/60">
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.totalOffers.toLocaleString()} live offers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.verifiedSuppliers} verified suppliers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.countries} countries</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span>{marketplaceStats.activeBuyers.toLocaleString()}+ active buyers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
