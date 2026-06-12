import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  loadAccountProductCatalog,
  localizedName,
  searchCatalog,
  type CatalogItem,
  type CatalogLang,
} from "@/lib/account-product-catalog";

interface Props {
  onSelect: (item: { commercialName: string; latinName: string }) => void;
  selected?: { commercialName: string; latinName: string } | null;
}

const ALIAS_LANGS: CatalogLang[] = ["en", "es", "ru", "fr", "cn", "de"];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Returns the localized alias that actually matched the user's query,
 * but only when it differs from both the Latin name and the active-locale
 * commercial name. Used to disclose which alias caused the hit without
 * replacing the Latin-first identity.
 */
const matchedAlias = (
  item: CatalogItem,
  query: string,
  activeCommercial: string,
): string | null => {
  const q = normalize(query.trim());
  if (!q) return null;
  for (const l of ALIAS_LANGS) {
    const v = item[l];
    if (!v) continue;
    if (v === activeCommercial || v === item.latin) continue;
    if (normalize(v).includes(q)) return v;
  }
  return null;
};

/**
 * Compact catalog picker used inside the product editing form.
 * Single text input + listbox (no nested interactive controls).
 * Latin name is the primary identity; commercial name is secondary.
 * Matching alias (if different from the active locale) is shown muted.
 */
export const AccountProductCatalogPicker = ({ onSelect, selected }: Props) => {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    void loadAccountProductCatalog().then((data) => {
      if (alive) setItems(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const results = useMemo(() => searchCatalog(items, query, 25), [items, query]);

  const label = t.account_product_catalog_picker_label;
  const hasSelected = Boolean(selected?.latinName && selected.latinName.trim());

  const select = (item: CatalogItem) => {
    const commercialName = localizedName(item, lang);
    onSelect({ commercialName, latinName: item.latin });
    setQuery(`${item.latin} (${commercialName})`);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <Label htmlFor="account-product-catalog-search" className="text-sm">
        {label}
      </Label>
      <Input
        id="account-product-catalog-search"
        type="search"
        autoComplete="off"
        value={query}
        placeholder={t.account_product_catalog_picker_placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        data-testid="account-product-catalog-search"
        className="mt-1"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {t.account_product_catalog_picker_placeholder}
      </p>

      {hasSelected ? (
        <div
          data-testid="account-product-selected-summary"
          className="mt-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2"
        >
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t.account_product_catalog_picker_selected_label}
          </div>
          <div
            data-testid="account-product-selected-latin"
            className="mt-0.5 break-words font-medium italic text-foreground"
          >
            {selected!.latinName}
          </div>
          {selected!.commercialName ? (
            <div
              data-testid="account-product-selected-commercial"
              className="break-words text-xs text-muted-foreground"
            >
              ({selected!.commercialName})
            </div>
          ) : null}
        </div>
      ) : null}

      {open && (query || results.length > 0) ? (
        <ul
          role="listbox"
          aria-label={label}
          data-testid="account-product-catalog-results"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-input bg-popover p-1 text-sm shadow-md"
        >
          {results.length === 0 ? (
            <li
              data-testid="account-product-catalog-empty"
              className="px-3 py-2"
            >
              <div className="text-foreground">
                {t.account_product_catalog_picker_empty}
              </div>
              <div className="text-xs text-muted-foreground">
                {t.account_product_catalog_picker_empty_hint}
              </div>
            </li>
          ) : (
            results.map((item) => {
              const commercialName = localizedName(item, lang);
              const alias = matchedAlias(item, query, commercialName);
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  data-testid={`account-product-catalog-option-${item.id}`}
                  onClick={() => select(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      select(item);
                    }
                  }}
                  className="cursor-pointer rounded px-3 py-2 min-h-[44px] hover:bg-accent focus:bg-accent focus:outline-none"
                >
                  <div className="font-medium italic text-foreground">
                    {item.latin}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({commercialName})
                  </div>
                  {alias ? (
                    <div className="text-[11px] text-muted-foreground/80">
                      {t.account_product_catalog_picker_alias_label}: {alias}
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
};
