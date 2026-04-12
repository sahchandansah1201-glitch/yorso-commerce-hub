import { Link } from "react-router-dom";
import { Snowflake, Leaf, Thermometer } from "lucide-react";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

const SimilarProducts = ({ current }: { current: SeafoodOffer }) => {
  // Show products from same category but different species, or same species different origin
  const products = mockOffers
    .filter(
      (o) =>
        o.id !== current.id &&
        (o.category === current.category || o.species === current.species)
    )
    .slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className="py-10 border-t border-border">
      <h2 className="font-heading text-lg font-bold text-foreground">
        Explore Similar Products
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        Continue browsing {current.category.toLowerCase()} and related seafood products
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((o) => {
          const FIcon = formatIcon[o.format];
          const relevance =
            o.species === current.species && o.origin !== current.origin
              ? `Same species, ${o.origin} origin`
              : o.category === current.category
              ? `${o.category} category`
              : "Related product";

          return (
            <Link
              key={o.id}
              to={`/offers/${o.id}`}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="overflow-hidden bg-muted/20">
                <img
                  src={o.image}
                  alt={o.productName}
                  className="aspect-[16/10] w-full object-cover transition-transform group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="p-3.5 space-y-2">
                <p className="text-[10px] text-muted-foreground">{relevance}</p>
                <p className="font-heading text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                  {o.productName}
                </p>
                <p className="text-[11px] italic text-muted-foreground">{o.latinName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FIcon className="h-3 w-3" /> {o.format} · {o.originFlag} {o.origin}
                </div>
                <p className="font-heading text-sm font-bold text-foreground">
                  {o.priceRange}{" "}
                  <span className="font-normal text-muted-foreground">{o.priceUnit}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarProducts;
