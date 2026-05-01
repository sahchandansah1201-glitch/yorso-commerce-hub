import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Copy,
  Calendar,
  MapPin,
  Globe,
  MessageCircle,
  ShieldCheck,
  Award,
  Package,
  Factory,
  Truck,
  Camera,
  HelpCircle,
  Snowflake,
  Thermometer,
  FileCheck2,
  Clock,
  Building2,
  FileBadge,
  Lock,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { mockSuppliers, countryCodeToFlag, type MockSupplier } from "@/data/mockSuppliers";
import { localizeSupplier } from "@/data/mockSuppliersI18n";
import { getOffersForSupplier } from "@/data/mockOffers";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";
import { getSupplierLegalDetails } from "@/lib/supplier-legal";
import {
  getLogoStatus,
  prefetchLogos,
  subscribeLogoStatus,
  type LogoStatus,
} from "@/lib/logo-cache";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  buildShipmentCasesI18n,
  buildFaqItemsI18n,
  supplierTypeLabelKey,
} from "@/lib/supplier-content";
import { interpolate, pluralize, formatLocalizedDate } from "@/lib/supplier-i18n";
import { formatMonthYear, formatTons, formatNumber, type AppLang } from "@/lib/intl-format";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import {
  getSupplierAccessRequest,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";
import {
  SupplierAccessRequestPanel,
  SupplierAccessRequestSent,
} from "@/components/suppliers/SupplierAccessRequestPanel";
import { processSupplierAccessRequests } from "@/lib/supplier-access-approval";

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

/** Компактный блок «Страны доставки» (используется в рельсе и в досье). */
const DeliveryCountriesBlock = ({ supplier }: { supplier: MockSupplier }) => {
  const { t } = useLanguage();
  const preview = supplier.deliveryCountries.slice(0, 15);
  const remaining = Math.max(supplier.deliveryCountriesTotal - preview.length, 0);
  return (
    <div>
      <ul className="grid grid-cols-5 gap-2">
        {preview.map((c) => (
          <li
            key={c.code}
            className="flex h-8 items-center justify-center rounded border border-border bg-background text-lg"
            title={c.name}
            aria-label={c.name}
          >
            <span aria-hidden>{countryCodeToFlag(c.code)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        {interpolate(t.supplier_about_deliveryCountriesCount, {
          n: supplier.deliveryCountriesTotal,
        })}
        {remaining > 0 && (
          <>
            {" · "}
            {interpolate(t.supplier_about_deliveryCountriesShown, {
              n: preview.length,
              rest: remaining,
            })}
          </>
        )}
      </p>
    </div>
  );
};

/** Сертификаты с местом под логотип (плейсхолдер-плита, пока нет файлов). */
const CertificationsBlock = ({
  supplier,
  size = "sm",
}: {
  supplier: MockSupplier;
  size?: "sm" | "lg";
}) => {
  const isLg = size === "lg";
  return (
    <ul className={isLg ? "grid grid-cols-2 gap-3 sm:grid-cols-3" : "grid grid-cols-3 gap-2"}>
      {supplier.certificationBadges.map((b) => (
        <li
          key={b.code}
          className="flex flex-col items-center justify-center rounded-md border border-border bg-background p-2 text-center"
          title={b.label}
        >
          <div
            className={
              isLg
                ? "flex h-12 w-12 items-center justify-center rounded bg-cool-gray/60 text-primary"
                : "flex h-8 w-8 items-center justify-center rounded bg-cool-gray/60 text-primary"
            }
            aria-hidden
          >
            <Award className={isLg ? "h-6 w-6" : "h-4 w-4"} />
          </div>
          <span
            className={
              isLg
                ? "mt-2 text-xs font-semibold leading-tight text-foreground"
                : "mt-1 text-[11px] font-semibold leading-tight text-foreground"
            }
          >
            {b.label}
          </span>
        </li>
      ))}
    </ul>
  );
};

/** Карточка «Основания надёжности». estimate-метки обязательны. */
/** Юридические реквизиты компании — для верификации контрагента. */
/** Инициалы компании для fallback-логотипа. Берём первые буквы 1-2 слов. */
const getCompanyInitials = (name: string): string => {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !/^(as|asa|sa|sl|gmbh|ltd|llc|co|inc|bv|ehf|ab|aps|srl|sarl|pvt|sac|sas|ooo)$/i.test(w));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Хук статуса загрузки логотипа из общего модульного кэша (см. lib/logo-cache).
 * До loaded — показываем скелет, при error — fallback-монограмму.
 */
const useLogoStatus = (url?: string): LogoStatus => {
  const [status, setStatus] = useState<LogoStatus>(() =>
    url ? getLogoStatus(url) : "idle",
  );
  useEffect(() => {
    if (!url) {
      setStatus("idle");
      return;
    }
    setStatus(getLogoStatus(url));
    return subscribeLogoStatus(url, setStatus);
  }, [url]);
  return status;
};

/**
 * Карточка-логотип поставщика.
 * Рендерит реальный logoImage если задан, иначе — монограмму на брендовом фоне.
 *
 * priority="hero" → loading=eager + fetchPriority=high (используется один раз
 * на странице — для основного логотипа в hero). Все остальные — lazy.
 */
const SupplierLogoCard = ({
  supplier,
  size = 80,
  className = "",
  priority = "lazy",
  displayName,
  showLogoImage = true,
}: {
  supplier: MockSupplier;
  size?: 28 | 40 | 80 | 86;
  className?: string;
  priority?: "hero" | "mini" | "lazy";
  displayName?: string;
  showLogoImage?: boolean;
}) => {
  const nameForLabel = displayName ?? supplier.companyName;
  const initials = getCompanyInitials(nameForLabel);
  // Hero — 80→86px. Mini — 28→32px (sticky-хедер). Плавный переход на md.
  const isHero = priority === "hero";
  const isMini = priority === "mini";
  const dim = `${size}px`;
  const radius = isMini
    ? "rounded-md md:rounded-lg"
    : size >= 80
      ? "rounded-xl"
      : size >= 40
        ? "rounded-lg"
        : "rounded-md";
  const textSize = isHero
    ? "text-2xl md:text-[26px]"
    : isMini
      ? "text-[11px] md:text-xs"
      : size >= 80
        ? "text-2xl"
        : size >= 40
          ? "text-sm"
          : "text-[11px]";
  const ring = isHero
    ? "ring-[3px] md:ring-4 ring-background shadow-lg"
    : isMini
      ? "ring-1 md:ring-2 ring-background shadow-sm"
      : size >= 80
        ? "ring-4 ring-background shadow-lg"
        : "ring-2 ring-background shadow-sm";

  const status = useLogoStatus(supplier.logoImage);
  const showImage = showLogoImage && !!supplier.logoImage && status !== "error";
  const showSkeleton = showImage && status !== "loaded";

  const sizeClasses = isHero
    ? "h-20 w-20 md:h-[86px] md:w-[86px] transition-[width,height,box-shadow] duration-300 ease-out [will-change:width,height]"
    : isMini
      ? "h-7 w-7 md:h-8 md:w-8 transition-[width,height] duration-200 ease-out"
      : "";

  const motionReduceLockdown =
    "motion-reduce:[&_*]:!transition-none motion-reduce:[&_*]:![animation-duration:0ms] motion-reduce:!transition-none motion-reduce:![animation-duration:0ms]";

  const sizeStyle: React.CSSProperties | undefined = isHero || isMini
    ? undefined
    : { width: dim, height: dim };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-border bg-card ${radius} ${ring} ${sizeClasses} ${motionReduceLockdown} ${className}`}
      style={sizeStyle}
      aria-label={`Логотип ${nameForLabel}`}
    >
      {showImage ? (
        <>
          {showSkeleton && (
            <Skeleton
              aria-hidden
              className="absolute inset-0 h-full w-full rounded-none transition-none"
            />
          )}
          <img
            src={supplier.logoImage}
            alt={`${nameForLabel} logo`}
            className={`h-full w-full object-contain p-1 transition-opacity duration-200 ${
              status === "loaded" ? "opacity-100" : "opacity-0"
            }`}
            loading={priority === "hero" ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error — нестандартный атрибут, поддержан в Chromium/WebKit
            fetchpriority={priority === "hero" ? "high" : "low"}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/80">
          <span
            className={`font-heading font-bold tracking-tight text-primary-foreground ${textSize}`}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

const LegalDetailsBlock = ({ supplier }: { supplier: MockSupplier }) => {
  const { t, lang } = useLanguage();
  const legal = getSupplierLegalDetails(supplier);
  const founded = formatLocalizedDate(legal.foundedDate, lang);
  const yearsOnMarket =
    new Date().getFullYear() - supplier.inBusinessSinceYear;

  const yearsWord = pluralize(lang, yearsOnMarket, {
    one: t.supplier_yearsOnMarket_pluralOne,
    few: t.supplier_yearsOnMarket_pluralFew,
    many: t.supplier_yearsOnMarket_pluralMany,
  });
  const yearsOnMarketLabel = interpolate(t.supplier_yearsOnMarket, {
    n: yearsOnMarket,
    plural: yearsWord,
  });

  const rows: { label: string; value: string; mono?: boolean }[] = [
    {
      label: legal.registrationLabel,
      value: legal.registrationNumber,
      mono: true,
    },
    ...(legal.vatNumber
      ? [{ label: "VAT", value: legal.vatNumber, mono: true }]
      : []),
    ...(legal.eoriNumber
      ? [{ label: "EORI", value: legal.eoriNumber, mono: true }]
      : []),
    { label: t.supplier_legal_legalForm, value: legal.legalForm },
    {
      label: t.supplier_legal_founded,
      value: `${founded} · ${yearsOnMarketLabel}`,
    },
    {
      label: t.supplier_legal_jurisdiction,
      value: `${countryCodeToFlag(supplier.countryCode)} ${supplier.country}`,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <FileBadge className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="font-heading text-base font-semibold text-foreground">
          {t.supplier_legal_title}
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t.supplier_legal_subtitle}
      </p>

      <dl className="mt-4 divide-y divide-border text-sm">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <dt className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
              {r.label}
            </dt>
            <dd
              className={`text-right text-foreground ${
                r.mono ? "font-mono text-[13px] tabular-nums" : "font-medium"
              }`}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{t.supplier_legal_disclaimer}</span>
      </div>
    </div>
  );
};

const TrustFactsBlock = ({
  supplier,
  unlocked = true,
}: {
  supplier: MockSupplier;
  unlocked?: boolean;
}) => {
  const { t, lang } = useLanguage();

  const responseLabel =
    supplier.responseSignal === "fast"
      ? t.supplier_response_fast
      : supplier.responseSignal === "normal"
      ? t.supplier_response_normal
      : t.supplier_response_slow;

  const docsLabel =
    supplier.documentReadiness === "ready"
      ? t.supplier_docs_ready
      : supplier.documentReadiness === "partial"
      ? t.supplier_docs_partial
      : t.supplier_docs_onRequest;

  const typeKey = supplierTypeLabelKey(supplier.supplierType);
  const typeValue = typeKey ? (t[typeKey] as string) : supplier.supplierType;

  // Exact active offer count is identity-adjacent (helps fingerprint a
  // supplier in a small market). Hide the precise number until access is
  // approved; show real value blurred with a small lock badge instead.
  const offersValue = formatNumber(lang as AppLang, supplier.activeOffersCount);

  const facts: Array<{
    label: string;
    value: string;
    estimate?: boolean;
    locked?: boolean;
    lockedHint?: string;
  }> = [
    { label: t.supplier_trust_type, value: typeValue },
    { label: t.supplier_trust_yearsOnMarket, value: formatNumber(lang as AppLang, supplier.yearsInBusiness) },
    {
      label: t.supplier_trust_activeOffers,
      value: offersValue,
      locked: !unlocked,
      lockedHint: t.supplier_locked_offersCountHidden,
    },
    { label: t.supplier_trust_documents, value: docsLabel },
    { label: t.supplier_trust_responseSpeed, value: responseLabel, estimate: true },
    {
      label: t.supplier_trust_repeatDeals,
      value: t.supplier_trust_repeatDeals_value,
      estimate: true,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
      {facts.map((f) => (
        <div key={f.label}>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {f.label}
          </dt>
          {f.locked ? (
            <dd className="mt-0.5">
              <span className="relative inline-flex items-center" aria-hidden="true">
                <span
                  className="inline-block min-w-[3rem] select-none rounded-md bg-muted/60 px-2 py-0.5 text-sm font-medium text-foreground/70 blur-[3px] [user-select:none]"
                  onCopy={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {f.value}
                </span>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card/95 shadow-sm">
                    <Lock className="h-3 w-3 text-primary" aria-hidden />
                  </span>
                </span>
              </span>
              {f.lockedHint && <span className="sr-only">{f.lockedHint}</span>}
            </dd>
          ) : (
            <dd className="mt-0.5 font-medium text-foreground">
              {f.value}
              {f.estimate && (
                <span className="ml-1 align-middle text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                  est.
                </span>
              )}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
};

/* ===== Mock-данные для новых SEO-вкладок (детерминированно от id) ===== */

const hashSeed = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const buildProductionFacts = (supplier: MockSupplier) => {
  const seed = hashSeed(supplier.id);
  const dailyTons = 8 + (seed % 35);
  const lines = 2 + (seed % 4);
  const coldStorageT = 200 + (seed % 9) * 100;
  const blastFreezerT = 20 + (seed % 8) * 5;
  const staff = 40 + (seed % 12) * 10;
  return { dailyTons, lines, coldStorageT, blastFreezerT, staff };
};

const buildLogisticsFacts = (supplier: MockSupplier) => {
  const seed = hashSeed(supplier.id);
  const incoterms = ["FCA", "CFR", "CIF", "FOB", "DAP"];
  const chosen = [incoterms[seed % 5], incoterms[(seed + 2) % 5], incoterms[(seed + 4) % 5]];
  const transit = 5 + (seed % 14);
  const minBatch = 1 + (seed % 4);
  const containers = ["20' Reefer", "40' Reefer HC"];
  return {
    incoterms: Array.from(new Set(chosen)),
    transitDaysMin: transit,
    transitDaysMax: transit + 7,
    minBatchTons: minBatch,
    containers,
    tempRange: "−18 °C … −22 °C",
  };
};

/* Shipment-кейсы и FAQ собираются key-based в @/lib/supplier-content
 * (buildShipmentCasesI18n / buildFaqItemsI18n). Старые хардкод-строки
 * на русском удалены вместе с типом ShipmentCase — теперь рендерим
 * через t(...) в JSX компонента ниже. */

const SupplierProfile = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const { t, lang } = useLanguage();

  // Базовый поставщик (en) — нужен для стабильных id/seed/lookup.
  const baseSupplier = useMemo<MockSupplier | undefined>(
    () => mockSuppliers.find((s) => s.id === supplierId),
    [supplierId],
  );
  // Локализованная копия — то, что реально рендерим (about, country, и т.п.).
  const supplier = useMemo<MockSupplier | undefined>(
    () => (baseSupplier ? localizeSupplier(baseSupplier, lang) : undefined),
    [baseSupplier, lang],
  );


  // ---- Access gating ----
  // Pull the global access level (anonymous / registered / qualified) and
  // check whether THIS supplier has an approved access request. The profile
  // unlocks for either condition; legacy global qualification keeps working,
  // and a per-supplier mock approval grants access without a global flag.
  const { level: globalLevel } = useAccessLevel();
  // Process pending mock approvals as soon as the profile mounts so that a
  // returning visitor sees the approved state immediately (the global
  // SupplierApprovalNotifier also runs, but it polls every 2s — running it
  // here removes the visible flash on first paint).
  useEffect(() => {
    if (typeof window === "undefined") return;
    processSupplierAccessRequests();
  }, [supplierId]);
  const [accessRequest, setAccessRequest] = useState<SupplierAccessRequest | null>(
    () => (supplierId ? getSupplierAccessRequest(supplierId) : null),
  );
  // Refresh request state when the supplier changes or storage emits.
  useEffect(() => {
    if (!supplierId) return;
    setAccessRequest(getSupplierAccessRequest(supplierId));
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes("supplier_access_requests")) {
        setAccessRequest(getSupplierAccessRequest(supplierId));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [supplierId]);
  const effectiveAccess: AccessLevel =
    accessRequest?.status === "approved"
      ? "qualified_unlocked"
      : globalLevel;
  const isUnlocked = effectiveAccess === "qualified_unlocked";
  const isAnonymous = effectiveAccess === "anonymous_locked";
  const isRegisteredLocked = effectiveAccess === "registered_locked";
  // The single string used everywhere the profile would show identity.
  const displayName = isUnlocked
    ? supplier?.companyName ?? ""
    : supplier?.maskedName ?? "";

  // Catalog: use origin/species mapping instead of index slicing so the
  // profile of e.g. Nordfjord Sjømat AS never shows offers belonging to
  // other suppliers. Always lookup against the EN baseline so origin/species
  // strings match the offer data (which is EN-only).
  const supplierOffers = useMemo(() => {
    if (!baseSupplier) return [];
    const species = baseSupplier.productFocus.map((p) => p.species);
    return getOffersForSupplier(baseSupplier.country, species, 4);
  }, [baseSupplier]);

  const production = useMemo(() => (supplier ? buildProductionFacts(supplier) : null), [supplier]);
  const logistics = useMemo(() => (supplier ? buildLogisticsFacts(supplier) : null), [supplier]);

  // Локализованное название продукта для подстановки в кейсы (поле product
  // в карточке кейса). Берём из productFocus уже локализованного supplier'а.
  const productLabel = useMemo(() => {
    if (!supplier) return "";
    return supplier.productFocus[0]?.species ?? t.supplier_cases_defaultProduct;
  }, [supplier, t]);

  const shipmentCases = useMemo(
    () => (supplier ? buildShipmentCasesI18n(supplier, productLabel) : []),
    [supplier, productLabel],
  );
  const faqItems = useMemo(
    () => (supplier ? buildFaqItemsI18n(supplier) : []),
    [supplier],
  );

  // Prefetch логотипов соседних профилей (prev + next 2) пока пользователь
  // смотрит текущий — переход по ссылкам «Похожие поставщики» / каталог
  // покажет логотип мгновенно (он уже в memory/HTTP cache).
  useEffect(() => {
    if (!supplier) return;
    const idx = mockSuppliers.findIndex((s) => s.id === supplier.id);
    if (idx < 0) return;
    const neighbors = [
      mockSuppliers[idx - 1],
      mockSuppliers[idx + 1],
      mockSuppliers[idx + 2],
    ]
      .filter(Boolean)
      .map((s) => s.logoImage)
      .filter((u): u is string => !!u);
    if (neighbors.length === 0) return;
    // Откладываем до idle, чтобы не конкурировать с критическими ресурсами
    // текущей страницы.
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    const run = () => prefetchLogos(neighbors);
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(run);
    } else {
      setTimeout(run, 300);
    }
  }, [supplier]);

  useEffect(() => {
    if (!supplier || typeof document === "undefined") return;
    const prev = document.title;
    const suffix = t.supplier_seo_titleSuffix;
    // Page title MUST NOT leak the supplier's real legal name when the
    // visitor has not been granted access. Use the masked label instead.
    const titleName = isUnlocked ? supplier.companyName : supplier.maskedName;
    const pageTitle = `${titleName} — ${suffix} · YORSO`;
    document.title = pageTitle;
    queueMicrotask(() => {
      if (document.title !== pageTitle) document.title = pageTitle;
    });
    // Description: same gating. shortDescription is intentionally a safe
    // preview (no legal/contact details) so it stays on for all states.
    const description =
      supplier.shortDescription ||
      interpolate(t.supplier_seo_descriptionFallback, {
        company: titleName,
        country: supplier.country,
      });
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    const ogLocaleMap: Record<string, string> = {
      en: "en_US",
      ru: "ru_RU",
      es: "es_ES",
    };
    upsertMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: ogLocaleMap[lang] ?? "en_US",
    });
    if (document.documentElement) {
      document.documentElement.lang = lang;
    }
    return () => {
      document.title = prev;
    };
  }, [supplier, t, lang, isUnlocked]);

  // Organization + FAQPage JSON-LD для SEO (локализованные)
  useEffect(() => {
    if (!supplier || typeof document === "undefined") return;

    // Identity gating mirrors the visible UI: locked states must not leak
    // the supplier's real legal name into structured data.
    const orgName = isUnlocked ? supplier.companyName : supplier.maskedName;

    // Organization
    const orgId = `org-jsonld-${supplier.id}`;
    let orgScript = document.getElementById(orgId) as HTMLScriptElement | null;
    if (!orgScript) {
      orgScript = document.createElement("script");
      orgScript.type = "application/ld+json";
      orgScript.id = orgId;
      document.head.appendChild(orgScript);
    }
    const typeLabel = t[supplierTypeLabelKey(supplier.supplierType)] as string;
    orgScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${window.location.origin}/suppliers/${supplier.id}`,
      name: orgName,
      url: `${window.location.origin}/suppliers/${supplier.id}`,
      ...(isUnlocked && supplier.logoImage ? { logo: supplier.logoImage } : {}),
      description: interpolate(t.supplier_seo_orgDescription, {
        company: orgName,
        type: typeLabel,
        country: supplier.country,
      }),
      address: {
        "@type": "PostalAddress",
        addressCountry: supplier.country,
      },
      inLanguage: lang,
    });

    // FAQPage
    const faqId = `faq-jsonld-${supplier.id}`;
    let faqScript: HTMLScriptElement | null = null;
    if (faqItems.length > 0) {
      faqScript = document.getElementById(faqId) as HTMLScriptElement | null;
      if (!faqScript) {
        faqScript = document.createElement("script");
        faqScript.type = "application/ld+json";
        faqScript.id = faqId;
        document.head.appendChild(faqScript);
      }
      faqScript.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: lang,
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: t[f.qKey] as string,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.params
              ? interpolate(t[f.aKey] as string, f.params)
              : (t[f.aKey] as string),
          },
        })),
      });
    }

    // ItemList — каталог продуктов. Эмитим только когда профиль разблокирован,
    // чтобы не привязывать имена продуктов к реальному названию компании
    // через brand.name в структурированных данных.
    const listId = `itemlist-jsonld-${supplier.id}`;
    let listScript: HTMLScriptElement | null = null;
    const previewItems = supplier.productCatalogPreview ?? [];
    if (isUnlocked && previewItems.length > 0) {
      listScript = document.getElementById(listId) as HTMLScriptElement | null;
      if (!listScript) {
        listScript = document.createElement("script");
        listScript.type = "application/ld+json";
        listScript.id = listId;
        document.head.appendChild(listScript);
      }
      const supplierUrl = `${window.location.origin}/suppliers/${supplier.id}`;
      listScript.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${supplierUrl}#catalog`,
        inLanguage: lang,
        name: interpolate(t.supplier_seo_itemListName, {
          company: orgName,
        }),
        numberOfItems: previewItems.length,
        itemListElement: previewItems.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Product",
            name: item.name,
            category: item.species,
            ...(item.image ? { image: item.image } : {}),
            brand: {
              "@type": "Organization",
              name: orgName,
            },
          },
        })),
      });
    } else {
      // Если ранее (в unlocked-сессии) ItemList был отрисован, удалим его,
      // чтобы при downgrade access он не оставался в <head>.
      const existing = document.getElementById(listId);
      if (existing) existing.remove();
    }

    return () => {
      orgScript?.remove();
      faqScript?.remove();
      listScript?.remove();
    };
  }, [supplier, faqItems, t, lang, isUnlocked]);

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t.supplier_notFound_title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.supplier_notFound_body}{" "}
            <Link to="/suppliers" className="text-primary underline">
              {t.supplier_notFound_link}
            </Link>
            .
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t.supplier_copySmartLink_toastOk });
    } catch {
      toast({ title: t.supplier_copySmartLink_toastFail, variant: "destructive" });
    }
  };

  const tabTriggerCls =
    "rounded-full px-5 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background";

  // Sticky-хедер: появляется когда основной hero уезжает за viewport.
  const heroSentinelRef = useRef<HTMLDivElement | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  useEffect(() => {
    const el = heroSentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { rootMargin: "0px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [supplier.id]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
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
              <Link to="/suppliers" className="hover:text-foreground">
                {t.supplier_breadcrumb_suppliers}
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground" data-testid="supplier-breadcrumb-name">{displayName}</span>
            </nav>
          </div>
        </div>

        {/* Hero cover */}
        <section className="relative">
          <div
            className="h-48 w-full bg-cover bg-center md:h-64 lg:h-72"
            style={{
              backgroundImage: `linear-gradient(180deg, hsl(var(--foreground) / 0.15) 0%, hsl(var(--foreground) / 0.05) 50%, hsl(var(--background)) 100%), url(${supplier.heroImage})`,
            }}
            aria-hidden
          />
        </section>

        {/* Identity */}
        <section className="bg-background">
          <div className="container -mt-10 pb-6 md:-mt-[43px]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl flex-1">
                <SupplierLogoCard
                  supplier={supplier}
                  size={86}
                  priority="hero"
                  displayName={displayName}
                  showLogoImage={isUnlocked}
                />

                <h1
                  className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                  data-testid="supplier-display-name"
                >
                  {displayName}
                </h1>

                <p className="mt-2 text-sm text-foreground/80">
                  {(() => {
                    const typeKey = supplierTypeLabelKey(supplier.supplierType);
                    const typeStr = typeKey
                      ? (t[typeKey] as string)
                      : supplier.supplierType;
                    const yearsStr = interpolate(t.supplier_yearsOnMarket, {
                      n: formatNumber(lang as AppLang, supplier.yearsInBusiness),
                      plural: pluralize(lang, supplier.yearsInBusiness, {
                        one: t.supplier_yearsOnMarket_pluralOne,
                        few: t.supplier_yearsOnMarket_pluralFew,
                        many: t.supplier_yearsOnMarket_pluralMany,
                      }),
                    });
                    // Hide exact active-offer count for locked states.
                    const offersStr = isUnlocked
                      ? interpolate(t.supplier_activeOffers, {
                          n: formatNumber(lang as AppLang, supplier.activeOffersCount),
                        })
                      : t.supplier_locked_offersCountHidden;
                    return interpolate(t.supplier_identity_subline, {
                      type: typeStr,
                      years: yearsStr,
                      offers: offersStr,
                    });
                  })()}
                </p>
                {!isUnlocked && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.supplier_locked_identityHint}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 md:mt-[70px] md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t.supplier_copySmartLink}
                </Button>
              </div>
            </div>

            <div className="max-w-3xl">

              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>
                    {interpolate(t.supplier_inBusinessSince, {
                      year: supplier.inBusinessSinceYear,
                    })}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>
                    {supplier.country}, {supplier.city}{" "}
                    <span aria-hidden>{countryCodeToFlag(supplier.countryCode)}</span>
                  </span>
                </li>
                {isUnlocked && supplier.website && (
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {supplier.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80">
                {supplier.shortDescription}
              </p>

              {/* Access-aware CTA block. Locked states never expose direct
                  contact actions; they only offer the registration / access
                  request path documented in mockSuppliers.ts. */}
              <div className="mt-5 flex flex-wrap gap-3" data-testid="supplier-cta-block">
                {isUnlocked ? (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() =>
                        toast({
                          title: t.supplier_sendMessage_toast_title,
                          description: t.supplier_sendMessage_toast_desc,
                        })
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t.supplier_sendMessage}
                    </Button>
                    {supplier.whatsapp && (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="gap-2 border-primary text-primary hover:bg-primary/5"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                  </>
                ) : isAnonymous ? (
                  <div
                    className="w-full max-w-md space-y-3 rounded-md border border-border bg-background p-4"
                    data-testid="supplier-anon-cta"
                  >
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        {t.supplier_locked_anonCtaTitle}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.supplier_locked_anonCtaBody}
                      </p>
                    </div>
                    <Button asChild size="lg" className="w-full">
                      <Link to="/register">
                        {t.supplier_locked_anonCtaButton}
                      </Link>
                    </Button>
                  </div>
                ) : isRegisteredLocked && supplier ? (
                  <div className="w-full max-w-md">
                    {accessRequest ? (
                      <SupplierAccessRequestSent
                        request={accessRequest}
                        supplierMaskedName={supplier.maskedName}
                      />
                    ) : (
                      <SupplierAccessRequestPanel
                        supplierId={supplier.id}
                        supplierMaskedName={supplier.maskedName}
                        onSent={(saved) => setAccessRequest(saved)}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div ref={heroSentinelRef} aria-hidden className="h-px w-full" />
          </div>
        </section>

        {/* Sticky mini-header — appears after hero scrolls out */}
        <div
          className={`sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur transition-all duration-200 ${
            showStickyHeader
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
          aria-hidden={!showStickyHeader}
        >
          <div className="container flex items-center justify-between gap-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <SupplierLogoCard
                supplier={supplier}
                size={28}
                priority="mini"
                displayName={displayName}
                showLogoImage={isUnlocked}
              />
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {countryCodeToFlag(supplier.countryCode)} {supplier.country} ·{" "}
                  {supplier.city}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="hidden h-8 gap-1.5 sm:inline-flex"
            >
              <Copy className="h-3.5 w-3.5" />
              {t.supplier_copySmartLink_short}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <section className="border-t border-border bg-background">
          <div className="container py-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-cool-gray/60 p-1">
                <TabsTrigger value="about" className={tabTriggerCls}>
                  {t.supplier_tab_about}
                </TabsTrigger>
                <TabsTrigger value="catalog" className={tabTriggerCls}>
                  {interpolate(t.supplier_tab_catalog, { n: supplierOffers.length })}
                </TabsTrigger>
                <TabsTrigger value="passport" className={tabTriggerCls}>
                  {t.supplier_tab_passport}
                </TabsTrigger>
                <TabsTrigger value="cases" className={tabTriggerCls}>
                  {t.supplier_tab_cases}
                </TabsTrigger>
                <TabsTrigger value="faq" className={tabTriggerCls}>
                  {t.supplier_tab_faq}
                </TabsTrigger>
              </TabsList>

              {/* === 1. О поставщике === */}
              <TabsContent value="about" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-heading text-lg font-semibold text-foreground">
                        {t.supplier_about_company}
                      </h2>
                      {isUnlocked ? (
                        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                          {supplier.about}
                        </p>
                      ) : (
                        <div
                          className="relative mt-3 overflow-hidden rounded-lg"
                          data-testid="supplier-about-locked"
                        >
                          <p
                            aria-hidden="true"
                            className="pointer-events-none select-none text-sm leading-relaxed text-foreground/80 blur-[2.5px]"
                          >
                            {supplier.about}
                          </p>
                          <div className="absolute inset-0 flex items-center justify-center bg-background/30 p-4">
                            <div className="flex max-w-[85%] items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-sm">
                              <Lock className="h-3.5 w-3.5 text-primary" aria-hidden />
                              <span className="text-xs font-medium text-foreground">
                                {t.supplier_locked_aboutPlaceholder}
                              </span>
                            </div>
                          </div>
                          <span className="sr-only">{t.supplier_locked_aboutPlaceholder}</span>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" aria-hidden />
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                          {t.supplier_about_productFocus}
                        </h2>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                        {supplier.productFocus.map((p) => (
                          <li key={p.species}>
                            <span className="font-medium text-foreground">
                              {p.species}
                            </span>{" "}
                            — {p.forms}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    {isUnlocked ? (
                      <LegalDetailsBlock supplier={supplier} />
                    ) : (
                      <div
                        className="relative overflow-hidden rounded-xl border border-border bg-card"
                        data-testid="supplier-legal-locked"
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none select-none blur-[2.5px]"
                        >
                          <LegalDetailsBlock supplier={supplier} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-background/30 p-4">
                          <div className="flex max-w-[85%] items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-sm">
                            <Lock className="h-3.5 w-3.5 text-primary" aria-hidden />
                            <span className="text-xs font-medium text-foreground">
                              {t.supplier_locked_legalHidden}
                            </span>
                          </div>
                        </div>
                        <span className="sr-only">{t.supplier_locked_legalHidden}</span>
                      </div>
                    )}

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          {t.supplier_about_trustBasis}
                        </h3>
                      </div>
                      <div className="mt-3">
                        <TrustFactsBlock supplier={supplier} unlocked={isUnlocked} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          {t.supplier_about_deliveryGeo}
                        </h3>
                      </div>
                      <div className="mt-3">
                        <DeliveryCountriesBlock supplier={supplier} />
                      </div>
                    </div>
                  </aside>
                </div>
              </TabsContent>

              {/* === 2. Каталог === */}
              <TabsContent value="catalog" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                  <div className="space-y-4">
                    {supplierOffers.map((offer) => (
                      <div key={offer.id}>
                        <div className="sm:hidden">
                          <MobileOfferCard
                            offer={offer}
                            isSelected={false}
                            onSelect={() => {}}
                          />
                        </div>
                        <div className="hidden sm:block">
                          <CatalogOfferRow
                            offer={offer}
                            isSelected={false}
                            onSelect={() => {}}
                          />
                        </div>
                      </div>
                    ))}
                    {supplierOffers.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                        {t.supplier_about_catalogEmpty}
                      </p>
                    )}
                  </div>

                  <aside className="space-y-4 lg:sticky lg:top-24">
                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-sm font-semibold text-foreground">
                          {t.supplier_about_trustBasis}
                        </h3>
                      </div>
                      <div className="mt-3">
                        <TrustFactsBlock supplier={supplier} unlocked={isUnlocked} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-sm font-semibold text-foreground">
                          {t.supplier_about_certifications}
                        </h3>
                      </div>
                      <div className="mt-3">
                        <CertificationsBlock supplier={supplier} size="sm" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-sm font-semibold text-foreground">
                          {t.supplier_about_deliveryGeo}
                        </h3>
                      </div>
                      <div className="mt-3">
                        <DeliveryCountriesBlock supplier={supplier} />
                      </div>
                    </div>
                  </aside>
                </div>
              </TabsContent>

              {/* === 3. Производственный паспорт (Сертификаты + Производство + Логистика) === */}
              <TabsContent value="passport" className="mt-6">
                <div className="space-y-4">
                  {/* Внутренняя навигация по разделам паспорта */}
                  <nav
                    aria-label={t.supplier_passport_nav_aria}
                    className="sticky top-16 z-10 -mx-1 flex flex-wrap gap-2 rounded-xl border border-border bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
                  >
                    <a
                      href="#passport-certs"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      <Award className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {t.supplier_passport_nav_certs}
                    </a>
                    <a
                      href="#passport-production"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      <Factory className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {t.supplier_passport_nav_production}
                    </a>
                    <a
                      href="#passport-logistics"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      <Truck className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {t.supplier_passport_nav_logistics}
                    </a>
                  </nav>

                  {/* --- 3.1 Сертификаты и аудиты --- */}
                  <section id="passport-certs" className="scroll-mt-32">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" aria-hidden />
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                          {t.supplier_passport_certs_title}
                        </h2>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        {t.supplier_passport_certs_subtitle}
                      </p>
                      <div className="mt-5">
                        <CertificationsBlock supplier={supplier} size="lg" />
                      </div>
                      <p className="mt-4 text-[11px] text-muted-foreground">
                        {t.supplier_passport_certs_disclaimer}
                      </p>
                    </div>
                  </section>

                  {/* --- 3.2 Производство и мощности --- */}
                  <section id="passport-production" className="scroll-mt-32">
                    {production && (
                      <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Factory className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                {t.supplier_passport_production_title}
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell
                                label={t.supplier_passport_production_dailyTons}
                                value={interpolate(t.supplier_passport_production_dailyTonsValue, {
                                  n: production.dailyTons,
                                })}
                                estimate
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                              <FactCell
                                label={t.supplier_passport_production_lines}
                                value={String(production.lines)}
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                              <FactCell
                                label={t.supplier_passport_production_staff}
                                value={interpolate(t.supplier_passport_production_staffValue, {
                                  n: production.staff,
                                })}
                                estimate
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                              <FactCell
                                label={t.supplier_passport_production_catalog}
                                value={interpolate(t.supplier_passport_production_catalogValue, {
                                  n: supplier.totalProductsCount,
                                })}
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Snowflake className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                {t.supplier_passport_cold_title}
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell
                                label={t.supplier_passport_cold_storage}
                                value={interpolate(t.supplier_passport_cold_storageValue, {
                                  n: production.coldStorageT,
                                })}
                                estimate
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                              <FactCell
                                label={t.supplier_passport_cold_blast}
                                value={interpolate(t.supplier_passport_cold_blastValue, {
                                  n: production.blastFreezerT,
                                })}
                                estimate
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                              <FactCell label={t.supplier_passport_cold_temp} value="−18 °C … −24 °C" />
                              <FactCell label={t.supplier_passport_cold_glaze} value={t.supplier_passport_cold_glazeValue} />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                {t.supplier_passport_formats_title}
                              </h2>
                            </div>
                            <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                              {supplier.productFocus.map((p) => (
                                <li key={p.species}>
                                  <span className="font-medium text-foreground">{p.species}</span>{" "}
                                  — {p.forms}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <aside className="space-y-6">
                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <FileCheck2 className="h-4 w-4 text-primary" aria-hidden />
                              <h3 className="font-heading text-base font-semibold text-foreground">
                                {t.supplier_passport_qc_title}
                              </h3>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                              <li>• {t.supplier_passport_qc_b1}</li>
                              <li>• {t.supplier_passport_qc_b2}</li>
                              <li>• {t.supplier_passport_qc_b3}</li>
                              <li>• {t.supplier_passport_qc_b4}</li>
                            </ul>
                          </div>

                          <p className="text-[11px] text-muted-foreground">
                            {t.supplier_passport_estNote}
                          </p>
                        </aside>
                      </div>
                    )}
                  </section>

                  {/* --- 3.3 Логистика и условия поставки --- */}
                  <section id="passport-logistics" className="scroll-mt-32">
                    {logistics && (
                      <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Truck className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                {t.supplier_passport_logistics_title}
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell
                                label={t.supplier_passport_logistics_incoterms}
                                value={logistics.incoterms.join(" · ")}
                              />
                              <FactCell
                                label={t.supplier_passport_logistics_minBatch}
                                value={interpolate(t.supplier_passport_logistics_minBatchValue, {
                                  n: logistics.minBatchTons,
                                })}
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                              <FactCell
                                label={t.supplier_passport_logistics_transit}
                                value={interpolate(t.supplier_passport_logistics_transitValue, {
                                  min: logistics.transitDaysMin,
                                  max: logistics.transitDaysMax,
                                })}
                                estimate
                                locked={!isUnlocked}
                                lockedHint={t.supplier_locked_passportHint}
                              />
                              <FactCell label={t.supplier_passport_logistics_containers} value={logistics.containers.join(", ")} />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                {t.supplier_passport_temp_title}
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell label={t.supplier_passport_temp_reefer} value={logistics.tempRange} />
                              <FactCell label={t.supplier_passport_temp_logger} value={t.supplier_passport_temp_loggerValue} />
                              <FactCell label={t.supplier_passport_temp_seal} value={t.supplier_passport_temp_sealValue} />
                              <FactCell label={t.supplier_passport_temp_insurance} value={t.supplier_passport_temp_insuranceValue} />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <FileCheck2 className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                {t.supplier_passport_docs_title}
                              </h2>
                            </div>
                            <ul className="mt-3 grid gap-1.5 text-sm text-foreground/80 sm:grid-cols-2">
                              <li>• {t.supplier_passport_docs_b1}</li>
                              <li>• {t.supplier_passport_docs_b2}</li>
                              <li>• {t.supplier_passport_docs_b3}</li>
                              <li>• {t.supplier_passport_docs_b4}</li>
                              <li>• {t.supplier_passport_docs_b5}</li>
                              <li>• {t.supplier_passport_docs_b6}</li>
                            </ul>
                          </div>
                        </div>

                        <aside className="space-y-6">
                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-primary" aria-hidden />
                              <h3 className="font-heading text-base font-semibold text-foreground">
                                {t.supplier_about_deliveryGeo}
                              </h3>
                            </div>
                            <div className="mt-3">
                              <DeliveryCountriesBlock supplier={supplier} />
                            </div>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" aria-hidden />
                              <h3 className="font-heading text-base font-semibold text-foreground">
                                {t.supplier_passport_lead_title}
                              </h3>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                              <li>• {t.supplier_passport_lead_b1}</li>
                              <li>• {t.supplier_passport_lead_b2} <span className="text-[10px] uppercase text-muted-foreground">est.</span></li>
                              <li>• {t.supplier_passport_lead_b3}</li>
                            </ul>
                          </div>
                        </aside>
                      </div>
                    )}
                  </section>
                </div>
              </TabsContent>

              {/* === 6. Отчёты о погрузке и кейсы === */}
              <TabsContent value="cases" className="mt-6">
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" aria-hidden />
                      <h2 className="font-heading text-lg font-semibold text-foreground">
                        {t.supplier_cases_title}
                      </h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                      {t.supplier_cases_intro}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {shipmentCases.map((c) => (
                      <article
                        key={c.id}
                        className="rounded-xl border border-border bg-card p-6"
                      >
                        <header className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-heading text-base font-semibold text-foreground">
                              {interpolate(t[c.titleKey] as string, { product: c.product })}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatMonthYear(lang as AppLang, c.dateISO)} ·{" "}
                              {t[c.destinationKey] as string} ·{" "}
                              {t[c.buyerTypeKey] as string}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
                            {c.incoterm}
                          </span>
                        </header>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <FactCell label={t.supplier_cases_factProduct} value={c.product} />
                          <FactCell
                            label={t.supplier_cases_factVolume}
                            value={formatTons(lang as AppLang, c.volumeTons)}
                          />
                          <FactCell label={t.supplier_cases_factBasis} value={c.incoterm} />
                        </dl>

                        <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                          {t[c.notesKey] as string}
                        </p>

                        <div className="mt-5">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t.supplier_cases_photoReportTitle}
                          </h4>
                          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {c.photoCaptionKeys.map((capKey, i) => (
                              <li
                                key={i}
                                className="overflow-hidden rounded-lg border border-border bg-cool-gray/40"
                              >
                                <div
                                  className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-cool-gray to-background text-muted-foreground"
                                  aria-hidden
                                >
                                  <Camera className="h-8 w-8 opacity-60" />
                                </div>
                                <p className="px-3 py-2 text-[11px] leading-snug text-foreground/80">
                                  {t[capKey] as string}
                                </p>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-[11px] text-muted-foreground">
                            {t.supplier_cases_photoReportNote}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* === 7. FAQ === */}
              <TabsContent value="faq" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-primary" aria-hidden />
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                          {t.supplier_faq_title}
                        </h2>
                      </div>
                      <Accordion type="single" collapsible className="mt-3">
                        {faqItems.map((f, i) => (
                          <AccordionItem key={i} value={`q-${i}`}>
                            <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
                              {t[f.qKey] as string}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm leading-relaxed text-foreground/80">
                              {f.params
                                ? interpolate(t[f.aKey] as string, f.params)
                                : (t[f.aKey] as string)}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        {t.supplier_faq_noAnswerTitle}
                      </h3>
                      <p className="mt-2 text-sm text-foreground/80">
                        {t.supplier_faq_noAnswerBody}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() =>
                          toast({
                            title: t.supplier_sendMessage_toast_title,
                            description: t.supplier_sendMessage_toast_desc,
                          })
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t.supplier_writeToSupplier}
                      </Button>
                    </div>
                  </aside>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

/** Унифицированная ячейка факта с опциональной estimate-меткой и locked-маской. */
const FactCell = ({
  label,
  value,
  estimate,
  locked,
  lockedHint,
}: {
  label: string;
  value: string;
  estimate?: boolean;
  /** Если true — значение скрывается размытым плейсхолдером. */
  locked?: boolean;
  /** Локализованная подсказка доступа, объявляется screen reader'ом. */
  lockedHint?: string;
}) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
    {locked ? (
      <dd className="mt-0.5">
        <span
          className="relative inline-flex items-center"
          // Скрываем от screen readers — вместо значения они услышат lockedHint ниже.
          aria-hidden="true"
        >
          <span
            className="inline-block min-w-[3.5rem] select-none rounded-md bg-muted/60 px-2 py-0.5 text-sm font-medium text-foreground/70 blur-[3px] [user-select:none]"
            onCopy={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {value || "•••••"}
          </span>
          {/* Замочек поверх блюра — для небольших полей. */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card/95 shadow-sm">
              <Lock className="h-3 w-3 text-primary" aria-hidden />
            </span>
          </span>
        </span>
        {lockedHint && <span className="sr-only">{lockedHint}</span>}
      </dd>
    ) : (
      <dd className="mt-0.5 text-sm font-medium text-foreground">
        {value}
        {estimate && (
          <span className="ml-1 align-middle text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
            est.
          </span>
        )}
      </dd>
    )}
  </div>
);

export default SupplierProfile;
