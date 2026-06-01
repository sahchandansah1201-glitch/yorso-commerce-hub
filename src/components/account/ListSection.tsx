import { type ReactNode } from "react";
import { Plus } from "lucide-react";
import { AccountSectionCard } from "@/components/account/AccountSectionCard";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────────────
 * Shared list-section primitives for `/account/*` CRUD tabs.
 * (Branches, Products, Meta-Regions, Notifications)
 *
 * Kept intentionally small. Each section owns its own filters,
 * draft state and item-card markup — only the repeated chrome
 * (header toolbar + empty/no-results card) is extracted here.
 * ───────────────────────────────────────────────────────────────── */

/**
 * Top toolbar of a list section: title + description + explainer + Add button.
 * Used as the first child of Branches/Products/Meta-Regions/Notifications.
 */
export const ListSectionHeader = ({
  title,
  description,
  explainer,
  explainerTestId,
  action,
}: {
  title: string;
  description?: string;
  explainer?: ReactNode;
  explainerTestId?: string;
  action?: {
    label: string;
    onClick: () => void;
    testId?: string;
    icon?: ReactNode;
  };
}) => (
  <AccountSectionCard title={title} description={description}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {explainer ? (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground" data-testid={explainerTestId}>
          {explainer}
        </p>
      ) : (
        <span />
      )}
      {action ? (
        <Button
          type="button"
          onClick={action.onClick}
          className="min-h-11 shrink-0 px-5 sm:min-h-10"
          data-testid={action.testId}
        >
          {action.icon ?? <Plus className="mr-2 h-4 w-4" aria-hidden />}
          {action.label}
        </Button>
      ) : null}
    </div>
  </AccountSectionCard>
);

/**
 * Uniform empty / no-results card.
 * Pass `action` for "no filter matches → reset" cases.
 */
export const ListEmpty = ({
  title,
  description,
  action,
  testId,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; testId?: string };
  testId?: string;
}) => (
  <AccountSectionCard title={title} testId={testId}>
    {description ? (
      <p className="text-sm text-muted-foreground">{description}</p>
    ) : null}
    {action ? (
      <Button
        type="button"
        variant="outline"
        onClick={action.onClick}
        data-testid={action.testId}
        className={description ? "mt-3" : undefined}
      >
        {action.label}
      </Button>
    ) : null}
  </AccountSectionCard>
);
