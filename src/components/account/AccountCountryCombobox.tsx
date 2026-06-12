/**
 * Reusable, a11y-first country combobox for /account/* forms.
 *
 * Keyboard:  ArrowDown / ArrowUp / Home / End / Enter / Escape
 * ARIA:      role=combobox + role=listbox + role=option, aria-expanded,
 *            aria-activedescendant, aria-controls, aria-autocomplete=list
 * Mobile:    44×44 tap targets, no nested interactive controls.
 *
 * The input remains a plain free-text Input so existing e2e flows that
 * Playwright-`fill` arbitrary strings keep working as a fallback.
 */
import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  COUNTRY_CATALOG,
  findCountryByName,
  localizedCountryName,
  searchCountries,
  type CountryEntry,
} from "@/lib/account-country-catalog";

export interface AccountCountryComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string, entry: CountryEntry | undefined) => void;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "data-testid"?: string;
}

export const AccountCountryCombobox = forwardRef<
  HTMLInputElement,
  AccountCountryComboboxProps
>((props, ref) => {
  const {
    id,
    value,
    onChange,
    placeholder,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    "data-testid": testId,
  } = props;
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const listboxId = `account-country-listbox-${safeId}`;
  const optionId = (cid: string) => `${listboxId}-opt-${cid}`;

  const matchedEntry = useMemo(
    () => findCountryByName(value, lang),
    [value, lang],
  );

  const results = useMemo(
    () => searchCountries(value, lang, 50),
    [value, lang],
  );

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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

  const listOpen = open && results.length > 0;
  const activeId =
    listOpen && activeIndex >= 0 && results[activeIndex]
      ? optionId(results[activeIndex].id)
      : undefined;

  const selectEntry = (entry: CountryEntry) => {
    onChange(localizedCountryName(entry, lang), entry);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
        selectEntry(results[activeIndex]);
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
      <Input
        ref={ref}
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        value={value}
        placeholder={placeholder ?? t.account_country_combobox_placeholder}
        onChange={(e) => {
          onChange(e.target.value, findCountryByName(e.target.value, lang));
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        data-testid={testId}
        className="min-h-[44px]"
      />
      {matchedEntry ? (
        <div
          data-testid={testId ? `${testId}-meta` : undefined}
          className="mt-1 text-[11px] text-muted-foreground"
        >
          {matchedEntry.alpha2} · {matchedEntry.alpha3} · {matchedEntry.phone}
        </div>
      ) : null}

      {listOpen ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={t.account_country_combobox_placeholder}
          data-testid={testId ? `${testId}-listbox` : undefined}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-input bg-popover p-1 text-sm shadow-md"
        >
          {results.map((entry, i) => {
            const name = localizedCountryName(entry, lang);
            const isActive = i === activeIndex;
            return (
              <li
                key={entry.id}
                id={optionId(entry.id)}
                role="option"
                aria-selected={isActive}
                data-option-index={i}
                data-testid={
                  testId ? `${testId}-option-${entry.id}` : undefined
                }
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectEntry(entry);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 ${
                  isActive ? "bg-accent" : ""
                }`}
              >
                <span className="break-words font-medium text-foreground">
                  {name}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {entry.alpha2} · {entry.phone}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
});

AccountCountryCombobox.displayName = "AccountCountryCombobox";

export { COUNTRY_CATALOG };
