import { BookOpen, Clock } from "lucide-react";
import type { RelatedArticle } from "@/data/mockOffers";

const RelatedArticles = ({ articles }: { articles: RelatedArticle[] }) => {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-10 border-t border-border">
      <h2 className="font-heading text-lg font-bold text-foreground mb-1">Related Market Insights</h2>
      <p className="text-sm text-muted-foreground mb-5">Context-relevant articles to support your sourcing decision</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <div key={a.id} className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <BookOpen className="h-2.5 w-2.5" /> {a.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" /> {a.readTime}
              </span>
            </div>
            <p className="font-heading text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
              {a.title}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Related: {a.relevanceReason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
