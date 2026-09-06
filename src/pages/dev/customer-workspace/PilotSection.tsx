/**
 * P7 — limited pilot: a compact customer notice with help and feedback, plus
 * the service-only anonymized pilot summary and decision.
 *
 * All values are deterministic module constants: no storage, no network.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ProtoLang } from "./copy";
import { P7_DECISIONS, protoP7Copy, type P7DecisionKey } from "./copy-p7";
import { P7_HELP, P7_SUMMARY } from "./data-p7";
import { CONTROL } from "./ui";

/** The built-in close control is hidden: a localized one is rendered instead. */
const DIALOG_CLOSE = "[&>button[type=button]]:hidden";

/** Localized accessible name for the corner close control. */
const LocalizedDialogClose = ({ label, testId }: { label: string; testId: string }) => (
  <div className="absolute right-3 top-3">
    <DialogClose asChild>
      <Button variant="ghost" className={`${CONTROL} px-0`} aria-label={label} data-testid={testId}>
        <X aria-hidden className="h-4 w-4" />
      </Button>
    </DialogClose>
  </div>
);

const Field = ({ label, value, testId }: { label: string; value: string; testId: string }) => (
  <div className="min-w-0" data-testid={testId}>
    <dt className="text-[10.5px] uppercase text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
  </div>
);

