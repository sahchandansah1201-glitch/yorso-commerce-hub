import { ShieldCheck, Globe, Package, Users, Ban, Eye } from "lucide-react";
import { marketplaceStats } from "@/data/mockOffers";

const stats = [
  {
    icon: Package,
    value: marketplaceStats.totalOffers.toLocaleString(),
    label: "Live Offers",
    detail: "updated daily from verified sources",
    color: "text-primary",
  },
  {
    icon: ShieldCheck,
    value: marketplaceStats.verifiedSuppliers.toLocaleString(),
    label: "Verified Suppliers",
    detail: "each passed 3-step due diligence",
    color: "text-success",
  },
  {
    icon: Globe,
    value: marketplaceStats.countries.toString(),
    label: "Countries",
    detail: "from Norway to Vietnam",
    color: "text-primary",
  },
  {
    icon: Users,
    value: marketplaceStats.activeBuyers.toLocaleString() + "+",
    label: "Active Buyers",
    detail: "sourcing right now",
    color: "text-primary",
  },
];

const differentiators = [
  { icon: Ban, text: "0% commission — your margins stay yours" },
  { icon: Eye, text: "Direct contacts — always open, never gated" },
  { icon: ShieldCheck, text: "Verification earned, not bought" },
];

const TrustStrip = () => {
  return (
    <section className="border-y border-border bg-cool-gray py-10">
      <div className="container">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <span className="mt-2 font-heading text-2xl font-bold text-foreground md:text-3xl">
                {stat.value}
              </span>
              <span className="mt-0.5 text-sm font-medium text-foreground">{stat.label}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{stat.detail}</span>
            </div>
          ))}
        </div>

        {/* Anti-Alibaba differentiators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border pt-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unlike other platforms:
          </span>
          {differentiators.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-foreground">
              <d.icon className="h-4 w-4 text-primary" />
              <span>{d.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
