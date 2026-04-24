import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, Globe, ChevronDown, LogOut, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { languageNames, languageFlags, type Language } from "@/i18n/translations";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import analytics from "@/lib/analytics";

const langs: Language[] = ["en", "ru", "es"];

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { session, isSignedIn, signOut } = useBuyerSession();

  const handleSignOut = () => {
    setAccountOpen(false);
    setMobileOpen(false);
    signOut();
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

          {isSignedIn && session ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                aria-label={t.nav_myAccount}
                data-testid="header-account-menu"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(session.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate">{session.displayName}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[220px] rounded-lg border border-border bg-card p-1 shadow-lg">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{session.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.identifier}</p>
                  </div>
                  <Link
                    to="/offers"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span>{t.nav_liveOffers}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    data-testid="header-signout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t.nav_signOut}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin" onClick={() => analytics.track("header_signin_click")}>
                <Button variant="ghost" size="sm">{t.nav_signIn}</Button>
              </Link>
              <Link to="/register" onClick={() => analytics.track("header_register_click")}>
                <Button size="sm" className="font-semibold">{t.nav_registerFree}</Button>
              </Link>
            </>
          )}
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

          {isSignedIn && session ? (
            <div className="mt-4 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(session.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{session.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.identifier}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={handleSignOut}
                data-testid="header-mobile-signout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.nav_signOut}
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <Link to="/signin" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">{t.nav_signIn}</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full font-semibold">{t.nav_registerFree}</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
