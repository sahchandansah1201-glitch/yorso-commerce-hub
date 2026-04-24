import { useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
import { normalizeMoq } from "@/lib/moq";
import type { SeafoodOffer } from "@/data/mockOffers";
import CertificationBadges from "@/components/CertificationBadges";
import { getPriceTrend, countryNews } from "@/data/mockIntelligence";
import { cn } from "@/lib/utils";
import { useAccessRequestPending } from "@/lib/catalog-requests";
import AccessRequestDialog from "@/components/catalog/AccessRequestDialog";

interface Props {
  offer: SeafoodOffer;
  isSelected: boolean;
  onSelect: (offerId: string) => void;
  forceLevel?: AccessLevel;
}

const SupplierLine = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  const { t } = useLanguage();
  if (level === "qualified_unlocked") {
    return (
      <div className="flex flex-col gap-0.5 text-[11px]">
        <span className="font-semibold text-foreground">{offer.supplier.name}</span>
        <span className="text-muted-foreground">
          {offer.supplier.countryFlag} {offer.supplier.country}
        </span>
      </div>
    );
  }
  const msg =
    level === "registered_locked"
      ? t.catalog_row_supplierLocked_reg
      : t.catalog_row_supplierLocked_anon;
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
      <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      <span>
        {msg} · {offer.supplier.countryFlag} {offer.supplier.country}
      </span>
    </div>
  );
};

const PhotoGallery = ({ offer }: { offer: SeafoodOffer }) => {
  const images =
    offer.images && offer.images.length > 0 ? offer.images : [offer.image];
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const hasMultiple = total > 1;

  const go = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIdx((prev) => (prev + delta + total) % total);
  };

  return (
    <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
      <img
        src={images[idx]}
        alt={offer.productName}
        loading="lazy"
        className="h-full w-full object-cover"
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
          <button
            type="button"
            onClick={go(-1)}
            aria-label="Previous image"
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-1 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-background group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={go(1)}
            aria-label="Next image"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-1 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-background group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
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
    <p className="text-[11px] text-muted-foreground">
      <span className="font-medium text-foreground">{t.offers_moqLabel}:</span>{" "}
      <span className="font-semibold text-foreground">{primaryMoq}</span>
    </p>
  );

  if (level === "qualified_unlocked" && hasNumeric) {
    const exact = ((offer.priceMin! + offer.priceMax!) / 2).toFixed(2);
    return (
      <div data-testid="catalog-row-price" className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-lg font-bold text-foreground">
            {offer.currency ?? "USD"} {exact}
          </span>
          <span className="text-[11px] text-muted-foreground">{unit}</span>
        </div>
        {MoqLine}
        {hasAdditionalBreaks && (
          <div className="mt-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
              {t.catalog_row_volumePricingLabel}
            </p>
            <ul className="mt-0.5 space-y-0.5 text-[11px]">
              {additionalBreaks.map((vb, i) => (
                <li key={i} className="flex items-baseline justify-between gap-2 leading-tight">
                  <span className="text-muted-foreground">{normalizeMoq(vb.minQty, lang).display}</span>
                  <span className="font-semibold text-foreground">{vb.priceRange}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const accessMsg =
    level === "registered_locked"
      ? t.catalog_row_priceAccess_reg
      : t.catalog_row_priceAccess_anon;

  return (
    <div data-testid="catalog-row-price" className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-base font-bold text-foreground">{range}</span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
      {MoqLine}
      {hasAdditionalBreaks && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {t.catalog_row_volumePricingLabel}
          </p>
          <ul className="mt-0.5 space-y-0.5 text-[11px]">
            {additionalBreaks.map((vb, i) => (
              <li key={i} className="flex items-baseline justify-between gap-2 leading-tight">
                <span className="text-muted-foreground">{normalizeMoq(vb.minQty, lang).display}</span>
                <span
                  className={cn(
                    "font-semibold",
                    level === "qualified_unlocked"
                      ? "text-foreground"
                      : "text-muted-foreground blur-[3px] select-none",
                  )}
                  aria-hidden={level !== "qualified_unlocked"}
                >
                  {vb.priceRange}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        {accessMsg}
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
            className="inline-flex items-center gap-1 self-start text-[11px] font-semibold text-link-hover hover:underline disabled:text-muted-foreground disabled:no-underline"
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

export const CatalogOfferRow = ({ offer, isSelected, onSelect, forceLevel }: Props) => {
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
      data-access-level={level}
      data-selected={isSelected ? "true" : "false"}
      onClick={handleRowClick}
      className={cn(
        "group relative grid cursor-pointer grid-cols-[290px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,220px)] gap-6 rounded-lg border bg-card p-5 shadow-sm transition-colors",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40",
      )}
    >
      {/* 1. Media */}
      <PhotoGallery offer={offer} />

      {/* 2. Product identity */}
      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <Link
            to={`/offers/${offer.id}`}
            onClick={(e) => e.stopPropagation()}
            data-testid="catalog-row-view-details"
            className="block"
          >
            <h3 className="font-heading text-base font-semibold leading-tight text-foreground line-clamp-2 transition-colors hover:text-link-hover hover:underline underline-offset-2 decoration-link-hover/60">
              {offer.productName}
            </h3>
          </Link>
          <p className="mt-1 text-[11px] italic text-muted-foreground line-clamp-1">
            {offer.latinName} · {offer.format} · {offer.cutType.split(",")[0]}
          </p>
        </div>

        <CertificationBadges certifications={offer.certifications ?? []} limit={3} />

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] text-muted-foreground">
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

      {/* 3. Deal terms */}
      <div className="flex min-w-0 flex-col gap-2 text-[11px] text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
              {t.catalog_row_basisLabel}
            </p>
            <ul className="mt-0.5 space-y-0.5 text-foreground">
              {(offer.deliveryBasisOptions ?? []).slice(0, 3).map((b) => (
                <li key={b.code} className="leading-tight">
                  <span className="font-semibold">{b.code}</span>{" "}
                  <span className="text-muted-foreground">
                    {b.shipmentPort?.split(",")[0]} · {b.leadTime}
                  </span>
                </li>
              ))}
              {(!offer.deliveryBasisOptions || offer.deliveryBasisOptions.length === 0) && (
                <li className="leading-tight">
                  <span className="font-semibold">{offer.commercial.incoterm}</span>{" "}
                  <span className="text-muted-foreground">
                    {offer.commercial.shipmentPort?.split(",")[0] ?? "—"}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
              {t.catalog_row_paymentLabel}
            </p>
            <p className="text-foreground leading-tight">{offer.commercial.paymentTerms}</p>
          </div>
        </div>
      </div>

      {/* 4. Price + supplier/access */}
      <div className="flex flex-col items-stretch gap-3">
        <PriceBlock offer={offer} level={level} />
        <div className="border-t border-border pt-2">
          <SupplierLine offer={offer} level={level} />
        </div>
      </div>
    </article>
  );
};

export default CatalogOfferRow;
