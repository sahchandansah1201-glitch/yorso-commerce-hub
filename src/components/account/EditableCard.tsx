import { useState, useRef, useEffect, useId, type ReactNode } from "react";
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
  const [dirty, setDirty] = useState(false);

  const titleId = useId();
  const descId = useId();
  const errorId = useId();
  const liveId = useId();
  const editBtnRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  const latestDraft = useRef<T>(initial);
  const lastSavedJson = useRef<string>(JSON.stringify(initial));
  const isAutosaveSave = useRef(false);

  const enter = () => {
    setDraft(initial);
    latestDraft.current = initial;
    lastSavedJson.current = JSON.stringify(initial);
    setDirty(false);
    setErrors({});
    setSaveState("idle");
    setSaveError(null);
    setValidationSummary(null);
    setEditing(true);
  };
  const cancel = () => {
    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    setDraft(initial);
    setDirty(false);
    setErrors({});
    setSaveState("idle");
    setSaveError(null);
    setValidationSummary(null);
    setEditing(false);
  };

  const getStickyOffset = () => {
    // Sum heights of any fixed/sticky bars above the viewport top so the
    // focused field doesn't slide under them after scrollIntoView.
    let offset = 16; // base breathing room
    const candidates = document.querySelectorAll<HTMLElement>(
      'header, [data-sticky], [data-testid="account-personal-jumpbar"], .sticky',
    );
    candidates.forEach((el) => {
      const style = window.getComputedStyle(el);
      const pos = style.position;
      if (pos !== "fixed" && pos !== "sticky") return;
      const rect = el.getBoundingClientRect();
      // Only count bars that are pinned at/near the top of the viewport
      if (rect.top <= 8 && rect.bottom > 0 && rect.height < 200) {
        offset = Math.max(offset, rect.bottom + 8);
      }
    });
    return offset;
  };

  const focusFirstInvalid = () => {
    // Defer until aria-invalid attributes are applied by React
    requestAnimationFrame(() => {
      const root = contentRef.current;
      if (!root) return;
      const invalid = root.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (!invalid) return;
      const offset = getStickyOffset();
      const rect = invalid.getBoundingClientRect();
      const target = window.scrollY + rect.top - offset;
      window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      try {
        invalid.focus({ preventScroll: true });
      } catch {
        invalid.focus();
      }
      // Briefly highlight enclosing group for context
      const group = invalid.closest<HTMLElement>('[role="group"]');
      if (group) {
        group.classList.add("ring-2", "ring-destructive/50", "rounded-md");
        window.setTimeout(
          () => group.classList.remove("ring-2", "ring-destructive/50", "rounded-md"),
          1400,
        );
      }
    });
  };

  const performSave = async (value: T, opts: { auto: boolean }) => {
    const errs = validate ? validate(value) : {};
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setValidationSummary(t.account_save_error_validation);
      setSaveState("error");
      focusFirstInvalid();
      return false;
    }
    setErrors({});
    setValidationSummary(null);
    setSaveState("saving");
    setSaveError(null);
    try {
      await Promise.resolve(onSave(value));
      lastSavedJson.current = JSON.stringify(value);
      setDirty(false);
      setSaveState("saved");
      if (!opts.auto) {
        toast.success(t.account_action_saved);
        setEditing(false);
      }
      window.setTimeout(
        () => setSaveState((s) => (s === "saved" ? "idle" : s)),
        opts.auto ? 1800 : 1500,
      );
      return true;
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : t.account_save_error_storage;
      setSaveError(msg);
      setSaveState("error");
      if (!opts.auto) toast.error(t.account_save_error_storage);
      return false;
    }
  };

  const save = () => performSave(latestDraft.current, { auto: false });

  // Autosave on draft change with 800ms debounce while editing
  useEffect(() => {
    latestDraft.current = draft;
    if (!editing) return;
    const json = JSON.stringify(draft);
    const isDirty = json !== lastSavedJson.current;
    setDirty(isDirty);
    if (!isDirty) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      isAutosaveSave.current = true;
      void performSave(latestDraft.current, { auto: true }).finally(() => {
        isAutosaveSave.current = false;
      });
    }, 800);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, editing]);

  // Warn before unloading the page if there are unsaved changes
  useEffect(() => {
    if (!editing || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editing, dirty]);

  // Focus management: first field when entering edit; restore to Edit btn after exit
  const wasEditing = useRef(editing);
  useEffect(() => {
    if (editing && !wasEditing.current) {
      const first = contentRef.current?.querySelector<HTMLElement>(
        "input:not([type='hidden']), textarea, select, [contenteditable='true']",
      );
      first?.focus();
    } else if (!editing && wasEditing.current) {
      editBtnRef.current?.focus();
    }
    wasEditing.current = editing;
  }, [editing]);

  // Focus the error region only for save/storage errors (no invalid field to focus)
  useEffect(() => {
    if (editing && saveError && !validationSummary) {
      errorRef.current?.focus();
    }
  }, [editing, validationSummary, saveError]);

  // Esc to cancel while editing
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing && e.key === "Escape" && !isSaving) {
      e.stopPropagation();
      cancel();
    }
  };

  const isSaving = saveState === "saving";
  const editAriaLabel = `${t.account_action_edit}: ${title}`;
  const cancelAriaLabel = `${t.account_action_cancel}: ${title}`;
  const saveAriaLabel = `${t.account_action_save}: ${title}`;

  return (
    <Card
      data-testid={testId}
      data-editing={editing ? "true" : "false"}
      data-save-state={saveState}
      onKeyDown={onKeyDown}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle id={titleId} className="text-base font-semibold">
            {title}
          </CardTitle>
          {description ? (
            <p id={descId} className="text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            // Status chip: visible in both view and edit modes when relevant
            const showSaving = isSaving;
            const showSaved = saveState === "saved";
            const showError = saveState === "error" && !!(saveError || validationSummary);
            const showDirty = editing && dirty && saveState === "idle";
            if (!showSaving && !showSaved && !showError && !showDirty) return null;

            const base =
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium";
            if (showSaving) {
              return (
                <span
                  className={`${base} border-primary/30 bg-primary/5 text-primary`}
                  role="status"
                  aria-live="polite"
                  data-testid={testId ? `${testId}-status-saving` : undefined}
                >
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  {t.account_action_saving}
                </span>
              );
            }
            if (showError) {
              return (
                <span
                  className={`${base} border-destructive/40 bg-destructive/5 text-destructive`}
                  role="status"
                  aria-live="polite"
                  data-testid={testId ? `${testId}-status-error` : undefined}
                >
                  <AlertCircle className="h-3 w-3" aria-hidden />
                  {validationSummary ? t.account_save_error_validation : t.account_save_error_storage}
                </span>
              );
            }
            if (showSaved) {
              return (
                <span
                  className={`${base} border-primary/30 bg-primary/5 text-primary`}
                  role="status"
                  aria-live="polite"
                  data-testid={testId ? `${testId}-saved-indicator` : undefined}
                >
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  {t.account_action_saved}
                </span>
              );
            }
            // dirty
            return (
              <span
                className={`${base} border-border bg-muted text-muted-foreground`}
                data-testid={testId ? `${testId}-status-dirty` : undefined}
              >
                {t.account_autosave_unsaved}
              </span>
            );
          })()}
          {editing ? (
            <span
              className="hidden text-[11px] text-muted-foreground sm:inline"
              aria-hidden
            >
              · {t.account_autosave_label}
            </span>
          ) : null}
          {!editing ? (
            <Button
              ref={editBtnRef}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={enter}
              aria-label={editAriaLabel}
              aria-controls={liveId}
              aria-expanded={false}
              data-testid={testId ? `${testId}-edit` : undefined}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              <span aria-hidden>{t.account_action_edit}</span>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={cancel}
                disabled={isSaving}
                aria-label={cancelAriaLabel}
                data-testid={testId ? `${testId}-cancel` : undefined}
              >
                {t.account_action_cancel}
              </Button>
              <Button
                size="sm"
                className="text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={save}
                disabled={isSaving}
                aria-busy={isSaving}
                aria-label={saveAriaLabel}
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
      <CardContent
        id={liveId}
        ref={contentRef}
        className="text-sm text-foreground"
        role="region"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        {editing && (validationSummary || saveError) ? (
          <div
            id={errorId}
            ref={errorRef}
            tabIndex={-1}
            className="mb-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            role="alert"
            aria-live="assertive"
            data-testid={testId ? `${testId}-error` : undefined}
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{saveError ?? validationSummary}</span>
          </div>
        ) : null}
        {/* polite live region for save state */}
        <span className="sr-only" role="status" aria-live="polite">
          {isSaving
            ? t.account_action_saving
            : saveState === "saved"
              ? t.account_action_saved
              : ""}
        </span>
        {editing ? renderEdit({ draft, setDraft, errors }) : renderView(initial)}
      </CardContent>
    </Card>
  );
}

export default EditableCard;
