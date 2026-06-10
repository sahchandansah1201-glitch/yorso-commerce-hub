import { NavLink } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ACCOUNT_SECTIONS, type AccountSectionKey } from "./account-sections";

/**
 * AccountSidebar — отдельный примитив, рендерит навигацию между разделами
 * /account/*. Все пункты — реальные `<NavLink>` на роуты, без fake-кнопок.
 *
 * Используется внутри `AccountShell` (desktop sidebar + mobile chip-row),
 * но вынесен отдельно, чтобы можно было переиспользовать в других layout-ах
 * (например, drawer на планшете) без дублирования разметки.
 */
interface Props {
  active: AccountSectionKey;
  /** "rail" — десктоп-сайдбар, "chips" — мобильная горизонтальная полоса. */
  variant?: "rail" | "chips";
}

export const AccountSidebar = ({ active, variant = "rail" }: Props) => {
  const { t } = useLanguage();

  if (variant === "chips") {
    return (
      <nav
        className="flex gap-2 overflow-x-auto pb-2"
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
                `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors min-h-11 ${
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
