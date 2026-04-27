import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildCatalogReturnState } from "@/lib/return-to-catalog";
import { Truck, TrendingUp, TrendingDown, Minus, Lock, ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
import type { SeafoodOffer } from "@/data/mockOffers";
import { getPriceTrend } from "@/data/mockIntelligence";
import { cn } from "@/lib/utils";
import { useAccessRequestPending } from "@/lib/catalog-requests";
import AccessRequestDialog from "@/components/catalog/AccessRequestDialog";

interface Props {
  offer: SeafoodOffer;
  isSelected: boolean;
  onSelect: (offerId: string) => void;
  forceLevel?: AccessLevel;
  isHighlighted?: boolean;
}

/**
 * Mobile-only offer card.
 *
 * Vertical info order (per product spec):
 *  1. Photo on top, with a 10% peek of the next photo if there are 2+ images.
 *  2. Price first (indicative if locked, exact if unlocked) + trend icon.
 *  3. Product name + Latin name underneath.
 *  4. Delivery basis.
 *  5. Supplier — blurred when price is locked, only country flag stays visible.
 *
 * The rest of the offer detail lives on /offers/:id.
 */
const MobileOfferCard = ({ offer, isSelected, onSelect, forceLevel, isHighlighted }: Props) => {
  const { t, lang } = useLanguage();
  const { level: ctxLevel } = useAccessLevel();
  const level = forceLevel ?? ctxLevel;
  const unlocked = level === "qualified_unlocked";
  const accessPending = useAccessRequestPending();
  const [dialogOpen, setDialogOpen] = useState(false);

  const images = offer.images && offer.images.length > 0 ? offer.images : [offer.image];
  const hasMultiple = images.length > 1;

  // Horizontal scroll/snap gallery — peeks next image so the user sees
  // there is more than one. We track active index for the dots indicator.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Detect orientation of every image so the gallery picks one container
  // aspect ratio that fits ALL slides without cropping or letterboxing
  // surprises:
  //  - all landscape/square → 4:3 (default product look)
  //  - all portrait         → 4:5 (Instagram-like)
  //  - mixed in same offer  → 4:5 + object-contain on portrait slides,
  //    so a vertical photo is shown fully and a horizontal one stays
  //    centered with soft padding (no awkward crops).
  type Orient = "landscape" | "portrait";
  const [orients, setOrients] = useState<Record<number, Orient>>({});
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const handleImgLoad = (i: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setLoaded((prev) => (prev[i] ? prev : { ...prev, [i]: true }));
    if (!img.naturalWidth || !img.naturalHeight) return;
    const o: Orient = img.naturalHeight > img.naturalWidth ? "portrait" : "landscape";
    setOrients((prev) => (prev[i] === o ? prev : { ...prev, [i]: o }));
  };
  const orientValues = Object.values(orients);
  const hasPortrait = orientValues.includes("portrait");
  const hasLandscape = orientValues.includes("landscape");
  const isMixed = hasPortrait && hasLandscape;
  const firstLoaded = loaded[0] === true;
  // Until the first image reports its natural size we use 4:5 — it fits both
  // landscape and portrait without cropping, so the card height never jumps
  // when orientation finally resolves. After detection we may relax to 4:3
  // for galleries that turn out to be all-landscape.
  const aspectClass = !firstLoaded || hasPortrait ? "aspect-[4/5]" : "aspect-[4/3]";

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !hasMultiple) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Each slide is ~85% of scroller width + 8px gap; pick the slide
        // closest to the left edge.
        const slideWidth = el.clientWidth * 0.85 + 8;
        const idx = Math.round(el.scrollLeft / slideWidth);
        setActiveIdx(Math.max(0, Math.min(images.length - 1, idx)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [hasMultiple, images.length]);

  const trend = getPriceTrend(offer.category);
  const TrendIcon = trend
    ? trend.d30.dir === "up"
      ? TrendingUp
      : trend.d30.dir === "down"
        ? TrendingDown
        : Minus
    : null;
  const trendColor = trend
    ? trend.d30.dir === "up"
      ? "text-primary"
      : trend.d30.dir === "down"
        ? "text-destructive"
        : "text-muted-foreground"
    : "";

  // Price rendering.
  const hasNumeric = typeof offer.priceMin === "number" && typeof offer.priceMax === "number";
  const range = hasNumeric
    ? formatPriceRange(offer.priceMin!, offer.priceMax!, lang, offer.currency ?? "USD")
    : offer.priceRange;
  const unit = offer.priceUnitKey ? t[offer.priceUnitKey] : t.card_perKg;
  const exact = unlocked && hasNumeric
    ? `${offer.currency ?? "USD"} ${((offer.priceMin! + offer.priceMax!) / 2).toFixed(2)}`
    : null;

  const basisOptions = offer.deliveryBasisOptions ?? [];
  const primaryBasis = basisOptions[0];

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
      onClick={handleCardClick}
      className={cn(
        "group relative flex w-full min-w-0 max-w-full cursor-pointer flex-col gap-3 overflow-hidden rounded-lg border bg-card shadow-sm transition-colors",
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-border",
        isHighlighted && "animate-pulse-once ring-2 ring-primary/60 border-primary",
      )}
    >
      {/* 1. Photo with peek-of-next */}
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ touchAction: "pan-x pan-y" }}
        >
          {images.map((src, i) => {
            // In a mixed-orientation gallery we use 4:5 container + contain
            // so neither orientation gets cropped. In a uniform gallery we
            // keep cover for an edge-to-edge product look.
            const fitClass = isMixed ? "object-contain" : "object-cover";
            const isLoaded = loaded[i] === true;
            return (
              <div
                key={i}
                className={cn(
                  "relative shrink-0 snap-start bg-muted",
                  aspectClass,
                  hasMultiple ? "w-[85%] mr-2 first:ml-0 rounded-md overflow-hidden" : "w-full",
                )}
              >
                {/* Skeleton placeholder — visible until this slide's image
                    has actually loaded. Keeps the gallery height + peek
                    stable while orientation is being detected. */}
                {!isLoaded && (
                  <div
                    aria-hidden
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/70 to-muted"
                  />
                )}
                <img
                  src={src}
                  alt={offer.productName}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  onLoad={handleImgLoad(i)}
                  className={cn(
                    "h-full w-full transition-opacity duration-200",
                    fitClass,
                    isLoaded ? "opacity-100" : "opacity-0",
                  )}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = "/placeholder.svg";
                    setLoaded((prev) => ({ ...prev, [i]: true }));
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Origin badge */}
        <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
          <span aria-hidden>{offer.originFlag}</span>
          {offer.origin}
        </div>

        {hasMultiple && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === activeIdx ? "bg-foreground" : "bg-background/70",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3 px-4 pb-4">
        {/* 2. Price first, with trend */}
        <div className="flex items-baseline gap-2">
          {exact ? (
            <span className="font-heading text-lg font-bold text-foreground">
              {exact}
            </span>
          ) : (
            <span className="font-heading text-lg font-bold text-foreground">{range}</span>
          )}
          <span className="text-xs text-muted-foreground">{unit}</span>
          {TrendIcon && trend && (
            <span className={cn("ml-auto inline-flex items-center gap-0.5 text-xs font-semibold", trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden />
              {trend.d30.pct > 0 ? "+" : ""}
              {trend.d30.pct.toFixed(1)}%
            </span>
          )}
        </div>

        {/* 3. Product name + Latin name */}
        <div>
          <Link
            to={`/offers/${offer.id}`}
            state={buildCatalogReturnState(offer.id)}
            onClick={(e) => e.stopPropagation()}
            data-testid="catalog-row-view-details"
            className="block"
          >
            <h3 className="font-heading text-base font-semibold leading-tight text-foreground line-clamp-2 break-words hover:text-link-hover">
              {offer.productName}
            </h3>
          </Link>
          {offer.latinName && (
            <p className="mt-0.5 text-xs italic text-muted-foreground line-clamp-1">
              {offer.latinName}
            </p>
          )}
        </div>

        {/* 4. Delivery basis */}
        {primaryBasis && (
          <div className="flex items-center gap-1.5 text-xs text-foreground">
            <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-semibold">{primaryBasis.code}</span>
            <span className="truncate text-muted-foreground">
              {primaryBasis.shipmentPort?.split(",")[0]} · {primaryBasis.leadTime}
            </span>
          </div>
        )}

        {/* 5. Supplier — blurred name when locked, flag visible always */}
        <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs">
          <span aria-hidden className="text-base leading-none">
            {offer.supplier.countryFlag}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              data-testid="catalog-row-supplier-name"
              aria-hidden={!unlocked}
              className={cn(
                "truncate font-semibold text-foreground",
                !unlocked && "blur-[5px] select-none pointer-events-none",
              )}
            >
              {offer.supplier.name}
            </span>
            <span className="text-muted-foreground">{offer.supplier.country}</span>
          </div>
          {!unlocked && (
            <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </div>

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
    </article>
  );
};

export default MobileOfferCard;
