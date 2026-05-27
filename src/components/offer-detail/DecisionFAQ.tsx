import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const DecisionFAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { t } = useLanguage();

  return (
    <section className="py-10 border-t border-border" data-testid="offer-decision-faq">
      <h2 className="font-heading text-lg font-bold text-foreground mb-6">{t.offerDetail_decisionFaqTitle}</h2>
      <div className="space-y-2">
        {t.offerDetail_decisionFaqItems.map((item, i) => {
          const open = openIdx === i;
          const answerId = `offer-decision-faq-answer-${i}`;

          return (
            <div key={i} className="rounded-lg border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={open}
                aria-controls={answerId}
                data-offer-detail-decision-target="decision-faq"
              >
                <span className="text-sm font-medium text-foreground">{item.question}</span>
                {open ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {open && (
                <p id={answerId} className="px-4 pb-3 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DecisionFAQ;
