import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { AccountProfile, AccountCompletionItem } from "@/data/mockAccount";
import { calculateAccountCompletion } from "@/lib/account-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface Props {
  profile: AccountProfile;
}

const GROUP_KEYS: Record<AccountCompletionItem["group"], string> = {
  user_profile: "account_overview_group_user",
  company_profile: "account_overview_group_company",
  supplier_readiness: "account_overview_group_supplier",
  buyer_matching: "account_overview_group_buyer",
  notifications: "account_overview_group_notifications",
};

export const AccountOverview = ({ profile }: Props) => {
  const { t } = useLanguage();
  const { items, percent } = useMemo(() => calculateAccountCompletion(profile), [profile]);

  const grouped = useMemo(() => {
    const map = new Map<AccountCompletionItem["group"], AccountCompletionItem[]>();
    for (const it of items) {
      const arr = map.get(it.group) ?? [];
      arr.push(it);
      map.set(it.group, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  const next = items.find((i) => !i.done);

  return (
    <Card data-testid="account-overview">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">{t.account_overview_title}</CardTitle>
          <span className="text-2xl font-bold text-primary" data-testid="account-overview-percent">
            {percent}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {next ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t.account_overview_nextAction}: </span>
            {t[next.labelKey as keyof typeof t] as string}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t.account_overview_allDone}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {grouped.map(([group, list]) => (
          <div key={group} className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t[GROUP_KEYS[group] as keyof typeof t] as string}
            </p>
            <ul className="space-y-1">
              {list.map((it) => (
                <li key={it.id} className="flex items-start gap-2 text-xs">
                  {it.done ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className={it.done ? "text-foreground" : "text-muted-foreground"}>
                    {t[it.labelKey as keyof typeof t] as string}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AccountOverview;
