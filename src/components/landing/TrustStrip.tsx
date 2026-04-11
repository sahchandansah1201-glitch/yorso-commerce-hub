import { ShieldCheck, Globe, Package, Users, Ban, Eye } from "lucide-react";
import { marketplaceStats } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";

const TrustStrip = () => {
  const { t } = useLanguage();

  const stats = [
    { icon: Package, value: marketplaceStats.totalOffers.toLocaleString(), label: t.trust_liveOffers, detail: t.trust_liveOffersDetail, color: "text-primary" },
    { icon: ShieldCheck, value: marketplaceStats.verifiedSuppliers.toLocaleString(), label: t.trust_verifiedSuppliers, detail: t.trust_verifiedSuppliersDetail, color: "text-success" },
    { icon: Globe, value: marketplaceStats.countries.toString(), label: t.trust_countries, detail: t.trust_countriesDetail, color: "text-primary" },
    { icon: Users, value: marketplaceStats.activeBuyers.toLocaleString() + "+", label: t.trust_activeBuyers, detail: t.trust_activeBuyersDetail, color: "text-primary" },
  ];

  const differentiators = [
    { icon: Ban, text: t.trust_zeroCommission },
    { icon: Eye, text: t.trust_directContacts },
    { icon: ShieldCheck, text: t.trust_verificationEarned },
  ];

  return (
    <section className="border-y border-border bg-cool-gray py-10">
      <div className="container">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <span className="mt-2 font-heading text-2xl font-bold text-foreground md:text-3xl">{stat.value}</span>
              <span className="mt-0.5 text-sm font-medium text-foreground">{stat.label}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{stat.detail}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border pt-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.trust_unlikeOthers}</span>
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
