import { ArrowRight } from "lucide-react";

interface RelatedProduct {
  id: string;
  name: string;
  species: string;
  origin: string;
  price: string;
  format: string;
  image: string;
  substituteReason: string;
}

interface Props {
  products: RelatedProduct[];
}

export const RelatedProducts = ({ products }: Props) => (
  <section>
    <h2 className="font-heading text-xl font-bold text-foreground mb-4">Related & Substitute Products</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden group hover:shadow-md transition-shadow">
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <img
              src={p.image}
              alt={p.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
            />
          </div>
          <div className="p-3.5">
            <h3 className="text-sm font-semibold text-foreground leading-snug">{p.name}</h3>
            <p className="mt-0.5 text-xs italic text-muted-foreground">{p.species}</p>
            <p className="mt-1 text-xs text-muted-foreground">{p.origin} · {p.format}</p>
            <p className="mt-1.5 font-heading text-sm font-bold text-foreground">{p.price}</p>
            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-2">
              {p.substituteReason}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
