import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Activity, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockOffers, categories, type SeafoodOffer } from "@/data/mockOffers";
import analytics from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import CatalogFilters, { emptyCatalogFilters, type CatalogFilterState } from "@/components/catalog/CatalogFilters";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import SelectedOfferPanel from "@/components/catalog/SelectedOfferPanel";
import RelatedRequests from "@/components/catalog/RelatedRequests";
import CatalogValueStrip from "@/components/catalog/CatalogValueStrip";
import CatalogRequestForm from "@/components/catalog/CatalogRequestForm";
import CompareTray from "@/components/catalog/CompareTray";
import { cn } from "@/lib/utils";

const COMPARE_MAX = 5;

const matches = (offer: SeafoodOffer, f: CatalogFilterState): boolean => {
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [
      offer.productName,
      offer.species,
      offer.latinName,
      offer.origin,
      offer.supplier.name,
      offer.supplier.country,
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.category && offer.category !== f.category) return false;
  if (f.origin && offer.origin !== f.origin) return false;
  if (f.supplierCountry && offer.supplier.country !== f.supplierCountry) return false;
  if (f.supplier && offer.supplier.name !== f.supplier) return false;
  if (f.basis && !offer.deliveryBasisOptions.some((b) => b.code === f.basis)) return false;
  if (f.certification && !(offer.certifications ?? []).includes(f.certification)) return false;
  if (f.paymentTerms && !offer.commercial.paymentTerms.includes(f.paymentTerms)) return false;
  if (f.state && offer.format !== f.state) return false;
  if (f.cutType && !offer.cutType.toLowerCase().includes(f.cutType.toLowerCase())) return false;
  if (f.currency && (offer.currency ?? "USD") !== f.currency) return false;
  return true;
};

const Offers = () => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<CatalogFilterState>(emptyCatalogFilters);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    analytics.track("offers_list_view");
  }, []);

  const options = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();
    return {
      categories: uniq(mockOffers.map((o) => o.category)),
      origins: uniq(mockOffers.map((o) => o.origin)),
      supplierCountries: uniq(mockOffers.map((o) => o.supplier.country)),
      suppliers: uniq(mockOffers.map((o) => o.supplier.name)),
      bases: uniq(mockOffers.flatMap((o) => o.deliveryBasisOptions.map((b) => b.code))),
      certifications: uniq(mockOffers.flatMap((o) => o.certifications ?? [])),
      paymentTermsList: uniq(mockOffers.map((o) => o.commercial.paymentTerms.split(",")[0].trim())),
      states: ["Frozen", "Fresh", "Chilled"],
      cutTypes: uniq(mockOffers.map((o) => o.cutType.split(",")[0].trim())),
      currencies: uniq(mockOffers.map((o) => o.currency ?? "USD")),
    };
  }, []);

  const visible = useMemo(() => mockOffers.filter((o) => matches(o, filters)), [filters]);

  useEffect(() => {
    if (visible.length === 0) {
      setSelectedOfferId(null);
      return;
    }
    if (!selectedOfferId || !visible.some((o) => o.id === selectedOfferId)) {
      setSelectedOfferId(visible[0].id);
    }
  }, [visible, selectedOfferId]);

  const selectedOffer = useMemo(
    () => visible.find((o) => o.id === selectedOfferId) ?? null,
    [visible, selectedOfferId],
  );

  const compareOffers = useMemo(
    () => compareIds.map((id) => mockOffers.find((o) => o.id === id)).filter(Boolean) as SeafoodOffer[],
    [compareIds],
  );

  const handleSelectOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    const o = mockOffers.find((x) => x.id === offerId);
    if (o) {
      analytics.track("catalog_offer_select", {
        offerId,
        category: o.category,
        origin: o.origin,
        supplierCountry: o.supplier.country,
      });
    }
  };

  const toggleCompare = (offerId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(offerId)) return prev.filter((x) => x !== offerId);
      if (prev.length >= COMPARE_MAX) return prev;
      return [...prev, offerId];
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
            YORSO
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/signin">
              <Button variant="ghost" size="sm">
                {t.nav_signIn}
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="font-semibold">
                {t.nav_registerFree}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className={cn("container py-6 md:py-8", compareIds.length > 0 && "pb-24")}>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <Activity className="h-3 w-3 text-primary" aria-hidden />
            {t.catalog_marketStatus_live}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.category === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
            onClick={() => setFilters({ ...filters, category: null })}
            data-testid="catalog-quick-cat-all"
          >
            {t.catalog_filters_all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.category === cat.name
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
              onClick={() => setFilters({ ...filters, category: cat.name })}
              data-testid={`catalog-quick-cat-${cat.name}`}
            >
              {cat.icon} {(t.cat_names as Record<string, string>)[cat.name] || cat.name} ({cat.count})
            </button>
          ))}
        </div>

        <div className="mt-4">
          <CatalogValueStrip />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside
            className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1"
            aria-label={t.catalog_filters_title}
          >
            <CatalogFilters value={filters} onChange={setFilters} options={options} />
          </aside>

          <section aria-label={t.aria_catalogResults}>
            {visible.length === 0 ? (
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
                {visible.map((offer) => {
                  const isCompared = compareIds.includes(offer.id);
                  const compareDisabled = !isCompared && compareIds.length >= COMPARE_MAX;
                  return (
                    <div key={offer.id} className="relative">
                      <CatalogOfferRow
                        offer={offer}
                        isSelected={offer.id === selectedOfferId}
                        onSelect={handleSelectOffer}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!compareDisabled) toggleCompare(offer.id);
                        }}
                        disabled={compareDisabled}
                        aria-pressed={isCompared}
                        aria-label={
                          isCompared
                            ? t.catalog_row_compareToggle_remove
                            : t.catalog_row_compareToggle_add
                        }
                        className={cn(
                          "absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                          isCompared
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background/95 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          compareDisabled && "cursor-not-allowed opacity-50",
                        )}
                        data-testid="catalog-row-compare-toggle"
                      >
                        <Scale className="h-3 w-3" aria-hidden />
                        {isCompared ? t.catalog_row_compareToggle_remove : t.catalog_row_compareToggle_add}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1">
            <SelectedOfferPanel offer={selectedOffer} />
          </div>
        </div>

        <div className="mt-8">
          <RelatedRequests category={filters.category} />
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card p-6 text-center">
          <h2 className="font-heading text-lg font-bold text-foreground">{t.catalog_recovery_title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.catalog_recovery_body}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link to="/register">
              <Button className="font-semibold">{t.catalog_recovery_signup}</Button>
            </Link>
            <Link to="/signin">
              <Button variant="outline" className="font-semibold">
                {t.catalog_recovery_signin}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <CompareTray
        offers={compareOffers}
        onRemove={toggleCompare}
        onClear={() => setCompareIds([])}
        max={COMPARE_MAX}
      />
    </div>
  );
};

export default Offers;
