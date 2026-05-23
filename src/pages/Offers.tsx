import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { readCatalogReturnState } from "@/lib/return-to-catalog";
import { ArrowLeft, ChevronRight, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SeafoodOffer } from "@/data/mockOffers";
import { getOffersForSupplier } from "@/data/mockOffers";
import { getSupplierById } from "@/data/mockSuppliers";
import { offerMatchesClientFilters, useOfferCatalogList } from "@/lib/use-offer-catalog";
import analytics from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
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
import Footer from "@/components/landing/Footer";
import { AlertsInlinePanel } from "@/components/alerts/AlertsPanel";
import TrustProofStrip from "@/components/catalog/TrustProofStrip";
import PhotoOrientationDevPanel from "@/components/catalog/PhotoOrientationDevPanel";
import {
  absoluteUrl,
  applyRouteSeo,
  removeJsonLd,
  restoreCanonical,
  restoreGlobalSeo,
  upsertJsonLd,
} from "@/lib/seo";
import {
  PUBLIC_ROUTE_OG_IMAGE_PATH,
  ogLocaleByLang,
  publicRouteOgImageAlt,
  seoTitleWithBrand,
} from "@/lib/public-route-seo";

const COMPARE_MAX = 5;
const OFFER_SORT_KEYS = ["updated_at", "category", "origin", "moq"] as const;
const OFFER_SORT_DIRECTIONS = ["asc", "desc"] as const;
const OFFER_PAGE_SIZES = [10, 20, 50] as const;
const OFFER_STATES = ["Frozen", "Fresh", "Chilled"] as const;
type OfferSortKey = (typeof OFFER_SORT_KEYS)[number];
type OfferSortDirection = (typeof OFFER_SORT_DIRECTIONS)[number];
type OfferPageSize = (typeof OFFER_PAGE_SIZES)[number];

const DEFAULT_OFFER_SORT_KEY: OfferSortKey = "updated_at";
const DEFAULT_OFFER_SORT_DIRECTION: OfferSortDirection = "desc";
const DEFAULT_OFFER_PAGE_SIZE: OfferPageSize = 10;

const isOfferSortKey = (value: string | null): value is OfferSortKey =>
  OFFER_SORT_KEYS.includes(value as OfferSortKey);
const isOfferSortDirection = (value: string | null): value is OfferSortDirection =>
  OFFER_SORT_DIRECTIONS.includes(value as OfferSortDirection);
const isOfferPageSize = (value: string | null): value is `${OfferPageSize}` =>
  value === "10" || value === "20" || value === "50";
const isOfferState = (value: string | null): value is (typeof OFFER_STATES)[number] =>
  OFFER_STATES.includes(value as (typeof OFFER_STATES)[number]);

const readInitialCatalogView = (params: URLSearchParams) => {
  const sort = params.get("sort");
  const direction = params.get("dir");
  const pageSizeParam = params.get("rows");
  const pageParam = Number(params.get("page") ?? "1");
  const productState = params.get("state");

  return {
    filters: {
      ...emptyCatalogFilters,
      q: params.get("q") ?? "",
      category: params.get("category"),
      origin: params.get("origin"),
      supplierCountry: params.get("supplierCountry"),
      certification: params.get("certification"),
      state: isOfferState(productState) ? productState : null,
    } satisfies CatalogFilterState,
    sortBy: isOfferSortKey(sort) ? sort : DEFAULT_OFFER_SORT_KEY,
    sortDirection: isOfferSortDirection(direction) ? direction : DEFAULT_OFFER_SORT_DIRECTION,
    pageSize: isOfferPageSize(pageSizeParam) ? Number(pageSizeParam) as OfferPageSize : DEFAULT_OFFER_PAGE_SIZE,
    page: Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1,
  };
};

const interpolate = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));

