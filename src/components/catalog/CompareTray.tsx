import { useState } from "react";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SeafoodOffer } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import analytics from "@/lib/analytics";
import { useAccessLevel } from "@/lib/access-level";
import { formatPriceRange } from "@/lib/format";

interface Props {
  offers: SeafoodOffer[];
  onRemove: (offerId: string) => void;
  onClear: () => void;
  /** Maximum allowed (visual hint). */
  max?: number;
}

export const CompareTray = ({ offers, onRemove, onClear, max = 5 }: Props) => {
  const { t, lang } = useLanguage();
  const { level } = useAccessLevel();
  const [open, setOpen] = useState(false);

  if (offers.length === 0) return null;

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      analytics.track("catalog_compare_open", {
        offerCount: offers.length,
        accessLevel: level,
      });
    }
  };

  const formatPrice = (offer: SeafoodOffer) => {
    if (typeof offer.priceMin === "number" && typeof offer.priceMax === "number") {
      return formatPriceRange(offer.priceMin, offer.priceMax, lang, offer.currency ?? "USD");
    }
    return offer.priceRange;
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-lg backdrop-blur"
      data-testid="catalog-compare-tray"
    >
      <div className="container flex flex-wrap items-center gap-2 px-3 py-2.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Scale className="h-3.5 w-3.5 text-primary" aria-hidden />
          {t.catalog_compare_trayTitle}
          <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
            {offers.length}/{max}
          </span>
        </div>

        <ul className="flex flex-1 flex-wrap items-center gap-1.5">
          {offers.map((o) => (
            <li
              key={o.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground"
            >
              <span aria-hidden>{o.originFlag}</span>
              <span className="max-w-[180px] truncate">{o.productName}</span>
              <button
                type="button"
                aria-label={t.catalog_compare_removeLabel}
                onClick={() => onRemove(o.id)}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>

        <div className="inline-flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
            {t.catalog_compare_clear}
          </Button>
          <Sheet open={open} onOpenChange={handleOpen}>
            <SheetTrigger asChild>
              <Button
                size="sm"
                disabled={offers.length < 2}
                className="text-xs font-semibold"
                data-testid="catalog-compare-open"
              >
                {t.catalog_compare_open}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t.catalog_compare_dialogTitle}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">{t.catalog_compare_col_offer}</th>
                      <th className="py-2 pr-3 font-medium">{t.catalog_compare_col_price}</th>
                      <th className="py-2 pr-3 font-medium">{t.catalog_compare_col_origin}</th>
                      <th className="py-2 pr-3 font-medium">{t.catalog_compare_col_supplierCountry}</th>
                      <th className="py-2 pr-3 font-medium">{t.catalog_compare_col_basis}</th>
                      <th className="py-2 pr-3 font-medium">{t.catalog_compare_col_moq}</th>
                      <th className="py-2 pr-3 font-medium">{t.catalog_compare_col_certifications}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((o) => (
                      <tr key={o.id} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-3 font-semibold text-foreground">{o.productName}</td>
                        <td className="py-2 pr-3 text-foreground">{formatPrice(o)}</td>
                        <td className="py-2 pr-3 text-foreground">
                          {o.originFlag} {o.origin}
                        </td>
                        <td className="py-2 pr-3 text-foreground">
                          {o.supplier.countryFlag} {o.supplier.country}
                        </td>
                        <td className="py-2 pr-3 text-foreground">
                          {o.commercial.incoterm} · {o.commercial.shipmentPort?.split(",")[0] ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-foreground">{o.moq}</td>
                        <td className="py-2 pr-3 text-foreground">
                          {(o.certifications ?? []).join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default CompareTray;
