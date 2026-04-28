import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { readCatalogReturnState } from "@/lib/return-to-catalog";
import { ArrowLeft, ChevronRight, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type SeafoodOffer } from "@/data/mockOffers";
import { fetchOffersWithRetry } from "@/lib/fetch-offers-with-retry";
import analytics from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import CatalogFilters, { emptyCatalogFilters, type CatalogFilterState } from "@/components/catalog/CatalogFilters";
import MobileFilterPills from "@/components/catalog/MobileFilterPills";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";
import SelectedOfferPanel from "@/components/catalog/SelectedOfferPanel";

import RelatedRequests from "@/components/catalog/RelatedRequests";
import CatalogValueStrip from "@/components/catalog/CatalogValueStrip";
import CatalogRecoveryCard from "@/components/catalog/CatalogRecoveryCard";
import CatalogRequestForm from "@/components/catalog/CatalogRequestForm";
import CompareTray from "@/components/catalog/CompareTray";
import Header from "@/components/landing/Header";
import { AlertsInlinePanel } from "@/components/alerts/AlertsPanel";
import TrustProofStrip from "@/components/catalog/TrustProofStrip";
import PhotoOrientationDevPanel from "@/components/catalog/PhotoOrientationDevPanel";

const COMPARE_MAX = 5;

const matches = (offer: SeafoodOffer, f: CatalogFilterState, allowSupplierName: boolean): boolean => {
  if (f.q) {
    const q = f.q.toLowerCase();
    const fields = [
      offer.productName,
      offer.species,
      offer.latinName,
      offer.origin,
      offer.supplier.country,
    ];
    if (allowSupplierName) fields.push(offer.supplier.name);
    if (!fields.join(" ").toLowerCase().includes(q)) return false;
  }
  if (f.category && offer.category !== f.category) return false;
  if (f.origin && offer.origin !== f.origin) return false;
  if (f.supplierCountry && offer.supplier.country !== f.supplierCountry) return false;
  if (f.supplier && allowSupplierName && offer.supplier.name !== f.supplier) return false;
  if (f.basis && !offer.deliveryBasisOptions.some((b) => b.code === f.basis)) return false;
  if (f.certification && !(offer.certifications ?? []).includes(f.certification)) return false;
  if (f.paymentTerms && !offer.commercial.paymentTerms.includes(f.paymentTerms)) return false;
  if (f.state && offer.format !== f.state) return false;
  if (f.cutType && !offer.cutType.toLowerCase().includes(f.cutType.toLowerCase())) return false;
  if (f.currency && (offer.currency ?? "USD") !== f.currency) return false;
  if (f.latinName && offer.latinName !== f.latinName) return false;
  return true;
};

