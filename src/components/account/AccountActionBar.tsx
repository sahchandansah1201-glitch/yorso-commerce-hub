import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * AccountActionBar — sticky footer для edit-mode секций.
 *
 * Назначение: единообразный Save/Cancel внизу формы. Бар НЕ перекрывает
 * значения полей (sticky bottom, прозрачное обрамление), оранжевая основная
 * кнопка, нейтральный Cancel слева. Disabled, пока форма невалидна.
 *
 * Может содержать дополнительный inline-статус (errors summary, "saved 2s ago")
 * через слот `status`.
 */
interface Props {
  onSave: () => void;
  onCancel?: () => void;
  saving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  status?: ReactNode;
  testId?: string;
}

export const AccountActionBar = ({
  onSave,
  onCancel,
  saving = false,
  disabled = false,
  saveLabel,
  cancelLabel,
  status,
  testId,
}: Props) => {
  const { t } = useLanguage();
  const save = saveLabel ?? (t.account_action_save as string) ?? "Save";
  const cancel = cancelLabel ?? (t.account_action_cancel as string) ?? "Cancel";

  return (
    <div
      className="sticky bottom-0 z-10 mt-4 flex flex-col gap-2 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:flex-row sm:items-center sm:justify-between"
      data-testid={testId ?? "account-action-bar"}
    >
      <div
        className="min-w-0 text-xs text-muted-foreground"
        data-testid="account-action-bar-status"
      >
        {status}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            className="min-h-11"
            data-testid="account-action-bar-cancel"
          >
            {cancel}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onSave}
          disabled={disabled || saving}
          className="min-h-11"
          data-testid="account-action-bar-save"
        >
          {saving ? (t.account_action_saving as string) ?? "Saving…" : save}
        </Button>
      </div>
    </div>
  );
};

export default AccountActionBar;
