import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, ShieldAlert, Building2, Timer, BadgeCheck,
  Bookmark, GitCompareArrows, Info, Lock,
} from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import analytics from "@/lib/analytics";
import { useState } from "react";
import CertificationBadges from "@/components/CertificationBadges";
import { useLanguage } from "@/i18n/LanguageContext";

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

interface Props {
  offer: SeafoodOffer;
  accessLevel?: AccessLevel;
}

const SupplierTrustPanel = ({ offer, accessLevel = "qualified_unlocked" }: Props) => {
  const { t } = useLanguage();
  const s = offer.supplier;
  const yearsInBusiness = new Date().getFullYear() - s.inBusinessSince;
  const [showScope, setShowScope] = useState(false);

  const isQualified = accessLevel === "qualified_unlocked";
  const isAnonymous = accessLevel === "anonymous_locked";

  // Mask supplier identity for non-qualified states.
  const displayName = isQualified ? s.name : t.offerDetail_supplierMasked_name;
  const initial = isQualified ? s.name.charAt(0) : "?";

  return (
    <div className="space-y-4">
      {/* Supplier card — must contain: 1) logo, 2) name, 3) In business / Response, 4) flag + country of origin */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          {/* 1. Логотип поставщика (плейсхолдер с инициалом, пока нет реальных логотипов) */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-lg font-bold text-foreground">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {/* 2. Название поставщика */}
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-semibold text-foreground truncate">{displayName}</span>
              {s.isVerified ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0 text-orange-500" />
              )}
              {!isQualified && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />}
            </div>
            {/* 4. Флаг + страна происхождения. Берём из offer.originFlag/origin,
                чтобы поле всегда было заполнено (страна происхождения товара
                публична даже когда идентичность поставщика скрыта). */}
            <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
              <span aria-hidden className="text-base leading-none">{offer.originFlag}</span>
              <span>{offer.origin}</span>
            </p>
          </div>
        </div>

        {!isQualified && (
          <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3 leading-relaxed">
            {t.offerDetail_supplierMasked_hint}
          </p>
        )}

        {/* Verification status — always shown (non-identifying) */}
        <div className={`rounded-lg p-3 text-xs leading-relaxed ${
          s.isVerified
            ? "bg-success/5 border border-success/20 text-foreground"
            : "bg-orange-50 border border-orange-200 text-foreground dark:bg-orange-950/20 dark:border-orange-800/30"
        }`}>
          {s.isVerified ? (
            <>
              <p className="font-semibold text-success mb-1">✓ Verified Supplier</p>
              <p className="text-muted-foreground">
                Verified {s.verificationDate}. Business license, certifications, and trade references reviewed by YORSO.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-orange-600 dark:text-orange-400 mb-1">⏳ Pending Full Verification</p>
              <p className="text-muted-foreground">
                Basic documents reviewed. Full verification in progress. Exercise due diligence for large orders.
              </p>
            </>
          )}
          {s.verificationScope && (
            <button
              onClick={() => setShowScope(!showScope)}
              className="mt-1.5 inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Info className="h-3 w-3" />
              {showScope ? "Hide details" : "What was reviewed?"}
            </button>
          )}
          {showScope && s.verificationScope && (
            <p className="mt-2 text-muted-foreground border-t border-border/50 pt-2">{s.verificationScope}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <MiniStat icon={<Building2 className="h-3.5 w-3.5" />} label="In business" value={`${yearsInBusiness} years`} />
          <MiniStat icon={<Timer className="h-3.5 w-3.5" />} label="Response" value={s.responseTime} />
        </div>

        {s.certifications.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Certifications</p>
            <CertificationBadges certifications={s.certifications} size="sm" />
          </div>
        )}

        {isQualified && s.documentsReviewed.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Reviewed documents</p>
            <ul className="space-y-1">
              {s.documentsReviewed.map((d) => (
                <li key={d} className="flex items-center gap-1.5 text-xs text-foreground">
                  <BadgeCheck className="h-3 w-3 text-success shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isQualified ? (
          <Button variant="outline" size="sm" className="w-full text-xs">
            View Supplier Profile
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" disabled>
            <Lock className="h-3 w-3" /> {t.offerDetail_supplierProfileLocked}
          </Button>
        )}
      </div>

      {/* CTA stack — gated by access */}
      <div className="space-y-2.5">
        {isQualified ? (
          <>
            <Button className="w-full gap-2 font-semibold" size="lg"
              onClick={() => analytics.track("register_cta_offer_detail", { offerId: offer.id })}>
              Contact Supplier <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full gap-2" size="sm">
              <Bookmark className="h-4 w-4" /> Save to Shortlist
            </Button>
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground" size="sm">
              <GitCompareArrows className="h-4 w-4" /> Compare Similar Offers
            </Button>
          </>
        ) : (
          <>
            <Link to="/register" className="block">
              <Button className="w-full gap-2 font-semibold" size="lg"
                onClick={() => analytics.track("register_cta_offer_detail", { offerId: offer.id })}>
                {isAnonymous ? t.offerDetail_priceLocked_anonCta : t.offerDetail_requestAccessCta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
              {isAnonymous ? t.offerDetail_accessLocked_body : t.offerDetail_accessLimited_body}
            </p>
            <Button variant="outline" className="w-full gap-2" size="sm" disabled>
              <Lock className="h-4 w-4" /> {t.offerDetail_supplierContactLocked}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierTrustPanel;
