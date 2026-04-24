/**
 * OfferPriceMoq — единый блок «цена + единица + MOQ + volume tiers + замок».
 *
 * Зачем компонент:
 *   До рефакторинга идентичная логика (формат цены, primary MOQ, summary
 *   диапазона MOQ, дополнительные volume-тиры с blur при locked) дублировалась
 *   в CatalogOfferCard и CatalogOfferRow. Любая правка контракта (новая
 *   локаль, изменение access-правил, иной формат тиров) требовала двух
 *   синхронных правок и регулярно расходилась.
 *
 * Дизайн:
 *   - Один компонент, два визуальных размера через `variant`:
 *       "card" — компактный, для grid-карточек (CatalogOfferCard);
 *       "row"  — крупнее, для горизонтальных строк (CatalogOfferRow).
 *   - Все access-правила вычисляются один раз здесь:
 *       qualified_unlocked → точная цена + полные тиры без blur;
 *       registered/anonymous_locked → диапазон, MOQ-summary, blur на
 *       ценах в дополнительных тирах, замок-подсказка.
 *   - data-testid для row/card сохранены, чтобы существующие интеграционные
 *     тесты не сломались.
 *   - Slot `lockedFooter` отдаёт хвост (например, кнопку «Request access»
 *     в CatalogOfferRow) родителю — компонент не тащит сюда диалог запроса
 *     доступа, чтобы не ломать SoC.
 *
 * Контракт:
 *   - offer должен иметь priceMin/priceMax/currency для точной цены; иначе
 *     показывается priceRange-строка.
 *   - volumeBreaks опциональны; если есть — первый тир считается primary MOQ.
 *   - locked-варианты НИКОГДА не показывают точную цену.
 */
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { AccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";
import { normalizeMoq, summarizeMoqRange } from "@/lib/moq";
import { cn } from "@/lib/utils";
import type { SeafoodOffer } from "@/data/mockOffers";
import { PriceUnit } from "@/components/catalog/PriceUnit";

type Variant = "card" | "row";

interface Props {
  offer: SeafoodOffer;
  level: AccessLevel;
  variant: Variant;
  /** test-id для контейнера (по умолчанию выбирается из variant) */
  testId?: string;
  /** контент, показываемый после locked-замка (например access-CTA) */
  lockedFooter?: ReactNode;
}

/** Размерные классы под variant — собираем в одном месте, чтобы UI правки
 *  не разъезжались. */
const SIZES = {
  card: {
    container: "",
    exact: "font-heading text-base font-bold text-foreground",
    range: "font-heading text-sm font-bold text-foreground",
    unit: "text-xs text-muted-foreground",
    moqLine: "mt-0.5 text-[11px] text-muted-foreground",
    rangeLabel: "text-[10px] uppercase tracking-wide text-muted-foreground",
    summary: "mt-0.5 text-[10px] text-muted-foreground",
    tiersLabel:
      "text-[10px] uppercase tracking-wide text-muted-foreground/80",
    tierRow: "text-[11px]",
    lockHint: "mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground",
    gap: "",
  },
  row: {
    container: "flex flex-col gap-1.5",
    exact: "font-heading text-lg font-bold text-foreground",
    range: "font-heading text-base font-bold text-foreground",
    unit: "text-[11px] text-muted-foreground",
    moqLine: "text-[11px] text-muted-foreground",
    rangeLabel: "text-[10px] uppercase tracking-wide text-muted-foreground",
    summary: "text-[10px] text-muted-foreground",
    tiersLabel:
      "text-[10px] uppercase tracking-wide text-muted-foreground/80",
    tierRow: "text-[11px]",
    lockHint: "inline-flex items-center gap-1 text-[10px] text-muted-foreground",
    gap: "",
  },
} as const;

export const OfferPriceMoq = ({ offer, level, variant, testId, lockedFooter }: Props) => {
  const { t, lang } = useLanguage();
  const s = SIZES[variant];
  const containerTestId =
    testId ?? (variant === "card" ? "catalog-card-price" : "catalog-row-price");

  const hasNumeric =
    typeof offer.priceMin === "number" && typeof offer.priceMax === "number";
  const range = hasNumeric
    ? formatPriceRange(offer.priceMin!, offer.priceMax!, lang, offer.currency ?? "USD")
    : offer.priceRange;
  const unit = offer.priceUnitKey ? t[offer.priceUnitKey] : t.card_perKg;

  const volumeBreaks = offer.volumeBreaks ?? [];
  const hasVolumeBreaks = volumeBreaks.length > 0;
  const primaryMoqRaw = hasVolumeBreaks ? volumeBreaks[0].minQty : offer.moq;
  const primaryMoq = normalizeMoq(primaryMoqRaw, lang).display;
  const additionalBreaks = volumeBreaks.slice(1);
  const hasAdditionalBreaks = additionalBreaks.length > 0;

  const MoqLine = (
    <p className={s.moqLine}>
      <span className="font-medium text-foreground">{t.offers_moqLabel}:</span>{" "}
      <span className="font-semibold text-foreground">{primaryMoq}</span>
    </p>
  );

  const AdditionalBreaks = hasAdditionalBreaks && (
    <div className={variant === "card" ? "mt-1" : undefined}>
      <p className={s.tiersLabel}>{t.catalog_row_volumePricingLabel}</p>
      <ul className={cn("mt-0.5 space-y-0.5", s.tierRow)}>
        {additionalBreaks.map((vb, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-2 leading-tight"
          >
            <span className="text-muted-foreground">
              {normalizeMoq(vb.minQty, lang).display}
            </span>
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
  );

  // Unlocked: точная цена + MOQ + полные тиры без blur.
  if (level === "qualified_unlocked" && hasNumeric) {
    const exact = ((offer.priceMin! + offer.priceMax!) / 2).toFixed(2);
    return (
      <div data-testid={containerTestId} className={s.container || "flex flex-col gap-1"}>
        <div className="flex items-baseline gap-1.5">
          <span className={s.exact}>
            {offer.currency ?? "USD"} {exact}
          </span>
          <PriceUnit unit={unit} className={s.unit} />
        </div>
        {MoqLine}
        {AdditionalBreaks}
      </div>
    );
  }

  // Locked (anonymous + registered): диапазон, summary, замок, slot для CTA.
  const moqSummary = summarizeMoqRange(
    hasVolumeBreaks ? volumeBreaks.map((vb) => vb.minQty) : [offer.moq],
    lang,
  );
  const summaryTestId =
    variant === "card" ? "catalog-card-moq-summary" : "catalog-row-moq-summary";
  const lockMsg =
    variant === "card"
      ? level === "anonymous_locked"
        ? t.catalog_card_priceLockedHint
        : t.catalog_card_priceLocked
      : level === "registered_locked"
        ? t.catalog_row_priceAccess_reg
        : t.catalog_row_priceAccess_anon;

  return (
    <div data-testid={containerTestId} className={s.container}>
      {variant === "card" && (
        <div className="flex items-center gap-1.5">
          <span className={s.rangeLabel}>{t.catalog_card_priceRange}</span>
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className={s.range}>{range}</span>
        <PriceUnit unit={unit} className={s.unit} />
      </div>
      {MoqLine}
      {moqSummary && hasVolumeBreaks && (
        <p className={s.summary} data-testid={summaryTestId}>
          {variant === "card"
            ? `${t.offers_moqLabel} ${t.catalog_card_priceRange.toLowerCase()}: `
            : `${t.offers_moqLabel}: `}
          <span className="font-medium text-foreground">{moqSummary}</span>
        </p>
      )}
      {AdditionalBreaks}
      <p className={s.lockHint}>
        <Lock className="h-3 w-3" aria-hidden />
        {lockMsg}
      </p>
      {lockedFooter}
    </div>
  );
};

export default OfferPriceMoq;
