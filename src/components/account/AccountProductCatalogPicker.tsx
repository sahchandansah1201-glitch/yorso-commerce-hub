import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
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
  onClear?: () => void;
  selected?: { commercialName: string; latinName: string } | null;
  invalid?: boolean;
  errorId?: string;
}

const ALIAS_LANGS: CatalogLang[] = ["en", "es", "ru", "fr", "cn", "de"];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

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

const selectedProductLabel = (selected?: Props["selected"]) => {
  if (!selected?.latinName?.trim()) return "";
  const commercialName = selected.commercialName?.trim();
  return commercialName ? `${selected.latinName} (${commercialName})` : selected.latinName;
};

/**
 * Combobox/listbox catalog picker with full keyboard a11y:
 *   ArrowDown/Up — move active option
 *   Enter        — select active option
 *   Escape       — close listbox
 * Latin-first identity, ranked results, no nested interactive controls.
 */
export const AccountProductCatalogPicker = ({
  onSelect,
  onClear,
  selected,
  invalid,
  errorId,
}: Props) => {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const lastSelectedLabelRef = useRef("");
  const suppressNextFocusOpenRef = useRef(false);
  const reactId = useId();
  const listboxId = `account-product-catalog-listbox-${reactId.replace(/:/g, "")}`;
  const optionId = (id: string) => `${listboxId}-opt-${id}`;

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
    () => searchCatalog(items, query, 25, lang),
    [items, query, lang],
  );

  // Reset active index when result set changes
  useEffect(() => {
    setActiveIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  // Scroll active option into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLLIElement>(
      `[data-option-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const label = t.account_product_catalog_picker_label;
  const hasSelected = Boolean(selected?.latinName && selected.latinName.trim());
  const selectedLabel = selectedProductLabel(selected);
  const listOpen = open && (query.length > 0 || results.length > 0);
  const activeId =
    listOpen && activeIndex >= 0 && results[activeIndex]
      ? optionId(results[activeIndex].id)
      : undefined;

  useEffect(() => {
    if (!selectedLabel || selectedLabel === lastSelectedLabelRef.current) return;
    lastSelectedLabelRef.current = selectedLabel;
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const select = (item: CatalogItem) => {
    const commercialName = localizedName(item, lang);
    const nextLabel = `${item.latin} (${commercialName})`;
    onSelect({ commercialName, latinName: item.latin });
    lastSelectedLabelRef.current = nextLabel;
    setQuery(nextLabel);
    setOpen(false);
  };

  const clearSelectedProduct = () => {
    onClear?.();
    lastSelectedLabelRef.current = "";
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    suppressNextFocusOpenRef.current = true;
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (results.length === 0) return;
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (results.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (listOpen && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        select(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === "Home" && open && results.length > 0) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End" && open && results.length > 0) {
      e.preventDefault();
      setActiveIndex(results.length - 1);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <Label htmlFor="account-product-catalog-search" className="text-sm">
        {label}
      </Label>
      <div
        className="relative mt-1"
        data-testid={hasSelected ? "account-product-selected-summary" : undefined}
      >
        <Input
          ref={inputRef}
          id="account-product-catalog-search"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-invalid={invalid ? "true" : undefined}
          aria-describedby={invalid && errorId ? errorId : undefined}
          value={query}
          placeholder={t.account_product_catalog_picker_placeholder}
          onChange={(e) => {
            const nextQuery = e.target.value;
            if (hasSelected && nextQuery !== selectedLabel) {
              onClear?.();
              lastSelectedLabelRef.current = "";
            }
            setQuery(nextQuery);
            setOpen(nextQuery.trim().length > 0);
          }}
          onFocus={(event) => {
            if (suppressNextFocusOpenRef.current) {
              suppressNextFocusOpenRef.current = false;
              return;
            }
            if (hasSelected && query === selectedLabel) {
              event.currentTarget.select();
              return;
            }
            if (query.trim().length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          data-testid="account-product-catalog-search"
          className="min-h-[44px] pr-11"
        />
        {hasSelected ? (
          <button
            type="button"
            className="absolute right-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t.account_product_catalog_picker_clear}
            title={t.account_product_catalog_picker_clear}
            onClick={clearSelectedProduct}
            data-testid="account-product-catalog-clear"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {listOpen ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          data-testid="account-product-catalog-results"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-input bg-popover p-1 text-sm shadow-md"
        >
          {results.length === 0 ? (
            <li
              data-testid="account-product-catalog-empty"
              className="px-3 py-2"
              role="presentation"
            >
              <div className="text-foreground">
                {t.account_product_catalog_picker_empty}
              </div>
              <div className="text-xs text-muted-foreground">
                {t.account_product_catalog_picker_empty_hint}
              </div>
            </li>
          ) : (
            results.map((item, i) => {
              const commercialName = localizedName(item, lang);
              const alias = matchedAlias(item, query, commercialName);
              const isActive = i === activeIndex;
              return (
                <li
                  key={item.id}
                  id={optionId(item.id)}
                  role="option"
                  aria-selected={isActive}
                  data-option-index={i}
                  data-testid={`account-product-catalog-option-${item.id}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(item);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`cursor-pointer rounded px-3 py-2 min-h-[44px] text-foreground ${
                    isActive
                      ? "bg-primary/10 ring-1 ring-inset ring-primary/40"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium italic text-foreground break-words">
                    {item.latin}
                  </div>
                  <div className="text-xs text-muted-foreground break-words">
                    ({commercialName})
                  </div>
                  {alias ? (
                    <div className="text-[11px] text-muted-foreground/80 break-words">
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
