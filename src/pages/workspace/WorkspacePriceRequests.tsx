import { Link } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPriceRequests, type PriceRequestStatus } from "@/data/mockWorkspace";
import { formatDate } from "@/lib/format";
import analytics from "@/lib/analytics";

const statusBadge = (status: PriceRequestStatus, t: ReturnType<typeof useLanguage>["t"]) => {
  switch (status) {
    case "pending":
      return { icon: Clock, label: t.workspace_priceReq_status_pending, className: "bg-amber-50 text-amber-900 border-amber-200" };
    case "approved":
      return { icon: CheckCircle2, label: t.workspace_priceReq_status_approved, className: "bg-emerald-50 text-emerald-900 border-emerald-200" };
    case "rejected":
      return { icon: XCircle, label: t.workspace_priceReq_status_rejected, className: "bg-rose-50 text-rose-900 border-rose-200" };
  }
};

const WorkspacePriceRequests = () => {
  const { t, lang } = useLanguage();

  return (
    <WorkspaceLayout section="price_requests">
      <div className="space-y-6">
        <div>
          <h1 data-testid="page-title" className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {t.workspace_priceReq_title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.workspace_priceReq_subtitle}</p>
        </div>

        {mockPriceRequests.length === 0 ? (
          <Card className="p-10 text-center" data-testid="workspace-price-empty">
            <p className="text-sm text-muted-foreground">{t.workspace_priceReq_empty}</p>
          </Card>
        ) : (
          <ul className="grid gap-3" data-testid="workspace-price-list">
            {mockPriceRequests.map((req) => {
              const badge = statusBadge(req.status, t);
              const Icon = badge.icon;
              return (
                <li key={req.id}>
                  <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`gap-1 ${badge.className}`} data-testid={`workspace-price-status-${req.id}`}>
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{req.supplier}</span>
                      </div>
                      <p className="mt-1 font-medium text-foreground line-clamp-1">{req.product}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t.workspace_priceReq_requestedAt.replace("{date}", formatDate(req.requestedAt, lang))}
                        {req.respondedAt && (
                          <>
                            {" · "}
                            {t.workspace_priceReq_respondedAt.replace("{date}", formatDate(req.respondedAt, lang))}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        analytics.track("workspace_price_request_open", { requestId: req.id, status: req.status })
                      }
                      data-testid={`workspace-price-open-${req.id}`}
                    >
                      <Link to={`/offers/${req.offerId}`}>
                        {t.workspace_priceReq_open}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
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

export default WorkspacePriceRequests;
