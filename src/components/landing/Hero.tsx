import { Button } from "@/components/ui/button";
import { Search, ArrowRight, TrendingUp, Globe, ShieldCheck, Package } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-accent pb-8 pt-16 md:pb-12 md:pt-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-accent-foreground md:text-5xl lg:text-6xl">
            Source Wholesale Seafood
            <span className="block text-primary"> From Verified Suppliers</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-accent-foreground/70 md:text-lg">
            Access 1,200+ live wholesale offers from 380 verified suppliers across 48 countries.
            Compare prices, check origins, and connect directly.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-lg">
            <div className="flex overflow-hidden rounded-lg border border-accent-foreground/10 bg-accent-foreground/5 shadow-lg shadow-accent-foreground/5 transition-shadow focus-within:shadow-xl">
              <div className="flex flex-1 items-center gap-2 px-4">
                <Search className="h-5 w-5 text-accent-foreground/40" />
                <input
                  type="text"
                  placeholder="Search products, species, or suppliers..."
                  className="flex-1 bg-transparent py-3.5 text-sm text-accent-foreground placeholder:text-accent-foreground/40 focus:outline-none"
                />
              </div>
              <Button className="m-1.5 rounded-md font-semibold">
                Search
              </Button>
            </div>
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

          {/* Proof strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-accent-foreground/60">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span><strong className="text-accent-foreground/80">1,247</strong> live offers</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span><strong className="text-accent-foreground/80">380</strong> verified suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span><strong className="text-accent-foreground/80">48</strong> countries</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span><strong className="text-accent-foreground/80">Updated</strong> today</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
