import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ArrowRight, BookmarkX } from "lucide-react";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockSavedOffers, type SavedOfferEntry } from "@/data/mockWorkspace";
import { mockOffers } from "@/data/mockOffers";
import { formatDate } from "@/lib/format";
import analytics from "@/lib/analytics";

const WorkspaceSaved = () => {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<SavedOfferEntry[]>(mockSavedOffers);

  const remove = (offerId: string) => {
    setItems((prev) => prev.filter((i) => i.offerId !== offerId));
    analytics.track("workspace_saved_offer_remove", { offerId });
  };

  const onOpen = (offerId: string) => {
    analytics.track("workspace_saved_offer_open", { offerId });
  };

  return (
    <WorkspaceLayout section="saved">
      <div className="space-y-6">
        <div>
          <h1 data-testid="page-title" className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {t.workspace_saved_title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.workspace_saved_subtitle}</p>
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center" data-testid="workspace-saved-empty">
            <BookmarkX className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t.workspace_saved_empty}</p>
          </Card>
        ) : (
          <ul className="grid gap-3" data-testid="workspace-saved-list">
            {items.map((entry) => {
              const offer = mockOffers.find((o) => o.id === entry.offerId);
              if (!offer) return null;
              return (
                <li key={entry.offerId}>
                  <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{offer.originFlag}</span>
                        <span className="text-sm text-muted-foreground">{offer.origin}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{offer.supplierName}</span>
                      </div>
                      <p className="mt-1 font-medium text-foreground line-clamp-1">{offer.productName}</p>
                      {entry.note && (
                        <p className="mt-1 text-xs text-muted-foreground italic">{entry.note}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t.workspace_saved_savedAt.replace("{date}", formatDate(entry.savedAt, lang))}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        onClick={() => onOpen(entry.offerId)}
                        data-testid={`workspace-saved-open-${entry.offerId}`}
                      >
                        <Link to={`/offers/${entry.offerId}`}>
                          {t.workspace_saved_open}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(entry.offerId)}
                        aria-label={t.workspace_saved_remove}
                        data-testid={`workspace-saved-remove-${entry.offerId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </WorkspaceLayout>
  );
};

export default WorkspaceSaved;