/** Customer-side pilot notice: full width, compact, no marketing card. */
export const PilotNotice = ({
  lang,
  resetKey,
}: {
  lang: ProtoLang;
  /** Any change closes open dialogs and clears the draft. */
  resetKey: string;
}) => {
  const t = protoP7Copy[lang];
  const [dialog, setDialog] = useState<null | "help" | "feedback">(null);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Смена роли/сценария/состояния закрывает диалоги и очищает черновик.
  useEffect(() => {
    setDialog(null);
    setDraft("");
    setNote(null);
    setTouched(false);
  }, [resetKey]);

  return (
    <div
      className="w-full min-w-0 border-y border-border/60 py-3"
      data-testid="proto-p7-notice"
    >
      <p className="text-sm font-medium">{t.pilotTitle}</p>
      <p className="mt-0.5 max-w-prose text-xs text-muted-foreground">{t.pilotBody}</p>
      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        <Button
          variant="outline"
          className={CONTROL}
          onClick={() => setDialog("help")}
          data-testid="proto-p7-help"
        >
          {t.getHelp}
        </Button>
        <Button
          variant="outline"
          className={CONTROL}
          onClick={() => {
            setNote(null);
            setTouched(false);
            setDraft("");
            setDialog("feedback");
          }}
          data-testid="proto-p7-feedback"
        >
          {t.addFeedback}
        </Button>
      </div>

      {note ? (
        <p className="mt-2 text-xs text-muted-foreground" role="status" data-testid="proto-p7-feedback-note">
          {note}
        </p>
      ) : null}

      <Dialog open={dialog === "help"} onOpenChange={(open) => setDialog(open ? "help" : null)}>
        <DialogContent className={DIALOG_CLOSE} data-testid="proto-p7-help-dialog">
          <LocalizedDialogClose label={t.close} testId="proto-p7-help-dialog-close" />
          <DialogHeader>
            <DialogTitle>{t.helpTitle}</DialogTitle>
            <DialogDescription>{t.helpNotice}</DialogDescription>
          </DialogHeader>
          <dl className="grid min-w-0 grid-cols-1 gap-3">
            <Field label={t.helpContactLabel} value={P7_HELP.contact[lang]} testId="proto-p7-help-contact" />
            <Field label={t.helpHoursLabel} value={P7_HELP.hours[lang]} testId="proto-p7-help-hours" />
          </dl>
          <DialogFooter>
            <Button className={CONTROL} onClick={() => setDialog(null)}>{t.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "feedback"}
        onOpenChange={(open) => setDialog(open ? "feedback" : null)}
      >
        <DialogContent className={DIALOG_CLOSE} data-testid="proto-p7-feedback-dialog">
          <LocalizedDialogClose label={t.close} testId="proto-p7-feedback-dialog-close" />
          <DialogHeader>
            <DialogTitle>{t.feedbackTitle}</DialogTitle>
            <DialogDescription>{t.feedbackHint}</DialogDescription>
          </DialogHeader>
          <div className="min-w-0">
            <label
              className="block text-[10.5px] uppercase text-muted-foreground"
              htmlFor="proto-p7-feedback-text"
            >
              {t.feedbackLabel}
            </label>
            <Textarea
              id="proto-p7-feedback-text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[110px]"
              aria-invalid={touched && draft.trim() === ""}
              aria-describedby={
                touched && draft.trim() === "" ? "proto-p7-feedback-error" : undefined
              }
              data-testid="proto-p7-feedback-text"
            />
            {touched && draft.trim() === "" ? (
              <p
                className="mt-1 text-xs text-destructive"
                role="alert"
                id="proto-p7-feedback-error"
                data-testid="proto-p7-feedback-error"
              >
                {t.feedbackRequired}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" className={CONTROL} onClick={() => setDialog(null)}>
              {t.cancel}
            </Button>
            <Button
              className={CONTROL}
              onClick={() => {
                setTouched(true);
                if (draft.trim() === "") return;
                setNote(t.feedbackSaved);
                setDraft("");
                setDialog(null);
              }}
              data-testid="proto-p7-feedback-save"
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Service-side anonymized pilot summary and local decision. */
export const ServicePilot = ({ lang }: { lang: ProtoLang }) => {
  const t = protoP7Copy[lang];
  const [choice, setChoice] = useState<P7DecisionKey | "">("");
  const [reason, setReason] = useState("");
  // Снимок решения: значение и обоснование на момент подтверждения.
  const [recorded, setRecorded] = useState<{ choice: P7DecisionKey; reason: string } | null>(null);
  const reasonMissing = reason.trim() === "";

  return (
    <section className="min-w-0 space-y-3" data-testid="proto-p7-service">
      <h2 className="font-heading text-base font-semibold">{t.pilotSummaryTitle}</h2>
      <p className="text-xs text-muted-foreground" data-testid="proto-p7-data-notice">
        {t.serviceDataNotice}
      </p>
      <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <Field label={t.companies} value={String(P7_SUMMARY.companies)} testId="proto-p7-companies" />
        <Field label={t.users} value={String(P7_SUMMARY.users)} testId="proto-p7-users" />
        <Field
          label={t.feedbackEntries}
          value={String(P7_SUMMARY.feedbackEntries)}
          testId="proto-p7-feedback-count"
        />
        <Field label={t.incidents} value={String(P7_SUMMARY.incidents)} testId="proto-p7-incidents" />
        <Field
          label={t.openIncidents}
          value={String(P7_SUMMARY.openIncidents)}
          testId="proto-p7-open-incidents"
        />
        <Field
          label={t.limitations}
          value={String(P7_SUMMARY.limitations)}
          testId="proto-p7-limitations"
        />
        <Field
          label={t.participants}
          value={P7_SUMMARY.participants.join(", ")}
          testId="proto-p7-participants"
        />
      </dl>

      <div className="flex min-w-0 flex-wrap items-end gap-3">
        <div className="min-w-0">
          <label
            className="block text-[10.5px] uppercase text-muted-foreground"
            htmlFor="proto-p7-decision"
          >
            {t.decisionLabel}
          </label>
          <Select value={choice} onValueChange={(v) => setChoice(v as P7DecisionKey)}>
            <SelectTrigger
              id="proto-p7-decision"
              className={`${CONTROL} w-[220px]`}
              data-testid="proto-p7-decision-select"
            >
              <SelectValue placeholder={t.decisionLabel} aria-label={t.decisionLabel} />
            </SelectTrigger>
            <SelectContent>
              {P7_DECISIONS.map((key) => (
                <SelectItem key={key} value={key}>{t.decisions[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <label
            className="block text-[10.5px] uppercase text-muted-foreground"
            htmlFor="proto-p7-reason"
          >
            {t.reasonLabel}
          </label>
          <Input
            id="proto-p7-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${CONTROL} w-[240px]`}
            aria-invalid={choice !== "" && reasonMissing}
            aria-describedby={choice !== "" && reasonMissing ? "proto-p7-reason-error" : undefined}
            data-testid="proto-p7-reason"
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className={CONTROL}
              disabled={choice === "" || reasonMissing}
              data-testid="proto-p7-record"
            >
              {t.recordDecision}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-testid="proto-p7-decision-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>{t.recordDecisionTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.recordDecisionBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={CONTROL}>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction
                className={CONTROL}
                onClick={() =>
                  setRecorded(choice === "" ? null : { choice, reason: reason.trim() })
                }
                data-testid="proto-p7-record-confirm"
              >
                {t.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {choice !== "" && reasonMissing ? (
          <p
            className="text-xs text-destructive"
            role="alert"
            id="proto-p7-reason-error"
            data-testid="proto-p7-reason-error"
          >
            {t.reasonRequired}
          </p>
        ) : null}
      </div>

      {recorded ? (
        <div className="min-w-0 space-y-1" role="status" data-testid="proto-p7-decision-note">
          <p className="text-sm font-medium">{t.decisions[recorded.choice]}</p>
          <p className="text-sm" data-testid="proto-p7-decision-reason">
            {t.recordedReasonLabel}: {recorded.reason}
          </p>
          <p className="text-xs text-muted-foreground">{t.decisionRecorded}</p>
        </div>
      ) : null}
    </section>
  );
};

export default PilotNotice;
