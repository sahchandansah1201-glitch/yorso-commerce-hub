import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { mockOffers } from "@/data/mockOffers";
import analytics from "@/lib/analytics";

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
  const offer = mockOffers.find((o) => o.id === id);

  useEffect(() => {
    if (offer) analytics.track("offer_detail_view", { offerId: offer.id, product: offer.productName });
  }, [offer]);

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Offer not found</h1>
          <Link to="/offers"><Button className="mt-4">Browse all offers</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">YORSO</Link>
          <div className="flex items-center gap-2">
            <Link to="/signin"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm" className="font-semibold">Register Free</Button></Link>
          </div>
        </div>
      </header>

      <main className="container py-6 md:py-10">
        <Link to="/offers">
          <Button variant="ghost" size="sm" className="mb-5 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> All offers
          </Button>
        </Link>

        {/* Above-the-fold: 3-column desktop / stacked mobile */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr_320px]">
          <PhotoGallery
            gallery={offer.gallery}
            productName={offer.productName}
            photoSourceLabel={offer.photoSourceLabel}
          />
          <OfferSummary offer={offer} />
          <div className="lg:sticky lg:top-20 lg:self-start">
            <SupplierTrustPanel offer={offer} />
          </div>
        </div>

        {/* Below-the-fold */}
        <TrustSection offer={offer} />
        <FullSpecifications offer={offer} />
        <SimilarOffers current={offer} />
        <SimilarProducts current={offer} />
        <RelatedArticles articles={offer.relatedArticles} />
        <DecisionFAQ />
      </main>
    </div>
  );
};

export default OfferDetail;
