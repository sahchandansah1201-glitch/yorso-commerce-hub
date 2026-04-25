import { Bell, AlertTriangle, Eye, Activity, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSignalAlerts, type SignalAlert } from "@/lib/watched-signals";
import analytics from "@/lib/analytics";

const sevIcon = (sev: SignalAlert["signalSeverity"], cls: string) => {
  if (sev === "alert") return <AlertTriangle className={cls} aria-hidden />;
  if (sev === "watch") return <Eye className={cls} aria-hidden />;
  return <Activity className={cls} aria-hidden />;
};

const sevTone = (sev: SignalAlert["signalSeverity"]) =>
  sev === "alert"
    ? "text-destructive"
    : sev === "watch"
    ? "text-primary"
    : "text-muted-foreground";

interface AlertsListProps {
  surface: "header_bell" | "inline_panel";
  /** Optional callback fired when the user clicks an alert (e.g. close popover). */
  onItemClick?: (alert: SignalAlert) => void;
  /** Maximum visible alerts (older are cut). */
  limit?: number;
}

/**
 * Shared alerts list rendering — used by the header bell popover and the
 * inline /offers panel. Newest alerts are shown first; unread are visually
 * highlighted with an orange dot + bg tint.
 */
export const AlertsList = ({ surface, onItemClick, limit }: AlertsListProps) => {
  const { t } = useLanguage();
  const { alerts, unreadCount, markAllRead, markRead } = useSignalAlerts();

  // Latest first by relying on the natural data order being chronological;
  // updates within mockIntelligence are listed newest-first.
  const visible = limit ? alerts.slice(0, limit) : alerts;

  const handleMarkAllRead = () => {
    analytics.track("alerts_mark_all_read", { count: unreadCount });
    markAllRead();
  };

  const handleClick = (a: SignalAlert) => {
    if (!a.isRead) markRead(a.alertId);
    analytics.track("alerts_item_click", { signalId: a.signalId, alertId: a.alertId });
    onItemClick?.(a);
  };

  if (alerts.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Bell className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-foreground">{t.alerts_panel_empty_title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.alerts_panel_empty_body}</p>
      </div>
    );
  }

  return (
    <div data-testid={`alerts-list-${surface}`}>
      {unreadCount > 0 && (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {unreadCount} {t.alerts_panel_unreadBadge.toLowerCase()}
          </span>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[11px] font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {t.alerts_panel_markAllRead}
          </button>
        </div>
      )}
      <ul className="divide-y divide-border">
        {visible.map((a) => (
          <li key={a.alertId}>
            <button
              type="button"
              onClick={() => handleClick(a)}
              className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                a.isRead ? "" : "bg-primary/5"
              }`}
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
                {sevIcon(a.signalSeverity, `h-3.5 w-3.5 ${sevTone(a.signalSeverity)}`)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span className="font-semibold text-foreground">{a.category}</span>
                  <span aria-hidden>·</span>
                  <span>{a.update.publishedAt}</span>
                </div>
                <p className="mt-0.5 text-xs font-medium leading-snug text-foreground">
                  {a.update.headline}
                </p>
                {a.update.body && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {a.update.body}
                  </p>
                )}
                <p className="mt-1 truncate text-[10px] text-muted-foreground/80">
                  {a.signalText}
                </p>
              </div>
              {!a.isRead && (
                <span
                  className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-label={t.alerts_panel_unreadBadge}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Inline panel variant for /offers — shown above the workspace. */
export const AlertsInlinePanel = () => {
  const { t } = useLanguage();
  const { alerts } = useSignalAlerts();

  // Hide entirely when the user has no subscriptions to keep workspace tidy.
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label={t.alerts_panel_title}
      className="rounded-lg border border-border bg-card"
      data-testid="alerts-inline-panel"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t.alerts_panel_title}
          </h2>
          <p className="text-[11px] text-muted-foreground">{t.alerts_panel_subtitle}</p>
        </div>
      </header>
      <AlertsList surface="inline_panel" limit={5} />
    </section>
  );
};

interface AlertsPopoverProps {
  onClose: () => void;
}

/** Header-bell popover content. Caller controls open state. */
export const AlertsPopover = ({ onClose }: AlertsPopoverProps) => {
  const { t } = useLanguage();
  return (
    <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
      <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">{t.alerts_panel_title}</h3>
          <p className="text-[11px] text-muted-foreground">{t.alerts_panel_subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.aria_close ?? "Close"}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>
      <div className="max-h-[60vh] overflow-y-auto">
        <AlertsList surface="header_bell" onItemClick={onClose} limit={10} />
      </div>
    </div>
  );
};
