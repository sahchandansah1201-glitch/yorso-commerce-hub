import { Link } from "react-router-dom";
import { Snowflake, Leaf, Thermometer } from "lucide-react";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

const getComparisonReason = (current: SeafoodOffer, other: SeafoodOffer): string => {
  const reasons: string[] = [];
  const currentMoqNum = parseInt(current.moq.replace(/\D/g, ""));
  const otherMoqNum = parseInt(other.moq.replace(/\D/g, ""));
  if (otherMoqNum < currentMoqNum) reasons.push("Lower MOQ");

  const currentPrice = parseFloat(current.priceRange.replace(/[^0-9.]/g, ""));
  const otherPrice = parseFloat(other.priceRange.replace(/[^0-9.]/g, ""));
  if (otherPrice < currentPrice) reasons.push("Lower price");

  if (other.species === current.species && other.origin !== current.origin) reasons.push("Different origin");
  if (other.species === current.species && other.origin === current.origin) reasons.push("Same species & origin");
  if (other.category === current.category && other.species !== current.species) reasons.push("Same category");

  if (other.supplier.isVerified && !current.supplier.isVerified) reasons.push("Verified supplier");
  if (other.supplier.certifications.length > current.supplier.certifications.length) reasons.push("More certifications");

  return reasons.slice(0, 2).join(" · ") || "Alternative option";
};

const SimilarOffers = ({ current }: { current: SeafoodOffer }) => {
  const similar = mockOffers
    .filter((o) => o.id !== current.id && (o.category === current.category || o.species === current.species))
    .slice(0, 3);

  if (similar.length === 0) return null;

  return (
    <section className="py-10 border-t border-border">
      <div className="mb-1">
        <h2 className="font-heading text-lg font-bold text-foreground">Compare Alternatives</h2>
        <p className="text-sm text-muted-foreground mt-1">Backup sourcing options for the same product category</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
        {similar.map((o) => {
          const FIcon = formatIcon[o.format];
          const reason = getComparisonReason(current, o);
          return (
            <Link key={o.id} to={`/offers/${o.id}`} className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="overflow-hidden rounded-lg mb-3">
                <img src={o.image} alt={o.productName} className="aspect-[16/10] w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} />
              </div>
              <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary mb-2">
                {reason}
              </span>
              <p className="font-heading text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">{o.productName}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <FIcon className="h-3 w-3" /> {o.format} · {o.originFlag} {o.origin}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-heading text-sm font-bold text-foreground">{o.priceRange} <span className="font-normal text-muted-foreground">{o.priceUnit}</span></p>
                <span className="text-[10px] text-muted-foreground">{o.moq}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarOffers;
