import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccessLevel } from "@/lib/access-level";
import { getRelatedRequests } from "@/data/mockIntelligence";

interface Props {
  category: string | null;
}

export const RelatedRequests = ({ category }: Props) => {
  const { t } = useLanguage();
  const { level } = useAccessLevel();
  const items = getRelatedRequests(category ?? undefined).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">{t.catalog_relatedReq_title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.catalog_relatedReq_subtitle}</p>
        </div>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((r) => (
          <li key={r.id} className="rounded-md border border-border bg-background p-3">
            <p className="font-heading text-sm font-semibold text-foreground">{r.product}</p>
            {r.origin && <p className="mt-0.5 text-[11px] text-muted-foreground">→ {r.origin}</p>}
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <p>
                <span className="uppercase tracking-wide">{t.catalog_relatedReq_volume}:</span>{" "}
                <span className="font-semibold text-foreground">{r.volume}</span>
              </p>
              <p>
                <span className="uppercase tracking-wide">{t.catalog_relatedReq_buyer}:</span>{" "}
                <span className="font-semibold text-foreground">{r.buyerCountryFlag} {r.buyerCountry}</span>
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.postedAgo}</span>
              {level === "qualified_unlocked" ? (
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <MessageSquare className="h-3 w-3" /> {t.catalog_relatedReq_respond}
                </Button>
              ) : (
                <Link to="/register">
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]">
                    {t.catalog_relatedReq_respond} <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RelatedRequests;
