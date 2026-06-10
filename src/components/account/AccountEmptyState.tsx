import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * AccountEmptyState — единый пустой стейт для секций /account/*.
 *
 * Используется в Branches/Products/Meta-Regions, когда у пользователя ещё
 * нет ни одной записи, а также как «no results» при фильтрации.
 *
 * Визуально: одна карточка, мягкая иконка-кружок, dark title, muted desc,
 * оранжевая основная CTA. Не использует Card-обёртку, чтобы можно было
 * вкладывать внутрь AccountSectionCard или ListSection без двойной рамки.
 */
interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    testId?: string;
  };
  testId?: string;
}

export const AccountEmptyState = ({
  icon,
  title,
  description,
  action,
  testId,
}: Props) => (
  <div
    className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center"
    data-testid={testId ?? "account-empty-state"}
  >
    {icon ? (
      <div
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground"
      >
        {icon}
      </div>
    ) : null}
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
    {action ? (
      <Button
        type="button"
        onClick={action.onClick}
        className="min-h-11"
        data-testid={action.testId}
      >
        {action.label}
      </Button>
    ) : null}
  </div>
);

export default AccountEmptyState;
