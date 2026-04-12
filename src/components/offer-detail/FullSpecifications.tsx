import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SeafoodOffer } from "@/data/mockOffers";

const FullSpecifications = ({ offer }: { offer: SeafoodOffer }) => {
  const [open, setOpen] = useState(false);
  const sp = offer.specs;
  const rows: [string, string][] = [
    ["Catching method", sp.catchingMethod],
    ["Freezing process", sp.freezingProcess],
    ["Glazing", sp.glazing],
    ["Storage temperature", sp.storageTemperature],
    ["Fishing area", sp.fishingArea],
    ["Ingredients", sp.ingredients],
    ["Calories", sp.nutritionPer100g.calories],
    ["Protein", sp.nutritionPer100g.protein],
    ["Fat", sp.nutritionPer100g.fat],
    ["Carbohydrates", sp.nutritionPer100g.carbs],
    ["Packing weight", sp.packingWeight],
    ["Shelf life", sp.shelfLife],
  ];

  return (
    <section className="py-10 border-t border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground">Full Specifications</h2>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
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
