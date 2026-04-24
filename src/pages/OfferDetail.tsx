import { useEffect } from "react";
import { ArrowRight, ChevronRight, Lock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { mockOffers } from "@/data/mockOffers";
import analytics from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";

import PhotoGallery from "@/components/offer-detail/PhotoGallery";
import OfferSummary from "@/components/offer-detail/OfferSummary";
import SupplierTrustPanel from "@/components/offer-detail/SupplierTrustPanel";
import TrustSection from "@/components/offer-detail/TrustSection";
import FullSpecifications from "@/components/offer-detail/FullSpecifications";
import SimilarOffers from "@/components/offer-detail/SimilarOffers";
import SimilarProducts from "@/components/offer-detail/SimilarProducts";
import RelatedArticles from "@/components/offer-detail/RelatedArticles";
import DecisionFAQ from "@/components/offer-detail/DecisionFAQ";

const OfferDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { level } = useAccessLevel();
  const offer = mockOffers.find((o) => o.id === id);
  const isLocked = level !== "qualified_unlocked";
  const lockTitle = level === "anonymous_locked"
    ? t.offerDetail_accessLocked_title
    : t.offerDetail_accessLimited_title;
  const lockBody = level === "anonymous_locked"
    ? t.offerDetail_accessLocked_body
    : t.offerDetail_accessLimited_body;

  useEffect(() => {
    if (offer) analytics.track("offer_detail_view", { offerId: offer.id, product: offer.productName });
  }, [offer]);

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">{t.offerDetail_notFound}</h1>
          <Link to="/offers"><Button className="mt-4">{t.offerDetail_browseAll}</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Header />

      <main className="container py-6 md:py-10">
        {isLocked && (
          <div className="mb-5 flex flex-wrap items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Lock className="h-4 w-4 mt-0.5 text-primary shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{lockTitle}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{lockBody}</p>
            </div>
            <Link to="/register">
              <Button size="sm" className="font-semibold">
                {level === "anonymous_locked" ? t.nav_registerFree : t.offerDetail_requestAccessCta}
              </Button>
            </Link>
          </div>
        )}

        <nav aria-label={t.aria_breadcrumb} className="mb-5">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
            <li><Link to="/" className="hover:text-foreground transition-colors">{t.offerDetail_home}</Link></li>
            <li><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to="/offers" className="hover:text-foreground transition-colors">{t.offerDetail_offers}</Link></li>
            <li><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><Link to={`/offers?category=${encodeURIComponent(offer.category)}`} className="hover:text-foreground transition-colors">{offer.category}</Link></li>
            <li><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{offer.productName}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr_320px]">
          <PhotoGallery gallery={offer.gallery} productName={offer.productName} photoSourceLabel={offer.photoSourceLabel} />
          <OfferSummary offer={offer} accessLevel={level} />
          <div className="lg:sticky lg:top-20 lg:self-start"><SupplierTrustPanel offer={offer} accessLevel={level} /></div>
        </div>

        <TrustSection offer={offer} />
        <FullSpecifications offer={offer} />
        <SimilarOffers current={offer} />
        <SimilarProducts current={offer} />
        <RelatedArticles articles={offer.relatedArticles} />
        <DecisionFAQ />
      </main>

      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur p-3 lg:hidden">
        <Link to="/register" className="block">
          <Button className="w-full gap-2 font-semibold text-base h-12">
            {t.offerDetail_registerToContact} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">{t.offerDetail_freeRegistration}</p>
      </div>

      <div className="h-24 lg:hidden" />
    </div>
  );
};

export default OfferDetail;
