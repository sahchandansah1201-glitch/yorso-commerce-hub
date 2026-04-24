/**
 * Shared price-unit chip with explanatory tooltip (e.g. "$/kg").
 *
 * Используется и в CatalogOfferCard, и в CatalogOfferRow. Оборачиваем в
 * <button> чтобы:
 *   1. Tooltip срабатывал на keyboard focus, а не только на hover.
 *   2. preventDefault/stopPropagation внутри клика не давали ссылке вокруг
 *      карточки/строки навигировать на /offers/:id.
 */
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface PriceUnitProps {
  unit: string;
  /** override классов (размер шрифта/цвета) под конкретный layout */
  className?: string;
}

export const PriceUnit = ({ unit, className }: PriceUnitProps) => {
  const { t } = useLanguage();
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-0.5 cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded",
              className ?? "text-[11px] text-muted-foreground",
            )}
            aria-label={`${unit} — ${t.priceUnit_tooltip}`}
            onClick={(e) => {
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

export default PriceUnit;
