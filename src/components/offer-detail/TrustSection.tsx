import { ShieldCheck, FileCheck, Anchor, Building2 } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import CertificationBadges from "@/components/CertificationBadges";

const TrustSection = ({ offer }: { offer: SeafoodOffer }) => {
  const s = offer.supplier;

  const trustPoints = [
    {
      icon: ShieldCheck,
      title: s.isVerified ? "Verified Supplier" : "Verification in Progress",
      desc: s.isVerified
        ? `${s.name} passed YORSO's multi-step verification in ${s.verificationDate || "2024"}. Reviewed: ${s.documentsReviewed.slice(0, 3).join(", ")}${s.documentsReviewed.length > 3 ? `, and ${s.documentsReviewed.length - 3} more` : ""}.`
        : `${s.name} has submitted basic documentation. Full verification including facility audit and trade references is in progress.`,
    },
    {
      icon: FileCheck,
      title: "Export & Compliance",
      desc: `This product ships from ${offer.commercial.shipmentPort || offer.origin}. ${offer.format === "Frozen" ? "Cold-chain documentation and health certificates available." : "Temperature-controlled shipping with health certificates."}`,
      certifications: s.certifications,
    },
    {
      icon: Anchor,
      title: "Traceability",
      desc: offer.traceability || `Product origin (${offer.origin}), fishing area (${offer.specs.fishingArea}), catching method (${offer.specs.catchingMethod}), and processing facility are documented.`,
    },
    {
      icon: Building2,
      title: "Direct Supplier Relationship",
      desc: `You communicate directly with ${s.name} (${s.countryFlag} ${s.country}, est. ${s.inBusinessSince}). No intermediaries. Average response time: ${s.responseTime}.`,
    },
  ];

  return (
    <section className="py-10 border-t border-border">
      <h2 className="font-heading text-lg font-bold text-foreground mb-6">Why this offer is safe</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {trustPoints.map((tp) => (
          <div key={tp.title} className="flex gap-3 rounded-lg border border-border bg-card p-4">
            <tp.icon className={`h-5 w-5 shrink-0 mt-0.5 ${s.isVerified || tp.title !== "Verified Supplier" ? "text-success" : "text-orange-500"}`} />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-foreground">{tp.title}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{tp.desc}</p>
              {tp.certifications && tp.certifications.length > 0 && (
                <CertificationBadges
                  certifications={tp.certifications}
                  size="sm"
                  className="mt-2"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustSection;
