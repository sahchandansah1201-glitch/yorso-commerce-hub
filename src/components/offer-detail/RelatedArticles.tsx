import { Link } from "react-router-dom";
import { BookOpen, Clock } from "lucide-react";
import type { RelatedArticle } from "@/data/mockOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import { interpolate } from "@/lib/supplier-i18n";

const localizedCategory = (
  category: string,
  t: ReturnType<typeof useLanguage>["t"],
) => ({
  "Buying Guide": t.offerDetail_relatedCategoryBuyingGuide,
  Logistics: t.offerDetail_relatedCategoryLogistics,
  "Market Analysis": t.offerDetail_relatedCategoryMarketAnalysis,
}[category] ?? category);

const localizedRelevance = (
  reason: string,
  t: ReturnType<typeof useLanguage>["t"],
) => ({
  "Same species": t.offerDetail_relatedReasonSameSpecies,
  "Same species group": t.offerDetail_relatedReasonSameSpeciesGroup,
  "Delivery basis": t.offerDetail_relatedReasonDeliveryBasis,
  "Same origin": t.offerDetail_relatedReasonSameOrigin,
}[reason] ?? reason);

const RelatedArticles = ({ articles }: { articles: RelatedArticle[] }) => {
  const { t } = useLanguage();
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-10 border-t border-border" data-testid="offer-related-insights">
      <h2 className="font-heading text-lg font-bold text-foreground mb-1">{t.offerDetail_relatedInsightsTitle}</h2>
      <p className="text-sm text-muted-foreground mb-5">{t.offerDetail_relatedInsightsSubtitle}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <Link
            key={a.id}
            to={`/blog/${a.slug}`}
            className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            aria-label={interpolate(t.offerDetail_openMarketInsight, { title: a.title })}
            data-offer-detail-decision-target="related-insight"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <BookOpen className="h-2.5 w-2.5" /> {localizedCategory(a.category, t)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" /> {a.readTime}
              </span>
            </div>
            <p className="font-heading text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
              {a.title}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.offerDetail_relatedLabel} {localizedRelevance(a.relevanceReason, t)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
