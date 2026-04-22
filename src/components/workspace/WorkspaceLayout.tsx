import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useWorkspaceGuard } from "@/hooks/use-workspace-guard";
import { Button } from "@/components/ui/button";
import analytics from "@/lib/analytics";
import { cn } from "@/lib/utils";

type TabKey = "dashboard" | "saved" | "price_requests" | "messages";

interface Tab {
  key: TabKey;
  to: string;
  label: (t: ReturnType<typeof useLanguage>["t"]) => string;
}

const TABS: Tab[] = [
  { key: "dashboard", to: "/workspace", label: (t) => t.workspace_tab_dashboard },
  { key: "saved", to: "/workspace/saved", label: (t) => t.workspace_tab_saved },
  { key: "price_requests", to: "/workspace/price-requests", label: (t) => t.workspace_tab_priceRequests },
  { key: "messages", to: "/workspace/messages", label: (t) => t.workspace_tab_messages },
];

const matchActive = (pathname: string, to: string): boolean => {
  if (to === "/workspace") return pathname === "/workspace" || pathname === "/workspace/";
  return pathname === to || pathname.startsWith(`${to}/`);
};

interface Props {
  children: ReactNode;
  /** Stable section identifier for analytics (workspace_view). */
  section: TabKey;
}

const WorkspaceLayout = ({ children, section }: Props) => {
  const { t } = useLanguage();
  const { session, signOut } = useBuyerSession();
  const { isSignedIn } = useWorkspaceGuard();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) return;
    analytics.track("workspace_view", { section });
  }, [section, isSignedIn]);

  const handleSignOut = () => {
    analytics.track("workspace_session_ended");
    signOut();
    navigate("/", { replace: true });
  };

  if (!isSignedIn || !session) {
    // Guard ещё редиректит — показываем пустой каркас, чтобы не мигать UI.
    return <div data-testid="workspace-redirecting" className="min-h-screen bg-background" />;
  }

  const greeting = t.workspace_greeting.replace("{name}", session.displayName);

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="workspace-shell">
      <header className="border-b border-border/60 bg-background/95">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
              YORSO
            </Link>
            <span
              data-testid="workspace-brand"
              className="hidden md:inline text-sm font-medium text-muted-foreground"
            >
              {t.workspace_brand}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span data-testid="workspace-greeting" className="hidden sm:inline text-sm text-muted-foreground">
              {greeting}
            </span>
            <Button
              data-testid="workspace-signout"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {t.workspace_signOut}
            </Button>
          </div>
        </div>
        <nav
          aria-label={t.workspace_brand}
          data-testid="workspace-tabs"
          className="container flex gap-1 overflow-x-auto"
        >
          {TABS.map((tab) => {
            const active = matchActive(location.pathname, tab.to);
            return (
              <Link
                key={tab.key}
                to={tab.to}
                data-testid={`workspace-tab-${tab.key}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  // Only emit on actual cross-tab navigation, not when clicking the active tab.
                  if (!active) {
                    analytics.track("workspace_tab_switch", { from: section, to: tab.key });
                  }
                }}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label(t)}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="container flex-1 py-8">{children}</main>
    </div>
  );
};

export default WorkspaceLayout;
