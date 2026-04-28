import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, ChevronRight, Lock, RefreshCw } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { readCatalogReturnState } from "@/lib/return-to-catalog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SeafoodOffer } from "@/data/mockOffers";
import { fetchOfferById } from "@/lib/catalog-api";
import { findFallbackOfferById } from "@/lib/catalog-fallback";
import { isRetriableCatalogError } from "@/lib/fetch-offers-with-retry";
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
import Header from "@/components/landing/Header";

/**
 * Legacy-id редирект ("/offers/1" → "/offers/<uuid>") теперь обслуживается на
 * уровне роутера через <LegacyOfferRedirect> в App.tsx, поэтому сюда такие id
 * физически не доходят.
 */

const DetailSkeleton = () => (
  <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr_320px]" aria-hidden>
    <Skeleton className="h-[420px] w-full rounded-lg" />
    <div className="space-y-3">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-40" />
    </div>
    <Skeleton className="h-[320px] w-full rounded-lg" />
  </div>
);

const OfferDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { level } = useAccessLevel();
  const location = useLocation();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<SeafoodOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const offerRef = useRef<SeafoodOffer | null>(null);
  offerRef.current = offer;

  const extractErrorCode = (err: unknown): string => {
    const e = err as { code?: string; status?: number; statusCode?: number; message?: string };
    if (e?.code) return String(e.code);
    const st = e?.status ?? e?.statusCode;
    if (st) return `HTTP ${st}`;
    const msg = e?.message ?? "";
    const m = msg.match(/PGRST\d+/i);
    if (m) return m[0].toUpperCase();
    return "ERR";
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    if (!offerRef.current) setLoading(true);
    setError(null);
    setRetrying(retryNonce > 0);
    fetchOfferById(id, level)
      .then((res) => {
        if (cancelled) return;
        setOffer(res);
        setUsingFallback(false);
        setFailedAttempts(0);
        setLastErrorCode(null);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("[OfferDetail] fetchOfferById failed", e);
        const code = extractErrorCode(e);
        setLastErrorCode(code);
        setFailedAttempts((n) => n + 1);
        const fallbackOffer = isRetriableCatalogError(e) ? findFallbackOfferById(id, level) : null;
        if (fallbackOffer) {
          setOffer(fallbackOffer);
          setUsingFallback(true);
          setError(null);
          return;
        }
        setError("Не удалось загрузить оффер");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRetrying(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, level, retryNonce]);

  const handleManualRetry = () => {
    analytics.track("offer_detail_manual_retry_click", { offerId: id, lastErrorCode });
    setRetryNonce((n) => n + 1);
  };

  useEffect(() => {
    if (offer) analytics.track("offer_detail_view", { offerId: offer.id, product: offer.productName });
  }, [offer]);

  const isLocked = level !== "qualified_unlocked";
  const returnCtx = readCatalogReturnState(location);
  const handleBack = () => {
    if (returnCtx) {
      navigate(-1);
    } else {
      navigate("/offers");
    }
  };
  const lockTitle = level === "anonymous_locked"
    ? t.offerDetail_accessLocked_title
    : t.offerDetail_accessLimited_title;
  const lockBody = level === "anonymous_locked"
    ? t.offerDetail_accessLocked_body
    : t.offerDetail_accessLimited_body;

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Header />
        <main className="container py-6 md:py-10" aria-busy="true" aria-live="polite">
          <Skeleton className="h-8 w-32 mb-5" />
          <DetailSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">{error}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Попробуйте обновить страницу или вернитесь к каталогу.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>Повторить</Button>
            <Link to="/offers"><Button>{t.offerDetail_browseAll}</Button></Link>
          </div>
        </main>
      </div>
    );
  }

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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBack}
          data-testid="offer-detail-back-to-catalog"
          aria-label={t.offerDetail_backToCatalog}
          className="mb-3 -ml-2 inline-flex max-w-full items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:gap-2 sm:px-3 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden truncate sm:inline md:hidden">{t.offerDetail_backToCatalogShort}</span>
          <span className="hidden truncate md:inline">{t.offerDetail_backToCatalog}</span>
        </Button>

        {isLocked && (
          <div className="mb-5 flex flex-wrap items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Lock className="h-4 w-4 mt-0.5 text-primary shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{lockTitle}</p>
            </div>
            <Link to="/register">
              <Button size="sm" className="font-semibold">
                {level === "anonymous_locked" ? t.nav_registerFree : t.offerDetail_requestAccessCta}
              </Button>
            </Link>
          </div>
        )}

        {usingFallback && (
          <div
            data-testid="offer-detail-recovery-banner"
            role="status"
            aria-live="polite"
            className="mb-5 flex flex-wrap items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50 p-4 dark:bg-amber-950/20"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Показаны демо-данные товара</p>
              <p className="text-xs text-muted-foreground">
                Сервис временно недоступен. Неудачных попыток: {failedAttempts}
                {lastErrorCode ? ` · код ошибки: ${lastErrorCode}` : ""}.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleManualRetry}
              disabled={retrying}
              data-testid="offer-detail-recovery-retry"
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} aria-hidden />
              {retrying ? "Повтор…" : "Повторить сейчас"}
            </Button>
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
