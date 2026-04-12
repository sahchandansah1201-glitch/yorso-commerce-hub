import { Snowflake, Scissors, Flag, MapPin, Anchor, ShieldCheck, Clock, Users } from "lucide-react";

const badgeIcons: Record<string, React.ElementType> = {
  snowflake: Snowflake,
  scissors: Scissors,
  flag: Flag,
  map: MapPin,
  anchor: Anchor,
};

interface Props {
  product: {
    name: string;
    h1: string;
    latinName: string;
    shortSummary: string;
    whyBuyersChoose: string;
    badges: { label: string; icon: string }[];
    image: string;
  };
  isLoggedIn: boolean;
}

export const ProductHero = ({ product }: Props) => (
  <div>
    {/* Product image */}
    <div className="overflow-hidden rounded-xl border border-border bg-muted aspect-[16/9] mb-6">
      <img
        src={product.image}
        alt={product.h1}
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
    </div>

    {/* Badges */}
    <div className="flex flex-wrap gap-2 mb-4">
      {product.badges.map((badge) => {
        const Icon = badgeIcons[badge.icon] || Snowflake;
        return (
          <span
            key={badge.label}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
          >
            <Icon className="h-3 w-3 text-muted-foreground" />
            {badge.label}
          </span>
        );
      })}
    </div>

    {/* H1 */}
    <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl lg:text-4xl leading-tight">
      {product.h1}
    </h1>

    <p className="mt-1 text-sm italic text-muted-foreground">{product.latinName}</p>

    {/* Short summary */}
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-2xl">
      {product.shortSummary}
    </p>

    {/* Why buyers choose */}
    <p className="mt-3 text-sm text-foreground/80 border-l-2 border-primary pl-3">
      {product.whyBuyersChoose}
    </p>

    {/* Trust signal row */}
    <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        380+ verified suppliers
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        2,100+ active buyers
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        Avg. response &lt; 24h
      </span>
    </div>
  </div>
);
