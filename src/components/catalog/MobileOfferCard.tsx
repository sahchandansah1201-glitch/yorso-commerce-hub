import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildCatalogReturnState } from "@/lib/return-to-catalog";
import { Truck, TrendingUp, TrendingDown, Minus, Lock, ArrowRight, Check, Maximize2, BarChart3, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
import type { SeafoodOffer } from "@/data/mockOffers";
import { getPriceTrend } from "@/data/mockIntelligence";
import { cn } from "@/lib/utils";
import { useAccessRequestPending } from "@/lib/catalog-requests";
import AccessRequestDialog from "@/components/catalog/AccessRequestDialog";
import OfferAnalyticsPanel from "@/components/catalog/OfferAnalyticsPanel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Peek profile presets — control how much of the next photo stays visible
 * after a snap, broken down by container width breakpoint.
 *
 * Use this prop to quickly switch the visual rhythm for different card
 * types or A/B experiments without touching the gallery internals.
 *
 *   profile      <360   360–479   480–639   ≥640    use case
 *   ─────────    ─────  ───────   ───────   ─────   ──────────────────────
 *   "tight"       6%      8%       10%      12%    info-dense rows, list view
 *   "default"     8%     10%       12%      14%    standard procurement card
 *   "loose"      10%     12%       14%      16%    hero / featured offers
 *   "showcase"   12%     14%       16%      18%    marketing-heavy cards
 */
export type PeekProfile = "tight" | "default" | "loose" | "showcase";

export type PeekBreakpoints = {
  /** container width < 360 px */
  xs: number;
  /** 360–479 px */
  sm: number;
  /** 480–639 px */
  md: number;
  /** ≥ 640 px */
  lg: number;
};

const PEEK_PROFILES: Record<PeekProfile, PeekBreakpoints> = {
  tight:    { xs: 0.06, sm: 0.08, md: 0.10, lg: 0.12 },
  default:  { xs: 0.08, sm: 0.10, md: 0.12, lg: 0.14 },
  loose:    { xs: 0.10, sm: 0.12, md: 0.14, lg: 0.16 },
  showcase: { xs: 0.12, sm: 0.14, md: 0.16, lg: 0.18 },
};

interface Props {
  offer: SeafoodOffer;
  isSelected: boolean;
  onSelect: (offerId: string) => void;
  forceLevel?: AccessLevel;
  isHighlighted?: boolean;
  /**
   * Named peek preset for the photo gallery. Defaults to "default".
   * Use {@link peekBreakpoints} for a fully custom curve.
   */
  peekProfile?: PeekProfile;
  /**
   * Custom peek-fraction-per-breakpoint. Overrides {@link peekProfile}.
   * Each value is a fraction in [0, 1) — e.g. 0.10 = 10% of the next slide
   * visible after snap.
   */
  peekBreakpoints?: Partial<PeekBreakpoints>;
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
const MobileOfferCard = ({
  offer,
  isSelected,
  onSelect,
  forceLevel,
  isHighlighted,
  peekProfile = "default",
  peekBreakpoints,
}: Props) => {
  const { t, lang } = useLanguage();
  const { level: ctxLevel } = useAccessLevel();
  const level = forceLevel ?? ctxLevel;
  const unlocked = level === "qualified_unlocked";
  const accessPending = useAccessRequestPending();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const images = offer.images && offer.images.length > 0 ? offer.images : [offer.image];
  const hasMultiple = images.length > 1;

  // Horizontal scroll/snap gallery — peeks next image so the user sees
  // there is more than one. We track active index for the dots indicator.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  // Mirror activeIdx in a ref so re-anchor / suppression logic can read the
  // latest value without re-creating effects on every swipe.
  const activeIdxRef = useRef(0);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);
  // True while we're programmatically scrolling to re-align after a width
  // change. Suppresses the scroll listener so dots can't flicker through
  // intermediate indexes during the snap fix-up.
  const suppressIdxRef = useRef(false);

  // Responsive peek: the % of the next photo that stays visible after a snap.
  // We tune it per *container* width (not viewport) so it stays correct when
  // the card lives in a narrower column. The goal is a constant visual rhythm
  // — the peek strip should feel like ~32–48px on every device, not a random
  // fraction of the screen.
  //
  //   container width   peek    rationale
  //   ─────────────     ────    ──────────────────────────────────────────
  //   < 360 px          8 %     keep the active photo dominant on tiny phones
  //   360–479 px        10 %    reference design (iPhone 12/13/14, Pixel 5)
  //   480–639 px        12 %    large phones / phablets / split tablet panes
  //   ≥ 640 px          14 %    tablet portrait, single-column wide layouts
  // `null` until we've measured the scroller. Using `null` (not `0`) is
  // important: a 0 would silently fall into the smallest breakpoint and
  // render with the wrong slide width on the very first paint, then jump
  // when the real width arrives. While `null`, we render a height-stable
  // placeholder (no slides) and skip snap math entirely.
  const [containerW, setContainerW] = useState<number | null>(null);

  // useLayoutEffect: measure synchronously after DOM mount, before paint.
  // This avoids a one-frame flash with the wrong slide width that a plain
  // useEffect would cause.
  //
  // Performance notes:
  //  - Coalesce ResizeObserver bursts via rAF: during a device rotation or
  //    a parent layout reflow the browser can fire many entries within a
  //    single frame; we only commit the *last* width per frame.
  //  - Drop sub-pixel jitter (<1px deltas) entirely — these can come from
  //    scrollbar gutter or zoom rounding and would otherwise re-render the
  //    whole card while the user is mid-scroll.
  //  - Use a functional updater so we can bail out of `setState` when the
  //    rounded width is unchanged, which lets React skip the render pass.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setContainerW(el.clientWidth || null);

    let rafId = 0;
    let pendingW = 0;
    const commit = () => {
      rafId = 0;
      const w = pendingW;
      if (w <= 0) return;
      setContainerW((prev) => {
        // Skip if unchanged or sub-pixel jitter — saves a render and all
        // downstream useMemo/useEffect work that depends on containerW.
        if (prev !== null && Math.abs(prev - w) < 1) return prev;
        return w;
      });
    };

    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? el.clientWidth);
      // Ignore intermediate 0-width reports (e.g. element temporarily
      // hidden in a collapsed parent) — keep the last good value so the
      // gallery doesn't collapse and re-expand.
      if (w <= 0) return;
      pendingW = w;
      if (rafId === 0) rafId = requestAnimationFrame(commit);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafId !== 0) cancelAnimationFrame(rafId);
    };
  }, []);

  // Resolve the active peek curve. `peekBreakpoints` overrides individual
  // values from the named profile, so callers can tweak just one breakpoint.
  // Memoized so identical profile/override props don't allocate a new object
  // on every render and re-trigger the slideFraction useMemo below.
  const resolvedPeek: PeekBreakpoints = useMemo(
    () => ({ ...PEEK_PROFILES[peekProfile], ...peekBreakpoints }),
    [peekProfile, peekBreakpoints],
  );

  const measured = containerW !== null && containerW > 0;

  // Snap to discrete breakpoints so containerW jitter (sub-pixel + the 1px
  // filter in ResizeObserver) within the same tier doesn't recompute the
  // peek fraction or trigger the re-anchor effect below.
  const breakpoint: keyof PeekBreakpoints = !measured
    ? "sm"
    : containerW! >= 640 ? "lg"
    : containerW! >= 480 ? "md"
    : containerW! >= 360 ? "sm"
    : "xs";

  const peekFraction = resolvedPeek[breakpoint];
  const slideFraction = 1 - peekFraction;
  const slideWidthPct = useMemo(
    () => `${(slideFraction * 100).toFixed(2)}%`,
    [slideFraction],
  );

  // When the breakpoint changes (e.g. user rotates device, layout reflows),
  // re-anchor the scroll position to the currently-active slide so the
  // active photo stays active and the peek lines up with the new fraction.
  // We suppress the scroll listener for the duration of the programmatic
  // jump so the dots indicator can't flicker through neighbouring indexes
  // while the browser fires intermediate scroll events.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || !measured || !hasMultiple) return;
    const idx = activeIdxRef.current;
    const target = idx * el.clientWidth * slideFraction;
    if (Math.abs(el.scrollLeft - target) <= 1) return;

    suppressIdxRef.current = true;
    // behavior: "auto" (instant) — no animation means no intermediate scroll
    // events the listener could mis-interpret.
    el.scrollTo({ left: target, behavior: "auto" });
    // Re-assert the active index in case React batched something stale,
    // then release suppression on the next frame so legitimate user
    // swipes are tracked normally again.
    setActiveIdx(idx);
    const raf = requestAnimationFrame(() => {
      suppressIdxRef.current = false;
    });
    return () => cancelAnimationFrame(raf);
    // We intentionally exclude `activeIdx` — this effect only fires on
    // breakpoint/width changes, not on every user swipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideFraction, measured, hasMultiple]);

  // Per-image orientation + load state. Lets the gallery pick a container
  // aspect ratio that fits ALL slides (4:5 if any portrait, otherwise 4:3),
  // and show a skeleton until each slide actually loads — so card height
  // and the next-photo peek don't jump while images resolve.
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
  // Until first image reports its size, use 4:5 (fits both orientations)
  // so the card height never jumps when orientation finally resolves.
  const aspectClass = !firstLoaded || hasPortrait ? "aspect-[4/5]" : "aspect-[4/3]";

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !hasMultiple || !measured) return;
    let frame = 0;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    // Synchronous mirror of the *intended* active index. activeIdxRef only
    // updates after React commits, which is too late during iOS momentum:
    // 60+ scroll events can fire before the first commit and each would
    // re-issue the same setState. We bump this synchronously inside the
    // rAF callback so subsequent events in the same flight short-circuit.
    let lastCommittedIdx = activeIdxRef.current;

    const computeIdx = () => {
      const slideWidth = el.clientWidth * slideFraction;
      if (slideWidth <= 0) return null;
      const raw = Math.round(el.scrollLeft / slideWidth);
      return Math.max(0, Math.min(images.length - 1, raw));
    };

    const onScroll = () => {
      // Programmatic re-anchor in progress — do not let intermediate
      // scroll positions override the active index (no dot flicker).
      if (suppressIdxRef.current) return;

      // One commit per frame max: if a frame is already scheduled, drop
      // this event entirely. iOS Safari fires scroll events at >60Hz
      // during momentum; without this guard we'd schedule (and cancel)
      // a rAF on every single one — wasted work even though only the
      // last one ever runs.
      if (frame !== 0) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        const idx = computeIdx();
        if (idx === null) return;

        // Skip entirely if the visible index hasn't changed. Saves
        // setActiveIdx → React reconciliation → dot DOM update on every
        // momentum frame where the user is still mid-slide.
        if (idx === lastCommittedIdx) {
          // Still arm the settle pass — when momentum stops on the same
          // slide, we don't need to re-commit, but we also don't want a
          // stale settle timer firing later with an outdated index.
          if (settleTimer) clearTimeout(settleTimer);
          settleTimer = setTimeout(() => {
            const finalIdx = computeIdx();
            if (finalIdx !== null && finalIdx !== lastCommittedIdx) {
              lastCommittedIdx = finalIdx;
              setActiveIdx(finalIdx);
            }
          }, 90);
          return;
        }

        // Provisional update: only commit if it's a clean change to a
        // neighbour. This prevents two-step jumps (0 → 2) when scrollLeft
        // momentarily lands between slides during a fast swipe or
        // breakpoint adjustment.
        if (Math.abs(idx - lastCommittedIdx) <= 1) {
          lastCommittedIdx = idx;
          setActiveIdx(idx);
        }

        // "Settled" pass: 90ms after the last scroll event we trust the
        // final scrollLeft and snap the dot indicator to it. This is what
        // keeps dots stable during ResizeObserver-driven layout changes
        // — any transient scroll noise is collapsed into one final read.
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          const finalIdx = computeIdx();
          if (finalIdx !== null && finalIdx !== lastCommittedIdx) {
            lastCommittedIdx = finalIdx;
            setActiveIdx(finalIdx);
          }
        }, 90);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [hasMultiple, images.length, slideFraction, measured]);

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
      {/* 1. Photo with responsive peek-of-next.
          Math model (resolution-independent):
            - container width = W
            - each slide      = slideFraction · W   (inline width %)
            - gap             = 0
            - scroll-padding  = 0
            - snap-align      = start
          → after a snap, the active slide fills `slideFraction · W` and
          the next slide's leading `peekFraction · W` is always visible.
          peekFraction comes from the container-width breakpoints above
          (8/10/12/14%) so the visual rhythm of the peek strip stays
          comparable across phones, phablets and split tablet panes. */}
      <div className="relative pt-3">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            // pan-x only: tells iOS Safari "this is a horizontal scroller",
            // so the vertical page scroll stays on the document and we don't
            // fight the gesture recognizer mid-swipe (a major source of jank
            // on iOS when both axes are claimed).
            touchAction: "pan-x",
            scrollPaddingLeft: 0,
            scrollPaddingRight: 0,
            // Keep momentum scrolling inside the gallery — prevents the
            // parent page from "rubber-banding" while the user is mid-swipe.
            overscrollBehaviorX: "contain",
            // Promote the scroller to its own GPU layer so iOS Safari can
            // composite the swipe without repainting siblings on every frame.
            // `paint` containment also short-circuits layout invalidation
            // when slide widths change after a ResizeObserver tick.
            transform: "translateZ(0)",
            contain: "content",
            // Smooth momentum-scroll on legacy iOS WebKit; harmless elsewhere.
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties}
        >
          {images.map((src, i) => {
            const fitClass = isMixed ? "object-contain" : "object-cover";
            const isLoaded = loaded[i] === true;
            // For object-contain (mixed orientations) the slide's background
            // is visible around the photo. We blend a soft tint of --muted
            // over --card so the padding reads as a natural "frame" of the
            // card, not as a foreign block — works in both light and dark
            // themes because both tokens follow the theme.
            const slideBgStyle: React.CSSProperties = isMixed
              ? {
                  background:
                    "radial-gradient(120% 90% at 50% 50%, hsl(var(--card)) 0%, hsl(var(--muted) / 0.55) 100%)",
                  boxShadow: "inset 0 0 0 1px hsl(var(--border) / 0.4)",
                }
              : {};
            const isLast = i === images.length - 1;
            return (
              <div
                key={i}
                style={
                  hasMultiple
                    ? {
                        width: slideWidthPct,
                        // No CSS width transition: on iOS Safari, animating
                        // the width of every slide simultaneously during a
                        // ResizeObserver tick (rotate / split-pane) causes
                        // the snap engine to chase a moving target — visible
                        // as a stutter mid-swipe. We snap to the new width
                        // instantly and re-anchor scrollLeft in JS instead.
                        // Per-slide containment so a width change on one
                        // slide doesn't invalidate layout for siblings.
                        contain: "layout paint",
                      }
                    : undefined
                }
                className={cn(
                  // Snap target — width is `slideWidthPct` of the scroller
                  // (responsive, see peekFraction table above). The right
                  // padding is a *visual* gutter INSIDE the snap box, so it
                  // doesn't shift the snap math. Last slide gets no gutter
                  // so it can sit flush against the right edge.
                  "relative shrink-0 snap-start",
                  !hasMultiple && "w-full",
                  hasMultiple && !isLast && "pr-[1.5%]",
                  // Hide slides until we know the real container width so a
                  // wrong-width first paint never flashes. Layout (height /
                  // aspect ratio) is preserved, only paint is suppressed.
                  hasMultiple && !measured && "invisible",
                )}
              >
                <div
                  style={slideBgStyle}
                  className={cn(
                    "relative w-full overflow-hidden rounded-md",
                    aspectClass,
                    !isMixed && "bg-muted",
                  )}
                >
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
              </div>
            );
          })}
        </div>

        {/* Origin badge */}
        <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
          <span aria-hidden>{offer.originFlag}</span>
          {offer.origin}
        </div>

        {/* Mixed-orientation hint — appears only when the gallery contains
            both portrait and landscape photos and therefore renders them
            with object-contain (no cropping). Tells the buyer the soft
            padding around photos is intentional, not a layout bug. */}
        {isMixed && (
          <div
            role="note"
            aria-label="Фото показаны полностью, без обрезки — в галерее смешаны вертикальные и горизонтальные кадры"
            title="Без обрезки: смешанные ориентации фото"
            className="pointer-events-auto absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm"
          >
            <Maximize2 className="h-3 w-3" aria-hidden />
            <span>Без обрезки</span>
          </div>
        )}

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

      <div className="flex min-w-0 flex-col gap-3 px-4 pb-4 pt-2">
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        {/* 2. Price first, with trend (trend doubles as analytics trigger) */}
        <div className="flex items-baseline gap-2 leading-6">
          {exact ? (
            <span className="font-heading text-lg font-bold leading-6 text-foreground">
              {exact}
            </span>
          ) : (
            <span className="font-heading text-lg font-bold leading-6 text-foreground">{range}</span>
          )}
          <span className="text-xs leading-5 text-muted-foreground">{unit}</span>
          {TrendIcon && trend && (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                aria-label={analyticsOpen ? "Скрыть аналитику" : "Показать аналитику цен"}
                aria-expanded={analyticsOpen}
                title={analyticsOpen ? "Скрыть аналитику" : "Показать аналитику цен"}
                data-testid="catalog-row-trend-analytics-toggle"
                className={cn(
                  "ml-auto inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-xs font-semibold leading-5 transition-all duration-200",
                  analyticsOpen
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                    : cn("border-transparent hover:border-primary/40 hover:bg-primary/5", trendColor),
                )}
              >
                <TrendIcon className="h-3.5 w-3.5" aria-hidden />
                {trend.d30.pct > 0 ? "+" : ""}
                {trend.d30.pct.toFixed(1)}%
              </button>
            </CollapsibleTrigger>
          )}
        </div>

        {/* 3. Product name + Latin name — единая увеличенная тач-цель.
            Отрицательные внешние отступы + внутренние padding'и расширяют
            кликабельную область до ~44px по высоте без визуального сдвига.

            stopPropagation НЕ нужен: handleCardClick сам отфильтровывает
            клики по `a, button` через closest(), а гасить bubbling здесь
            мешало бы делегированным слушателям (аналитика, outside-click
            и т.п.) видеть переход. Навигация по <Link> идёт штатно через
            React Router. */}
        <Link
          to={`/offers/${offer.id}`}
          state={buildCatalogReturnState(offer.id)}
          data-testid="catalog-row-view-details"
          aria-label={`Открыть карточку: ${offer.productName}`}
          className="block min-w-0 -mx-2 -my-1 rounded-md px-2 py-1 touch-manipulation [-webkit-tap-highlight-color:transparent] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-muted/40 active:bg-muted active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:bg-muted/40"
        >
          <h3
            className="font-heading text-base font-semibold leading-6 text-foreground line-clamp-2 group-hover:text-link-hover"
            style={{
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {offer.productName}
          </h3>
          {offer.latinName && (
            <p className="mt-1 text-xs leading-5 italic text-muted-foreground line-clamp-1">
              {offer.latinName}
            </p>
          )}
        </Link>

        {/* 4. Delivery basis — кликабельная строка, ведёт на детали оффера.
            Расширенная тач-цель за счёт -mx-2/-my-1 + py-1.5.
            stopPropagation не нужен — см. комментарий у блока названия. */}
        {primaryBasis && (
          <Link
            to={`/offers/${offer.id}`}
            state={buildCatalogReturnState(offer.id)}
            data-testid="catalog-row-basis"
            aria-label={`Базис поставки ${primaryBasis.code}, ${primaryBasis.shipmentPort?.split(",")[0]}, срок ${primaryBasis.leadTime}`}
            className="-mx-2 -my-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs leading-5 text-foreground touch-manipulation [-webkit-tap-highlight-color:transparent] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-muted/40 active:bg-muted active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:bg-muted/40"
          >
            <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-semibold">{primaryBasis.code}</span>
            <span className="truncate text-muted-foreground">
              {primaryBasis.shipmentPort?.split(",")[0]} · {primaryBasis.leadTime}
            </span>
          </Link>
        )}

        {/* 5. Supplier — blurred name when locked, flag visible always.
            Right side hosts the Lock indicator (if locked) AND the
            analytics toggle pictogram. */}
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

        <CollapsibleContent
          className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
        >
          <div className="mt-2">
            <OfferAnalyticsPanel offer={offer} />
          </div>
        </CollapsibleContent>
        </Collapsible>
      </div>
    </article>
  );
};

// Memoize to skip re-renders when the parent re-renders but this offer's
// props are unchanged (e.g. another row gets selected). The default shallow
// compare is enough since `offer` is a stable reference from mock data and
// callbacks come from a parent useCallback.
export default memo(MobileOfferCard);
