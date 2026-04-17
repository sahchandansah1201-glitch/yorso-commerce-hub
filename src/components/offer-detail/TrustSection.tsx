import { ShieldCheck, FileCheck, Anchor, Building2 } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import { getSupplierRegion } from "@/lib/visibility";

const fmt = (tpl: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), tpl);

const TrustSection = ({ offer }: { offer: SeafoodOffer }) => {
  const { t } = useLanguage();
  const s = offer.supplier;
  const region = getSupplierRegion(s.country);
  const certs = s.certifications.join(", ");
  const plural = s.certifications.length > 1 ? "s" : "";

  const trustPoints = [
    {
      icon: ShieldCheck,
      title: t.trust_verifiedTitle,
      desc: s.isVerified ? t.trust_verifiedDescVerified : t.trust_verifiedDescPending,
      ok: s.isVerified,
    },
    {
      icon: FileCheck,
      title: t.trust_complianceTitle,
      desc: fmt(t.trust_complianceDesc, { region, certifications: certs, plural }),
      ok: true,
    },
    {
      icon: Anchor,
      title: t.trust_traceabilityTitle,
      desc: fmt(t.trust_traceabilityDesc, {
        origin: offer.origin,
        area: offer.specs.fishingArea,
        method: offer.specs.catchingMethod,
      }),
      ok: true,
    },
    {
      icon: Building2,
      title: t.trust_directTitle,
      desc: fmt(t.trust_directDesc, { region }),
      ok: true,
    },
  ];

  return (
    <section className="py-10 border-t border-border">
      <h2 className="font-heading text-lg font-bold text-foreground mb-6">{t.trust_sectionTitle}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {trustPoints.map((tp) => (
          <div key={tp.title} className="flex gap-3 rounded-lg border border-border bg-card p-4">
            <tp.icon className={`h-5 w-5 shrink-0 mt-0.5 ${tp.ok ? "text-success" : "text-orange-500"}`} />
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">{tp.title}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tp.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustSection;
