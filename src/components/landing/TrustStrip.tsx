import { ShieldCheck, Globe, Package, Users } from "lucide-react";
import { marketplaceStats } from "@/data/mockOffers";

const stats = [
  { icon: Package, value: marketplaceStats.totalOffers.toLocaleString(), label: "Live Offers", color: "text-primary" },
  { icon: ShieldCheck, value: marketplaceStats.verifiedSuppliers.toLocaleString(), label: "Verified Suppliers", color: "text-success" },
  { icon: Globe, value: marketplaceStats.countries.toString(), label: "Countries", color: "text-primary" },
  { icon: Users, value: marketplaceStats.activeBuyers.toLocaleString() + "+", label: "Active Buyers", color: "text-primary" },
];

const TrustStrip = () => {
  return (
    <section className="border-y border-border bg-cool-gray py-10">
      <div className="container">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <span className="mt-2 font-heading text-2xl font-bold text-foreground md:text-3xl">
                {stat.value}
              </span>
              <span className="mt-0.5 text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
