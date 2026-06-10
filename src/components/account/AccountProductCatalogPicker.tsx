import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  loadAccountProductCatalog,
  localizedName,
  searchCatalog,
  type CatalogItem,
} from "@/lib/account-product-catalog";

interface Props {
  onSelect: (item: { commercialName: string; latinName: string }) => void;
}

/**
 * Compact catalog picker used inside the product editing form.
 * Uses a single text input + listbox (no nested interactive controls).
 * Search matches latin + every localized name. Selecting a row fills
 * commercialName (active locale display) and latinName (Latin).
 */
export const AccountProductCatalogPicker = ({ onSelect }: Props) => {
  const { lang } = useLanguage();
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

  const results = useMemo(
    () => searchCatalog(items, query, 25),
    [items, query],
  );

  const placeholder =
    t.account_product_catalog_search_placeholder ??
    "Поиск по каталогу: латинское или локализованное название";
  const label = t.account_product_catalog_search_label ?? "Каталог продуктов";
  const emptyLabel = t.account_product_catalog_empty ?? "Ничего не найдено";

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
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        data-testid="account-product-catalog-search"
        className="mt-1"
      />
      {open && (query || results.length > 0) ? (
        <ul
          role="listbox"
          aria-label={label}
          data-testid="account-product-catalog-results"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-input bg-popover p-1 text-sm shadow-md"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">{emptyLabel}</li>
          ) : (
            results.map((item) => {
              const display = localizedName(item, lang);
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  data-testid={`account-product-catalog-option-${item.id}`}
                  onClick={() => {
                    onSelect({
                      commercialName: display,
                      latinName: item.latin,
                    });
                    setQuery(display);
                    setOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect({
                        commercialName: display,
                        latinName: item.latin,
                      });
                      setQuery(display);
                      setOpen(false);
                    }
                  }}
                  className="cursor-pointer rounded px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none"
                >
                  <div className="font-medium">{display}</div>
                  <div className="text-xs italic text-muted-foreground">
                    {item.latin}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
};
