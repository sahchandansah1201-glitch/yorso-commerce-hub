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
import { mockOffers } from "@/data/mockOffers";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";
import { getSupplierLegalDetails, formatFoundedDate } from "@/lib/supplier-legal";
import {
  getLogoStatus,
  prefetchLogos,
  subscribeLogoStatus,
  type LogoStatus,
} from "@/lib/logo-cache";
import { Skeleton } from "@/components/ui/skeleton";

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
        Доставка в {supplier.deliveryCountriesTotal} стран
        {remaining > 0 && <> · показано {preview.length}, ещё {remaining}</>}
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
}: {
  supplier: MockSupplier;
  size?: 28 | 40 | 80 | 86;
  className?: string;
  priority?: "hero" | "lazy";
}) => {
  const initials = getCompanyInitials(supplier.companyName);
  // Hero-логотип адаптивный: 80px на mobile → 86px на md+ (площадь +15%).
  // Плавный переход transition-all сглаживает rerender при resize.
  const isHero = priority === "hero";
  const dim = `${size}px`;
  const radius = size >= 80 ? "rounded-xl" : size >= 40 ? "rounded-lg" : "rounded-md";
  const textSize = isHero
    ? "text-2xl md:text-[26px]"
    : size >= 80
      ? "text-2xl"
      : size >= 40
        ? "text-sm"
        : "text-[11px]";
  const ring =
    size >= 80
      ? "ring-4 ring-background shadow-lg"
      : "ring-2 ring-background shadow-sm";

  const status = useLogoStatus(supplier.logoImage);
  const showImage = !!supplier.logoImage && status !== "error";
  const showSkeleton = showImage && status !== "loaded";

  // Для hero — адаптивные классы (mobile 80 → md 86), плавный transition.
  // Для остальных размеров — фиксированный inline-размер как раньше.
  const sizeClasses = isHero
    ? "h-20 w-20 md:h-[86px] md:w-[86px] transition-[width,height] duration-200 ease-out"
    : "";
  const sizeStyle: React.CSSProperties | undefined = isHero
    ? undefined
    : { width: dim, height: dim };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-border bg-card ${radius} ${ring} ${sizeClasses} ${className}`}
      style={sizeStyle}
      aria-label={`Логотип ${supplier.companyName}`}
    >
      {showImage ? (
        <>
          {showSkeleton && (
            <Skeleton
              aria-hidden
              className="absolute inset-0 h-full w-full rounded-none"
            />
          )}
          <img
            src={supplier.logoImage}
            alt={`${supplier.companyName} logo`}
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
  const legal = getSupplierLegalDetails(supplier);
  const founded = formatFoundedDate(legal.foundedDate);
  const yearsOnMarket =
    new Date().getFullYear() - supplier.inBusinessSinceYear;

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
    { label: "Юр. форма", value: legal.legalForm },
    {
      label: "Основана",
      value: `${founded} · ${yearsOnMarket} ${
        yearsOnMarket % 10 === 1 && yearsOnMarket % 100 !== 11
          ? "год"
          : yearsOnMarket % 10 >= 2 &&
            yearsOnMarket % 10 <= 4 &&
            (yearsOnMarket % 100 < 10 || yearsOnMarket % 100 >= 20)
          ? "года"
          : "лет"
      } на рынке`,
    },
    {
      label: "Юрисдикция",
      value: `${countryCodeToFlag(supplier.countryCode)} ${supplier.country}`,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <FileBadge className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="font-heading text-base font-semibold text-foreground">
          Юридические реквизиты
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Для проверки контрагента в национальных реестрах
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
        <span>
          Реквизиты предоставлены поставщиком и проверены YORSO при подключении.
          Полный пакет документов — во вкладке «Производственный паспорт».
        </span>
      </div>
    </div>
  );
};

const TrustFactsBlock = ({ supplier }: { supplier: MockSupplier }) => {
  const responseLabel =
    supplier.responseSignal === "fast"
      ? "до 4 ч"
      : supplier.responseSignal === "normal"
      ? "до 24 ч"
      : "более 24 ч";
  const docsLabel =
    supplier.documentReadiness === "ready"
      ? "готовы"
      : supplier.documentReadiness === "partial"
      ? "частично"
      : "по запросу";

  const facts: Array<{ label: string; value: string; estimate?: boolean }> = [
    { label: "Тип", value: supplierTypeLabel(supplier.supplierType) },
    { label: "Лет на рынке", value: String(supplier.yearsInBusiness) },
    { label: "Активные офферы", value: String(supplier.activeOffersCount) },
    { label: "Документы", value: docsLabel },
    { label: "Скорость ответа", value: responseLabel, estimate: true },
    {
      label: "Повторные сделки",
      value: "около 60%",
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
          <dd className="mt-0.5 font-medium text-foreground">
            {f.value}
            {f.estimate && (
              <span className="ml-1 align-middle text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                est.
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const supplierTypeLabel = (t: MockSupplier["supplierType"]) => {
  switch (t) {
    case "producer":
      return "Производитель";
    case "processor":
      return "Переработчик";
    case "exporter":
      return "Экспортёр";
    case "distributor":
      return "Дистрибьютор";
    case "trader":
      return "Трейдер";
    default:
      return t;
  }
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

type ShipmentCase = {
  id: string;
  title: string;
  date: string;
  destination: string;
  product: string;
  volume: string;
  incoterm: string;
  buyerType: string;
  notes: string;
  photos: { caption: string }[];
};

const buildShipmentCases = (supplier: MockSupplier): ShipmentCase[] => {
  const seed = hashSeed(supplier.id);
  const product = supplier.productFocus[0]?.species ?? "Морепродукция";
  const cases: ShipmentCase[] = [
    {
      id: "case-de-2024",
      title: `Поставка «${product}» в розничную сеть, Германия`,
      date: "Окт 2024",
      destination: "Гамбург, DE 🇩🇪",
      product,
      volume: `${20 + (seed % 8)} т`,
      incoterm: "CFR Hamburg",
      buyerType: "Федеральная розничная сеть (NDA)",
      notes:
        "Партия отгружена в 40' reefer, температура −20 °C, PSI-инспекция перед погрузкой. Документы: H/C, CoO EUR.1, CoA, упаковочный лист.",
      photos: [
        { caption: "Загрузка контейнера, склад отправителя" },
        { caption: "Установка термописца, перед пломбировкой" },
        { caption: "Опломбированный контейнер, № пломбы скрыт" },
        { caption: "Документы партии (обезличено)" },
      ],
    },
    {
      id: "case-fr-2024",
      title: `Поставка «${product}» дистрибьютору HoReCa, Франция`,
      date: "Июл 2024",
      destination: "Марсель, FR 🇫🇷",
      product,
      volume: `${10 + (seed % 6)} т`,
      incoterm: "DAP Marseille",
      buyerType: "Дистрибьютор HoReCa (NDA)",
      notes:
        "Смешанная палетная отгрузка, IQF-формат, картон ритейл-готовый. Запрос покупателя: фото каждого паллета и температурный лог за 72 часа.",
      photos: [
        { caption: "Палеты после блистфризера" },
        { caption: "Этикетка партии (бренд скрыт)" },
        { caption: "Температурный лог, выгрузка из reefer" },
      ],
    },
    {
      id: "case-ae-2023",
      title: `Поставка «${product}» оптовому импортёру, ОАЭ`,
      date: "Дек 2023",
      destination: "Джебель-Али, AE 🇦🇪",
      product,
      volume: `${24 + (seed % 5)} т`,
      incoterm: "CIF Jebel Ali",
      buyerType: "Импортёр-оптовик (NDA)",
      notes:
        "Halal-сертификация партии, двойная проверка глазури, сюрвей независимой инспекции в порту отправки.",
      photos: [
        { caption: "Сюрвей-инспекция перед погрузкой" },
        { caption: "Загрузка 40' HC reefer" },
      ],
    },
  ];
  return cases;
};

const buildFaqItems = (supplier: MockSupplier) => {
  const minBatch = 1 + (hashSeed(supplier.id) % 4);
  return [
    {
      q: "Какой минимальный объём заказа?",
      a: `Стандартный минимум — от ${minBatch} тонн на SKU. Под сборные контейнеры обсуждается индивидуально после запроса доступа к ценам.`,
    },
    {
      q: "На каких условиях Incoterms работаете?",
      a: "Базово FCA склад отправителя и CFR/CIF до основных портов. DAP — по согласованию маршрута и страховщика.",
    },
    {
      q: "Какие документы предоставляете на партию?",
      a: "Health Certificate, Certificate of Origin (EUR.1 при наличии), Certificate of Analysis, упаковочный лист, BL/CMR, по запросу — Halal/Kosher.",
    },
    {
      q: "Как происходит контроль качества перед отгрузкой?",
      a: "Внутренняя QC-проверка по чек-листу (вес-нетто, глазурь, температура ядра, упаковка), фото-отчёт, по требованию — независимый сюрвей (SGS/Bureau Veritas) за счёт покупателя.",
    },
    {
      q: "Какие сроки производства и отгрузки?",
      a: "Со склада — 3–7 дней после подтверждения оплаты/аккредитива. Производство под заказ — 2–4 недели в зависимости от сезона и формата.",
    },
    {
      q: "Какие условия оплаты?",
      a: "Базово 30% предоплата / 70% против копий документов. Для повторных сделок — отсрочка или аккредитив (L/C at sight).",
    },
  ];
};

const SupplierProfile = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const supplier = useMemo<MockSupplier | undefined>(
    () => mockSuppliers.find((s) => s.id === supplierId),
    [supplierId],
  );

  const supplierOffers = useMemo(() => {
    if (!supplier) return [];
    const idx = mockSuppliers.findIndex((s) => s.id === supplier.id);
    const start = (idx * 2) % Math.max(mockOffers.length - 2, 1);
    return mockOffers.slice(start, start + 2);
  }, [supplier]);

  const production = useMemo(() => (supplier ? buildProductionFacts(supplier) : null), [supplier]);
  const logistics = useMemo(() => (supplier ? buildLogisticsFacts(supplier) : null), [supplier]);
  const shipmentCases = useMemo(() => (supplier ? buildShipmentCases(supplier) : []), [supplier]);
  const faqItems = useMemo(() => (supplier ? buildFaqItems(supplier) : []), [supplier]);

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
    document.title = `${supplier.companyName} · YORSO`;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: supplier.shortDescription,
    });
    return () => {
      document.title = prev;
    };
  }, [supplier]);

  // FAQPage JSON-LD для SEO
  useEffect(() => {
    if (!supplier || typeof document === "undefined" || faqItems.length === 0) return;
    const id = `faq-jsonld-${supplier.id}`;
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
    return () => {
      script?.remove();
    };
  }, [supplier, faqItems]);

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Поставщик не найден
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Возможно, ссылка устарела. Вернитесь в{" "}
            <Link to="/suppliers" className="text-primary underline">
              каталог поставщиков
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
      toast({ title: "Smart-ссылка скопирована" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
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
                Главная
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <Link to="/suppliers" className="hover:text-foreground">
                Поставщики
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground">{supplier.companyName}</span>
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
                <SupplierLogoCard supplier={supplier} size={86} priority="hero" />

                <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {supplier.companyName}
                </h1>

                <p className="mt-2 text-sm text-foreground/80">
                  {supplierTypeLabel(supplier.supplierType)} ·{" "}
                  {supplier.yearsInBusiness} лет на рынке ·{" "}
                  {supplier.activeOffersCount} активных офферов
                </p>
              </div>

              <div className="flex shrink-0 md:mt-16 md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Копировать smart-link
                </Button>
              </div>
            </div>

            <div className="max-w-3xl">

              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>В бизнесе с {supplier.inBusinessSinceYear}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>
                    {supplier.country}, {supplier.city}{" "}
                    <span aria-hidden>{countryCodeToFlag(supplier.countryCode)}</span>
                  </span>
                </li>
                {supplier.website && (
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

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() =>
                    toast({
                      title: "Сообщение поставщику",
                      description: "Запрос подготовлен. Менеджер свяжется с вами.",
                    })
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                  ОТПРАВИТЬ СООБЩЕНИЕ
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
              <SupplierLogoCard supplier={supplier} size={28} />
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-foreground">
                  {supplier.companyName}
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
              Smart-link
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <section className="border-t border-border bg-background">
          <div className="container py-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-cool-gray/60 p-1">
                <TabsTrigger value="about" className={tabTriggerCls}>
                  О поставщике
                </TabsTrigger>
                <TabsTrigger value="catalog" className={tabTriggerCls}>
                  Каталог ({supplierOffers.length})
                </TabsTrigger>
                <TabsTrigger value="passport" className={tabTriggerCls}>
                  Производственный паспорт
                </TabsTrigger>
                <TabsTrigger value="cases" className={tabTriggerCls}>
                  Отчёты о погрузке и кейсы
                </TabsTrigger>
                <TabsTrigger value="faq" className={tabTriggerCls}>
                  FAQ
                </TabsTrigger>
              </TabsList>

              {/* === 1. О поставщике === */}
              <TabsContent value="about" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-heading text-lg font-semibold text-foreground">
                        О компании
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                        {supplier.about}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" aria-hidden />
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                          Продуктовый фокус
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
                    <LegalDetailsBlock supplier={supplier} />

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          Основания надёжности
                        </h3>
                      </div>
                      <div className="mt-3">
                        <TrustFactsBlock supplier={supplier} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          География поставок
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
                        Каталог пока не опубликован.
                      </p>
                    )}
                  </div>

                  <aside className="space-y-4 lg:sticky lg:top-24">
                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-sm font-semibold text-foreground">
                          Основания надёжности
                        </h3>
                      </div>
                      <div className="mt-3">
                        <TrustFactsBlock supplier={supplier} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-sm font-semibold text-foreground">
                          Сертификаты
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
                          Страны доставки
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
                    aria-label="Разделы производственного паспорта"
                    className="sticky top-16 z-10 -mx-1 flex flex-wrap gap-2 rounded-xl border border-border bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
                  >
                    <a
                      href="#passport-certs"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      <Award className="h-3.5 w-3.5 text-primary" aria-hidden />
                      Сертификаты и аудиты
                    </a>
                    <a
                      href="#passport-production"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      <Factory className="h-3.5 w-3.5 text-primary" aria-hidden />
                      Производство и мощности
                    </a>
                    <a
                      href="#passport-logistics"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      <Truck className="h-3.5 w-3.5 text-primary" aria-hidden />
                      Логистика и условия поставки
                    </a>
                  </nav>

                  {/* --- 3.1 Сертификаты и аудиты --- */}
                  <section id="passport-certs" className="scroll-mt-32">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" aria-hidden />
                        <h2 className="font-heading text-lg font-semibold text-foreground">
                          Сертификаты и аудиты
                        </h2>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Подтверждённые отраслевые сертификации и аудиты. Подлинники
                        и сроки действия передаются под NDA после запроса доступа.
                      </p>
                      <div className="mt-5">
                        <CertificationsBlock supplier={supplier} size="lg" />
                      </div>
                      <p className="mt-4 text-[11px] text-muted-foreground">
                        Логотипы сертификаций — товарные знаки правообладателей,
                        используются для обозначения программ.
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
                                Производственные мощности
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell
                                label="Суточная переработка"
                                value={`${production.dailyTons} т / сутки`}
                                estimate
                              />
                              <FactCell
                                label="Производственных линий"
                                value={String(production.lines)}
                              />
                              <FactCell
                                label="Сотрудников на производстве"
                                value={`около ${production.staff}`}
                                estimate
                              />
                              <FactCell
                                label="Каталог продукции"
                                value={`${supplier.totalProductsCount} SKU`}
                              />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Snowflake className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                Холод и заморозка
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell
                                label="Холодильные склады"
                                value={`${production.coldStorageT} т единовременного хранения`}
                                estimate
                              />
                              <FactCell
                                label="Шоковая заморозка"
                                value={`${production.blastFreezerT} т / сутки`}
                                estimate
                              />
                              <FactCell label="Температурный режим" value="−18 °C … −24 °C" />
                              <FactCell label="Глазурь" value="контроль 5–12% по запросу" />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                Форматы продукции
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
                                Контроль качества
                              </h3>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                              <li>• Внутренняя QC по чек-листу на каждую партию</li>
                              <li>• Лабораторные тесты: микробиология, гистамин, тяжёлые металлы</li>
                              <li>• Фото-отчёт о погрузке в стандарте</li>
                              <li>• Независимый сюрвей (SGS / Bureau Veritas) — по запросу</li>
                            </ul>
                          </div>

                          <p className="text-[11px] text-muted-foreground">
                            Часть показателей — оценочные (estimate), уточняются при запросе доступа.
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
                                Условия поставки
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell
                                label="Incoterms"
                                value={logistics.incoterms.join(" · ")}
                              />
                              <FactCell
                                label="Минимальная партия"
                                value={`от ${logistics.minBatchTons} т / SKU`}
                              />
                              <FactCell
                                label="Транзит до основных портов"
                                value={`${logistics.transitDaysMin}–${logistics.transitDaysMax} дней`}
                                estimate
                              />
                              <FactCell label="Тип контейнеров" value={logistics.containers.join(", ")} />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                Температурный режим и сохранность
                              </h2>
                            </div>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                              <FactCell label="Температура в reefer" value={logistics.tempRange} />
                              <FactCell label="Термописец" value="устанавливается на каждую партию" />
                              <FactCell label="Пломбирование" value="по протоколу, фото пломбы" />
                              <FactCell label="Страхование груза" value="CIF: ICC (A), 110% инвойса" />
                            </dl>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <FileCheck2 className="h-5 w-5 text-primary" aria-hidden />
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                Документы на партию
                              </h2>
                            </div>
                            <ul className="mt-3 grid gap-1.5 text-sm text-foreground/80 sm:grid-cols-2">
                              <li>• Health Certificate</li>
                              <li>• Certificate of Origin (EUR.1 при наличии)</li>
                              <li>• Certificate of Analysis</li>
                              <li>• Упаковочный лист</li>
                              <li>• Bill of Lading / CMR</li>
                              <li>• Halal / Kosher — по запросу</li>
                            </ul>
                          </div>
                        </div>

                        <aside className="space-y-6">
                          <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-primary" aria-hidden />
                              <h3 className="font-heading text-base font-semibold text-foreground">
                                География поставок
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
                                Сроки готовности
                              </h3>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                              <li>• Со склада: 3–7 дней после оплаты</li>
                              <li>• Под заказ: 2–4 недели <span className="text-[10px] uppercase text-muted-foreground">est.</span></li>
                              <li>• Сезонные позиции: по графику добычи</li>
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
                        Отчёты о погрузке и реальные кейсы
                      </h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                      Каждый поставщик YORSO предоставляет фото-отчёт о погрузке партии:
                      загрузка контейнера, установка термописца, опломбирование,
                      сопроводительные документы. Имена покупателей скрыты по NDA,
                      все верифицируемые детали (порт, объём, Incoterms, дата) — указаны.
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
                              {c.title}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {c.date} · {c.destination} · {c.buyerType}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
                            {c.incoterm}
                          </span>
                        </header>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <FactCell label="Продукт" value={c.product} />
                          <FactCell label="Объём партии" value={c.volume} />
                          <FactCell label="Базис" value={c.incoterm} />
                        </dl>

                        <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                          {c.notes}
                        </p>

                        <div className="mt-5">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Фото-отчёт о погрузке
                          </h4>
                          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {c.photos.map((p, i) => (
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
                                  {p.caption}
                                </p>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-[11px] text-muted-foreground">
                            Полные фото-отчёты в исходном разрешении передаются
                            квалифицированным покупателям после запроса доступа.
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
                          Частые вопросы покупателей
                        </h2>
                      </div>
                      <Accordion type="single" collapsible className="mt-3">
                        {faqItems.map((f, i) => (
                          <AccordionItem key={i} value={`q-${i}`}>
                            <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
                              {f.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm leading-relaxed text-foreground/80">
                              {f.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        Не нашли ответ?
                      </h3>
                      <p className="mt-2 text-sm text-foreground/80">
                        Отправьте сообщение поставщику — менеджер ответит в рабочее время.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() =>
                          toast({
                            title: "Сообщение поставщику",
                            description: "Запрос подготовлен. Менеджер свяжется с вами.",
                          })
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                        Написать поставщику
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

/** Унифицированная ячейка факта с опциональной estimate-меткой. */
const FactCell = ({
  label,
  value,
  estimate,
}: {
  label: string;
  value: string;
  estimate?: boolean;
}) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium text-foreground">
      {value}
      {estimate && (
        <span className="ml-1 align-middle text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
          est.
        </span>
      )}
    </dd>
  </div>
);

export default SupplierProfile;
