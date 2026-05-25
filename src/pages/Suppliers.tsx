import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { mockSuppliers, type MockSupplier } from "@/data/mockSuppliers";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { SupplierRow } from "@/components/suppliers/SupplierRow";
import { SelectedSupplierPanel } from "@/components/suppliers/SelectedSupplierPanel";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SupplierDirectoryQuery } from "@/lib/supplier-directory-api";
import { useSupplierDirectoryList } from "@/lib/use-supplier-directory";
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

interface QuickFilter {
  id: string;
  label: string;
  /** Match against supplier productFocus.species (case-insensitive substring) or "certified". */
  match: (s: MockSupplier) => boolean;
  apiQuery?: Pick<Partial<SupplierDirectoryQuery>, "species" | "certification" | "verificationLevel">;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "salmon",
    label: "Salmon",
    match: (s) => s.productFocus.some((p) => /salmon/i.test(p.species)),
    apiQuery: { species: "salmon" },
  },
  {
    id: "shrimp",
    label: "Shrimp",
    match: (s) => s.productFocus.some((p) => /shrimp|vannamei/i.test(p.species)),
    apiQuery: { species: "shrimp" },
  },
  {
    id: "tuna",
    label: "Tuna",
    match: (s) => s.productFocus.some((p) => /tuna|skipjack/i.test(p.species)),
    apiQuery: { species: "tuna" },
  },
  {
    id: "whitefish",
    label: "Whitefish",
    match: (s) =>
      s.productFocus.some((p) =>
        /cod|pollock|haddock|hake|saithe|whitefish|pangasius|tilapia/i.test(p.species),
      ),
    apiQuery: { species: "cod" },
  },
  {
    id: "crab",
    label: "Crab",
    match: (s) => s.productFocus.some((p) => /crab/i.test(p.species)),
    apiQuery: { species: "crab" },
  },
  {
    id: "squid",
    label: "Squid",
    match: (s) => s.productFocus.some((p) => /squid|octopus/i.test(p.species)),
    apiQuery: { species: "squid" },
  },
  {
    id: "certified",
    label: "Certified suppliers",
    match: (s) => s.verificationLevel === "documents_reviewed",
    apiQuery: { verificationLevel: "documents_reviewed" },
  },
];

const SHORTLIST_KEY = "yorso_supplier_shortlist";

const FILTER_LABEL_KEYS: Record<string, keyof ReturnType<typeof useLanguage>["t"]> = {
  salmon: "suppliersPage_filter_salmon",
  shrimp: "suppliersPage_filter_shrimp",
  tuna: "suppliersPage_filter_tuna",
  whitefish: "suppliersPage_filter_whitefish",
  crab: "suppliersPage_filter_crab",
  squid: "suppliersPage_filter_squid",
  certified: "suppliersPage_filter_certified",
};

const interpolate = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

const SUPPLIER_SORT_KEYS = ["updated_at", "country", "verification", "response"] as const;
const SUPPLIER_SORT_DIRECTIONS = ["asc", "desc"] as const;
const SUPPLIER_PAGE_SIZES = [10, 20, 50] as const;
type SupplierSortKey = (typeof SUPPLIER_SORT_KEYS)[number];
type SupplierSortDirection = (typeof SUPPLIER_SORT_DIRECTIONS)[number];
type SupplierPageSize = (typeof SUPPLIER_PAGE_SIZES)[number];

const DEFAULT_SUPPLIER_SORT_KEY: SupplierSortKey = "updated_at";
const DEFAULT_SUPPLIER_SORT_DIRECTION: SupplierSortDirection = "desc";
const DEFAULT_SUPPLIER_PAGE_SIZE: SupplierPageSize = 10;

const isSupplierSortKey = (value: string | null): value is SupplierSortKey =>
  SUPPLIER_SORT_KEYS.includes(value as SupplierSortKey);
const isSupplierSortDirection = (value: string | null): value is SupplierSortDirection =>
  SUPPLIER_SORT_DIRECTIONS.includes(value as SupplierSortDirection);
const isSupplierPageSize = (value: string | null): value is `${SupplierPageSize}` =>
  value === "10" || value === "20" || value === "50";

const supplierAccessLevel = (
  supplier: MockSupplier | null | undefined,
  fallbackLevel: AccessLevel,
): AccessLevel => supplier?.accessLevel ?? fallbackLevel;

