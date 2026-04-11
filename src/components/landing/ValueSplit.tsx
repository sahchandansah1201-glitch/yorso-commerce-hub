import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldOff, Eye, BarChart3, AlertTriangle, Globe, Users, TrendingUp, ShieldCheck } from "lucide-react";

const buyerBenefits = [
  {
    icon: AlertTriangle,
    title: "Reduce Supply Risk",
    desc: "Pre-qualify backup suppliers before your main source fails. Compare verified alternatives across 48 countries.",
  },
  {
    icon: Eye,
    title: "Price Visibility",
    desc: "See real prices from multiple origins. Walk into negotiations with benchmark data, not guesswork.",
  },
  {
    icon: ShieldOff,
    title: "Verified Suppliers Only",
    desc: "Every supplier passes document review, facility checks, and trade reference verification. No pay-to-play badges.",
  },
  {
    icon: BarChart3,
    title: "Faster Sourcing Decisions",
    desc: "Search, compare, and contact suppliers in hours — not weeks of emails and trade show follow-ups.",
  },
];

const supplierBenefits = [
  {
    icon: Globe,
    title: "Zero Commission",
    desc: "Keep 100% of your margins. No hidden fees, no percentage from deals. Direct buyer relationships.",
  },
  {
    icon: Users,
    title: "Qualified Demand",
    desc: "Connect with verified procurement professionals actively sourcing your products right now.",
  },
  {
    icon: TrendingUp,
    title: "Year-Round Visibility",
    desc: "Your offers are live 24/7 to buyers from 48+ countries. Not just during a 3-day trade show.",
  },
  {
    icon: ShieldCheck,
    title: "Build Trust Through Verification",
    desc: "Showcase your certifications and track record. Buyers contact verified suppliers first.",
  },
];

const ValueSplit = () => {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Built for Both Sides of the Trade
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Whether you're sourcing seafood or selling it, YORSO gives you the tools to trade with confidence.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Buyer column */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              For Buyers
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">
              Source with confidence, not guesswork
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
            <div className="inline-flex rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success">
              For Suppliers
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">
              Sell directly, without the middleman tax
            </h3>
            <div className="mt-6 space-y-5">
              {supplierBenefits.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                    <b.icon className="h-4 w-4 text-success" />
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
