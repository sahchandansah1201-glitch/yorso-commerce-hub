import { ShieldCheck, FileCheck, Anchor, Building2 } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import CertificationBadges from "@/components/CertificationBadges";
import { useLanguage } from "@/i18n/LanguageContext";
import { interpolate } from "@/lib/supplier-i18n";

const TrustSection = ({
  offer,
  accessLevel = offer.accessLevel,
}: {
  offer: SeafoodOffer;
  accessLevel?: SeafoodOffer["accessLevel"];
}) => {
  const { t } = useLanguage();
  const s = offer.supplier;
  const isQualified = accessLevel === "qualified_unlocked";
  const reviewedDocuments = s.documentsReviewed.slice(0, 3).join(", ");
  const verifiedDesc = reviewedDocuments
    ? interpolate(t.offerDetail_trustVerifiedDesc, {
        date: s.verificationDate || "2024",
        documents: reviewedDocuments,
      })
    : t.offerDetail_trustVerifiedDescNoDocuments;
  const shipmentPort = offer.commercial.shipmentPort || offer.origin;

  const trustPoints = [
    {
      icon: ShieldCheck,
      title: s.isVerified ? t.offerDetail_supplierVerifiedTitle : t.offerDetail_supplierPendingTitle,
      desc: s.isVerified ? verifiedDesc : t.offerDetail_trustPendingDesc,
    },
    {
      icon: FileCheck,
      title: t.offerDetail_exportComplianceTitle,
      desc: interpolate(
        offer.format === "Frozen" ? t.offerDetail_exportComplianceFrozen : t.offerDetail_exportComplianceTemperature,
        { port: shipmentPort },
      ),
      certifications: s.certifications,
    },
    {
      icon: Anchor,
      title: t.offerDetail_traceabilityTitle,
      desc: offer.traceability || interpolate(t.offerDetail_traceabilityFallback, {
        origin: offer.origin,
        area: offer.specs.fishingArea,
        method: offer.specs.catchingMethod,
      }),
    },
    {
      icon: Building2,
      title: t.offerDetail_directRelationshipTitle,
      desc: isQualified
        ? interpolate(t.offerDetail_directRelationshipUnlocked, {
            supplier: s.name,
            country: `${s.countryFlag} ${s.country}`,
            year: String(s.inBusinessSince),
            response: s.responseTime,
          })
        : t.offerDetail_directRelationshipLocked,
    },
  ];

  return (
    <section className="py-10 border-t border-border" data-testid="offer-trust-section">
      <h2 className="font-heading text-lg font-bold text-foreground mb-6">{t.offerDetail_trustSectionTitle}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {trustPoints.map((tp, index) => (
          <div key={tp.title} className="flex gap-3 rounded-lg border border-border bg-card p-4">
            <tp.icon
              className={`h-5 w-5 shrink-0 mt-0.5 ${s.isVerified || index !== 0 ? "text-success" : "text-orange-500"}`}
              aria-hidden
            />
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