const Offers = () => {
  const { t, lang } = useLanguage();
  const { level } = useAccessLevel();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialCatalogView] = useState(() => readInitialCatalogView(searchParams));
  const [filters, setFilters] = useState<CatalogFilterState>(initialCatalogView.filters);
  const [sortBy, setSortBy] = useState<OfferSortKey>(initialCatalogView.sortBy);
  const [sortDirection, setSortDirection] = useState<OfferSortDirection>(initialCatalogView.sortDirection);
  const [pageSize, setPageSize] = useState<OfferPageSize>(initialCatalogView.pageSize);
  const [page, setPage] = useState(initialCatalogView.page);
  // Optional supplier prefilter from /suppliers/:id catalog cards.
  // Only honored at qualified_unlocked — locked users must not see a list
  // narrowed to a specific supplier's offers (would imply identity).
  const supplierIdParam = new URLSearchParams(location.search).get("supplier");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [highlightOfferId, setHighlightOfferId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState(filters.q);

  const offerAccessLevel = useCallback(
    (offer: SeafoodOffer): AccessLevel => offer.accessLevel ?? level,
    [level],
  );
  const canUseOfferSupplierName = useCallback(
    (offer: SeafoodOffer): boolean => offerAccessLevel(offer) === "qualified_unlocked",
    [offerAccessLevel],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(filters.q.trim());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [filters.q]);

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (debouncedQuery) next.set("q", debouncedQuery);
      else next.delete("q");
      if (filters.category) next.set("category", filters.category);
      else next.delete("category");
      if (filters.origin) next.set("origin", filters.origin);
      else next.delete("origin");
      if (filters.supplierCountry) next.set("supplierCountry", filters.supplierCountry);
      else next.delete("supplierCountry");
      if (filters.certification) next.set("certification", filters.certification);
      else next.delete("certification");
      if (filters.state) next.set("state", filters.state);
      else next.delete("state");
      if (sortBy !== DEFAULT_OFFER_SORT_KEY) next.set("sort", sortBy);
      else next.delete("sort");
      if (sortDirection !== DEFAULT_OFFER_SORT_DIRECTION) next.set("dir", sortDirection);
      else next.delete("dir");
      if (pageSize !== DEFAULT_OFFER_PAGE_SIZE) next.set("rows", String(pageSize));
      else next.delete("rows");
      if (page > 1) next.set("page", String(page));
      else next.delete("page");
      return next;
    }, { replace: true });
  }, [
    debouncedQuery,
    filters.category,
    filters.certification,
    filters.origin,
    filters.state,
    filters.supplierCountry,
    page,
    pageSize,
    setSearchParams,
    sortBy,
    sortDirection,
  ]);

  const apiFilters = useMemo(
    () => ({ ...filters, q: debouncedQuery }),
    [filters, debouncedQuery],
  );

  const offerCatalog = useOfferCatalogList({
    filters: apiFilters,
    level,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sortBy,
    sortDirection,
  });
  const offers = offerCatalog.offers;
  const offersLoading = offerCatalog.status === "loading" && offers.length === 0;
  const offersError = offerCatalog.status === "error" && offers.length === 0
    ? offerCatalog.error?.message ?? "offer_catalog_api_failed"
    : null;
  const usingFallback = offerCatalog.usingFallback;
  const failedAttempts = usingFallback ? 1 : 0;
  const lastErrorCode = offerCatalog.error?.message ?? null;
  const recovering = offerCatalog.status === "loading" && offerCatalog.source === "api";
  const handleManualRetry = offerCatalog.retry;
  const updateFilters = (next: CatalogFilterState) => {
    setFilters(next);
    setPage(1);
  };

  useEffect(() => {
    analytics.track("offers_list_view");
  }, []);

  useEffect(() => {
    const prevCanonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? null;
    const canonical = absoluteUrl("/offers");
    const image = absoluteUrl(PUBLIC_ROUTE_OG_IMAGE_PATH);
    const title = seoTitleWithBrand(t.offers_title);
    const description = t.offers_subtitle;
    const imageAlt = publicRouteOgImageAlt[lang];

    applyRouteSeo({
      title,
      description,
      canonical,
      og: {
        type: "website",
        title,
        description,
        url: canonical,
        image,
        imageAlt,
        locale: ogLocaleByLang[lang],
        siteName: "YORSO",
      },
      twitter: {
        title,
        description,
        image,
        imageAlt,
      },
    });

    upsertJsonLd("offers-webpage", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: title,
          description,
          inLanguage: lang,
          isPartOf: { "@id": `${absoluteUrl("/")}#website` },
          about: {
            "@type": "Thing",
            name: t.offers_title,
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonical}#breadcrumbs`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: t.catalog_breadcrumbHome,
              item: absoluteUrl("/"),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: t.nav_liveOffers,
              item: canonical,
            },
          ],
        },
      ],
    });

    return () => {
      removeJsonLd("offers-webpage");
      restoreGlobalSeo({
        title: t.meta_siteTitle,
        description: t.meta_siteDescription,
      });
      restoreCanonical(prevCanonical);
    };
  }, [lang, t]);

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
  }, [canUseOfferSupplierName, offers]);

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
      suppliers: uniq(offers.filter(canUseOfferSupplierName).map((o) => o.supplier.name)),
      bases: uniq(offers.flatMap((o) => o.deliveryBasisOptions.map((b) => b.code))),
      certifications: uniq(offers.flatMap((o) => o.certifications ?? [])),
      paymentTermsList: uniq(offers.map((o) => (o.commercial?.paymentTerms ?? "").split(",")[0].trim())),
      states: [...OFFER_STATES],
      cutTypes: uniq(offers.map((o) => o.cutType.split(",")[0].trim())),
      currencies: uniq(offers.map((o) => o.currency ?? "USD")),
      latinNames: uniq(offers.map((o) => o.latinName)),
    };
  }, [canUseOfferSupplierName, offers]);

  const visible = useMemo(() => {
    let base = offers.filter((o) =>
      offerMatchesClientFilters(o, filters, canUseOfferSupplierName, offerCatalog.serverFiltered),
    );
    if (supplierIdParam && level === "qualified_unlocked") {
      const sup = getSupplierById(supplierIdParam);
      if (sup) {
        const ids = new Set(
          getOffersForSupplier(
            sup.country,
            sup.productFocus.map((p) => p.species),
            50,
          ).map((o) => o.id),
        );
        base = base.filter((o) => ids.has(o.id));
      }
    }
    return base;
  }, [canUseOfferSupplierName, filters, level, offers, offerCatalog.serverFiltered, supplierIdParam]);

  const totalResults = offerCatalog.total;
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize));
  const pageStart = totalResults === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalResults === 0 ? 0 : Math.min(page * pageSize, totalResults);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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
  }, [offers]);

  const selectedOffer = useMemo(
    () => visible.find((o) => o.id === selectedOfferId) ?? null,
    [visible, selectedOfferId],
  );

  const comparedOffers = useMemo(
    () => compareIds.map((id) => offers.find((o) => o.id === id)).filter(Boolean) as SeafoodOffer[],
    [compareIds, offers],
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

  // Compare tray — это fixed-панель внизу экрана. Когда она активна,
  // прижимаем подвал/контент дополнительным отступом, чтобы tray не
  // перекрывал footer и последние строки списка после прокрутки.
  const hasCompareTray = compareIds.length > 0;

  return (
    <div
      className={`flex min-h-screen flex-col overflow-x-clip bg-background ${
        hasCompareTray ? "pb-24 md:pb-20" : ""
      }`}
    >
      <Header />

      <main className="container flex-1 overflow-x-clip py-6 md:py-8 pb-32">
        <nav aria-label={t.aria_breadcrumb} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="-mx-2 inline-flex min-h-11 items-center gap-1 px-2 hover:text-foreground sm:min-h-0">
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
              {t.catalog_resultCount.replace("{count}", String(totalResults))}
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            data-testid="offer-catalog-source"
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              offerCatalog.source === "api" && offerCatalog.status !== "error"
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-muted/40 text-muted-foreground"
            }`}
          >
            {offerCatalog.source === "api" && offerCatalog.status !== "error"
              ? t.catalog_sourceApi
              : offerCatalog.status === "error"
                ? t.catalog_sourceFallback
                : t.catalog_sourceLocal}
          </span>
          {offerCatalog.status === "loading" && (
            <span
              data-testid="offer-catalog-loading-inline"
              className="text-xs text-muted-foreground"
              role="status"
            >
              {t.catalog_loading}
            </span>
          )}
        </div>

        {usingFallback && (
          <div
            role="status"
            data-testid="catalog-fallback-banner"
            className="mt-4 flex flex-col gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="space-y-0.5">
                <p className="font-medium">
                  {t.catalog_fallback_title}
                </p>
                <p className="text-xs opacity-80">
                  {recovering
                    ? t.catalog_fallback_recovering
                    : t.catalog_fallback_body}
                  {failedAttempts > 0 && (
                    <>
                      {" "}{t.catalog_fallback_attempts.replace("{count}", String(failedAttempts))}
                      {lastErrorCode ? ` · ${t.catalog_fallback_code.replace("{code}", lastErrorCode)}` : ""}.
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRetry}
              disabled={recovering}
              className="gap-1.5"
              data-testid="catalog-fallback-retry"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recovering ? "animate-spin" : ""}`} aria-hidden />
              {t.catalog_fallback_retry}
            </Button>
          </div>
        )}

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
            <MobileFilterPills value={filters} onChange={updateFilters} options={options} />
          </div>
          <div className="hidden lg:block">
            <CatalogFilters value={filters} onChange={updateFilters} options={options} layout="horizontal" />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-3 text-xs md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-medium text-muted-foreground">
              <span>{t.catalog_sortLabel}</span>
              <select
                data-testid="offer-catalog-sort"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as OfferSortKey);
                  setPage(1);
                }}
                className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground sm:h-9 sm:min-h-0"
              >
                <option value="updated_at">{t.catalog_sortUpdated}</option>
                <option value="category">{t.catalog_sortCategory}</option>
                <option value="origin">{t.catalog_sortOrigin}</option>
                <option value="moq">{t.catalog_sortMoq}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 font-medium text-muted-foreground">
              <span>{t.catalog_directionLabel}</span>
              <select
                data-testid="offer-catalog-direction"
                value={sortDirection}
                onChange={(event) => {
                  setSortDirection(event.target.value as OfferSortDirection);
                  setPage(1);
                }}
                className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground sm:h-9 sm:min-h-0"
              >
                <option value="desc">{t.catalog_directionDesc}</option>
                <option value="asc">{t.catalog_directionAsc}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 font-medium text-muted-foreground">
              <span>{t.catalog_rowsLabel}</span>
              <select
                data-testid="offer-catalog-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value) as OfferPageSize);
                  setPage(1);
                }}
                className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground sm:h-9 sm:min-h-0"
              >
                {OFFER_PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {interpolate(t.catalog_rowsOption, { count: size })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            data-testid="offer-catalog-page-summary"
            className="text-muted-foreground"
            aria-live="polite"
          >
            {interpolate(t.catalog_pageSummary, {
              start: pageStart,
              end: pageEnd,
              total: totalResults,
            })}
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
                <span className="sr-only">{t.catalog_loading}</span>
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
                  {t.catalog_error_title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.catalog_error_body.replace("{code}", offersError)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={handleManualRetry}
                  data-testid="catalog-error-retry"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden /> {t.catalog_error_retry}
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
                    onClick={() => updateFilters(emptyCatalogFilters)}
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
                        forceLevel={offerAccessLevel(offer)}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <CatalogOfferRow
                        offer={offer}
                        isSelected={offer.id === selectedOfferId}
                        isHighlighted={offer.id === highlightOfferId}
                        onSelect={handleSelectOffer}
                        forceLevel={offerAccessLevel(offer)}
                      />
                    </div>
                  </div>
                ))}
                {totalResults > pageSize && (
                  <div
                    data-testid="offer-catalog-pagination"
                    className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <span className="text-muted-foreground">
                      {interpolate(t.catalog_pageNumber, {
                        current: page,
                        total: pageCount,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="offer-catalog-prev"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        {t.catalog_previous}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="offer-catalog-next"
                        disabled={page >= pageCount}
                        onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                      >
                        {t.catalog_next}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Desktop-only sticky intelligence column. On <xl screens this would
              fall to the bottom of the page (poor UX), so we hide it and rely
              on MobileIntelDock above the list instead. */}
          <div id="catalog-anchor-intelligence" className="hidden scroll-mt-20 xl:sticky xl:top-20 xl:block xl:h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1">
            <SelectedOfferPanel
              offer={selectedOffer}
              forceLevel={selectedOffer ? offerAccessLevel(selectedOffer) : level}
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

      <Footer />
    </div>
  );
};

export default Offers;
