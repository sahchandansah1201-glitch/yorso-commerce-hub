/**
 * P6 — service-only operations section: queue, alerts, update readiness,
 * backup register, two-person recovery drill and targets.
 *
 * Counts and identifiers only: no customer records. Local state only.
 */
import { useState } from "react";
import { AlertTriangle, Check, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { protoP6Copy } from "./copy-p6";
import {
  P6_ALERTS,
  P6_BACKUP,
  P6_CHECKS,
  P6_QUEUE,
  P6_SERVICE_EMPLOYEES,
  P6_TARGET_KEYS,
  P6_VERSIONS,
} from "./data-p6";
import { CONTROL } from "./ui";

const Field = ({ label, value, testId }: { label: string; value: string; testId: string }) => (
  <div className="min-w-0" data-testid={testId}>
    <dt className="text-[10.5px] uppercase text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
  </div>
);

export const OperationsSection = ({ lang }: { lang: ProtoLang }) => {
  const t = protoP6Copy[lang];
  const [alertReason, setAlertReason] = useState<Record<string, string>>({});
  const [scheduled, setScheduled] = useState<Record<string, boolean>>({});
  const [firstId, setFirstId] = useState<string | null>(null);
  const [firstChoice, setFirstChoice] = useState("");
  const [secondChoice, setSecondChoice] = useState("");
  const [drillDone, setDrillDone] = useState(false);

  const secondOptions = P6_SERVICE_EMPLOYEES.filter((e) => e.id !== firstId);

  return (
    <div className="space-y-8" data-testid="proto-p6-operations">
      <h2 className="font-heading text-base font-semibold">{t.operationsTitle}</h2>

      {/* Queue summary */}
      <section className="min-w-0 space-y-2" aria-labelledby="proto-p6-queue">
        <h3 id="proto-p6-queue" className="font-heading text-sm font-semibold">
          {t.queueTitle}
        </h3>
        <dl
          className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4"
          data-testid="proto-p6-queue-summary"
        >
          <Field label={t.queueTotal} value={String(P6_QUEUE.total)} testId="proto-p6-queue-total" />
          {P6_QUEUE.rows.map((r) => (
            <Field
              key={r.key}
              label={t.queueStatuses[r.key]}
              value={String(r.count)}
              testId={`proto-p6-queue-${r.key}`}
            />
          ))}
          <Field label={t.queueOldest} value={t.queueOldestValue} testId="proto-p6-queue-oldest" />
        </dl>
      </section>

      {/* Alerts */}
      <section className="min-w-0 space-y-2" aria-labelledby="proto-p6-alerts">
        <h3 id="proto-p6-alerts" className="font-heading text-sm font-semibold">
          {t.alertsTitle}
        </h3>
        <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60">
          {P6_ALERTS.map((al) => (
            <li key={al.id} className="min-w-0 space-y-2 py-3" data-testid={`proto-p6-alert-${al.id}`}>
              <p className="min-w-0 break-words text-sm font-medium">{al.id}</p>
              <p className="text-xs text-muted-foreground">
                {t.alertColumns.responsible}: {al.responsible} · {t.alertColumns.age}: {al.age[lang]}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.alertColumns.reason}: {al.reason[lang]}
              </p>
              <div className="flex min-w-0 flex-wrap items-end gap-2">
                <div className="min-w-0">
                  <label
                    className="block text-[10.5px] uppercase text-muted-foreground"
                    htmlFor={`proto-p6-reason-${al.id}`}
                  >
                    {t.reasonLabel}
                  </label>
                  <Input
                    id={`proto-p6-reason-${al.id}`}
                    value={alertReason[al.id] ?? ""}
                    onChange={(e) =>
                      setAlertReason((prev) => ({ ...prev, [al.id]: e.target.value }))
                    }
                    className={`${CONTROL} w-[220px]`}
                    data-testid={`proto-p6-reason-${al.id}`}
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className={CONTROL}
                      disabled={(alertReason[al.id] ?? "").trim() === "" || Boolean(scheduled[al.id])}
                      data-testid={`proto-p6-retry-${al.id}`}
                    >
                      {t.scheduleRetry}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.scheduleRetryTitle}</AlertDialogTitle>
                      <AlertDialogDescription>{t.scheduleRetryBody}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={CONTROL}>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        className={CONTROL}
                        onClick={() => setScheduled((prev) => ({ ...prev, [al.id]: true }))}
                        data-testid={`proto-p6-retry-confirm-${al.id}`}
                      >
                        {t.confirm}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {scheduled[al.id] ? (
                  <p className="text-xs text-muted-foreground" role="status">
                    {t.scheduledNote}
                  </p>
                ) : (alertReason[al.id] ?? "").trim() === "" ? (
                  <p className="text-xs text-muted-foreground">{t.reasonRequired}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Update readiness */}
      <section className="min-w-0 space-y-2" aria-labelledby="proto-p6-readiness">
        <h3 id="proto-p6-readiness" className="font-heading text-sm font-semibold">
          {t.readinessTitle}
        </h3>
        <p className="text-xs text-muted-foreground" data-testid="proto-p6-readiness-counts">
          {t.readinessCounts}
        </p>
        <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60">
          {P6_CHECKS.map((ch) => (
            <li
              key={ch.id}
              className="flex min-w-0 items-center justify-between gap-3 py-2"
              data-testid={`proto-p6-check-${ch.id}`}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm">
                {ch.status === "pass" ? (
                  <Check aria-hidden className="h-4 w-4 shrink-0 text-success" />
                ) : ch.status === "warning" ? (
                  <AlertTriangle aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <CircleDashed aria-hidden className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span className="min-w-0 break-words">{ch.label[lang]}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {t.checkStatuses[ch.status]}
              </span>
            </li>
          ))}
        </ul>
        <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t.candidateVersion} value={P6_VERSIONS.candidate} testId="proto-p6-candidate" />
          <Field label={t.currentVersion} value={P6_VERSIONS.current} testId="proto-p6-current" />
          <Field label={t.changeSummary} value={t.changeSummaryValue} testId="proto-p6-changes" />
          <Field
            label={t.backupPrerequisite}
            value={t.backupPrerequisiteValue}
            testId="proto-p6-prerequisite"
          />
          <Field label={t.rollbackPlan} value={t.rollbackPlanValue} testId="proto-p6-rollback" />
        </dl>
        <p className="text-sm font-medium" data-testid="proto-p6-not-approved">
          {t.updateNotApproved}
        </p>
      </section>

      {/* Backup register */}
      <section className="min-w-0 space-y-2" aria-labelledby="proto-p6-backup">
        <h3 id="proto-p6-backup" className="font-heading text-sm font-semibold">
          {t.backupTitle}
        </h3>
        <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t.backupId} value={P6_BACKUP.id} testId="proto-p6-backup-id" />
          <Field label={t.backupScope} value={t.backupScopeValue} testId="proto-p6-backup-scope" />
          <Field
            label={t.backupVerification}
            value={t.backupVerificationValue}
            testId="proto-p6-backup-verification"
          />
          <Field label={t.backupAge} value={t.backupAgeValue} testId="proto-p6-backup-age" />
          <Field
            label={t.backupRetention}
            value={t.backupRetentionValue}
            testId="proto-p6-backup-retention"
          />
        </dl>
      </section>

      {/* Two-person recovery drill */}
      <section className="min-w-0 space-y-3" aria-labelledby="proto-p6-drill">
        <h3 id="proto-p6-drill" className="font-heading text-sm font-semibold">
          {t.drillTitle}
        </h3>
        <p className="text-xs text-muted-foreground">{t.drillHint}</p>

        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <div className="min-w-0">
            <label
              className="block text-[10.5px] uppercase text-muted-foreground"
              htmlFor="proto-p6-first"
            >
              {t.drillFirstLabel}
            </label>
            <Select
              value={firstChoice}
              onValueChange={setFirstChoice}
              disabled={firstId !== null}
            >
              <SelectTrigger
                id="proto-p6-first"
                className={`${CONTROL} w-[200px]`}
                data-testid="proto-p6-first-select"
              >
                <SelectValue placeholder={t.drillFirstLabel} aria-label={t.drillFirstLabel} />
              </SelectTrigger>
              <SelectContent>
                {P6_SERVICE_EMPLOYEES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className={CONTROL}
            disabled={firstChoice === "" || firstId !== null}
            onClick={() => setFirstId(firstChoice)}
            data-testid="proto-p6-first-confirm"
          >
            {t.drillFirstConfirm}
          </Button>
        </div>

        {firstId ? (
          <p className="text-xs text-muted-foreground" role="status" data-testid="proto-p6-first-note">
            {t.drillFirstRecorded.replace("{name}", firstId)}
          </p>
        ) : null}

        {firstId && !drillDone ? (
          <div className="flex min-w-0 flex-wrap items-end gap-3">
            <div className="min-w-0">
              <label
                className="block text-[10.5px] uppercase text-muted-foreground"
                htmlFor="proto-p6-second"
              >
                {t.drillSecondLabel}
              </label>
              <Select value={secondChoice} onValueChange={setSecondChoice}>
                <SelectTrigger
                  id="proto-p6-second"
                  className={`${CONTROL} w-[200px]`}
                  data-testid="proto-p6-second-select"
                >
                  <SelectValue placeholder={t.drillSecondLabel} aria-label={t.drillSecondLabel} />
                </SelectTrigger>
                <SelectContent>
                  {secondOptions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className={CONTROL}
              disabled={secondChoice === "" || secondChoice === firstId}
              onClick={() => setDrillDone(true)}
              data-testid="proto-p6-second-confirm"
            >
              {t.drillSecondConfirm}
            </Button>
            <p className="text-xs text-muted-foreground">{t.drillSameBlocked}</p>
          </div>
        ) : null}

        {drillDone ? (
          <p className="text-sm" role="status" data-testid="proto-p6-drill-done">
            {t.drillDone}
          </p>
        ) : null}
      </section>

      {/* Targets */}
      <section className="min-w-0 space-y-2" aria-labelledby="proto-p6-targets">
        <h3 id="proto-p6-targets" className="font-heading text-sm font-semibold">
          {t.targetsTitle}
        </h3>
        <div className="hidden min-w-0 overflow-x-auto md:block">
          <Table data-testid="proto-p6-targets-table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t.targetColumns.metric}</TableHead>
                <TableHead className="text-xs">{t.targetColumns.target}</TableHead>
                <TableHead className="text-xs">{t.targetColumns.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {P6_TARGET_KEYS.map((key) => (
                <TableRow key={key} data-testid={`proto-p6-target-${key}`}>
                  <TableCell className="align-top text-sm font-medium">{t.targets[key]}</TableCell>
                  <TableCell className="align-top text-sm">{t.targetValues[key]}</TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {t.targetStatus}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60 md:hidden">
          {P6_TARGET_KEYS.map((key) => (
            <li key={key} className="min-w-0 py-2" data-testid={`proto-p6-target-card-${key}`}>
              <p className="text-sm font-medium">{t.targets[key]}</p>
              <p className="text-sm">{t.targetValues[key]}</p>
              <p className="text-xs text-muted-foreground">{t.targetStatus}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default OperationsSection;
