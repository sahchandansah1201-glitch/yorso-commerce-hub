import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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


interface QuickFilter {
  id: string;
  label: string;
  /** Match against supplier productFocus.species (case-insensitive substring) or "certified". */
  match: (s: MockSupplier) => boolean;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "salmon",
    label: "Salmon",
    match: (s) => s.productFocus.some((p) => /salmon/i.test(p.species)),
  },
  {
    id: "shrimp",
    label: "Shrimp",
    match: (s) => s.productFocus.some((p) => /shrimp|vannamei/i.test(p.species)),
  },
  {
    id: "tuna",
    label: "Tuna",
    match: (s) => s.productFocus.some((p) => /tuna|skipjack/i.test(p.species)),
  },
  {
    id: "whitefish",
    label: "Whitefish",
    match: (s) =>
      s.productFocus.some((p) =>
        /cod|pollock|haddock|hake|saithe|whitefish|pangasius|tilapia/i.test(p.species),
      ),
  },
  {
    id: "crab",
    label: "Crab",
    match: (s) => s.productFocus.some((p) => /crab/i.test(p.species)),
  },
  {
    id: "squid",
    label: "Squid",
    match: (s) => s.productFocus.some((p) => /squid|octopus/i.test(p.species)),
  },
  {
    id: "certified",
    label: "Certified suppliers",
    match: (s) => s.verificationLevel === "documents_reviewed",
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

const Suppliers = () => {
  const { level } = useAccessLevel();
  const [query, setQuery] = useState("");
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

  // SEO + page view
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevTitle = document.title;
    document.title = "Seafood suppliers · YORSO";
    upsertMeta('meta[name="description"]', {
      name: "description",
      content:
        "Discover seafood suppliers by country, species, certification and trust evidence. Request supplier access through YORSO.",
    });
    
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const persistShortlist = (next: Set<string>) => {
    setShortlist(next);
    try {
      sessionStorage.setItem(SHORTLIST_KEY, JSON.stringify(Array.from(next)));
    } catch {
      /* ignore */
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const includeCompanyName = level === "qualified_unlocked";
    return mockSuppliers.filter((s) => {
      if (activeFilter) {
        const f = QUICK_FILTERS.find((x) => x.id === activeFilter);
        if (f && !f.match(s)) return false;
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
        // Only qualified buyers can search by full identity / contact / about.
        fields.push(s.companyName);
        fields.push(s.about);
        if (s.website) fields.push(s.website);
        if (s.whatsapp) fields.push(s.whatsapp);
      }
      const haystack = fields.join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeFilter, level]);

  // Neutral state stays visible until the user actively selects a supplier.
  // Filtering away the selected supplier resets selection to null instead of
  // silently auto-selecting the first remaining row.
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return filtered.find((s) => s.id === selectedId) ?? null;
  }, [filtered, selectedId]);

  const handleShortlist = (id: string) => {
    const next = new Set(shortlist);
    if (next.has(id)) {
      next.delete(id);
      toast({ title: "Removed from shortlist" });
    } else {
      next.add(id);
      toast({ title: "Added to shortlist" });
    }
    persistShortlist(next);
    
  };

  const handlePrimaryAction = (supplier: MockSupplier) => {
    if (level === "anonymous_locked") {
      // The button-as-link variant in the panel handles navigation; rows call this directly.
      window.location.assign("/register");
      return;
    }
    if (level === "registered_locked") {
      toast({
        title: "Access request prepared",
        description:
          "In the prototype, supplier review happens manually. The buyer-side workflow will be wired in the next step.",
      });
      
      return;
    }
    toast({
      title: "Supplier profile",
      description: "Full supplier profile page is coming next.",
    });
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
                Home
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground">Suppliers</span>
            </nav>
          </div>
        </div>

        {/* Page header */}
        <section className="border-b border-border bg-background">
          <div className="container py-6 md:py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-foreground md:text-[34px]">
                  Seafood suppliers
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  Discover producers, processors, exporters and traders across key seafood
                  origins. Review trust evidence and request access on your terms.
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {filtered.length}
                  </span>{" "}
                  / {mockSuppliers.length} suppliers
                </span>
              </div>
            </div>

            {/* Search */}
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
                  placeholder="Search supplier, species, country, certification..."
                  className="h-11 pl-9"
                  aria-label="Search suppliers"
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
                  Clear filters
                </Button>
              )}
            </div>

            {/* Quick chips */}
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Quick filters">
              {QUICK_FILTERS.map((f) => {
                const active = activeFilter === f.id;
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
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Workspace */}
        <section className="bg-cool-gray/40">
          <div className="container py-6 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              {/* Supplier list */}
              <div>
                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No suppliers match your filters
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try a different species, country, or clear the active filter.
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
