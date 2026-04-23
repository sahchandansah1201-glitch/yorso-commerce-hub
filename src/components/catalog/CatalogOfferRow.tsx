import { Link } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  Truck,
  CreditCard,
  Eye,
  Bookmark,
  BellRing,
  Scale,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
import type { SeafoodOffer } from "@/data/mockOffers";
import CertificationBadges from "@/components/CertificationBadges";
import { getPriceTrend, countryNews } from "@/data/mockIntelligence";
import { cn } from "@/lib/utils";

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
        <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="font-semibold">{offer.supplier.name}</span>
        <span className="text-muted-foreground">
          · {offer.supplier.countryFlag} {offer.supplier.country}
        </span>
      </span>
    );
  }
  if (level === "registered_locked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
        {t.catalog_card_supplierPartial} · {offer.supplier.countryFlag} {offer.supplier.country}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5" aria-hidden />
      {t.catalog_card_supplierStub}
    </span>
  );
};

const PriceCell = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  const { t, lang } = useLanguage();
  const hasNumeric = typeof offer.priceMin === "number" && typeof offer.priceMax === "number";
  const range = hasNumeric
    ? formatPriceRange(offer.priceMin!, offer.priceMax!, lang, offer.currency ?? "USD")
    : offer.priceRange;
  const unit = offer.priceUnitKey ? t[offer.priceUnitKey] : t.card_perKg;

  if (level === "qualified_unlocked" && hasNumeric) {
    const exact = ((offer.priceMin! + offer.priceMax!) / 2).toFixed(2);
    return (
      <div data-testid="catalog-row-price">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-base font-bold text-foreground">
            {offer.currency ?? "USD"} {exact}
          </span>
          <span className="text-[11px] text-muted-foreground">{unit}</span>
        </div>
        {offer.volumeBreaks && offer.volumeBreaks.length > 0 && (
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-primary">
            {t.catalog_card_volumeBreaks}: {offer.volumeBreaks.length}
          </p>
        )}
      </div>
    );
  }

  return (
    <div data-testid="catalog-row-price">
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-sm font-bold text-foreground">{range}</span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
      <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        {level === "anonymous_locked" ? t.catalog_card_priceLockedHint : t.catalog_card_priceLocked}
      </p>
    </div>
  );
};

const dirIcon = (dir: "up" | "down" | "flat") => {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-primary" aria-hidden />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-destructive" aria-hidden />;
  return <Minus className="h-3 w-3 text-muted-foreground" aria-hidden />;
};

const ActionsCell = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  const { t } = useLanguage();
  if (level === "qualified_unlocked") {
    return (
      <div className="flex flex-col gap-1.5">
        <Button size="sm" className="text-xs font-semibold">
          <ShoppingCart className="h-3.5 w-3.5" /> {t.catalog_card_action_addToCart}
        </Button>
        <Button size="sm" variant="outline" className="text-xs font-semibold">
          <MessageSquare className="h-3.5 w-3.5" /> {t.catalog_card_action_contactSupplier}
        </Button>
        <Link to={`/offers/${offer.id}`}>
          <Button size="sm" variant="ghost" className="w-full text-xs">
            <Eye className="h-3.5 w-3.5" /> {t.catalog_card_action_view}
          </Button>
        </Link>
      </div>
    );
  }
  if (level === "registered_locked") {
    return (
      <div className="flex flex-col gap-1.5">
        <Button size="sm" className="text-xs font-semibold">
          <BellRing className="h-3.5 w-3.5" /> {t.catalog_card_action_notifyPrice}
        </Button>
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" className="text-[11px] font-semibold">
            <Bookmark className="h-3 w-3" /> {t.catalog_card_action_save}
          </Button>
          <Button size="sm" variant="outline" className="text-[11px] font-semibold">
            <Scale className="h-3 w-3" /> {t.catalog_card_action_compare}
          </Button>
        </div>
        <Link to={`/offers/${offer.id}`}>
          <Button size="sm" variant="ghost" className="w-full text-xs">
            <Eye className="h-3.5 w-3.5" /> {t.catalog_card_action_view}
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Link to="/register">
        <Button size="sm" className="w-full text-xs font-semibold">
          {t.catalog_card_action_signupForPrice}
        </Button>
      </Link>
      <Link to={`/offers/${offer.id}`}>
        <Button size="sm" variant="outline" className="w-full text-xs font-semibold">
          <Eye className="h-3.5 w-3.5" /> {t.catalog_card_action_view}
        </Button>
      </Link>
    </div>
  );
};

