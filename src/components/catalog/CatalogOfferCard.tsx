import { Link } from "react-router-dom";
import { buildCatalogReturnState } from "@/lib/return-to-catalog";
import { Lock, ShieldCheck, Users, Truck, CreditCard, Eye, Bookmark, BellRing, Scale, MessageSquare, ShoppingCart, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel, type AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
import { normalizeMoq, summarizeMoqRange } from "@/lib/moq";
import type { SeafoodOffer } from "@/data/mockOffers";
import CertificationBadges from "@/components/CertificationBadges";

/**
 * Renders the price unit (e.g. "$/kg", "per kg") with a tooltip explaining
 * how the per-unit price is calculated. Buyers often miss whether the price
 * is for net weight, gross weight, or includes glaze — surfacing this on
 * hover/focus prevents costly misreadings without cluttering the card.
 */
const PriceUnit = ({ unit, className }: { unit: string; className?: string }) => {
  const { t } = useLanguage();
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-0.5 ${className ?? "text-xs text-muted-foreground"} cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded`}
            aria-label={`${unit} — ${t.priceUnit_tooltip}`}
            onClick={(e) => {
              // Prevent navigating to the offer detail when the trigger sits
              // inside a link area; tooltip is a passive disclosure.
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {unit}
            <Info className="h-2.5 w-2.5 opacity-60" aria-hidden />
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
  /** allow forcing a level (e.g. for tests); defaults to current */
  forceLevel?: AccessLevel;
}

const SupplierBlock = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  const { t } = useLanguage();
  if (level === "qualified_unlocked") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span className="font-semibold">{offer.supplier.name}</span>
        <span className="text-muted-foreground">· {offer.supplier.countryFlag} {offer.supplier.country}</span>
      </div>
    );
  }
  if (level === "registered_locked") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span>{t.catalog_card_supplierPartial} · {offer.supplier.countryFlag} {offer.supplier.country}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5" aria-hidden />
      <span>{t.catalog_card_supplierStub}</span>
    </div>
  );
};

const PriceBlock = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  const { t, lang } = useLanguage();

  const hasNumeric = typeof offer.priceMin === "number" && typeof offer.priceMax === "number";
  const range = hasNumeric
    ? formatPriceRange(offer.priceMin!, offer.priceMax!, lang, offer.currency ?? "USD")
    : offer.priceRange;
  const unit = offer.priceUnitKey ? t[offer.priceUnitKey] : t.card_perKg;

  // First volume break is the MOQ tier — surface it next to the price so
  // buyers see "from-to + MOQ" together (e.g. "8.50 – 9.20 $/kg, MOQ 1,000 – 4,999 kg").
  // Remaining tiers go to a compact secondary list.
  const volumeBreaks = offer.volumeBreaks ?? [];
  const hasVolumeBreaks = volumeBreaks.length > 0;
  const primaryMoqRaw = hasVolumeBreaks ? volumeBreaks[0].minQty : offer.moq;
  const primaryMoq = normalizeMoq(primaryMoqRaw, lang).display;
  const additionalBreaks = volumeBreaks.slice(1);

  const MoqLine = (
    <p className="mt-0.5 text-[11px] text-muted-foreground">
      <span className="font-medium text-foreground">{t.offers_moqLabel}:</span>{" "}
      <span className="font-semibold text-foreground">{primaryMoq}</span>
    </p>
  );

  const AdditionalBreaks = additionalBreaks.length > 0 && (
    <div className="mt-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
        {t.catalog_row_volumePricingLabel}
      </p>
      <ul className="mt-0.5 space-y-0.5 text-[11px]">
        {additionalBreaks.map((vb, i) => (
          <li key={i} className="flex items-baseline justify-between gap-2 leading-tight">
            <span className="text-muted-foreground">{normalizeMoq(vb.minQty, lang).display}</span>
            <span
              className={
                level === "qualified_unlocked"
                  ? "font-semibold text-foreground"
                  : "font-semibold text-muted-foreground blur-[3px] select-none"
              }
              aria-hidden={level !== "qualified_unlocked"}
            >
              {vb.priceRange}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (level === "qualified_unlocked" && hasNumeric) {
    const exact = ((offer.priceMin! + offer.priceMax!) / 2).toFixed(2);
    return (
      <div data-testid="catalog-card-price">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-base font-bold text-foreground">{offer.currency ?? "USD"} {exact}</span>
          <PriceUnit unit={unit} className="text-xs text-muted-foreground" />
        </div>
        {MoqLine}
        {AdditionalBreaks}
      </div>
    );
  }

  // Anonymous + Registered: range only with explanation.
  // Surface a summarized MOQ range (e.g. "1,000 – 20,000+ kg") so buyers can
  // gauge minimum order scale without registering. The detailed per-tier MOQ
  // values stay visible in MoqLine + AdditionalBreaks; this is just the
  // at-a-glance summary placed near the locked price.
  const moqSummary = summarizeMoqRange(
    hasVolumeBreaks ? volumeBreaks.map((vb) => vb.minQty) : [offer.moq],
    lang,
  );
  return (
    <div data-testid="catalog-card-price">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.catalog_card_priceRange}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-sm font-bold text-foreground">{range}</span>
        <PriceUnit unit={unit} className="text-[11px] text-muted-foreground" />
      </div>
      {MoqLine}
      {moqSummary && hasVolumeBreaks && (
        <p
          className="mt-0.5 text-[10px] text-muted-foreground"
          data-testid="catalog-card-moq-summary"
        >
          {t.offers_moqLabel} {t.catalog_card_priceRange.toLowerCase()}: <span className="font-medium text-foreground">{moqSummary}</span>
        </p>
      )}
      {AdditionalBreaks}
      <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden />
        {level === "anonymous_locked" ? t.catalog_card_priceLockedHint : t.catalog_card_priceLocked}
      </p>
    </div>
  );
};

const Actions = ({ offer, level }: { offer: SeafoodOffer; level: AccessLevel }) => {
  const { t } = useLanguage();
  if (level === "qualified_unlocked") {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Button size="sm" className="text-xs font-semibold">
          <ShoppingCart className="h-3.5 w-3.5" /> {t.catalog_card_action_addToCart}
        </Button>
        <Button size="sm" variant="outline" className="text-xs font-semibold">
          <MessageSquare className="h-3.5 w-3.5" /> {t.catalog_card_action_contactSupplier}
        </Button>
        <Link to={`/offers/${offer.id}`} className="col-span-2">
          <Button size="sm" variant="ghost" className="w-full text-xs">
            <Eye className="h-3.5 w-3.5" /> {t.catalog_card_action_view}
          </Button>
        </Link>
      </div>
    );
  }
  if (level === "registered_locked") {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Button size="sm" variant="outline" className="text-xs font-semibold">
          <Bookmark className="h-3.5 w-3.5" /> {t.catalog_card_action_save}
        </Button>
        <Button size="sm" variant="outline" className="text-xs font-semibold">
          <Scale className="h-3.5 w-3.5" /> {t.catalog_card_action_compare}
        </Button>
        <Button size="sm" variant="outline" className="text-xs font-semibold">
          <BellRing className="h-3.5 w-3.5" /> {t.catalog_card_action_notifyPrice}
        </Button>
        <Button size="sm" variant="outline" className="text-xs font-semibold">
          <Users className="h-3.5 w-3.5" /> {t.catalog_card_action_followSupplier}
        </Button>
        <Link to={`/offers/${offer.id}`} className="col-span-2">
          <Button size="sm" className="w-full text-xs font-semibold">
            <Eye className="h-3.5 w-3.5" /> {t.catalog_card_action_view}
          </Button>
        </Link>
      </div>
    );
  }
  // anonymous
  return (
    <div className="mt-3 grid grid-cols-1 gap-1.5">
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

export const CatalogOfferCard = ({ offer, forceLevel }: Props) => {
  const { t } = useLanguage();
  const { level: ctxLevel } = useAccessLevel();
  const level = forceLevel ?? ctxLevel;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
      data-testid="catalog-offer-card"
      data-access-level={level}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={offer.image}
          alt={offer.productName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = "/placeholder.svg";
          }}
        />
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur-sm">
          <span>{offer.originFlag}</span>
          {offer.origin}
        </div>
        {offer.isVerified && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-[10px] font-semibold text-primary-foreground backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            {t.card_verified}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-sm font-semibold leading-tight text-foreground line-clamp-2 min-h-[2.5rem]">
          {offer.productName}
        </h3>
        <p className="mt-0.5 text-[11px] italic text-muted-foreground">{offer.latinName}</p>

        <div className="mt-2">
          <SupplierBlock offer={offer} level={level} />
        </div>

        <CertificationBadges certifications={offer.certifications ?? []} limit={3} className="mt-2" />

        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3 w-3" aria-hidden />
            {offer.commercial.incoterm} · {offer.commercial.shipmentPort?.split(",")[0] ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1">
            <CreditCard className="h-3 w-3" aria-hidden />
            {offer.commercial.paymentTerms.split(",")[0]}
          </span>
        </div>

        <div className="mt-auto pt-3">
          <PriceBlock offer={offer} level={level} />
        </div>

        <Actions offer={offer} level={level} />
      </div>
    </article>
  );
};

export default CatalogOfferCard;
