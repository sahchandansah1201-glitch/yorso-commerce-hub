import { useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  type CatalogFilterState,
  emptyCatalogFilters,
} from "@/components/catalog/CatalogFilters";

type StringKey = {
  [K in keyof CatalogFilterState]: CatalogFilterState[K] extends string | null ? K : never;
}[keyof CatalogFilterState];

interface PillDef {
  key: StringKey; // value is string | null
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
 * Mobile/tablet procurement filters as horizontally-scrollable pills.
 * Tapping a pill opens a bottom sheet (~2/3 viewport) with the option list,
 * a clear-action and an explicit close (X) control.
 */
export const MobileFilterPills = ({ value, onChange, options }: Props) => {
  const { t } = useLanguage();
  const [openKey, setOpenKey] = useState<StringKey | null>(null);
  const [search, setSearch] = useState("");

  const pills: PillDef[] = [
    { key: "category", label: t.catalog_filters_species, options: options.categories },
    { key: "origin", label: t.catalog_filters_origin, options: options.origins },
    { key: "supplierCountry", label: t.catalog_filters_supplierCountry, options: options.supplierCountries },
    { key: "state", label: t.catalog_filters_state, options: options.states },
    { key: "basis", label: t.catalog_filters_logisticsBasis, options: options.bases },
    { key: "certification", label: t.catalog_filters_certification, options: options.certifications },
    { key: "paymentTerms", label: t.catalog_filters_paymentTerms, options: options.paymentTermsList },
    { key: "cutType", label: t.catalog_filters_cutType, options: options.cutTypes },
    { key: "currency", label: t.catalog_filters_currency, options: options.currencies },
    ...(options.suppliers.length > 0
      ? [{ key: "supplier" as StringKey, label: t.catalog_filters_supplier, options: options.suppliers }]
      : []),
  ];

  const active = pills.find((p) => p.key === openKey) ?? null;
  const filteredOptions = active
    ? active.options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : [];

  const closeSheet = () => {
    setOpenKey(null);
    setSearch("");
  };

  const handleSelect = (opt: string) => {
    if (!active) return;
    const current = value[active.key];
    onChange({ ...value, [active.key]: current === opt ? null : opt });
    closeSheet();
  };

  const clearActive = () => {
    if (!active) return;
    onChange({ ...value, [active.key]: null });
  };

  return (
    <>
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
              className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
              data-testid={`catalog-pill-${p.key}`}
              aria-haspopup="dialog"
              aria-expanded={openKey === p.key}
            >
              <span>{p.label}</span>
              {isActive ? (
                <span className="max-w-[120px] truncate text-primary/80">: {v}</span>
              ) : null}
              <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
            </button>
          );
        })}
        {Object.values(value).some((v) => typeof v === "string" && v) && (
          <button
            type="button"
            onClick={() => onChange(emptyCatalogFilters)}
            className="shrink-0 whitespace-nowrap rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            data-testid="catalog-pill-clear-all"
          >
            {t.catalog_filters_clearAll}
          </button>
        )}
      </div>

      <Sheet
        open={!!openKey}
        onOpenChange={(o) => {
          if (!o) closeSheet();
        }}
      >
        <SheetContent
          side="bottom"
          className="flex h-[66vh] flex-col gap-0 rounded-t-2xl p-0 [&>button]:hidden"
          data-testid="catalog-pill-sheet"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <SheetTitle className="text-base font-semibold">{active?.label}</SheetTitle>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearActive}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                data-testid="catalog-pill-sheet-clear"
              >
                {t.catalog_filterPill_clear}
              </button>
              <button
                type="button"
                onClick={closeSheet}
                aria-label={t.catalog_filterPill_close}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                data-testid="catalog-pill-sheet-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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

          {/* Options */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">—</div>
            ) : (
              <ul role="listbox" className="flex flex-col">
                {filteredOptions.map((opt) => {
                  const selected = active && value[active.key] === opt;
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        onClick={() => handleSelect(opt)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm transition-colors ${
                          selected
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                        role="option"
                        aria-selected={!!selected}
                      >
                        <span className="truncate">{opt}</span>
                        {selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileFilterPills;
