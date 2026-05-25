import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, ShieldAlert, Building2, Timer, BadgeCheck,
  Bookmark, GitCompareArrows, Info, Lock,
} from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import type { SupplierAccessRequest } from "@/lib/supplier-access-requests";
import analytics from "@/lib/analytics";
import { useState } from "react";
import CertificationBadges from "@/components/CertificationBadges";
import { useLanguage } from "@/i18n/LanguageContext";
import { interpolate, pluralize } from "@/lib/supplier-i18n";
import {
  SupplierAccessRequestPanel,
  SupplierAccessRequestSent,
} from "@/components/suppliers/SupplierAccessRequestPanel";
import MarketPulse from "@/components/offer-detail/MarketPulse";

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
  accessRequest?: SupplierAccessRequest | null;
  onAccessRequestSent?: (request: SupplierAccessRequest) => void;
}

const SupplierTrustPanel = ({
  offer,
  accessLevel = "qualified_unlocked",
  accessRequest,
  onAccessRequestSent,
}: Props) => {
  const { lang, t } = useLanguage();
  const s = offer.supplier;
  const yearsInBusiness = new Date().getFullYear() - s.inBusinessSince;
  const [showScope, setShowScope] = useState(false);

  const isQualified = accessLevel === "qualified_unlocked";
  const isAnonymous = accessLevel === "anonymous_locked";
  const isRegisteredLocked = accessLevel === "registered_locked";
  const supplierAccessId = offer.supplier.id ?? offer.supplier.profileSlug ?? offer.id;

  // Mask supplier identity for non-qualified states — show real name blurred.
  const initial = s.name.charAt(0);
  const verifiedBody = s.verificationDate
    ? interpolate(t.offerDetail_supplierVerifiedBody, { date: s.verificationDate })
    : t.offerDetail_supplierVerifiedBodyNoDate;
  const yearsInBusinessLabel = interpolate(
    pluralize(lang, yearsInBusiness, {
      one: t.offerDetail_yearsInBusiness_one,
      few: t.offerDetail_yearsInBusiness_few,
      many: t.offerDetail_yearsInBusiness_many,
    }),
    { n: yearsInBusiness },
  );

  return (
    <div className="space-y-4">
      {/* Supplier card — must contain logo, name, stats and country of origin */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          {/* 1. Логотип поставщика (плейсхолдер с инициалом, пока нет реальных логотипов) */}
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-lg font-bold text-foreground ${
              !isQualified ? "blur-sm select-none" : ""
            }`}
            aria-hidden={!isQualified}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {/* 2. Название поставщика — допускаем перенос на 2 строки для длинных юр. наименований */}
            <div className="flex items-start gap-1.5">
              <span
                className={`font-heading font-semibold text-foreground leading-snug line-clamp-2 break-words ${
                  !isQualified ? "blur-sm select-none" : ""
                }`}
                aria-label={isQualified ? s.name : t.offerDetail_supplierMasked_name}
              >
                {s.name}
              </span>
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1">
                {s.isVerified ? (
                  <ShieldCheck className="h-4 w-4 text-success" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                )}
                {!isQualified && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
              </span>
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
        }`} data-testid="offer-detail-supplier-verification">
          {s.isVerified ? (
            <>
              <p className="font-semibold text-success mb-1">
                <span aria-hidden>✓</span> {t.offerDetail_supplierVerifiedTitle}
              </p>
              <p className="text-muted-foreground">
                {verifiedBody}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-orange-600 dark:text-orange-400 mb-1">
                <span aria-hidden>⏳</span> {t.offerDetail_supplierPendingTitle}
              </p>
              <p className="text-muted-foreground">
                {t.offerDetail_supplierPendingBody}
              </p>
            </>
          )}
          {s.verificationScope && (
            <button
              type="button"
              onClick={() => setShowScope(!showScope)}
              className="mt-1.5 inline-flex min-h-11 items-center gap-1 rounded text-primary hover:underline"
              aria-expanded={showScope}
              data-offer-detail-mobile-target="supplier-review-scope"
            >
              <Info className="h-3 w-3" />
              {showScope ? t.offerDetail_supplierReviewHide : t.offerDetail_supplierReviewShow}
            </button>
          )}
          {showScope && s.verificationScope && (
            <p className="mt-2 text-muted-foreground border-t border-border/50 pt-2">{s.verificationScope}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <MiniStat icon={<Building2 className="h-3.5 w-3.5" />} label={t.offerDetail_inBusinessLabel} value={yearsInBusinessLabel} />
          <MiniStat icon={<Timer className="h-3.5 w-3.5" />} label={t.offerDetail_responseLabel} value={s.responseTime} />
        </div>

        {s.certifications.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t.offerDetail_supplierCertificationsLabel}</p>
            <CertificationBadges certifications={s.certifications} size="sm" />
          </div>
        )}

        {isQualified && s.documentsReviewed.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{t.offerDetail_reviewedDocumentsLabel}</p>
            <ul className="space-y-1">
              {s.documentsReviewed.map((d) => (
                <li key={d} className="flex items-center gap-1.5 text-xs text-foreground">
                  <BadgeCheck className="h-3 w-3 text-success shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isQualified && (
          <Button variant="outline" size="sm" className="w-full text-xs">
            {t.offerDetail_viewSupplierProfileCta}
          </Button>
        )}
      </div>

      {/* CTA stack — gated by access */}
      {/* Market Pulse — offer-scoped activity signals, mock estimate */}
      <MarketPulse offerId={offer.id} />

      {/* CTA stack — gated by access */}
      <div id="offer-supplier-access" className="scroll-mt-24 space-y-2.5">
        {isQualified ? (
          <>
            <Button className="w-full gap-2 font-semibold" size="lg"
              onClick={() => analytics.track("register_cta_offer_detail", { offerId: offer.id })}>
              {t.offerDetail_contactSupplierCta} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full gap-2" size="sm">
              <Bookmark className="h-4 w-4" /> {t.offerDetail_saveToShortlistCta}
            </Button>
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground" size="sm">
              <GitCompareArrows className="h-4 w-4" /> {t.offerDetail_compareSimilarOffersCta}
            </Button>
          </>
        ) : isRegisteredLocked ? (
          supplierAccessId ? (
            accessRequest ? (
              <SupplierAccessRequestSent
                request={accessRequest}
                supplierMaskedName={t.offerDetail_supplierMasked_name}
              />
            ) : (
              <SupplierAccessRequestPanel
                supplierId={supplierAccessId}
                supplierMaskedName={t.offerDetail_supplierMasked_name}
                onSent={(request) => onAccessRequestSent?.(request)}
              />
            )
          ) : (
            <Button variant="outline" className="w-full gap-2" size="sm" disabled>
              <Lock className="h-4 w-4" /> {t.offerDetail_supplierContactLocked}
            </Button>
          )
        ) : (
          <Button variant="outline" className="w-full gap-2" size="sm" disabled>
            <Lock className="h-4 w-4" /> {t.offerDetail_supplierContactLocked}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SupplierTrustPanel;
