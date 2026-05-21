import { Link, useLocation } from "react-router-dom";
import { Activity, ClipboardCheck, Gauge, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/admin",
    icon: Gauge,
    id: "overview",
    label: "Operations",
    testId: "admin-operator-nav-overview",
  },
  {
    href: "/admin/access-requests",
    icon: ClipboardCheck,
    id: "access_requests",
    label: "Requests",
    testId: "admin-operator-nav-access-requests",
  },
  {
    href: "/admin/access-grants",
    icon: KeyRound,
    id: "access_grants",
    label: "Grants",
    testId: "admin-operator-nav-access-grants",
  },
  {
    href: "/admin/runtime",
    icon: Activity,
    id: "runtime",
    label: "Runtime",
    testId: "admin-operator-nav-runtime",
  },
] as const;

export function AdminOperatorNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Admin operator sections"
      className="rounded-[1.5rem] border border-border bg-card p-2 shadow-sm"
      data-testid="admin-operator-nav"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((item) => {
          const active = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-orange-100 text-orange-800"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              data-testid={item.testId}
              key={item.id}
              to={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
