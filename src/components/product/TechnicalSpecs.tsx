interface Props {
  specs: { label: string; value: string }[];
}

export const TechnicalSpecs = ({ specs }: Props) => (
  <section>
    <h2 className="font-heading text-xl font-bold text-foreground mb-4">Technical Specifications</h2>
    <div className="rounded-lg border border-border overflow-hidden">
      {specs.map((spec, i) => (
        <div
          key={spec.label}
          className={`flex text-sm ${i % 2 === 0 ? "bg-card" : "bg-muted/40"}`}
        >
          <span className="w-[40%] shrink-0 px-4 py-2.5 font-medium text-foreground border-r border-border">
            {spec.label}
          </span>
          <span className="px-4 py-2.5 text-muted-foreground">{spec.value}</span>
        </div>
      ))}
    </div>
  </section>
);
