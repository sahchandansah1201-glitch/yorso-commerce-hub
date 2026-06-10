import { type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Header from "@/components/landing/Header";
import { AccountOverview } from "./AccountOverview";
import { AccountSidebar } from "./AccountSidebar";
import { getAccountProfile } from "@/lib/account-store";
import type { AccountProfile } from "@/data/mockAccount";
import { type AccountSectionKey } from "./account-sections";

export type { AccountSectionKey };

interface Props {
  active: AccountSectionKey;
  children: ReactNode;
  profile?: AccountProfile;
}

export const AccountShell = ({ active, children, profile: profileProp }: Props) => {
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

  const profile = profileProp ?? getAccountProfile();

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

        {/* Mobile section tabs — sticky so the user can switch разделы без скролла наверх */}
        <div className="sticky top-[64px] z-20 -mx-4 mb-4 border-b border-border/60 bg-background/95 px-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
          <AccountSidebar active={active} variant="chips" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          {/* Sidebar */}
          <aside className="hidden lg:block" data-testid="account-sidebar">
            <AccountSidebar active={active} variant="rail" />
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