export const CatalogOfferRow = ({ offer, isSelected, onSelect, forceLevel }: Props) => {
  const { t } = useLanguage();
  const { level: ctxLevel } = useAccessLevel();
  const level = forceLevel ?? ctxLevel;

  // Lightweight scannable signals (mock, derived from category + countries).
  const trend = getPriceTrend(offer.category);
  const offerCountries = new Set([offer.origin, offer.supplier.country]);
  const newsCount = countryNews.filter(
    (n) => n.category === offer.category && offerCountries.has(n.countryName),
  ).length;
  const docsReady = (offer.certifications?.length ?? 0) >= 2;

  const handleActivate = () => onSelect(offer.id);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      data-testid="catalog-offer-row"
      data-access-level={level}
      data-selected={isSelected ? "true" : "false"}
      aria-pressed={isSelected}
      className={cn(
        "group grid cursor-pointer grid-cols-[120px_minmax(0,1fr)_180px_180px] gap-4 rounded-lg border bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md md:grid-cols-[140px_minmax(0,1.4fr)_minmax(0,1fr)_200px]",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border",
      )}
    >
      {/* 1. Media */}
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        <img
          src={offer.image}
          alt={offer.productName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-foreground backdrop-blur-sm">
          <span aria-hidden>{offer.originFlag}</span>
          {offer.origin}
        </div>
      </div>

      {/* 2. Identity + supplier + signals */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start gap-2">
          <h3 className="font-heading text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {offer.productName}
          </h3>
          {offer.isVerified && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              <ShieldCheck className="h-3 w-3" aria-hidden /> {t.card_verified}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] italic text-muted-foreground line-clamp-1">
          {offer.latinName} · {offer.format} · {offer.cutType.split(",")[0]}
        </p>
        <div className="mt-1.5">
          <SupplierLine offer={offer} level={level} />
        </div>
        <CertificationBadges
          certifications={offer.certifications ?? []}
          limit={3}
          className="mt-1.5"
        />
        {/* Fast intelligence signals */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[10px] text-muted-foreground">
          {trend && (
            <span className="inline-flex items-center gap-1">
              {dirIcon(trend.d30.dir)}
              <span className="font-semibold text-foreground">
                {trend.d30.pct > 0 ? "+" : ""}
                {trend.d30.pct.toFixed(1)}%
              </span>
              <span className="uppercase tracking-wide">
                {t.catalog_intel_priceTrend_d30}
              </span>
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
      <div className="flex min-w-0 flex-col gap-1.5 text-[11px] text-muted-foreground">
        <PriceCell offer={offer} level={level} />
        <span className="inline-flex items-center gap-1">
          <Truck className="h-3 w-3" aria-hidden />
          {offer.commercial.incoterm} · {offer.commercial.shipmentPort?.split(",")[0] ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CreditCard className="h-3 w-3" aria-hidden />
          {offer.commercial.paymentTerms.split(",")[0]}
        </span>
        <span className="text-foreground">
          {t.offers_moqLabel}: <span className="font-semibold">{offer.moq}</span>
        </span>
      </div>

      {/* 4. Actions — stop click bubbling so action buttons don't trigger row select */}
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <ActionsCell offer={offer} level={level} />
      </div>
    </article>
  );
};

export default CatalogOfferRow;