const Offers = () => {
  const { t } = useLanguage();
  const { level } = useAccessLevel();
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CatalogFilterState>(() => {
    // Hydrate filter state from URL query so deep-links from alerts (e.g.
    // /offers?category=Salmon&fromAlert=...) immediately apply the filter
    // without an extra render.
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    return category ? { ...emptyCatalogFilters, category } : emptyCatalogFilters;
  });
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [highlightOfferId, setHighlightOfferId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [offers, setOffers] = useState<SeafoodOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offersError, setOffersError] = useState<string | null>(null);

  const allowSupplierName = level === "qualified_unlocked";

  useEffect(() => {
    analytics.track("offers_list_view");
  }, []);

  // Load catalog from Supabase whenever the access level changes (qualified
  // users get exact price/supplier; others see redacted public view).
  useEffect(() => {
    let cancelled = false;
    setOffersLoading(true);
    setOffersError(null);
    fetchOffersWithRetry(level)
      .then((rows) => {
        if (cancelled) return;
        setOffers(rows);
        setOffersLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setOffersError(err?.message ?? "Не удалось загрузить каталог");
        setOffersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  // If the user lands here from an alert, scroll to the alerts strip and
  // clean the `fromAlert` param so back-navigation doesn't re-trigger.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromAlert = params.get("fromAlert");
    if (!fromAlert) return;
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-testid="alerts-inline-panel"]');
      if (el) {
        el.scrollIntoView({ block: "start", behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    analytics.track("alerts_navigated_to_catalog", { alertId: fromAlert });
    params.delete("fromAlert");
    const nextSearch = params.toString();
    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore scroll position + highlight when returning from offer detail.
  useEffect(() => {
    const ctx = readCatalogReturnState(location);
    if (!ctx?.offerId) return;
    setSelectedOfferId(ctx.offerId);
    setHighlightOfferId(ctx.offerId);
    const scrollY = ctx.scrollY;
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
      const el = document.querySelector(`[data-offer-id="${ctx.offerId}"]`);
      if (el && Math.abs(window.scrollY - scrollY) > 200) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
      }
    });
    navigate(location.pathname + location.search, { replace: true, state: null });
    const timer = window.setTimeout(() => setHighlightOfferId(null), 3500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();
    return {
      categories: uniq(offers.map((o) => o.category)),
      origins: uniq(offers.map((o) => o.origin)),
      supplierCountries: uniq(offers.map((o) => o.supplier.country)),
      // Hide exact supplier names from the filter selector unless qualified.
      suppliers: allowSupplierName ? uniq(offers.map((o) => o.supplier.name)) : [],
      bases: uniq(offers.flatMap((o) => o.deliveryBasisOptions.map((b) => b.code))),
      certifications: uniq(offers.flatMap((o) => o.certifications ?? [])),
      paymentTermsList: uniq(offers.map((o) => (o.commercial?.paymentTerms ?? "").split(",")[0].trim())),
      states: ["Frozen", "Fresh", "Chilled"],
      cutTypes: uniq(offers.map((o) => o.cutType.split(",")[0].trim())),
      currencies: uniq(offers.map((o) => o.currency ?? "USD")),
      latinNames: uniq(offers.map((o) => o.latinName)),
    };
  }, [allowSupplierName, offers]);

  const visible = useMemo(
    () => offers.filter((o) => matches(o, filters, allowSupplierName)),
    [filters, allowSupplierName, offers],
  );

  useEffect(() => {
    if (visible.length === 0) {
      setSelectedOfferId(null);
      return;
    }
    if (!selectedOfferId || !visible.some((o) => o.id === selectedOfferId)) {
      setSelectedOfferId(visible[0].id);
    }
  }, [visible, selectedOfferId]);

  const freshOffersCount = useMemo(() => {
    return offers.filter((o) => {
      const f = (o.freshness ?? "").toLowerCase();
      if (f.includes("today")) return true;
      const m = f.match(/(\d+)\s*h\s*ago/);
      if (m && parseInt(m[1], 10) <= 24) return true;
      return false;
    }).length;
  }, []);

  const selectedOffer = useMemo(
    () => visible.find((o) => o.id === selectedOfferId) ?? null,
    [visible, selectedOfferId],
  );

  const comparedOffers = useMemo(
    () => compareIds.map((id) => offers.find((o) => o.id === id)).filter(Boolean) as SeafoodOffer[],
    [compareIds],
  );

  const handleSelectOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    const o = offers.find((x) => x.id === offerId);
    if (o) {
      analytics.track("catalog_offer_select", {
        offerId,
        category: o.category,
        origin: o.origin,
        supplierCountry: o.supplier.country,
      });
    }
  };

  const handleCompareToggle = (offerId: string) => {
    const o = offers.find((x) => x.id === offerId);
    if (!o) return;
    setCompareIds((prev) => {
      if (prev.includes(offerId)) {
        const next = prev.filter((id) => id !== offerId);
        analytics.track("catalog_offer_compare_remove", {
          offerId,
          category: o.category,
          origin: o.origin,
          supplierCountry: o.supplier.country,
          accessLevel: level,
          selectedCount: next.length,
        });
        return next;
      }
      if (prev.length >= COMPARE_MAX) return prev;
      const next = [...prev, offerId];
      analytics.track("catalog_offer_compare_add", {
        offerId,
        category: o.category,
        origin: o.origin,
        supplierCountry: o.supplier.country,
        accessLevel: level,
        selectedCount: next.length,
      });
      return next;
    });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Header />

      <main className="container overflow-x-clip py-6 md:py-8 pb-32">
        <nav aria-label={t.aria_breadcrumb} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> {t.catalog_breadcrumbHome}
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="font-medium text-foreground">{t.catalog_breadcrumbCatalog}</span>
        </nav>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {t.catalog_pageTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="catalog-result-count">
              {t.catalog_resultCount.replace("{count}", String(visible.length))}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
            data-testid="catalog-fresh-offers"
          >
            <Activity className="h-3 w-3 text-primary" aria-hidden />
            {t.catalog_freshOffers_24h.replace("{count}", String(freshOffersCount))}
          </div>
        </div>

        <div id="catalog-anchor-alerts" className="mt-4 scroll-mt-20">
          <AlertsInlinePanel />
        </div>

        <div id="catalog-anchor-access" className="mt-4 scroll-mt-20">
          <CatalogValueStrip />
        </div>

        {level === "anonymous_locked" && (
          <div id="catalog-anchor-verification" className="mt-4 scroll-mt-20">
            <TrustProofStrip />
          </div>
        )}

        {new URLSearchParams(location.search).get("devPhotos") === "1" && (
          <PhotoOrientationDevPanel />
        )}

        {/* Procurement filters: pill-bar on mobile/tablet (opens bottom sheet),
            compact horizontal CatalogFilters bar on desktop. Sticky while scrolling. */}
        <div
          id="catalog-anchor-filters"
          className="sticky top-16 z-30 -mx-4 mt-4 scroll-mt-20 border-b border-border/60 bg-background/95 px-4 py-2 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur md:-mx-6 md:px-6"
        >
          <div className="lg:hidden">
            <MobileFilterPills value={filters} onChange={setFilters} options={options} />
          </div>
          <div className="hidden lg:block">
            <CatalogFilters value={filters} onChange={setFilters} options={options} layout="horizontal" />
          </div>
        </div>

        <div id="catalog-anchor-results" className="mt-5 grid scroll-mt-20 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-label={t.aria_catalogResults} className="min-w-0">
            {/* Per-offer analytics now lives inside each card via a
                collapsible pictogram, so the global mobile intel dock is
                no longer rendered here. */}
            {offersLoading ? (
              <div
                className="flex flex-col gap-3"
                aria-busy="true"
                aria-live="polite"
                data-testid="catalog-loading"
              >
                <span className="sr-only">Загружаем каталог…</span>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-lg border border-border/60 bg-card p-4"
                  >
                    <Skeleton className="h-24 w-24 shrink-0 rounded-md sm:h-28 sm:w-28" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="hidden w-32 flex-col items-end gap-2 sm:flex">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="mt-auto h-9 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : offersError ? (
              <div
                role="alert"
                data-testid="catalog-error"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center"
              >
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Не удалось загрузить каталог
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {offersError}. Проверьте соединение или попробуйте ещё раз.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => {
                    // повторная загрузка через смену ключа эффекта — проще всего перезагрузить страницу
                    window.location.reload();
                  }}
                  data-testid="catalog-error-retry"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Повторить попытку
                </Button>
              </div>
            ) : visible.length === 0 ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t.catalog_results_none}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setFilters(emptyCatalogFilters)}
                    data-testid="catalog-empty-reset"
                  >
                    {t.catalog_results_resetFilters}
                  </Button>
                </div>
                <CatalogRequestForm initialProduct={filters.q ?? ""} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visible.map((offer) => (
                  <div key={offer.id} className="min-w-0">
                    <div className="sm:hidden">
                      <MobileOfferCard
                        offer={offer}
                        isSelected={offer.id === selectedOfferId}
                        isHighlighted={offer.id === highlightOfferId}
                        onSelect={handleSelectOffer}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <CatalogOfferRow
                        offer={offer}
                        isSelected={offer.id === selectedOfferId}
                        isHighlighted={offer.id === highlightOfferId}
                        onSelect={handleSelectOffer}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Desktop-only sticky intelligence column. On <xl screens this would
              fall to the bottom of the page (poor UX), so we hide it and rely
              on MobileIntelDock above the list instead. */}
          <div id="catalog-anchor-intelligence" className="hidden scroll-mt-20 xl:sticky xl:top-20 xl:block xl:h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1">
            <SelectedOfferPanel
              offer={selectedOffer}
              isCompared={selectedOffer ? compareIds.includes(selectedOffer.id) : false}
              onCompareToggle={handleCompareToggle}
              compareDisabled={compareIds.length >= COMPARE_MAX}
            />
          </div>
        </div>

        <div className="mt-8">
          <RelatedRequests category={filters.category} />
        </div>

        <CatalogRecoveryCard />
      </main>

      <CompareTray
        offers={comparedOffers}
        onRemove={handleCompareToggle}
        onClear={() => setCompareIds([])}
        max={COMPARE_MAX}
      />
    </div>
  );
};

export default Offers;
