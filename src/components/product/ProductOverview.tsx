interface Props {
  product: {
    overview: { paragraphs: string[] };
  };
}

export const ProductOverview = ({ product }: Props) => (
  <section>
    <h2 className="font-heading text-xl font-bold text-foreground mb-4">Product Overview</h2>
    <div className="space-y-3">
      {product.overview.paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          {p}
        </p>
      ))}
    </div>
  </section>
);
