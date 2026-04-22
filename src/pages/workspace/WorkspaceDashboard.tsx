import { Link } from "react-router-dom";
import { Bookmark, MailOpen, MessagesSquare, Building2, ArrowRight, Eye, MessageSquare, BadgeDollarSign } from "lucide-react";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  mockActivity,
  workspaceKpis,
  type ActivityItem,
} from "@/data/mockWorkspace";
import { formatDate } from "@/lib/format";
import analytics from "@/lib/analytics";

const activityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "offer_view":
      return Eye;
    case "price_request":
      return BadgeDollarSign;
    case "message":
      return MessageSquare;
  }
};

const WorkspaceDashboard = () => {
  const { t, lang } = useLanguage();
  const { session } = useBuyerSession();
  const kpis = workspaceKpis();

  const greeting = session ? t.workspace_greeting.replace("{name}", session.displayName) : "";

  const kpiCards = [
    { id: "saved", label: t.workspace_kpi_saved, value: kpis.savedCount, icon: Bookmark, to: "/workspace/saved" },
    { id: "price", label: t.workspace_kpi_priceRequests, value: kpis.pendingPriceRequests, icon: BadgeDollarSign, to: "/workspace/price-requests" },
    { id: "unread", label: t.workspace_kpi_unread, value: kpis.unreadMessages, icon: MailOpen, to: "/workspace/messages" },
    { id: "suppliers", label: t.workspace_kpi_suppliers, value: kpis.activeSuppliers, icon: Building2, to: "/workspace/messages" },
  ];

  const activityLabel = (item: ActivityItem) => {
    switch (item.type) {
      case "offer_view":
        return `${t.workspace_activity_offer_view}: ${item.label}`;
      case "price_request":
        return `${t.workspace_activity_price_request} ${item.label}`;
      case "message":
        return `${t.workspace_activity_message} ${item.label}`;
    }
  };

  return (
    <WorkspaceLayout section="dashboard">
      <div className="space-y-8">
        <div>
          <h1 data-testid="page-title" className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {t.workspace_dashboard_title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.workspace_dashboard_subtitle}</p>
          {greeting && (
            <p className="sr-only" data-testid="workspace-greeting-text">
              {greeting}
            </p>
          )}
        </div>

        <section
          aria-label={t.workspace_dashboard_title}
          data-testid="workspace-kpis"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {kpiCards.map((k) => (
            <Link key={k.id} to={k.to} className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{k.label}</span>
                  <k.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-foreground" data-testid={`workspace-kpi-${k.id}`}>
                  {k.value}
                </div>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">{t.workspace_recentActivity}</h2>
            <ul className="mt-4 divide-y divide-border" data-testid="workspace-activity">
              {mockActivity.map((item) => {
                const Icon = activityIcon(item.type);
                return (
                  <li key={item.id} className="py-3 flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activityLabel(item)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.at, lang, { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">{t.workspace_quickActions}</h2>
            <div className="mt-4 space-y-2" data-testid="workspace-quick-actions">
              <Button
                asChild
                variant="default"
                className="w-full justify-between"
                onClick={() => analytics.track("workspace_quick_action_click", { action: "browse_offers" })}
              >
                <Link to="/offers">
                  {t.workspace_action_browseOffers}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-between"
                onClick={() => analytics.track("workspace_quick_action_click", { action: "view_saved" })}
              >
                <Link to="/workspace/saved">
                  {t.workspace_action_viewSaved}
                  <Bookmark className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-between"
                onClick={() => analytics.track("workspace_quick_action_click", { action: "open_messages" })}
              >
                <Link to="/workspace/messages">
                  {t.workspace_action_openMessages}
                  <MessagesSquare className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </WorkspaceLayout>
  );
};

export default WorkspaceDashboard;
