/**
 * P1 — closed "Service review" screen for the service role.
 * Two unframed sections, never nested cards. No customer records, no names,
 * no emails, no company content. Local in-memory demo state only.
 */
import { useState } from "react";
import { Check, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { protoAccessCopy } from "./copy-access";
import { CAPABILITY_ROWS } from "./data-access";
import { CONTROL } from "./ui";

const SummaryField = ({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  testId: string;
}) => (
  <div className="min-w-0" data-testid={testId}>
    <dt className="text-[10.5px] uppercase text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

export const ServiceReview = ({ lang }: { lang: ProtoLang }) => {
  const a = protoAccessCopy[lang];
  const [decisionRecorded, setDecisionRecorded] = useState(false);

  const checks: { key: string; label: string; ok: boolean }[] = [
    { key: "company-found", label: a.accessChecks.companyFound, ok: true },
    { key: "rules-applied", label: a.accessChecks.rulesApplied, ok: true },
    { key: "revocation", label: a.accessChecks.revocation, ok: false },
    { key: "content-hidden", label: a.accessChecks.contentHidden, ok: true },
  ];

  return (
    <div className="space-y-8" data-testid="proto-service-review">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold lg:text-2xl">{a.serviceScreenTitle}</h1>
        <p className="text-xs text-muted-foreground">{a.serviceScreenHint}</p>
      </div>

      {/* A. Feature readiness */}
      <section className="min-w-0 space-y-3" aria-labelledby="proto-service-readiness">
        <h2 id="proto-service-readiness" className="font-heading text-base font-semibold">
          {a.readinessTitle}
        </h2>

        <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryField
            label={a.readinessFields.edition}
            value={a.editionValue}
            hint={a.editionStatus}
            testId="proto-service-edition"
          />
          <SummaryField
            label={a.readinessFields.license}
            value={a.licenseValue}
            testId="proto-service-license"
          />
          <SummaryField
            label={a.readinessFields.lastReview}
            value={a.lastReviewValue}
            testId="proto-service-last-review"
          />
          <SummaryField
            label={a.readinessFields.ownerDecision}
            value={decisionRecorded ? a.ownerDecisionRecorded : a.ownerDecisionPending}
            testId="proto-service-owner-decision"
          />
        </dl>

        <div className="hidden min-w-0 overflow-x-auto border-t border-border/60 md:block">
          <Table data-testid="proto-capability-table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{a.capabilityColumns.feature}</TableHead>
                <TableHead className="text-xs">{a.capabilityColumns.status}</TableHead>
                <TableHead className="text-xs">{a.capabilityColumns.limitation}</TableHead>
                <TableHead className="text-xs">{a.capabilityColumns.risk}</TableHead>
                <TableHead className="text-xs">{a.capabilityColumns.decision}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPABILITY_ROWS.map((r) => (
                <TableRow key={r.id} data-testid={`proto-capability-row-${r.id}`}>
                  <TableCell className="align-top font-medium">{r.feature[lang]}</TableCell>
                  <TableCell className="align-top text-sm">{a.capabilityStatuses[r.status]}</TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {r.limitation[lang]}
                  </TableCell>
                  <TableCell className="align-top text-sm">{r.risk[lang]}</TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {r.decision[lang]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60 md:hidden">
          {CAPABILITY_ROWS.map((r) => (
            <li key={r.id} className="min-w-0 py-3" data-testid={`proto-capability-card-${r.id}`}>
              <p className="min-w-0 break-words font-medium">{r.feature[lang]}</p>
              <p className="text-sm">{a.capabilityStatuses[r.status]}</p>
              <p className="text-xs text-muted-foreground">
                {a.capabilityColumns.limitation}: {r.limitation[lang]}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.capabilityColumns.risk}: {r.risk[lang]} · {a.capabilityColumns.decision}:{" "}
                {r.decision[lang]}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex min-w-0 flex-wrap items-center gap-3 pt-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className={CONTROL} data-testid="proto-service-record-decision">
                {a.recordDecision}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-testid="proto-service-decision-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>{a.recordDecisionTitle}</AlertDialogTitle>
                <AlertDialogDescription>{a.recordDecisionBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className={CONTROL}>{a.cancel}</AlertDialogCancel>
                <AlertDialogAction className={CONTROL} onClick={() => setDecisionRecorded(true)}>
                  {a.recordDecisionConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {decisionRecorded ? (
            <p className="min-w-0 text-xs text-muted-foreground" role="status" data-testid="proto-service-decision-note">
              {a.decisionRecordedNote}
            </p>
          ) : null}
        </div>
      </section>

      {/* B. Access review */}
      <section className="min-w-0 space-y-3" aria-labelledby="proto-service-access">
        <h2 id="proto-service-access" className="font-heading text-base font-semibold">
          {a.accessReviewTitle}
        </h2>
        <ul className="min-w-0 divide-y divide-border/60 border-t border-border/60" data-testid="proto-access-checks">
          {checks.map((check) => (
            <li
              key={check.key}
              className="flex min-w-0 items-center justify-between gap-3 py-3"
              data-testid={`proto-access-check-${check.key}`}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm">
                {check.ok ? (
                  <Check aria-hidden className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <CircleDashed aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 break-words">{check.label}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {check.ok ? a.checkPassed : a.checkRequiresReview}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ServiceReview;
