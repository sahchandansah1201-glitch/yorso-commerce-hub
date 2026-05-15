import { useEffect, useRef, useState } from "react";
import { CheckCheck, Inbox, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSupplierAccessNotifications } from "@/lib/use-supplier-access-notifications";
import type {
  SupplierAccessNotificationFeedItem,
  SupplierAccessNotificationsFeed,
} from "@/lib/use-supplier-access-notifications";

const formatNotificationDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

interface SupplierAccessNotificationRowProps {
  notification: SupplierAccessNotificationFeedItem;
  onOpen: (notification: SupplierAccessNotificationFeedItem) => void;
}

const SupplierAccessNotificationRow = ({
  notification,
  onOpen,
}: SupplierAccessNotificationRowProps) => {
  const { t } = useLanguage();
  const unread = notification.status === "unread";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full items-start gap-2.5 px-3 py-3 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
          unread ? "bg-primary/5" : ""
        }`}
        data-testid={`supplier-access-notification-${notification.id}`}
      >
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Inbox className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>{t.supplier_notifications_priceAccessApproved}</span>
            <span aria-hidden>·</span>
            <span>{formatNotificationDate(notification.createdAt)}</span>
          </span>
          <span className="mt-0.5 block text-xs font-semibold leading-snug text-foreground">
            {notification.title || t.supplier_notifications_priceAccessApproved}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
            {notification.body || t.supplier_notifications_defaultBody}
          </span>
          <span className="mt-1 block text-[10px] font-medium text-primary">
            {t.supplier_notifications_openSupplier}
          </span>
        </span>
        {unread && (
          <span
            className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            aria-label={t.supplier_notifications_unread}
          />
        )}
      </button>
    </li>
  );
};

interface SupplierAccessNotificationsPopoverProps {
  onClose: () => void;
  feed: SupplierAccessNotificationsFeed;
}

export const SupplierAccessNotificationsPopover = ({
  onClose,
  feed,
}: SupplierAccessNotificationsPopoverProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    status,
    usingSelfHostedApi,
    markAllRead,
    markRead,
    refresh,
  } = feed;

  const handleOpen = async (notification: SupplierAccessNotificationFeedItem) => {
    if (notification.status === "unread") {
      await markRead([notification.id]);
    }
    navigate(`/suppliers/${encodeURIComponent(notification.supplierId)}`);
    onClose();
  };

  return (
    <div
      className="w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
      data-testid="supplier-access-notifications-popover"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            {t.supplier_notifications_title}
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {usingSelfHostedApi
              ? t.supplier_notifications_subtitle
              : t.supplier_notifications_localMode}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.aria_close}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} ${t.supplier_notifications_unreadBadge.toLowerCase()}`
            : t.supplier_notifications_allCaughtUp}
        </span>
        <div className="flex items-center gap-2">
          {status === "loading" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="rounded text-[11px] font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid="supplier-access-notifications-mark-all"
            >
              {t.supplier_notifications_markAllRead}
            </button>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded text-[11px] font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            data-testid="supplier-access-notifications-refresh"
          >
            {t.supplier_notifications_refresh}
          </button>
        </div>
      </div>

      {status === "error" && (
        <p
          className="border-b border-border bg-destructive/5 px-3 py-2 text-[11px] text-destructive"
          role="alert"
        >
          {t.supplier_notifications_error}
        </p>
      )}

      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-7 text-center" data-testid="supplier-access-notifications-empty">
            <Inbox className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-foreground">
              {t.supplier_notifications_emptyTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t.supplier_notifications_emptyBody}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((notification) => (
              <SupplierAccessNotificationRow
                key={notification.id}
                notification={notification}
                onOpen={handleOpen}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const SupplierAccessNotificationBell = () => {
  const { t } = useLanguage();
  const feed = useSupplierAccessNotifications({ autoLoad: false });
  const { unreadCount, refresh } = feed;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      if (next) void refresh();
      return next;
    });
  };

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={t.supplier_notifications_aria}
        aria-expanded={open}
        data-testid="header-supplier-access-notifications-bell"
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Inbox className="h-4 w-4" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
            aria-label={`${unreadCount} ${t.supplier_notifications_unreadBadge}`}
            data-testid="header-supplier-access-notifications-count"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1">
          <SupplierAccessNotificationsPopover
            feed={feed}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export const SupplierAccessNotificationsInlineSummary = () => {
  const { t } = useLanguage();
  const { unreadCount, status } = useSupplierAccessNotifications();

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground"
      data-testid="supplier-access-notifications-inline-summary"
    >
      <CheckCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
      {status === "loading"
        ? t.supplier_notifications_loading
        : unreadCount > 0
          ? `${unreadCount} ${t.supplier_notifications_unreadBadge.toLowerCase()}`
          : t.supplier_notifications_allCaughtUp}
    </div>
  );
};
