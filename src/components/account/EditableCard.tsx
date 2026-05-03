import { useState, type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  onSave: (draft: T) => void;
  renderView: (value: T) => ReactNode;
  renderEdit: (args: RenderArgs<T>) => ReactNode;
}

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

  const enter = () => {
    setDraft(initial);
    setErrors({});
    setEditing(true);
  };
  const cancel = () => {
    setDraft(initial);
    setErrors({});
    setEditing(false);
  };
  const save = () => {
    const errs = validate ? validate(draft) : {};
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave(draft);
    setErrors({});
    setEditing(false);
  };

  return (
    <Card data-testid={testId} data-editing={editing ? "true" : "false"}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {!editing ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={enter}
            data-testid={testId ? `${testId}-edit` : undefined}
          >
            {t.account_action_edit}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={cancel}
              data-testid={testId ? `${testId}-cancel` : undefined}
            >
              {t.account_action_cancel}
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={save}
              data-testid={testId ? `${testId}-save` : undefined}
            >
              {t.account_action_save}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="text-sm text-foreground">
        {editing ? renderEdit({ draft, setDraft, errors }) : renderView(initial)}
      </CardContent>
    </Card>
  );
}

export default EditableCard;
