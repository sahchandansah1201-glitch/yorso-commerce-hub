import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildCatalogReturnState } from "@/lib/return-to-catalog";
import {
  Lock,
  Truck,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  FileCheck2,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
import { normalizeMoq, summarizeMoqRange } from "@/lib/moq";
import type { SeafoodOffer } from "@/data/mockOffers";
import CertificationBadges from "@/components/CertificationBadges";
import { getPriceTrend, countryNews } from "@/data/mockIntelligence";
import { cn } from "@/lib/utils";
import { useAccessRequestPending } from "@/lib/catalog-requests";
import AccessRequestDialog from "@/components/catalog/AccessRequestDialog";

/**
 * Renders the price unit (e.g. "$/kg") with a tooltip explaining how the
 * per-unit price is calculated. See CatalogOfferCard for the full rationale.
 */
const PriceUnit = ({ unit }: { unit: string }) => {
  const { t } = useLanguage();
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            aria-label={`${unit} — ${t.priceUnit_tooltip}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {unit}
            <Info className="h-3 w-3 opacity-60" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
          {t.priceUnit_tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface Props {
  offer: SeafoodOffer;
  isSelected: boolean;
  onSelect: (offerId: string) => void;
  forceLevel?: AccessLevel;
  isHighlighted?: boolean;
}

/**
 * Compact deal-terms strip (Incoterm + payment) rendered under the
 * certifications block. Keeps commercial context close to product identity
 * while freeing the right column for price/MOQ/access scanning.
 */
const DealTermsStrip = ({ offer }: { offer: SeafoodOffer }) => {
  const { t } = useLanguage();
  const basisOptions = offer.deliveryBasisOptions ?? [];
  const primaryBasis = basisOptions[0];
  const altBasisCount = Math.max(0, basisOptions.length - 1);

  return (
    <div className="space-y-2 text-xs leading-snug">
      <div className="flex items-start gap-1.5">
        <Truck className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 text-foreground">
          {primaryBasis ? (
            <>
              <span className="font-semibold">{primaryBasis.code}</span>{" "}
              <span className="text-muted-foreground">
                {primaryBasis.shipmentPort?.split(",")[0]} · {primaryBasis.leadTime}
              </span>
              {altBasisCount > 0 && (
                <span className="ml-1 text-muted-foreground">
                  (+{altBasisCount} {t.catalog_row_basisAltSuffix})
                </span>
              )}
            </>
          ) : (
            <>
              <span className="font-semibold">{offer.commercial.incoterm}</span>{" "}
              <span className="text-muted-foreground">
                {offer.commercial.shipmentPort?.split(",")[0] ?? "—"}
              </span>
            </>
          )}
        </p>
      </div>
      <div className="flex items-start gap-1.5">
        <CreditCard className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 text-foreground">{offer.commercial.paymentTerms}</p>
      </div>
    </div>
  );
};

const SupplierLine = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  if (level === "qualified_unlocked") {
    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="font-semibold text-foreground">{offer.supplier.name}</span>
        <span className="text-muted-foreground">
          {offer.supplier.countryFlag} {offer.supplier.country}
        </span>
      </div>
    );
  }
  // Supplier-locked text was merged into the price-access message to avoid
  // duplicating the same access rule twice in one card. Here we keep only a
  // minimal visual cue (lock + country) so the row still communicates that
  // supplier identity is gated, without repeating the full sentence.
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="h-3 w-3 shrink-0" aria-hidden />
      <span>
        {offer.supplier.countryFlag} {offer.supplier.country}
      </span>
    </div>
  );
};

const PhotoGallery = ({ offer }: { offer: SeafoodOffer }) => {
  const { t } = useLanguage();
  const images =
    offer.images && offer.images.length > 0 ? offer.images : [offer.image];
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const hasMultiple = total > 1;

  const go = (delta: number) => (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIdx((prev) => (prev + delta + total) % total);
  };

  /*
   * Touch swipe support.
   *
   * Goal: horizontal swipe across the photo navigates between images,
   * but a vertical drag must keep scrolling the page — never hijack it.
   *
   * Approach:
   *   - On touchstart, record (x, y, time) and reset direction lock.
   *   - On the first significant touchmove, decide direction:
   *       * |dx| dominant AND > THRESHOLD_DETECT  → lock "h", call
   *         preventDefault on every subsequent move so the browser
   *         doesn't also try to scroll horizontally / trigger page swipe.
   *       * otherwise → lock "v" and do nothing; the page keeps scrolling.
   *   - On touchend, if locked "h" and |dx| > THRESHOLD_COMMIT (or it was
   *     a fast flick), advance/retreat one image.
   *
   * touch-action: pan-y on the container tells the browser our element
   * accepts vertical pans by default and only horizontal gestures are
   * interactive — this makes Safari/Chrome give up the vertical axis to
   * the page immediately, no fighting.
   *
   * preventDefault inside touchmove only works on a non-passive listener,
   * so we attach via addEventListener({ passive: false }) in useEffect
   * instead of using React's onTouchMove (which is passive).
   */
  const containerRef = useRef<HTMLDivElement>(null);
  const touchState = useRef<{
    x: number;
    y: number;
    t: number;
    lock: "none" | "h" | "v";
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasMultiple) return;

    const THRESHOLD_DETECT = 8; // px before we decide direction
    const THRESHOLD_COMMIT = 40; // px to count as a swipe
    const FLICK_MS = 250;
    const FLICK_DIST = 20;

    const onStart = (e: TouchEvent) => {
      const tt = e.touches[0];
      if (!tt) return;
      touchState.current = { x: tt.clientX, y: tt.clientY, t: Date.now(), lock: "none" };
    };

    const onMove = (e: TouchEvent) => {
      const s = touchState.current;
      const tt = e.touches[0];
      if (!s || !tt) return;
      const dx = tt.clientX - s.x;
      const dy = tt.clientY - s.y;

      if (s.lock === "none") {
        if (Math.abs(dx) < THRESHOLD_DETECT && Math.abs(dy) < THRESHOLD_DETECT) return;
        // Decide direction. Require horizontal to clearly dominate
        // (1.2x) so a slightly diagonal scroll still goes to the page.
        if (Math.abs(dx) > Math.abs(dy) * 1.2) {
          s.lock = "h";
        } else {
          s.lock = "v";
        }
      }

      if (s.lock === "h") {
        // Stop the browser from also scrolling horizontally and stop
        // ancestor handlers (e.g. row click).
        e.preventDefault();
      }
      // s.lock === "v" → do nothing, page scroll continues naturally.
    };

    const onEnd = (e: TouchEvent) => {
      const s = touchState.current;
      touchState.current = null;
      if (!s || s.lock !== "h") return;
      const tt = e.changedTouches[0];
      if (!tt) return;
      const dx = tt.clientX - s.x;
      const dt = Date.now() - s.t;
      const isFlick = dt < FLICK_MS && Math.abs(dx) > FLICK_DIST;
      if (Math.abs(dx) > THRESHOLD_COMMIT || isFlick) {
        // Swipe left (dx < 0) → next image, swipe right → previous.
        setIdx((prev) => (prev + (dx < 0 ? 1 : -1) + total) % total);
      }
    };

    const onCancel = () => {
      touchState.current = null;
    };

    // passive:false on touchmove is required for preventDefault to take effect.
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [hasMultiple, total]);

  return (
    <div
      ref={containerRef}
      data-testid="catalog-row-photo"
      // touch-action: pan-y → browser owns the vertical axis (page scroll
      // stays buttery). We only intercept horizontal gestures via the JS
      // handlers above. Without this, mobile Safari sometimes pre-empts
      // the gesture before our touchmove fires.
      style={{ touchAction: "pan-y" }}
      className="relative aspect-[4/3] sm:aspect-[4/3] lg:aspect-square xl:aspect-[5/4] xl:max-h-[260px] overflow-hidden rounded-md bg-muted select-none"
    >
      <img
        src={images[idx]}
        alt={offer.productName}
        loading="lazy"
        draggable={false}
        className="h-full w-full object-cover pointer-events-none"
        onError={(e) => {
          const target = e.currentTarget;
          target.onerror = null;
          target.src = "/placeholder.svg";
        }}
      />
      <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
        <span aria-hidden>{offer.originFlag}</span>
        {offer.origin}
      </div>
      {hasMultiple && (
        <>
          {/*
            Большие невидимые hit-зоны на левой и правой половине фото —
            покупатель листает «куда смотрит», а не «куда метится». Шевроны
            остаются как визуальные подсказки внутри зон и появляются на
            hover/focus. На тач-устройствах работает свайп (см. useEffect
            выше), а тап по половине = переключение.
          */}
          <button
            type="button"
            onClick={go(-1)}
            aria-label={t.aria_imgPrev}
            data-testid="catalog-row-img-prev"
            className="group/nav absolute inset-y-0 left-0 z-10 flex w-1/2 items-center justify-start pl-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={go(1)}
            aria-label={t.aria_imgNext}
            data-testid="catalog-row-img-next"
            className="group/nav absolute inset-y-0 right-0 z-10 flex w-1/2 items-center justify-end pr-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 group-hover/nav:opacity-100 group-focus-within/nav:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
          <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === idx ? "bg-foreground" : "bg-background/70",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const PriceBlock = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  const { t, lang } = useLanguage();
  const accessPending = useAccessRequestPending();
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasNumeric = typeof offer.priceMin === "number" && typeof offer.priceMax === "number";
  const range = hasNumeric
    ? formatPriceRange(offer.priceMin!, offer.priceMax!, lang, offer.currency ?? "USD")
    : offer.priceRange;
  const unit = offer.priceUnitKey ? t[offer.priceUnitKey] : t.card_perKg;

  // Deal terms surfaced directly under price: in B2B procurement, Incoterm
  // and payment terms are part of the same commercial decision as the price.
  const basisOptions = offer.deliveryBasisOptions ?? [];
  const primaryBasis = basisOptions[0];
  const altBasisCount = Math.max(0, basisOptions.length - 1);

  const volumeBreaks = offer.volumeBreaks ?? [];
  const hasVolumeBreaks = volumeBreaks.length > 0;
  // First volume break is the minimum order quantity tier — surface it next to
  // the price so buyers see "from-to + MOQ" together. Remaining tiers stay in
  // the secondary "volume pricing" list below.
  const primaryMoqRaw = hasVolumeBreaks ? volumeBreaks[0].minQty : offer.moq;
  const primaryMoq = normalizeMoq(primaryMoqRaw, lang).display;
  const additionalBreaks = volumeBreaks.slice(1);
  const hasAdditionalBreaks = additionalBreaks.length > 0;

  const MoqLine = (
    <p className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{t.offers_moqLabel}:</span>{" "}
      <span className="whitespace-nowrap font-semibold text-foreground tabular-nums">
        {primaryMoq}
      </span>
    </p>
  );

  if (level === "qualified_unlocked" && hasNumeric) {
    const exact = ((offer.priceMin! + offer.priceMax!) / 2).toFixed(2);
    return (
      <div data-testid="catalog-row-price" className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-[17px] font-bold text-foreground">
            {offer.currency ?? "USD"} {exact}
          </span>
          <PriceUnit unit={unit} />
        </div>
        {MoqLine}
        {hasAdditionalBreaks && (
          <ul
            dir="ltr"
            data-testid="catalog-row-volume-tiers"
            className="mt-1 max-w-[260px] space-y-0.5 text-xs"
          >
            {additionalBreaks.map((vb, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight tabular-nums"
              >
                <span className="whitespace-nowrap font-semibold text-foreground">
                  {vb.priceRange}
                </span>
                <span aria-hidden className="text-muted-foreground/60">·</span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {normalizeMoq(vb.minQty, lang).display}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Combined price + supplier locked message — supplier visibility follows
  // price access, so showing the rule once near the price avoids duplication.
  const accessMsg =
    level === "registered_locked"
      ? t.catalog_row_priceSupplierLocked_reg
      : t.catalog_row_priceSupplierLocked_anon;

  // Surface a summarized MOQ range so locked-price buyers can still gauge
  // minimum order scale (e.g. "1,000 – 20,000+ kg") without registration.
  const moqSummary = summarizeMoqRange(
    hasVolumeBreaks ? volumeBreaks.map((vb) => vb.minQty) : [offer.moq],
    lang,
  );

  return (
    <div data-testid="catalog-row-price" className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-[17px] font-bold text-foreground">{range}</span>
        <PriceUnit unit={unit} />
      </div>
      {hasVolumeBreaks && moqSummary ? (
        <p className="text-xs text-muted-foreground" data-testid="catalog-row-moq-summary">
          <span className="font-medium text-foreground">{t.offers_moqLabel}:</span>{" "}
          <span className="whitespace-nowrap font-semibold text-foreground tabular-nums">
            {moqSummary}
          </span>
        </p>
      ) : (
        MoqLine
      )}
      {hasAdditionalBreaks && (
        <ul
          dir="ltr"
          data-testid="catalog-row-volume-tiers"
          className="max-w-[260px] space-y-0.5 text-xs"
        >
          {additionalBreaks.map((vb, i) => (
            <li
              key={i}
              className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-tight tabular-nums"
            >
              <span
                className={cn(
                  "whitespace-nowrap font-semibold",
                  level === "qualified_unlocked"
                    ? "text-foreground"
                    : "text-muted-foreground blur-[3px] select-none",
                )}
                aria-hidden={level !== "qualified_unlocked"}
              >
                {vb.priceRange}
              </span>
              <span aria-hidden className="text-muted-foreground/60">·</span>
              <span className="whitespace-nowrap text-muted-foreground">
                {normalizeMoq(vb.minQty, lang).display}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="flex items-start gap-1 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        <span className="min-w-0 break-words">{accessMsg}</span>
      </p>
      {level === "registered_locked" && (
        <>
          <button
            type="button"
            disabled={accessPending}
            onClick={(e) => {
              e.stopPropagation();
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-1 self-start text-xs font-semibold text-link-hover hover:underline disabled:text-muted-foreground disabled:no-underline"
            data-testid="catalog-row-request-access"
          >
            {accessPending ? (
              <>
                <Check className="h-3 w-3" />
                {t.catalog_row_priceCta_reg_sent}
              </>
            ) : (
              <>
                {t.catalog_row_priceCta_reg}
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
          <AccessRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
      )}
    </div>
  );
};

const dirIcon = (dir: "up" | "down" | "flat") => {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-primary" aria-hidden />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-destructive" aria-hidden />;
  return <Minus className="h-3 w-3 text-muted-foreground" aria-hidden />;
};

export const CatalogOfferRow = ({ offer, isSelected, onSelect, forceLevel, isHighlighted }: Props) => {
  const { t } = useLanguage();
  const { level: ctxLevel } = useAccessLevel();
  const level = forceLevel ?? ctxLevel;

  const trend = getPriceTrend(offer.category);
  const offerCountries = new Set([offer.origin, offer.supplier.country]);
  const newsCount = countryNews.filter((n) => offerCountries.has(n.countryName)).length;
  const docsReady = (offer.certifications?.length ?? 0) >= 2;

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    onSelect(offer.id);
  };

  return (
    <article
      data-testid="catalog-offer-row"
      data-offer-id={offer.id}
      data-access-level={level}
      data-selected={isSelected ? "true" : "false"}
      onClick={handleRowClick}
      className={cn(
        "group relative grid cursor-pointer gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors",
        // Mobile (<640): single column, everything stacks.
        "grid-cols-1",
        // Tablet (640–1023): image gets a fluid 160–200px column, content
        // takes the rest. Price/supplier wraps full-width via col-span-2.
        "sm:grid-cols-[minmax(160px,200px)_minmax(0,1fr)] sm:gap-5 sm:p-5",
        // Desktop (1024–1279): three columns. Price column needs a generous
        // min-width so "Цена и поставщик — после регистрации" stays on ≤2
        // lines and exact prices don't wrap mid-number.
        "lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(240px,260px)] lg:gap-6 lg:p-6",
        // XL (≥1280): give the image more room and widen the content column
        // so long product names breathe instead of clamping.
        "xl:grid-cols-[300px_minmax(0,1.61fr)_minmax(260px,290px)] xl:gap-8",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40",
        isHighlighted && "animate-pulse-once ring-2 ring-primary/60 border-primary",
      )}
    >
      {/* 1. Media */}
      <PhotoGallery offer={offer} />

      {/* 2. Product identity */}
      <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
        <div>
          <Link
            to={`/offers/${offer.id}`}
            state={buildCatalogReturnState(offer.id)}
            onClick={(e) => e.stopPropagation()}
            data-testid="catalog-row-view-details"
            className="block"
          >
            <h3 className="font-heading text-[17px] font-semibold leading-tight text-foreground line-clamp-3 sm:line-clamp-2 break-words transition-colors hover:text-link-hover hover:underline underline-offset-2 decoration-link-hover/60">
              {offer.productName}
            </h3>
          </Link>
          <p className="mt-1.5 text-xs italic text-muted-foreground line-clamp-1">
            {offer.latinName} · {offer.format} · {offer.cutType.split(",")[0]}
          </p>
        </div>

        <CertificationBadges certifications={offer.certifications ?? []} limit={3} />

        <div className="border-t border-border/60 pt-3 lg:pt-4">
          <DealTermsStrip offer={offer} />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 lg:pt-4 text-xs text-muted-foreground">
          {trend && (
            <span className="inline-flex items-center gap-1">
              {dirIcon(trend.d30.dir)}
              <span className="font-semibold text-foreground">
                {trend.d30.pct > 0 ? "+" : ""}
                {trend.d30.pct.toFixed(1)}%
              </span>
              <span className="uppercase tracking-wide">{t.catalog_intel_priceTrend_d30}</span>
            </span>
          )}
          {newsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Newspaper className="h-3 w-3" aria-hidden />
              <span className="font-semibold text-foreground">{newsCount}</span>
              <span>{t.catalog_row_signal_news}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <FileCheck2
              className={cn("h-3 w-3", docsReady ? "text-primary" : "text-muted-foreground")}
              aria-hidden
            />
            {docsReady ? t.catalog_row_signal_docsReady : t.catalog_row_signal_docsPending}
          </span>
        </div>
      </div>

      {/* 3. Price + supplier/access. Below lg this block sits full-width
          under the identity column; from lg+ it becomes the third column. */}
      <div className="flex flex-col items-stretch gap-4 border-t border-border pt-4 lg:gap-5 lg:border-t-0 lg:pt-0 sm:col-span-2 lg:col-span-1">
        <PriceBlock offer={offer} level={level} />
        <div className="border-t border-border pt-3 lg:pt-4">
          <SupplierLine offer={offer} level={level} />
        </div>
      </div>
    </article>
  );
};

export default CatalogOfferRow;
