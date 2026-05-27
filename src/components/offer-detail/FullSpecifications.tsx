import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";

const FullSpecifications = ({ offer }: { offer: SeafoodOffer }) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const sp = offer.specs;
  const rows: [string, string][] = [
    [t.offerDetail_specCatchingMethod, sp.catchingMethod],
    [t.offerDetail_specFreezingProcess, sp.freezingProcess],
    [t.offerDetail_specGlazing, sp.glazing],
    [t.offerDetail_specStorageTemperature, sp.storageTemperature],
    [t.offerDetail_specFishingArea, sp.fishingArea],
    [t.offerDetail_specIngredients, sp.ingredients],
    [t.offerDetail_specCalories, sp.nutritionPer100g.calories],
    [t.offerDetail_specProtein, sp.nutritionPer100g.protein],
    [t.offerDetail_specFat, sp.nutritionPer100g.fat],
    [t.offerDetail_specCarbohydrates, sp.nutritionPer100g.carbs],
    [t.offerDetail_specPackingWeight, sp.packingWeight],
    [t.offerDetail_specShelfLife, sp.shelfLife],
  ];
  const contentId = "offer-full-specifications-content";

  return (
    <section className="py-10 border-t border-border" data-testid="offer-full-specifications">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full items-center justify-between rounded-md"
        aria-expanded={open}
        aria-controls={contentId}
        data-offer-detail-mobile-target="full-specifications"
      >
        <h2 className="font-heading text-lg font-bold text-foreground">{t.offerDetail_specsTitle}</h2>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && (
        <div id={contentId} className="mt-4 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([label, value], i) => (
                <tr key={label} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                  <td className="px-4 py-2.5 font-medium text-muted-foreground w-1/3">{label}</td>
                  <td className="px-4 py-2.5 text-foreground">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default FullSpecifications;
