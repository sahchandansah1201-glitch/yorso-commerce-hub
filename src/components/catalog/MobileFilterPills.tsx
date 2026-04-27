import { useEffect, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import CatalogFilters, {
  type CatalogFilterState,
  emptyCatalogFilters,
} from "@/components/catalog/CatalogFilters";

type StringKey = {
  [K in keyof CatalogFilterState]: CatalogFilterState[K] extends string | null ? K : never;
}[keyof CatalogFilterState];

interface PillDef {
  key: StringKey;
  label: string;
  options: string[];
}

interface Props {
  value: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  options: {
    categories: string[];
    origins: string[];
    supplierCountries: string[];
    suppliers: string[];
    bases: string[];
    certifications: string[];
    paymentTermsList: string[];
    states: string[];
    cutTypes: string[];
    currencies: string[];
  };
}

/**
 * Mobile/tablet procurement filter bar (Avito-style):
 *  - Square dark search-icon button on the left
 *  - Horizontally scrollable grey pills with chevron
 *  - Top-right "Filters" button with red dot when any filter is active,
 *    opens a full-size sheet with the complete CatalogFilters form
 *  - Tapping a pill opens a bottom sheet (~2/3 viewport) with the option list,
 *    centered title, X close (left) and "Clear" (right), sticky "Apply" button.
 *  - Uses a draft state inside the sheet so changes are committed on Apply.
 */
export const MobileFilterPills = ({ value, onChange, options }: Props) => {
  const { t } = useLanguage();
  const [openKey, setOpenKey] = useState<StringKey | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<string | null>(null);

  const pills: PillDef[] = [
    { key: "latinName", label: t.catalog_filters_latinName, options: options.latinNames ?? [] },
    { key: "category", label: t.catalog_filters_species, options: options.categories },
    { key: "cutType", label: t.catalog_filters_cutType, options: options.cutTypes },
    { key: "origin", label: t.catalog_filters_origin, options: options.origins },
    { key: "currency", label: t.catalog_filters_currency, options: options.currencies },
  ];

  const active = pills.find((p) => p.key === openKey) ?? null;
  const filteredOptions = active
    ? active.options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : [];

  // Sync draft with current value when the sheet opens
  useEffect(() => {
    if (active) {
      setDraft((value[active.key] as string | null) ?? null);
      setSearch("");
    }
  }, [active, value]);

  const closeSheet = () => {
    setOpenKey(null);
    setSearch("");
  };

  const toggleDraft = (opt: string) => {
    setDraft((prev) => (prev === opt ? null : opt));
  };

  const clearDraft = () => setDraft(null);

  const scrollToResults = () => {
    // Wait for the sheet's close animation (~220ms) to finish before starting
    // smooth scroll — running both at once causes visible jank on mobile.
    window.setTimeout(() => {
      const el =
        document.getElementById("catalog-anchor-filters") ??
        document.getElementById("catalog-anchor-results");
      if (el) {
        el.scrollIntoView({ block: "start", behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 240);
  };

  const applyDraft = () => {
    if (!active) return;
    onChange({ ...value, [active.key]: draft });
    closeSheet();
    scrollToResults();
  };

  const hasActive = Object.values(value).some((v) => typeof v === "string" && v);

  return (
    <>
      {/* Top bar: square icon (search/all-filters) + scrolling pills + Filters button */}
      <div className="flex items-start gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            aria-label={t.catalog_filtersBar_title}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-foreground text-background hover:bg-foreground/90"
            data-testid="catalog-pill-search-square"
          >
            <Search className="h-4 w-4" />
          </button>
          <div
            className="-mr-4 flex flex-1 gap-2 overflow-x-auto pr-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={t.catalog_filtersBar_title}
            data-testid="catalog-mobile-filter-pills"
          >
            {pills.map((p) => {
              const v = value[p.key];
              const isActive = !!v;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setOpenKey(p.key)}
                  className={`shrink-0 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  data-testid={`catalog-pill-${p.key}`}
                  aria-haspopup="dialog"
                  aria-expanded={openKey === p.key}
                >
                  <span className="truncate max-w-[140px]">
                    {isActive ? v : p.label}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAllOpen(true)}
          className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-foreground hover:bg-muted"
          data-testid="catalog-pill-all-filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>{t.catalog_filtersBar_title}</span>
          {hasActive && (
            <span
              className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-destructive"
              aria-hidden
            />
          )}
        </button>
      </div>

      {/* Per-pill bottom sheet */}
      <Sheet
        open={!!openKey}
        onOpenChange={(o) => {
          if (!o) closeSheet();
        }}
      >
        <SheetContent
          side="bottom"
          className="flex h-[66vh] flex-col gap-0 rounded-t-2xl p-0 transform-gpu will-change-transform ease-out data-[state=open]:duration-300 data-[state=closed]:duration-200 [&>button]:hidden"
          data-testid="catalog-pill-sheet"
        >
          {/* Header: X (left) — Title (center) — Clear (right) */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border px-3 py-3">
            <button
              type="button"
              onClick={closeSheet}
              aria-label={t.catalog_filterPill_close}
              className="rounded-md p-1.5 text-foreground hover:bg-muted"
              data-testid="catalog-pill-sheet-close"
            >
              <X className="h-5 w-5" />
            </button>
            <SheetTitle className="text-center text-base font-semibold">
              {active?.label}
            </SheetTitle>
            <button
              type="button"
              onClick={clearDraft}
              disabled={!draft}
              className="rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
              data-testid="catalog-pill-sheet-clear"
            >
              {t.catalog_filterPill_clear}
            </button>
          </div>

          {/* Search */}
          {active && active.options.length > 8 && (
            <div className="border-b border-border px-4 py-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.catalog_filterPill_searchPlaceholder}
                  className="h-9 pl-10"
                  autoFocus={false}
                />
              </div>
            </div>
          )}

          {/* Options as checkbox rows (single-select bound to draft) */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">—</div>
            ) : (
              <ul role="listbox" className="flex flex-col">
                {filteredOptions.map((opt) => {
                  const checked = draft === opt;
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        onClick={() => toggleDraft(opt)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-[15px] text-foreground hover:bg-muted"
                        role="option"
                        aria-selected={checked}
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors ${
                            checked
                              ? "border-foreground bg-foreground text-background"
                              : "border-input bg-background"
                          }`}
                          aria-hidden
                        >
                          {checked && (
                            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 8.5l3.5 3.5L13 5" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{opt}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Sticky Apply */}
          <div className="border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              onClick={applyDraft}
              className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
              data-testid="catalog-pill-sheet-apply"
            >
              {t.catalog_filterPill_apply}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Full-form bottom sheet (all filters) */}
      <Sheet open={allOpen} onOpenChange={setAllOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[90vh] flex-col gap-0 rounded-t-2xl p-0 transform-gpu will-change-transform ease-out data-[state=open]:duration-300 data-[state=closed]:duration-200 [&>button]:hidden"
          data-testid="catalog-pill-all-sheet"
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border px-3 py-3">
            <button
              type="button"
              onClick={() => setAllOpen(false)}
              aria-label={t.catalog_filterPill_close}
              className="rounded-md p-1.5 text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <SheetTitle className="text-center text-base font-semibold">
              {t.catalog_filtersBar_title}
            </SheetTitle>
            <button
              type="button"
              onClick={() => onChange(emptyCatalogFilters)}
              disabled={!hasActive}
              className="rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              {t.catalog_filterPill_clear}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <CatalogFilters value={value} onChange={onChange} options={options} layout="stacked" />
          </div>
          <div className="border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              onClick={() => {
                setAllOpen(false);
                scrollToResults();
              }}
              className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
            >
              {t.catalog_filterPill_apply}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileFilterPills;
