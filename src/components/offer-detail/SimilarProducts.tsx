import { Link } from "react-router-dom";
import { Snowflake, Leaf, Thermometer } from "lucide-react";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import { interpolate } from "@/lib/supplier-i18n";

const formatIcon = { Frozen: Snowflake, Fresh: Leaf, Chilled: Thermometer };

const SimilarProducts = ({
  current,
  accessLevel = current.accessLevel,
}: {
  current: SeafoodOffer;
  accessLevel?: SeafoodOffer["accessLevel"];
}) => {
  const { t } = useLanguage();
  const isQualified = accessLevel === "qualified_unlocked";
  // Primary: same category or species. Fallback: same format, then any.
  let products = mockOffers
    .filter(
      (o) =>
        o.id !== current.id &&
        (o.category === current.category || o.species === current.species)
    )
    .slice(0, 4);

  if (products.length === 0) {
    products = mockOffers
      .filter((o) => o.id !== current.id && o.format === current.format)
      .slice(0, 4);
  }

  if (products.length === 0) {
    products = mockOffers.filter((o) => o.id !== current.id).slice(0, 4);
  }

  if (products.length === 0) return null;

  return (
    <section className="py-10 border-t border-border" data-testid="offer-similar-products">
      <h2 className="font-heading text-lg font-bold text-foreground">
        {t.offerDetail_similarProductsTitle}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        {t.offerDetail_similarProductsSubtitle}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((o) => {
          const FIcon = formatIcon[o.format];
          const relevance =
            o.species === current.species && o.origin !== current.origin
              ? t.offerDetail_similarReasonDifferentOrigin
              : o.category === current.category
              ? t.offerDetail_similarReasonSameCategory
              : o.format === current.format
              ? interpolate(t.offerDetail_similarReasonAlsoFormat, { format: o.format.toLowerCase() })
              : t.offerDetail_similarReasonRelatedProduct;

          return (
            <Link
              key={o.id}
              to={`/offers/${o.id}`}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
              aria-label={interpolate(t.offerDetail_openOfferDetails, { product: o.productName })}
              data-offer-detail-decision-target="similar-product"
            >
              <div className="overflow-hidden bg-muted/20">
                <img
                  src={o.image}
                  alt={interpolate(t.offerDetail_offerImageAlt, { product: o.productName })}
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
                  {isQualified ? o.priceRange : t.offerDetail_priceLocked_label}
                  {isQualified && <span className="font-normal text-muted-foreground"> {o.priceUnit}</span>}
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
