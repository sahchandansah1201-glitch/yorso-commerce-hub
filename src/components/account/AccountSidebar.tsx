import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ACCOUNT_SECTIONS, type AccountSectionKey } from "./account-sections";

/**
 * AccountSidebar — навигация между разделами /account/*. Real `<NavLink>`s.
 *
 * variant="rail"  — десктоп-сайдбар.
 * variant="chips" — мобильная горизонтальная полоса. Sticky, чтобы при
 *                   скролле длинных форм пользователь мог переключать разделы
 *                   без возврата наверх. Активный чип автоскроллится в видимую
 *                   область.
 */
interface Props {
  active: AccountSectionKey;
  variant?: "rail" | "chips";
}

export const AccountSidebar = ({ active, variant = "rail" }: Props) => {
  const { t } = useLanguage();
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (variant !== "chips") return;
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active, variant]);

  if (variant === "chips") {
    return (
      <nav
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
        aria-label={t.account_nav_aria}
        data-testid="account-mobile-nav"
      >
        {ACCOUNT_SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = s.key === active;
          return (
            <NavLink
              key={s.key}
              to={`/account/${s.key}`}
              ref={isActive ? activeRef : undefined}
              className={({ isActive: navActive }) =>
                `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors min-h-11 ${
                  navActive || isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t[s.labelKey as keyof typeof t] as string}
            </NavLink>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label={t.account_nav_aria}
      className="sticky top-20 space-y-1"
      data-testid="account-sidebar-nav"
    >
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
  );
};

export default AccountSidebar;
