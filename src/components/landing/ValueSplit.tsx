import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, ShieldOff, Eye, BarChart3, Globe, Users, TrendingUp, ShieldCheck } from "lucide-react";

const buyerBenefits = [
  {
    icon: AlertTriangle,
    pain: "Stop wasting weeks on email chains",
    title: "Find & Compare in Minutes",
    desc: "Search 1,200+ offers by species, origin, format. Get quotes in hours, not months of back-and-forth emails.",
  },
  {
    icon: ShieldOff,
    pain: "Never get scammed again",
    title: "Every Supplier Verified",
    desc: "3-step due diligence: business docs, facility certs, trade references. Unlike pay-to-play badges, ours are earned.",
  },
  {
    icon: Eye,
    pain: "Show your CFO the real market price",
    title: "Price Transparency",
    desc: "Compare prices across origins and suppliers. No more price blindness at board meetings.",
  },
  {
    icon: BarChart3,
    pain: "Escape single-supplier dependency",
    title: "Backup Suppliers on Demand",
    desc: "Pre-qualify alternatives before your main supplier has a force majeure. Sleep better at night.",
  },
];

const supplierBenefits = [
  {
    icon: Globe,
    pain: "Stop paying 15% to middlemen",
    title: "Zero Commission",
    desc: "Your margins stay yours. No hidden fees, no percentage from deals. Direct buyer relationships.",
  },
  {
    icon: Users,
    pain: "Stop chasing cold leads",
    title: "Qualified Buyer Requests",
    desc: "Connect with verified procurement professionals who are actively sourcing your products.",
  },
  {
    icon: TrendingUp,
    pain: "Stop depending on trade shows",
    title: "365-Day Visibility",
    desc: "Your offers are live 24/7, not just during a 3-day expo. Reach buyers from 48+ countries year-round.",
  },
  {
    icon: ShieldCheck,
    pain: "Build trust before first contact",
    title: "Verification Badge",
    desc: "Showcase your certifications, export history, and track record. Buyers contact verified suppliers first.",
  },
];

const ValueSplit = () => {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Your Pain. Our Solution.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            We built YORSO for people tired of broken marketplaces, hidden commissions, and sourcing by guesswork.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Buyer column */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              For Buyers
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-foreground">
              Take back control of sourcing
            </h3>
            <div className="mt-6 space-y-5">
              {buyerBenefits.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary/80">{b.pain}</p>
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
              Sell without the middleman tax
            </h3>
            <div className="mt-6 space-y-5">
              {supplierBenefits.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <b.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-accent/80">{b.pain}</p>
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