const readInitialSupplierView = (params: URLSearchParams) => {
  const filter = params.get("filter");
  const sort = params.get("sort");
  const direction = params.get("dir");
  const pageSizeParam = params.get("rows");
  const pageParam = Number(params.get("page") ?? "1");
  return {
    query: params.get("q") ?? "",
    activeFilter: QUICK_FILTERS.some((item) => item.id === filter) ? filter : null,
    sortBy: isSupplierSortKey(sort) ? sort : DEFAULT_SUPPLIER_SORT_KEY,
    sortDirection: isSupplierSortDirection(direction)
      ? direction
      : DEFAULT_SUPPLIER_SORT_DIRECTION,
    pageSize: isSupplierPageSize(pageSizeParam) ? Number(pageSizeParam) as SupplierPageSize : DEFAULT_SUPPLIER_PAGE_SIZE,
    page: Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1,
  };
};

const Suppliers = () => {
  const { level } = useAccessLevel();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialSupplierView] = useState(() => readInitialSupplierView(searchParams));
  const [query, setQuery] = useState(initialSupplierView.query);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSupplierView.query.trim());
  const [activeFilter, setActiveFilter] = useState<string | null>(initialSupplierView.activeFilter);
  const [sortBy, setSortBy] = useState<SupplierSortKey>(initialSupplierView.sortBy);
  const [sortDirection, setSortDirection] = useState<SupplierSortDirection>(initialSupplierView.sortDirection);
  const [pageSize, setPageSize] = useState<SupplierPageSize>(initialSupplierView.pageSize);
  const [page, setPage] = useState(initialSupplierView.page);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shortlist, setShortlist] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = sessionStorage.getItem(SHORTLIST_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  // SEO + page view (locale-aware)
  useEffect(() => {
    const prevCanonical =
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? null;
    const canonical = absoluteUrl("/suppliers");
    const image = absoluteUrl(PUBLIC_ROUTE_OG_IMAGE_PATH);
    const title = seoTitleWithBrand(t.suppliersPage_title);
    const description = t.suppliersPage_subtitle;
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

    upsertJsonLd("suppliers-webpage", {
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
            name: t.suppliersPage_title,
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
              name: t.suppliersPage_breadcrumb,
              item: canonical,
            },
          ],
        },
      ],
    });

    return () => {
      removeJsonLd("suppliers-webpage");
      restoreGlobalSeo({
        title: t.meta_siteTitle,
        description: t.meta_siteDescription,
      });
      restoreCanonical(prevCanonical);
    };
  }, [lang, t]);

  const persistShortlist = (next: Set<string>) => {
    setShortlist(next);
    try {
      sessionStorage.setItem(SHORTLIST_KEY, JSON.stringify(Array.from(next)));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const stableSupplierById = useMemo(() => new Map(mockSuppliers.map((s) => [s.id, s])), []);

  const activeQuickFilter = activeFilter
    ? QUICK_FILTERS.find((x) => x.id === activeFilter) ?? null
    : null;

  const directory = useSupplierDirectoryList({
    accessLevel: level,
    language: lang,
    query: debouncedQuery,
    filterQuery: activeQuickFilter?.apiQuery ?? null,
    sortBy,
    sortDirection,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (debouncedQuery) next.set("q", debouncedQuery);
      else next.delete("q");
      if (activeFilter) next.set("filter", activeFilter);
      else next.delete("filter");
      if (sortBy !== DEFAULT_SUPPLIER_SORT_KEY) next.set("sort", sortBy);
      else next.delete("sort");
      if (sortDirection !== DEFAULT_SUPPLIER_SORT_DIRECTION) next.set("dir", sortDirection);
      else next.delete("dir");
      if (pageSize !== DEFAULT_SUPPLIER_PAGE_SIZE) next.set("rows", String(pageSize));
      else next.delete("rows");
      if (page > 1) next.set("page", String(page));
      else next.delete("page");
      return next;
    }, { replace: true });
  }, [activeFilter, debouncedQuery, page, pageSize, setSearchParams, sortBy, sortDirection]);

  const filtered = useMemo(() => {
    if (directory.serverFiltered) return directory.suppliers;

    const q = query.trim().toLowerCase();
    const source = directory.suppliers;
    return source.filter((s) => {
      const includeCompanyName = supplierAccessLevel(s, level) === "qualified_unlocked";
      if (activeFilter) {
        const f = QUICK_FILTERS.find((x) => x.id === activeFilter);
        const stableSupplier = stableSupplierById.get(s.id) ?? s;
        // match against original (EN) species so regex stays stable across locales
        if (f && !f.match(stableSupplier)) return false;
      }
      if (!q) return true;
      const fields = [
        s.maskedName,
        s.country,
        s.city,
        s.supplierType,
        ...s.productFocus.map((p) => `${p.species} ${p.forms}`),
        ...s.certifications,
        s.shortDescription,
      ];
      if (includeCompanyName) {
        fields.push(s.companyName);
        fields.push(s.about);
        if (s.website) fields.push(s.website);
        if (s.whatsapp) fields.push(s.whatsapp);
      }
      const haystack = fields.join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [directory.serverFiltered, directory.suppliers, query, activeFilter, level, stableSupplierById]);

  const totalResults = directory.serverFiltered ? directory.total : filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize));
  const pageStart = totalResults === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalResults === 0 ? 0 : Math.min(page * pageSize, totalResults);
  const visibleSuppliers = useMemo(() => {
    if (directory.serverFiltered) return filtered;
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [directory.serverFiltered, filtered, page, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return visibleSuppliers.find((s) => s.id === selectedId) ?? null;
  }, [visibleSuppliers, selectedId]);

  const handleShortlist = (id: string) => {
    const next = new Set(shortlist);
    if (next.has(id)) {
      next.delete(id);
      toast({ title: t.suppliersPage_removedShortlist });
    } else {
      next.add(id);
      toast({ title: t.suppliersPage_addedShortlist });
    }
    persistShortlist(next);
  };

  const handlePrimaryAction = (supplier: MockSupplier) => {
    const actionLevel = supplierAccessLevel(supplier, level);
    if (actionLevel === "anonymous_locked") {
      window.location.assign("/register");
      return;
    }
    if (actionLevel === "registered_locked") {
      toast({
        title: t.suppliersPage_accessRequestPreparedTitle,
        description: t.suppliersPage_accessRequestPreparedDesc,
      });
      return;
    }
    navigate(`/suppliers/${supplier.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showSkipLink />
      <main id="main">
        {/* Breadcrumbs */}
        <div className="border-b border-border bg-background">
          <div className="container py-3">
            <nav
              aria-label={t.aria_breadcrumb}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link to="/" className="-mx-2 inline-flex min-h-11 items-center px-2 hover:text-foreground sm:min-h-0">
                {t.supplier_breadcrumb_home}
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground">{t.suppliersPage_breadcrumb}</span>
            </nav>
          </div>
        </div>

        <section className="border-b border-border bg-background">
          <div className="container py-6 md:py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-foreground md:text-[34px]">
                  {t.suppliersPage_title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  {t.suppliersPage_subtitle}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {interpolate(t.suppliersPage_countSuffix, {
                    visible: visibleSuppliers.length,
                    total: totalResults,
                  })}
                  {directory.status === "loading" && (
                    <span className="sr-only">{t.suppliersPage_loading}</span>
                  )}
                </span>
                <span
                  data-testid="supplier-directory-source"
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    directory.source === "api" && directory.status !== "error"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-muted/40 text-muted-foreground",
                  )}
                >
                  {directory.source === "api" && directory.status !== "error"
                    ? t.suppliersPage_sourceApi
                    : directory.status === "error"
                      ? t.suppliersPage_sourceFallback
                      : t.suppliersPage_sourceLocal}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  data-testid="supplier-directory-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.suppliersPage_searchPlaceholder}
                  className="h-11 pl-9"
                  aria-label={t.suppliersPage_searchAriaLabel}
                />
              </div>
              {(activeFilter || query) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveFilter(null);
                    setQuery("");
                    setPage(1);
                  }}
                  className="self-start md:self-auto"
                >
                  {t.suppliersPage_clearFilters}
                </Button>
              )}
            </div>

            <div
              className="mt-3 flex flex-wrap gap-2"
              role="group"
              aria-label={t.suppliersPage_quickFiltersAria}
            >
              {QUICK_FILTERS.map((f) => {
                const active = activeFilter === f.id;
                const labelKey = FILTER_LABEL_KEYS[f.id];
                const label = labelKey ? (t[labelKey] as string) : f.label;
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-testid={`supplier-directory-filter-${f.id}`}
                    onClick={() => {
                      setActiveFilter(active ? null : f.id);
                      setPage(1);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "min-h-11 rounded-full border px-3 py-2 text-xs font-medium transition sm:min-h-9 sm:py-1",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground/80 hover:border-foreground/30",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-3 text-xs md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 font-medium text-muted-foreground">
                  <span>{t.suppliersPage_sortLabel}</span>
                  <select
                    data-testid="supplier-directory-sort"
                    value={sortBy}
                    onChange={(event) => {
                      setSortBy(event.target.value as SupplierSortKey);
                      setPage(1);
                    }}
                    className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground sm:h-9 sm:min-h-0"
                  >
                    <option value="updated_at">{t.suppliersPage_sortUpdated}</option>
                    <option value="country">{t.suppliersPage_sortCountry}</option>
                    <option value="verification">{t.suppliersPage_sortVerification}</option>
                    <option value="response">{t.suppliersPage_sortResponse}</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 font-medium text-muted-foreground">
                  <span>{t.suppliersPage_directionLabel}</span>
                  <select
                    data-testid="supplier-directory-direction"
                    value={sortDirection}
                    onChange={(event) => {
                      setSortDirection(event.target.value as SupplierSortDirection);
                      setPage(1);
                    }}
                    className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground sm:h-9 sm:min-h-0"
                  >
                    <option value="desc">{t.suppliersPage_directionDesc}</option>
                    <option value="asc">{t.suppliersPage_directionAsc}</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 font-medium text-muted-foreground">
                  <span>{t.suppliersPage_rowsLabel}</span>
                  <select
                    data-testid="supplier-directory-page-size"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value) as SupplierPageSize);
                      setPage(1);
                    }}
                    className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground sm:h-9 sm:min-h-0"
                  >
                    {SUPPLIER_PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {interpolate(t.suppliersPage_rowsOption, { count: size })}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div
                data-testid="supplier-directory-page-summary"
                className="text-muted-foreground"
                aria-live="polite"
              >
                {interpolate(t.suppliersPage_pageSummary, {
                  start: pageStart,
                  end: pageEnd,
                  total: totalResults,
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-cool-gray/40" aria-labelledby="supplier-directory-results-heading">
          <div className="container py-6 md:py-8">
            <h2 id="supplier-directory-results-heading" className="sr-only">
              {t.suppliersPage_resultsHeading}
            </h2>
            {directory.status === "error" && (
              <div
                data-testid="supplier-directory-error"
                className="mb-4 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{t.suppliersPage_errorTitle}</p>
                  <p className="mt-1 text-muted-foreground">{t.suppliersPage_errorBody}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={directory.refresh}>
                  {t.suppliersPage_retry}
                </Button>
              </div>
            )}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div className="min-w-0">
                {directory.status === "loading" && (
                  <div
                    data-testid="supplier-directory-loading"
                    className="mb-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
                    role="status"
                  >
                    {t.suppliersPage_loading}
                  </div>
                )}
                {visibleSuppliers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {t.suppliersPage_emptyTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.suppliersPage_emptyBody}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {visibleSuppliers.map((s) => (
                      <SupplierRow
                        key={s.id}
                        supplier={s}
                        isSelected={selected?.id === s.id}
                        isShortlisted={shortlist.has(s.id)}
                        accessLevel={supplierAccessLevel(s, level)}
                        onSelect={setSelectedId}
                        onShortlist={handleShortlist}
                        onPrimaryAction={handlePrimaryAction}
                      />
                    ))}
                  </ul>
                )}
                {totalResults > pageSize && (
                  <div
                    data-testid="supplier-directory-pagination"
                    className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <span className="text-muted-foreground">
                      {interpolate(t.suppliersPage_pageNumber, {
                        current: page,
                        total: pageCount,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="supplier-directory-prev"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        {t.suppliersPage_previous}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="supplier-directory-next"
                        disabled={page >= pageCount}
                        onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                      >
                        {t.suppliersPage_next}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected supplier panel — sticky on desktop, stacked below on mobile */}
              <aside
                aria-label={t.selectedSupplier_aboutLabel}
                className="lg:sticky lg:top-20 lg:self-start"
              >
                <SelectedSupplierPanel
                  supplier={selected}
                  accessLevel={supplierAccessLevel(selected, level)}
                  isShortlisted={selected ? shortlist.has(selected.id) : false}
                  onShortlist={handleShortlist}
                  onPrimaryAction={handlePrimaryAction}
                />
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Suppliers;
