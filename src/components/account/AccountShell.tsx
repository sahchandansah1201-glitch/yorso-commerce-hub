import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User,
  Building2,
  MapPin,
  Package,
  Globe2,
  Bell,
  LogIn,
} from "lucide-react";
import Header from "@/components/landing/Header";
import { AccountOverview } from "./AccountOverview";
import { getAccountProfile } from "@/lib/account-store";
import type { AccountProfile } from "@/data/mockAccount";

export type AccountSectionKey =
  | "personal"
  | "company"
  | "branches"
  | "products"
  | "meta-regions"
  | "notifications";

interface Props {
  active: AccountSectionKey;
  children: ReactNode;
  profile?: AccountProfile;
}

export const ACCOUNT_SECTIONS: { key: AccountSectionKey; icon: typeof User; labelKey: string }[] = [
  { key: "personal", icon: User, labelKey: "account_nav_personal" },
  { key: "company", icon: Building2, labelKey: "account_nav_company" },
  { key: "branches", icon: MapPin, labelKey: "account_nav_branches" },
  { key: "products", icon: Package, labelKey: "account_nav_products" },
  { key: "meta-regions", icon: Globe2, labelKey: "account_nav_metaRegions" },
  { key: "notifications", icon: Bell, labelKey: "account_nav_notifications" },
];

export const AccountShell = ({ active, children }: Props) => {
  const { t } = useLanguage();
  const { isSignedIn } = useBuyerSession();

  if (!isSignedIn && typeof window !== "undefined" && !import.meta.env.MODE.includes("test")) {
    // In test/preview, allow render without session for QA. Real gate below.
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main
          className="container py-16 max-w-xl"
          data-testid="account-signin-required"
        >
          <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
            <LogIn className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <h1 className="font-heading text-2xl font-semibold">{t.account_signinRequired_title}</h1>
            <p className="text-sm text-muted-foreground">{t.account_signinRequired_body}</p>
            <Button asChild>
              <Link to="/signin">{t.account_signinRequired_cta}</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const profile = getAccountProfile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 lg:py-10">
        <div className="mb-6 space-y-1">
          <h1 className="font-heading text-2xl font-semibold lg:text-3xl">
            {t.account_workspace_title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.account_workspace_subtitle}</p>
        </div>

        {/* Mobile section tabs */}
        <nav
          className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden"
          aria-label={t.account_nav_aria}
          data-testid="account-mobile-nav"
        >
          {ACCOUNT_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <NavLink
                key={s.key}
                to={`/account/${s.key}`}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {t[s.labelKey as keyof typeof t] as string}
              </NavLink>
            );
          })}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          {/* Sidebar */}
          <aside className="hidden lg:block" data-testid="account-sidebar">
            <nav aria-label={t.account_nav_aria} className="sticky top-20 space-y-1">
              {ACCOUNT_SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = s.key === active;
                return (
                  <NavLink
                    key={s.key}
                    to={`/account/${s.key}`}
                    className={({ isActive: navActive }) => {
                      const a = navActive || isActive;
                      return `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        a
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`;
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {t[s.labelKey as keyof typeof t] as string}
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <section className="min-w-0 space-y-4" data-testid="account-content">
            {children}
            <p className="text-[11px] text-muted-foreground" data-testid="account-prototype-note">
              {t.account_prototype_savedLocally}
            </p>
          </section>

          {/* Right overview (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <AccountOverview profile={profile} />
            </div>
          </aside>

          {/* Mobile overview at bottom */}
          <div className="lg:hidden">
            <AccountOverview profile={profile} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountShell;
