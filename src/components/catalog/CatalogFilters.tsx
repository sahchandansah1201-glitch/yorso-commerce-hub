/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";

export interface CatalogFilterState {
  q: string;
  category: string | null;
  origin: string | null;
  supplierCountry: string | null;
  supplier: string | null;
  basis: string | null;
  certification: string | null;
  paymentTerms: string | null;
  state: string | null;
  cutType: string | null;
  currency: string | null;
}

export const emptyCatalogFilters: CatalogFilterState = {
  q: "",
  category: null,
  origin: null,
  supplierCountry: null,
  supplier: null,
  basis: null,
  certification: null,
  paymentTerms: null,
  state: null,
  cutType: null,
  currency: null,
};

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

const Select = ({
  label,
  value,
  options,
  onChange,
  anyLabel,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
  anyLabel: string;
}) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    <select
      className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">{anyLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </label>
);

export const CatalogFilters = ({ value, onChange, options }: Props) => {
  const { t } = useLanguage();
  const [advanced, setAdvanced] = useState(false);

  const update = (patch: Partial<CatalogFilterState>) => onChange({ ...value, ...patch });
  const activeChips: { key: keyof CatalogFilterState; label: string }[] = [];
  (Object.keys(value) as (keyof CatalogFilterState)[]).forEach((k) => {
    const v = value[k];
    if (typeof v === "string" && v) activeChips.push({ key: k, label: v });
  });

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground">{t.catalog_filters_title}</h2>
        {activeChips.length > 0 && (
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => onChange(emptyCatalogFilters)}
            data-testid="catalog-filters-clear"
          >
            {t.catalog_filters_clearAll}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={value.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder={t.catalog_filters_searchPlaceholder}
          className="pl-10"
          aria-label={t.catalog_filters_search}
          data-testid="catalog-filters-search"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Select label={t.catalog_filters_species} value={value.category} options={options.categories} onChange={(v) => update({ category: v })} anyLabel={t.catalog_filters_all} />
        <Select label={t.catalog_filters_origin} value={value.origin} options={options.origins} onChange={(v) => update({ origin: v })} anyLabel={t.catalog_filters_any} />
        <Select label={t.catalog_filters_supplierCountry} value={value.supplierCountry} options={options.supplierCountries} onChange={(v) => update({ supplierCountry: v })} anyLabel={t.catalog_filters_any} />
        <Select label={t.catalog_filters_state} value={value.state} options={options.states} onChange={(v) => update({ state: v })} anyLabel={t.catalog_filters_any} />
      </div>

      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        aria-expanded={advanced}
        data-testid="catalog-filters-advanced-toggle"
      >
        {t.catalog_filters_advanced}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advanced ? "rotate-180" : ""}`} />
      </button>

      {advanced && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Select label={t.catalog_filters_supplier} value={value.supplier} options={options.suppliers} onChange={(v) => update({ supplier: v })} anyLabel={t.catalog_filters_any} />
          <Select label={t.catalog_filters_logisticsBasis} value={value.basis} options={options.bases} onChange={(v) => update({ basis: v })} anyLabel={t.catalog_filters_any} />
          <Select label={t.catalog_filters_certification} value={value.certification} options={options.certifications} onChange={(v) => update({ certification: v })} anyLabel={t.catalog_filters_any} />
          <Select label={t.catalog_filters_paymentTerms} value={value.paymentTerms} options={options.paymentTermsList} onChange={(v) => update({ paymentTerms: v })} anyLabel={t.catalog_filters_any} />
          <Select label={t.catalog_filters_cutType} value={value.cutType} options={options.cutTypes} onChange={(v) => update({ cutType: v })} anyLabel={t.catalog_filters_any} />
          <Select label={t.catalog_filters_currency} value={value.currency} options={options.currencies} onChange={(v) => update({ currency: v })} anyLabel={t.catalog_filters_any} />
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full p-0"
                onClick={() => update({ [chip.key]: chip.key === "q" ? "" : null } as Partial<CatalogFilterState>)}
                aria-label="remove"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogFilters;
