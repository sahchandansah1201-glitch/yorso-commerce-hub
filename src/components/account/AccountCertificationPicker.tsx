import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  canonicalizeCertificationCode,
  canonicalizeCertificationList,
  getCertificationInfo,
  listCertificationCodes,
} from "@/data/certifications";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  testId?: string;
}

const normalizeKey = (code: string) => code.toUpperCase().replace(/[\s.\-_/]/g, "");

const matches = (query: string, haystack: string[]) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => h.toLowerCase().includes(q));
};

/**
 * Компактный multi-select сертификатов по локальному справочнику.
 * Логотипы — только существующие локальные ассеты, alt="" (рядом всегда видимая аббревиатура).
 * testid всегда строятся на каноническом коде (GLOBALGAP), не на отображаемом названии.
 */
export const AccountCertificationPicker = ({
  value,
  onChange,
  testId = "account-company-certificates",
}: Props) => {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reactId = useId();
  const listboxId = `account-certifications-listbox-${reactId.replace(/:/g, "")}`;

  const selected = useMemo(() => canonicalizeCertificationList(value), [value]);
  const selectedKeys = useMemo(
    () => new Set(selected.map((code) => normalizeKey(code))),
    [selected],
  );

  const options = useMemo(() => {
    return listCertificationCodes()
      .filter((code) => !selectedKeys.has(normalizeKey(code)))
      .map((code) => getCertificationInfo(code, lang))
      .filter((info) => matches(query, [info.code, info.name, info.fullName]));
  }, [lang, query, selectedKeys]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, selected.length]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const focusInput = () => {
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const add = (code: string) => {
    const canonical = canonicalizeCertificationCode(code);
    if (!canonical) return;
    if (selectedKeys.has(normalizeKey(canonical))) return;
    onChange([...selected, canonical]);
    setQuery("");
    setOpen(true);
    setActiveIndex(0);
    focusInput();
  };

  const remove = (code: string) => {
    const key = normalizeKey(code);
    onChange(selected.filter((c) => normalizeKey(c) !== key));
    focusInput();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      if (options.length === 0) return;
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (options.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open && options[activeIndex]) {
        e.preventDefault();
        add(options[activeIndex].code);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  return (
    <div ref={wrapRef} className="relative space-y-2" data-testid={testId}>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => {
            const info = getCertificationInfo(code, lang);
            return (
              <span
                key={code}
                data-testid={`account-company-certificate-chip-${code}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-input bg-muted/40 pl-2 pr-1 text-sm"
              >
                {info.logo ? (
                  <img src={info.logo} alt="" aria-hidden className="h-5 w-5 object-contain" />
                ) : (
                  <span
                    aria-hidden
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border px-1 text-[9px] font-semibold uppercase text-muted-foreground"
                  >
                    {info.code.slice(0, 3)}
                  </span>
                )}
                <span className="font-medium">{info.name}</span>
                <button
                  type="button"
                  onClick={() => remove(code)}
                  aria-label={`${t.account_company_certificates_remove}: ${info.name}`}
                  title={t.account_company_certificates_remove}
                  data-testid={`account-company-certificate-remove-${code}`}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <Input
        ref={inputRef}
        type="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={t.account_company_certificates}
        value={query}
        placeholder={t.account_company_certificates_searchPlaceholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        data-testid="account-company-certificates-search"
        className="min-h-[44px]"
      />

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t.account_company_certificates}
          data-testid="account-company-certificates-options"
          className="absolute z-30 max-h-64 w-full overflow-auto rounded-md border border-input bg-popover p-1 text-sm shadow-md"
        >
          {options.length === 0 ? (
            <li
              role="presentation"
              data-testid="account-company-certificates-empty"
              className="px-3 py-2 text-muted-foreground"
            >
              {t.account_company_certificates_empty}
            </li>
          ) : (
            options.map((info, i) => (
              <li
                key={info.code}
                role="option"
                aria-selected={i === activeIndex}
                data-testid={`account-company-certificates-option-${info.code}`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(info.code);
                }}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded px-3 py-2 ${
                  i === activeIndex ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : "hover:bg-muted"
                }`}
              >
                {info.logo ? (
                  <img src={info.logo} alt="" aria-hidden className="h-6 w-6 object-contain" />
                ) : (
                  <span
                    aria-hidden
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border px-1 text-[10px] font-semibold uppercase text-muted-foreground"
                  >
                    {info.code.slice(0, 3)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{info.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {info.fullName}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
};
