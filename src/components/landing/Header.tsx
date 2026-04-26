import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, ChevronDown, Bell, LogOut } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { languageNames, languageFlags, type Language } from "@/i18n/translations";
import analytics from "@/lib/analytics";
import { useSignalAlerts } from "@/lib/watched-signals";
import { AlertsPopover } from "@/components/alerts/AlertsPanel";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";

const langs: Language[] = ["en", "ru", "es"];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const { lang, setLang, t } = useLanguage();
  const { unreadCount } = useSignalAlerts();
  const { session, isSignedIn, signOut } = useBuyerSession();
  const initial = (session?.displayName || session?.identifier || "?").trim().charAt(0).toUpperCase();

  // Close alerts popover on outside click / Esc.
  useEffect(() => {
    if (!alertsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!alertsRef.current?.contains(e.target as Node)) setAlertsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAlertsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [alertsOpen]);

  const openAlerts = () => {
    setAlertsOpen((v) => {
      const next = !v;
      if (next) analytics.track("alerts_open", { surface: "header_bell" });
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-bold tracking-tight text-foreground">YORSO</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/offers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t.nav_liveOffers}</Link>
          <a href="/#categories" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t.nav_categories}</a>
          <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t.nav_howItWorks}</a>
          <a href="/#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t.nav_faq}</a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            >
              <Globe className="h-4 w-4" />
              <span>{languageFlags[lang]} {lang.toUpperCase()}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg">
                {langs.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${lang === l ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    <span>{languageFlags[l]}</span>
                    <span>{languageNames[l]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={alertsRef} className="relative">
            <button
              type="button"
              onClick={openAlerts}
              aria-label={t.alerts_bell_aria}
              aria-expanded={alertsOpen}
              data-testid="header-alerts-bell"
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bell className="h-4 w-4" aria-hidden />
              {unreadCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                  aria-label={`${unreadCount} ${t.alerts_panel_unreadBadge}`}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {alertsOpen && (
              <div className="absolute right-0 top-full z-50 mt-1">
                <AlertsPopover onClose={() => setAlertsOpen(false)} />
              </div>
            )}
          </div>

          <Link to="/signin" onClick={() => analytics.track("header_signin_click")}>
            <Button variant="ghost" size="sm">{t.nav_signIn}</Button>
          </Link>
          <Link to="/register" onClick={() => analytics.track("header_register_click")}>
            <Button size="sm" className="font-semibold">{t.nav_registerFree}</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={t.aria_toggleMenu}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link to="/offers" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.nav_liveOffers}</Link>
            <a href="/#categories" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.nav_categories}</a>
            <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.nav_howItWorks}</a>
            <a href="/#faq" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>{t.nav_faq}</a>
          </nav>
          <div className="mt-4 flex gap-2">
            {langs.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors ${lang === l ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground"}`}
              >
                {languageFlags[l]} {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/signin" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">{t.nav_signIn}</Button>
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}>
              <Button className="w-full font-semibold">{t.nav_registerFree}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
