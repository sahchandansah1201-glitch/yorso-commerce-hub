import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, ShieldAlert, Building2, BadgeCheck,
  Bookmark, GitCompareArrows, Lock,
} from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import analytics from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import { getSupplierRegion } from "@/lib/visibility";

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const SupplierTrustPanel = ({ offer }: { offer: SeafoodOffer }) => {
  const { t } = useLanguage();
  const s = offer.supplier;
  const yearsInBusiness = new Date().getFullYear() - s.inBusinessSince;
  const region = getSupplierRegion(s.country);
  const anonymousLabel = (s.isVerified ? t.card_supplierAnonymousVerified : t.card_supplierAnonymous)
    .replace("{region}", region);

  return (
    <div className="space-y-4">
      {/* Anonymous supplier trust card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-semibold text-foreground truncate">
                {anonymousLabel}
              </span>
              {s.isVerified ? (
                <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0 text-orange-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t.offer_locked_supplierTitle}</p>
          </div>
        </div>

        {/* Verification status — anonymous */}
        <div className={`rounded-lg p-3 text-xs leading-relaxed ${
          s.isVerified
            ? "bg-success/5 border border-success/20 text-foreground"
            : "bg-orange-50 border border-orange-200 text-foreground dark:bg-orange-950/20 dark:border-orange-800/30"
        }`}>
          {s.isVerified ? (
            <>
              <p className="font-semibold text-success mb-1">✓ Verified Supplier</p>
              <p className="text-muted-foreground">
                Business license, certifications, and trade references reviewed by YORSO.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-orange-600 dark:text-orange-400 mb-1">⏳ Pending Full Verification</p>
              <p className="text-muted-foreground">
                Basic documents reviewed. Full verification in progress.
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <MiniStat icon={<Building2 className="h-3.5 w-3.5" />} label="In business" value={`${yearsInBusiness}+ years`} />
          <MiniStat icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Certifications" value={`${s.certifications.length} active`} />
        </div>

        {s.certifications.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Certifications</p>
            <div className="flex flex-wrap gap-1.5">
              {s.certifications.map((c) => (
                <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA stack — register to unlock */}
      <div className="space-y-2.5">
        <Link
          to="/register"
          className="block"
          onClick={() =>
            analytics.track("register_to_unlock_click", {
              surface: "supplier_panel",
              offerId: offer.id,
            })
          }
        >
          <Button className="w-full gap-2 font-semibold" size="lg">
            {t.offer_locked_supplierCta} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
          {t.offer_locked_helper}
        </p>
        <Button variant="outline" className="w-full gap-2" size="sm">
          <Bookmark className="h-4 w-4" /> Save to Shortlist
        </Button>
        <Button variant="ghost" className="w-full gap-2 text-muted-foreground" size="sm">
          <GitCompareArrows className="h-4 w-4" /> Compare Similar Offers
        </Button>
      </div>
    </div>
  );
};

export default SupplierTrustPanel;
