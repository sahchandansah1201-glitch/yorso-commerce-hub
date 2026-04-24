import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  Truck,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  FileCheck2,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
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
      <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
        <span className="font-semibold">{offer.supplier.name}</span>
        <span className="text-muted-foreground">
          · {offer.supplier.countryFlag} {offer.supplier.country}
        </span>
      </span>
    );
  }
  const msg =
    level === "registered_locked"
      ? t.catalog_row_supplierLocked_reg
      : t.catalog_row_supplierLocked_anon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5" aria-hidden />
      {msg} · {offer.supplier.countryFlag} {offer.supplier.country}
    </span>
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

  if (level === "qualified_unlocked" && hasNumeric) {
    const exact = ((offer.priceMin! + offer.priceMax!) / 2).toFixed(2);
    return (
      <div data-testid="catalog-row-price" className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-lg font-bold text-foreground">
            {offer.currency ?? "USD"} {exact}
          </span>
          <span className="text-[11px] text-muted-foreground">{unit}</span>
        </div>
        {offer.volumeBreaks && offer.volumeBreaks.length > 0 && (
          <p className="text-[10px] uppercase tracking-wide text-primary">
            {t.catalog_card_volumeBreaks}: {offer.volumeBreaks.length}
          </p>
        )}
      </div>
    );
  }

  // Locked states: single, clear access message + one action.
  const accessMsg =
    level === "registered_locked"
      ? t.catalog_row_priceAccess_reg
      : t.catalog_row_priceAccess_anon;

  const ctaLabel =
    level === "registered_locked"
      ? accessPending
        ? t.catalog_row_priceCta_reg_sent
        : t.catalog_row_priceCta_reg
      : t.catalog_row_priceCta_anon;

  return (
    <div data-testid="catalog-row-price" className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-base font-bold text-foreground">{range}</span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
      <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        {accessMsg}
      </p>
      {level === "registered_locked" ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={accessPending}
            onClick={(e) => {
              e.stopPropagation();
              setDialogOpen(true);
            }}
            className="h-7 self-start px-2.5 text-[11px] font-semibold"
            data-testid="catalog-row-request-access"
          >
            {accessPending ? <Check className="h-3 w-3" /> : null}
            {ctaLabel}
            {!accessPending && <ArrowRight className="h-3 w-3" />}
          </Button>
          <AccessRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
      ) : (
        <Link to="/register" className="self-start" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] font-semibold">
            {ctaLabel}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
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
        "group relative grid cursor-pointer grid-cols-[140px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,200px)] gap-6 rounded-lg border bg-card p-5 shadow-sm transition-colors",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40",
      )}
    >
      {/* 1. Media */}
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        <img
          src={offer.image}
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
      </div>

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

        <SupplierLine offer={offer} level={level} />

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
        <span className="inline-flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" aria-hidden />
          <span className="text-foreground">
            {offer.commercial.incoterm} · {offer.commercial.shipmentPort?.split(",")[0] ?? "—"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          {offer.commercial.paymentTerms.split(",")[0]}
        </span>
        <span className="text-foreground">
          {t.offers_moqLabel}: <span className="font-semibold">{offer.moq}</span>
        </span>
      </div>

      {/* 4. Price + access */}
      <div className="flex flex-col items-stretch gap-3">
        <PriceBlock offer={offer} level={level} />
      </div>
    </article>
  );
};

export default CatalogOfferRow;
