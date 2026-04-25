import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, ChevronDown, Bell } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { languageNames, languageFlags, type Language } from "@/i18n/translations";
import analytics from "@/lib/analytics";
import { useSignalAlerts } from "@/lib/watched-signals";
import { AlertsPopover } from "@/components/alerts/AlertsPanel";

const langs: Language[] = ["en", "ru", "es"];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

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
