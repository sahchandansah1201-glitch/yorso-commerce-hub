import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { mockSuppliers, type MockSupplier } from "@/data/mockSuppliers";
import { useAccessLevel } from "@/lib/access-level";
import { SupplierRow } from "@/components/suppliers/SupplierRow";
import { SelectedSupplierPanel } from "@/components/suppliers/SelectedSupplierPanel";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SupplierDirectoryQuery } from "@/lib/supplier-directory-api";
import { useSupplierDirectoryList } from "@/lib/use-supplier-directory";


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

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
};

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

const Suppliers = () => {
  const { level } = useAccessLevel();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
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
    if (typeof document === "undefined") return;
    const prevTitle = document.title;
    document.title = `${t.suppliersPage_title} · YORSO`;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: t.suppliersPage_subtitle,
    });
    return () => {
      document.title = prevTitle;
    };
  }, [t]);

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
    limit: 50,
    offset: 0,
  });

  const filtered = useMemo(() => {
    if (directory.serverFiltered) return directory.suppliers;

    const q = query.trim().toLowerCase();
    const includeCompanyName = level === "qualified_unlocked";
    const source = directory.suppliers;
    return source.filter((s) => {
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

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return filtered.find((s) => s.id === selectedId) ?? null;
  }, [filtered, selectedId]);

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
    if (level === "anonymous_locked") {
      window.location.assign("/register");
      return;
    }
    if (level === "registered_locked") {
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
      <Header />
      <main id="main">
        {/* Breadcrumbs */}
        <div className="border-b border-border bg-background">
          <div className="container py-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link to="/" className="hover:text-foreground">
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
                    visible: filtered.length,
                    total: directory.total,
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
                    onClick={() => setActiveFilter(active ? null : f.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
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
          </div>
        </section>

        <section className="bg-cool-gray/40">
          <div className="container py-6 md:py-8">
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
                {filtered.length === 0 ? (
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
                    {filtered.map((s) => (
                      <SupplierRow
                        key={s.id}
                        supplier={s}
                        isSelected={selected?.id === s.id}
                        isShortlisted={shortlist.has(s.id)}
                        accessLevel={level}
                        onSelect={setSelectedId}
                        onShortlist={handleShortlist}
                        onPrimaryAction={handlePrimaryAction}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {/* Selected supplier panel — sticky on desktop, stacked below on mobile */}
              <aside
                aria-label="Selected supplier"
                className="lg:sticky lg:top-20 lg:self-start"
              >
                <SelectedSupplierPanel
                  supplier={selected}
                  accessLevel={level}
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
