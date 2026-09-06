/**
 * P5 — data upload interface: a full-screen in-workspace wizard for the
 * customer side and a service-side transfer register.
 *
 * No file is read, no request is made, no storage is used. Every value is a
 * deterministic module constant and every state transition is local.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { P5_STEPS, protoP5Copy, type P5Choice, type P5StepKey } from "./copy-p5";
import {
  P5_COLUMNS,
  P5_FIELDS,
  P5_RESULT,
  P5_ROWS,
  P5_ROW_OUTCOMES,
  P5_SERVICE_RUN,
  P5_SOURCES,
  P5_TOTALS,
  type P5Field,
} from "./data-p5";
import { CONTROL } from "./ui";

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    template,
  );

const Field = ({ label, value, testId }: { label: string; value: string; testId: string }) => (
  <div className="min-w-0" data-testid={testId}>
    <dt className="text-[10.5px] uppercase text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
  </div>
);

export const ImportWizard = ({
  lang,
  onClose,
}: {
  lang: ProtoLang;
  onClose: () => void;
}) => {
  const t = protoP5Copy[lang];
  const [step, setStep] = useState<P5StepKey>("source");
  const [sourceId, setSourceId] = useState("");
  const [mapping, setMapping] = useState<Record<string, P5Field>>(() =>
    Object.fromEntries(P5_COLUMNS.map((c) => [c.id, c.target])),
  );
  const [choices, setChoices] = useState<Record<string, P5Choice | null>>(() =>
    Object.fromEntries(P5_ROWS.map((r) => [r.id, r.defaultChoice])),
  );
  const [confirmed, setConfirmed] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [report, setReport] = useState(false);

  const index = P5_STEPS.indexOf(step);

  // Escape закрывает окно, пока выполнение не подтверждено.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmed) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmed, onClose]);

  // Осознанный локальный переход состояния с прогрессом.
  useEffect(() => {
    if (!confirmed || processed >= P5_RESULT.processable) return;
    const timer = window.setTimeout(() => setProcessed((n) => n + 1), 260);
    return () => window.clearTimeout(timer);
  }, [confirmed, processed]);

  useEffect(() => {
    if (confirmed && processed >= P5_RESULT.processable) {
      const timer = window.setTimeout(() => setStep("result"), 300);
      return () => window.clearTimeout(timer);
    }
  }, [confirmed, processed]);

  const ambiguousPending = useMemo(
    () => P5_ROWS.some((r) => r.classification === "ambiguous" && !choices[r.id]),
    [choices],
  );

  const nextDisabled =
    (step === "source" && sourceId === "") ||
    (step === "matches" && ambiguousPending) ||
    step === "execution" ||
    step === "result";

  const goNext = () => {
    const at = P5_STEPS.indexOf(step);
    if (at < P5_STEPS.length - 1) setStep(P5_STEPS[at + 1]);
  };
  const goBack = () => {
    const at = P5_STEPS.indexOf(step);
    if (at > 0 && !confirmed) setStep(P5_STEPS[at - 1]);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={t.wizardTitle}
      data-testid="proto-p5-wizard"
    >
      <div className="container min-w-0 space-y-4 py-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">{t.wizardTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.wizardHint}</p>
        </div>

        <ol
          className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 border-y border-border/60 py-2 text-xs"
          data-testid="proto-p5-stepper"
        >
          {P5_STEPS.map((key, i) => (
            <li
              key={key}
              aria-current={key === step ? "step" : undefined}
              className={i === index ? "font-medium text-foreground" : "text-muted-foreground"}
            >
              {t.stepLabel} {i + 1}. {t.steps[key]}
            </li>
          ))}
        </ol>

        {step === "source" ? (
          <section className="min-w-0 space-y-2" data-testid="proto-p5-step-source">
            <p className="text-sm font-medium">{t.sourceLabel}</p>
            <p className="text-xs text-muted-foreground" data-testid="proto-p5-file-notice">
              {t.fileNotice}
            </p>
            <ul className="min-w-0 space-y-2" role="radiogroup" aria-label={t.sourceLabel}>
              {P5_SOURCES.map((s) => (
                <li key={s.id} className="min-w-0">
                  <Button
                    variant={sourceId === s.id ? "default" : "outline"}
                    role="radio"
                    aria-checked={sourceId === s.id}
                    className={`${CONTROL} w-full justify-start`}
                    onClick={() => setSourceId(s.id)}
                    data-testid={`proto-p5-source-${s.id}`}
                  >
                    <span className="min-w-0 truncate">
                      {s.fileName} · {s.rows} {t.sourceRows}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "matching" ? (
          <section className="min-w-0 space-y-3" data-testid="proto-p5-step-matching">
            <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60">
              {P5_COLUMNS.map((col) => (
                <li
                  key={col.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="min-w-0">
                    <span className="block text-[10.5px] uppercase text-muted-foreground">
                      {t.columnSource}
                    </span>
                    <span className="block break-words text-sm font-medium">{col.source}</span>
                  </span>
                  <span className="min-w-0">
                    <label
                      className="block text-[10.5px] uppercase text-muted-foreground"
                      htmlFor={`proto-p5-map-${col.id}`}
                    >
                      {t.columnTarget}
                    </label>
                    <Select
                      value={mapping[col.id]}
                      onValueChange={(v) =>
                        setMapping((prev) => ({ ...prev, [col.id]: v as P5Field }))
                      }
                    >
                      <SelectTrigger
                        id={`proto-p5-map-${col.id}`}
                        className={`${CONTROL} w-[240px]`}
                        data-testid={`proto-p5-map-${col.id}`}
                      >
                        <SelectValue aria-label={t.columnTarget} />
                      </SelectTrigger>
                      <SelectContent>
                        {P5_FIELDS.map((f) => (
                          <SelectItem key={f} value={f}>{t.fields[f]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "preview" ? (
          <section className="min-w-0 space-y-3" data-testid="proto-p5-step-preview">
            <p className="text-xs text-muted-foreground">{t.previewHint}</p>
            <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Field label={t.totalRows} value={String(P5_TOTALS.rows)} testId="proto-p5-total-rows" />
              <Field
                label={t.totalCompanies}
                value={String(P5_TOTALS.companies)}
                testId="proto-p5-total-companies"
              />
              <Field
                label={t.totalContacts}
                value={String(P5_TOTALS.contacts)}
                testId="proto-p5-total-contacts"
              />
            </dl>
            <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60">
              {P5_ROWS.slice(0, 6).map((r) => (
                <li key={r.id} className="min-w-0 py-2">
                  <p className="min-w-0 break-words text-sm font-medium">
                    {r.id} · {r.value || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.rowKind}: {t.kinds[r.kind]} · {t.classification}:{" "}
                    {t.classifications[r.classification]}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "matches" ? (
          <section className="min-w-0 space-y-3" data-testid="proto-p5-step-matches">
            {ambiguousPending ? (
              <p className="text-xs text-muted-foreground" data-testid="proto-p5-required-note">
                {t.choiceRequired}
              </p>
            ) : null}
            <div className="hidden min-w-0 overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t.rowName}</TableHead>
                    <TableHead className="text-xs">{t.rowKind}</TableHead>
                    <TableHead className="text-xs">{t.classification}</TableHead>
                    <TableHead className="text-xs">{t.choice}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {P5_ROWS.map((r) => (
                    <TableRow key={r.id} data-testid={`proto-p5-row-${r.id}`}>
                      <TableCell className="align-middle text-sm font-medium">
                        {r.id} · {r.value || "—"}
                      </TableCell>
                      <TableCell className="align-middle text-sm">{t.kinds[r.kind]}</TableCell>
                      <TableCell className="align-middle text-sm">
                        {t.classifications[r.classification]}
                      </TableCell>
                      <TableCell className="align-middle text-sm">
                        {r.classification === "error" ? (
                          <span className="text-xs text-muted-foreground">{t.errorNotExecutable}</span>
                        ) : (
                          <Select
                            value={choices[r.id] ?? ""}
                            onValueChange={(v) =>
                              setChoices((prev) => ({ ...prev, [r.id]: v as P5Choice }))
                            }
                          >
                            <SelectTrigger
                              className={`${CONTROL} w-[190px]`}
                              aria-label={`${t.choice} ${r.id}`}
                              data-testid={`proto-p5-choice-${r.id}`}
                            >
                              <SelectValue placeholder={t.choice} />
                            </SelectTrigger>
                            <SelectContent>
                              {(["link", "create", "skip"] as P5Choice[]).map((k) => (
                                <SelectItem key={k} value={k}>{t.choices[k]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60 md:hidden">
              {P5_ROWS.map((r) => (
                <li key={r.id} className="min-w-0 space-y-1 py-2" data-testid={`proto-p5-card-${r.id}`}>
                  <p className="min-w-0 break-words text-sm font-medium">
                    {r.id} · {r.value || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.kinds[r.kind]} · {t.classifications[r.classification]}
                  </p>
                  {r.classification === "error" ? (
                    <p className="text-xs text-muted-foreground">{t.errorNotExecutable}</p>
                  ) : (
                    <Select
                      value={choices[r.id] ?? ""}
                      onValueChange={(v) => setChoices((prev) => ({ ...prev, [r.id]: v as P5Choice }))}
                    >
                      <SelectTrigger
                        className={`${CONTROL} w-full`}
                        aria-label={`${t.choice} ${r.id}`}
                        data-testid={`proto-p5-choice-m-${r.id}`}
                      >
                        <SelectValue placeholder={t.choice} />
                      </SelectTrigger>
                      <SelectContent>
                        {(["link", "create", "skip"] as P5Choice[]).map((k) => (
                          <SelectItem key={k} value={k}>{t.choices[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "execution" ? (
          <section className="min-w-0 space-y-3" data-testid="proto-p5-step-execution">
            <p className="text-sm text-muted-foreground">{t.executionHint}</p>
            {confirmed ? (
              <div className="min-w-0 space-y-2" role="status" data-testid="proto-p5-progress">
                <p className="flex items-center gap-2 text-sm">
                  {processed < P5_RESULT.processable ? (
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Check aria-hidden className="h-4 w-4 text-success" />
                  )}
                  {processed < P5_RESULT.processable ? t.executionRunning : t.executionDone}
                </p>
                <Progress value={(processed / P5_RESULT.processable) * 100} />
                <p className="text-xs text-muted-foreground">
                  {fill(t.executionProgress, { done: processed, total: P5_RESULT.processable })}
                </p>
              </div>
            ) : (
              <Button
                className={CONTROL}
                onClick={() => setConfirmed(true)}
                data-testid="proto-p5-execute"
              >
                {t.executionConfirm}
              </Button>
            )}
          </section>
        ) : null}

        {step === "result" ? (
          <section className="min-w-0 space-y-3" data-testid="proto-p5-step-result">
            <h3 className="font-heading text-base font-semibold">{t.resultTitle}</h3>
            <ul className="min-w-0 space-y-1 text-sm" data-testid="proto-p5-result-summary">
              <li>
                {fill(t.resultCompleted, {
                  done: P5_RESULT.completed,
                  total: P5_RESULT.processable,
                })}
              </li>
              <li>{fill(t.resultTemporaryFailure, { count: P5_RESULT.temporaryFailure })}</li>
              <li>{fill(t.resultRejected, { count: P5_RESULT.rejected })}</li>
              <li>{fill(t.resultSkipped, { count: P5_RESULT.skipped })}</li>
            </ul>
            <p className="text-xs text-muted-foreground" data-testid="proto-p5-result-notice">
              {t.resultNotice}
            </p>
            <Button
              variant="outline"
              className={CONTROL}
              onClick={() => setReport((v) => !v)}
              aria-expanded={report}
              data-testid="proto-p5-report-toggle"
            >
              {report ? t.reportHide : t.reportShow}
            </Button>
            {report ? (
              <div className="min-w-0" data-testid="proto-p5-report">
                <p className="text-sm font-medium">{t.reportTitle}</p>
                <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60">
                  {P5_ROWS.map((r) => (
                    <li key={r.id} className="min-w-0 py-2 text-sm">
                      <span className="font-medium">{r.id}</span> · {t.reportRowOutcome}:{" "}
                      {t.outcomes[P5_ROW_OUTCOMES[r.id]]}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="flex min-w-0 flex-wrap gap-2 border-t border-border/60 pt-3">
          {step === "result" ? (
            <Button className={CONTROL} onClick={onClose} data-testid="proto-p5-close">
              {t.close}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className={CONTROL}
                onClick={goBack}
                disabled={index === 0 || confirmed}
                data-testid="proto-p5-back"
              >
                {t.back}
              </Button>
              <Button
                className={CONTROL}
                onClick={goNext}
                disabled={nextDisabled}
                data-testid="proto-p5-next"
              >
                {t.next}
              </Button>
              {confirmed ? null : (
                <Button
                  variant="ghost"
                  className={CONTROL}
                  onClick={onClose}
                  data-testid="proto-p5-cancel"
                >
                  {t.cancel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/** Service-side transfer register: counts and identifiers only. */
