import { cloneElement, useId, type ReactElement, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";

/* ─────────────────────────────────────────────────────────────────
 * Account form primitives — shared across all `/account/*` sections.
 * Keep these visually minimal: muted uppercase label, prominent value.
 * ───────────────────────────────────────────────────────────────── */

export const fallback = (v: string | undefined, nf: string) =>
  v && v.trim() ? v : nf;

export const splitList = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Read-only field for an account profile section.
 * Renders dt/dd inside a `<dl>` grid container.
 */
export const Field = ({
  label,
  value,
  badge,
  className,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
  className?: string;
}) => {
  const { t } = useLanguage();
  const isEmpty = !value || !value.trim();
  return (
    <div className={`min-w-0 ${className ?? ""}`.trim()}>
      <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          isEmpty
            ? "mt-1 flex items-center text-[15px] italic text-muted-foreground"
            : "mt-1 flex items-center text-[15px] font-medium text-foreground"
        }
        title={isEmpty ? undefined : value}
      >
        <span className="truncate">{fallback(value, t.account_value_notSpecified)}</span>
        {badge}
      </dd>
    </div>
  );
};

/**
 * Edit-mode row: small label + a single input/select/textarea + hint or error.
 * The child gets `id`, `aria-invalid`, `aria-describedby` injected automatically.
 */
export const FormRow = ({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactElement;
}) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const enhancedChild = (() => {
    try {
      const childProps = (children.props ?? {}) as Record<string, unknown>;
      return cloneElement(children, {
        id: (childProps.id as string | undefined) ?? id,
        "aria-invalid": !!error || undefined,
        "aria-describedby":
          [
            (childProps["aria-describedby"] as string | undefined) ?? "",
            describedBy ?? "",
          ]
            .filter(Boolean)
            .join(" ") || undefined,
        className:
          [
            (childProps.className as string | undefined) ?? "",
            error ? "border-destructive focus-visible:ring-destructive" : "",
          ]
            .filter(Boolean)
            .join(" ")
            .trim() || undefined,
      } as Record<string, unknown>);
    } catch {
      return children;
    }
  })();

  return (
    <div className={`space-y-1 ${className ?? ""}`.trim()}>
      <Label htmlFor={id} className="text-xs">
        {label}{" "}
        {required ? (
          <span aria-hidden className="text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {enhancedChild}
      {error ? (
        <p id={errorId} className="flex items-start gap-1 text-xs text-destructive" role="alert">
          <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

/**
 * Compact placeholder for "feature coming later" rows.
 * Matches the Security row style on the Personal tab.
 */
export const PendingFeatureRow = ({
  icon,
  title,
  description,
  testId,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  testId?: string;
}) => (
  <div
    className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3"
    data-testid={testId}
  >
    <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);
