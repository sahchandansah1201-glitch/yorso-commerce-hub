import { Hash, Info } from "lucide-react";
import { useHowItWorks } from "@/i18n/how-it-works";

/**
 * Компактная полоса "Proof by numbers": показывает счётчики воркфлоу и
 * структурированные поля продукта. Намеренно НЕ содержит метрик бизнес-результата
 * (клиенты, GMV, рост конверсии) — только то, что покупатель реально видит в продукте.
 */
const ProofByNumbers = () => {
  const t = useHowItWorks();

  return (
    <section
      id="proof-by-numbers"
      aria-label={t.proof_eyebrow}
      className="border-b border-border bg-[hsl(var(--cool-gray))]/60 py-12 md:py-16"
    >
      <div className="container max-w-6xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Hash className="h-3.5 w-3.5" />
              {t.proof_eyebrow}
            </span>
            <h2 className="mt-2 font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground sm:text-2xl md:text-[28px]">
              {t.proof_title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground md:text-sm">
              {t.proof_subtitle}
            </p>
          </div>
        </div>

        <ul className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:mt-10 md:grid-cols-4">
          {t.proof_metrics.map((m) => (
            <li
              key={m.label}
              className="flex flex-col gap-1.5 bg-card p-4 md:p-5"
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {m.kind}
              </span>
              <span className="font-heading text-2xl font-bold leading-none tracking-tight text-primary md:text-3xl tabular-nums">
                {m.value}
              </span>
              <span className="text-[12px] font-semibold leading-snug text-foreground md:text-[13px]">
                {m.label}
              </span>
              <span className="text-[11px] leading-relaxed text-muted-foreground md:text-xs">
                {m.why}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 inline-flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground md:text-xs">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{t.proof_disclaimer}</span>
        </p>
      </div>
    </section>
  );
};

export default ProofByNumbers;
