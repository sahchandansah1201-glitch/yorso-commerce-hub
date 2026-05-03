import { useState, type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { toast } from "sonner";

interface RenderArgs<T> {
  draft: T;
  setDraft: (v: T) => void;
  errors: Record<string, string>;
}

interface Props<T> {
  title: string;
  description?: string;
  testId?: string;
  initial: T;
  validate?: (draft: T) => Record<string, string>;
  /** May throw or return a rejected promise to surface a save error. */
  onSave: (draft: T) => void | Promise<void>;
  renderView: (value: T) => ReactNode;
  renderEdit: (args: RenderArgs<T>) => ReactNode;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function EditableCard<T>({
  title,
  description,
  testId,
  initial,
  validate,
  onSave,
  renderView,
  renderEdit,
}: Props<T>) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<string | null>(null);

  const enter = () => {
    setDraft(initial);
    setErrors({});
    setSaveState("idle");
    setSaveError(null);
    setValidationSummary(null);
    setEditing(true);
  };
  const cancel = () => {
    setDraft(initial);
    setErrors({});
    setSaveState("idle");
    setSaveError(null);
    setValidationSummary(null);
    setEditing(false);
  };
  const save = async () => {
    const errs = validate ? validate(draft) : {};
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setValidationSummary(t.account_save_error_validation);
      setSaveState("error");
      return;
    }
    setErrors({});
    setValidationSummary(null);
    setSaveState("saving");
    setSaveError(null);
    try {
      await Promise.resolve(onSave(draft));
      setSaveState("saved");
      toast.success(t.account_action_saved);
      setEditing(false);
      // brief grace period so the indicator is visible if user reopens edit
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : t.account_save_error_storage;
      setSaveError(msg);
      setSaveState("error");
      toast.error(t.account_save_error_storage);
    }
  };

  const isSaving = saveState === "saving";

  return (
    <Card data-testid={testId} data-editing={editing ? "true" : "false"} data-save-state={saveState}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {saveState === "saved" && !editing ? (
            <span
              className="inline-flex items-center gap-1 text-xs text-primary"
              data-testid={testId ? `${testId}-saved-indicator` : undefined}
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {t.account_action_saved}
            </span>
          ) : null}
          {!editing ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={enter}
              data-testid={testId ? `${testId}-edit` : undefined}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t.account_action_edit}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={cancel}
                disabled={isSaving}
                data-testid={testId ? `${testId}-cancel` : undefined}
              >
                {t.account_action_cancel}
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={save}
                disabled={isSaving}
                aria-busy={isSaving}
                data-testid={testId ? `${testId}-save` : undefined}
              >
                {isSaving ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    {t.account_action_saving}
                  </span>
                ) : (
                  t.account_action_save
                )}
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="text-sm text-foreground">
        {editing && (validationSummary || saveError) ? (
          <div
            className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
            role="alert"
            data-testid={testId ? `${testId}-error` : undefined}
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{saveError ?? validationSummary}</span>
          </div>
        ) : null}
        {editing ? renderEdit({ draft, setDraft, errors }) : renderView(initial)}
      </CardContent>
    </Card>
  );
}

export default EditableCard;