export const ServiceDataTransfer = ({ lang }: { lang: ProtoLang }) => {
  const t = protoP5Copy[lang];
  const [reason, setReason] = useState("");
  const [retried, setRetried] = useState(false);
  const done = retried ? P5_RESULT.processable : P5_RESULT.completed;

  return (
    <section className="min-w-0 space-y-3" data-testid="proto-p5-service">
      <h2 className="font-heading text-base font-semibold">{t.serviceTransferTitle}</h2>
      <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t.serviceRunId} value={P5_SERVICE_RUN.runId} testId="proto-p5-service-run" />
        <Field
          label={t.serviceChecksum}
          value={`${P5_SERVICE_RUN.checksumSource} → ${P5_SERVICE_RUN.checksumProcessed}`}
          testId="proto-p5-service-checksum"
        />
        <Field
          label={t.serviceSourceCounts}
          value={`${P5_SERVICE_RUN.sourceCompanies} + ${P5_SERVICE_RUN.sourceContacts} = ${P5_TOTALS.rows}`}
          testId="proto-p5-service-counts"
        />
        <Field
          label={t.serviceWriteMode}
          value={t.serviceWriteModeValue}
          testId="proto-p5-service-mode"
        />
        <Field
          label={t.serviceOutcome}
          value={fill(t.serviceOutcomeValue, { done, total: P5_RESULT.processable })}
          testId="proto-p5-service-outcome"
        />
        <Field label={t.serviceRowIds} value={P5_SERVICE_RUN.rowIds} testId="proto-p5-service-ids" />
        <Field
          label={t.serviceFailedIds}
          value={retried ? "—" : P5_SERVICE_RUN.failedIds.join(", ")}
          testId="proto-p5-service-failed"
        />
      </dl>

      <div className="flex min-w-0 flex-wrap items-end gap-3">
        <div className="min-w-0">
          <label
            className="block text-[10.5px] uppercase text-muted-foreground"
            htmlFor="proto-p5-service-reason"
          >
            {t.serviceReasonLabel}
          </label>
          <Input
            id="proto-p5-service-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${CONTROL} w-[260px]`}
            data-testid="proto-p5-service-reason"
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className={CONTROL}
              disabled={reason.trim() === "" || retried}
              data-testid="proto-p5-service-retry"
            >
              {t.serviceRetry}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-testid="proto-p5-service-retry-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>{t.serviceRetryTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.serviceRetryBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={CONTROL}>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction
                className={CONTROL}
                onClick={() => setRetried(true)}
                data-testid="proto-p5-service-retry-confirm"
              >
                {t.serviceRetryConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {reason.trim() === "" && !retried ? (
          <p className="text-xs text-muted-foreground">{t.serviceReasonRequired}</p>
        ) : null}
        {retried ? (
          <p className="text-xs text-muted-foreground" role="status" data-testid="proto-p5-service-retry-note">
            {fill(t.serviceRetryResult, { done, total: P5_RESULT.processable })}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default ImportWizard;
