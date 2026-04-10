import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, MessageSquare, BarChart3, Globe, Users, ArrowRight, TrendingUp } from "lucide-react";

const buyerBenefits = [
  { icon: Search, title: "Find Products Fast", desc: "Search by species, origin, format, or price across 1,200+ offers." },
  { icon: ShieldCheck, title: "Verified Suppliers", desc: "Every verified supplier passes our due diligence process." },
  { icon: MessageSquare, title: "Direct Communication", desc: "Contact suppliers directly. No middlemen, no hidden fees." },
  { icon: BarChart3, title: "Compare & Decide", desc: "Compare prices, MOQs, and terms across multiple suppliers." },
];

const supplierBenefits = [
  { icon: Globe, title: "Global Reach", desc: "Access buyers from 48+ countries actively sourcing seafood." },
  { icon: Users, title: "Qualified Leads", desc: "Connect with verified procurement professionals and importers." },
  { icon: TrendingUp, title: "Grow Sales", desc: "List your products and get discovered by new trade partners." },
  { icon: ShieldCheck, title: "Build Trust", desc: "Earn verification badges and showcase your track record." },
];

const ValueSplit = () => {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Built for the Global Seafood Trade
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Whether you're sourcing or selling, YORSO gives you the tools to trade with confidence.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Buyer column */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              For Buyers
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">
              Source smarter, not harder
            </h3>
            <div className="mt-6 space-y-5">
              {buyerBenefits.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-8 w-full gap-2 font-semibold">
              Register as Buyer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Supplier column */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="inline-flex rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
              For Suppliers
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">
              Reach new markets instantly
            </h3>
            <div className="mt-6 space-y-5">
              {supplierBenefits.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <b.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-8 w-full gap-2 font-semibold">
              Register as Supplier
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueSplit;
