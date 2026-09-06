/**
 * P2 — "Employees" customer section: employees, invitations, ownership transfer.
 * Role matrix mirrors the current company-access contract. All actions are
 * local in-memory demo state with accessible confirmation dialogs.
 */
import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { protoCopy, type ProtoLang, type ProtoRoleKey } from "./copy";
import {
  EMPLOYEES_TABS,
  protoAccessCopy,
  type EmployeeActionKey,
  type EmployeesTabKey,
} from "./copy-access";
import { EMPLOYEE_RECORDS, INVITATION_RECORDS, SELF_RECORDS } from "./data-access";
import { CONTROL } from "./ui";

type CustomerRole = Exclude<ProtoRoleKey, "service">;

interface Props {
  lang: ProtoLang;
  role: CustomerRole;
  /** Ownership transfer in the demo leaves the current user as administrator. */
  onOwnershipTransferred: () => void;
  /** Leaving the company in the demo closes access to the company. */
  onLeftCompany: () => void;
}

const canManage = (role: CustomerRole) => role === "owner" || role === "admin";

const allowedActions = (role: CustomerRole): EmployeeActionKey[] => {
  if (role === "owner") return ["invite", "changeRole", "closeAccess", "transferOwnership"];
  if (role === "admin") return ["invite", "changeRole", "closeAccess", "leaveCompany"];
  return ["leaveCompany"];
};

export const EmployeesSection = ({
  lang,
  role,
  onOwnershipTransferred,
  onLeftCompany,
}: Props) => {
  const c = protoCopy[lang];
  const a = protoAccessCopy[lang];
  const [tab, setTab] = useState<EmployeesTabKey>("employees");
  const [pending, setPending] = useState<EmployeeActionKey | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const actions = useMemo(() => allowedActions(role), [role]);
  const tabs = useMemo<EmployeesTabKey[]>(
    () => (canManage(role) ? EMPLOYEES_TABS.filter((t) => t !== "ownership" || role === "owner") : []),
    [role],
  );

  // Роль понижена или изменилась — закрываем открытую форму/диалог и убираем
  // устаревшее состояние, чтобы недоступные действия не оставались на экране.
  useEffect(() => {
    setPending((current) => (current && actions.includes(current) ? current : null));
    setNote(null);
    setTab((current) => (tabs.includes(current) ? current : "employees"));
  }, [role, actions, tabs]);

  const self = SELF_RECORDS[role];

  const confirmAction = () => {
    if (!pending) return;
    if (pending === "transferOwnership") {
      setPending(null);
      onOwnershipTransferred();
      return;
    }
    if (pending === "leaveCompany") {
      setPending(null);
      onLeftCompany();
      return;
    }
    setNote(a.actionRecorded);
    setPending(null);
  };

  const ActionButton = ({
    action,
    variant = "outline",
  }: {
    action: EmployeeActionKey;
    variant?: "default" | "outline" | "destructive";
  }) =>
    actions.includes(action) ? (
      <Button
        variant={variant}
        className={CONTROL}
        onClick={() => setPending(action)}
        data-testid={`proto-employees-action-${action}`}
      >
        {a.employeeActions[action]}
      </Button>
    ) : null;

  return (
    <div className="min-w-0 space-y-4" data-testid="proto-employees">
      {canManage(role) ? (
        <div
          className="flex min-w-0 flex-wrap gap-1.5"
          role="group"
          aria-label={a.employeesTabsLabel}
          data-testid="proto-employees-tabs"
        >
          {tabs.map((key) => (
            <Button
              key={key}
              variant={tab === key ? "secondary" : "ghost"}
              aria-pressed={tab === key}
              className={`${CONTROL} ${tab === key ? "font-semibold" : ""}`}
              onClick={() => setTab(key)}
              data-testid={`proto-employees-tab-${key}`}
            >
              {a.employeesTabs[key]}
            </Button>
          ))}
        </div>
      ) : null}

      {note ? (
        <p className="text-xs text-muted-foreground" role="status" data-testid="proto-employees-note">
          {note}
        </p>
      ) : null}

      {/* Manager and Observer: only their own record and Leave company */}
      {!canManage(role) ? (
        <div className="min-w-0 rounded-lg border border-border bg-card p-4" data-testid="proto-employees-own-record">
          <h2 className="font-heading text-base font-semibold">{a.ownRecordTitle}</h2>
          <p className="text-xs text-muted-foreground">{a.ownRecordHint}</p>
          <dl className="mt-3 grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-[10.5px] uppercase text-muted-foreground">
                {a.employeeColumns.name}
              </dt>
              <dd className="min-w-0 break-words text-sm font-medium">{self.name}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[10.5px] uppercase text-muted-foreground">{a.ownRecordRole}</dt>
              <dd className="text-sm font-medium">{c.roles[role]}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[10.5px] uppercase text-muted-foreground">
                {a.employeeColumns.since}
              </dt>
              <dd className="text-sm">{self.since}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">{a.noEmployeeList}</p>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <ActionButton action="leaveCompany" />
          </div>
        </div>
      ) : null}

      {canManage(role) && tab === "employees" ? (
        <div className="min-w-0 space-y-3" data-testid="proto-employees-list">
          <div className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{a.employeeColumns.name}</TableHead>
                  <TableHead className="text-xs">{a.employeeColumns.role}</TableHead>
                  <TableHead className="text-xs">{a.employeeColumns.since}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EMPLOYEE_RECORDS.map((e) => (
                  <TableRow key={e.id} className="h-12" data-testid={`proto-employee-row-${e.id}`}>
                    <TableCell className="align-top font-medium">{e.name}</TableCell>
                    <TableCell className="align-top text-sm">{c.roles[e.role]}</TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">{e.since}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-2 md:hidden">
            {EMPLOYEE_RECORDS.map((e) => (
              <li
                key={e.id}
                className="min-w-0 rounded-lg border border-border bg-card p-3"
                data-testid={`proto-employee-card-${e.id}`}
              >
                <p className="min-w-0 break-words font-medium">{e.name}</p>
                <p className="text-sm">{c.roles[e.role]}</p>
                <p className="text-xs text-muted-foreground">
                  {a.employeeColumns.since}: {e.since}
                </p>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">{a.firstRegistrantNote}</p>

          <div className="flex min-w-0 flex-wrap gap-2 border-t border-border/60 pt-3">
            <ActionButton action="invite" variant="default" />
            <ActionButton action="changeRole" />
            <ActionButton action="closeAccess" variant="destructive" />
            <ActionButton action="leaveCompany" />
          </div>
          {role === "owner" ? (
            <p className="text-xs text-muted-foreground" data-testid="proto-employees-owner-leave-note">
              {a.ownershipOwnerNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {canManage(role) && tab === "invitations" ? (
        <div className="min-w-0 space-y-3" data-testid="proto-employees-invitations">
          <p className="text-xs text-muted-foreground">{a.invitationsHint}</p>
          <div className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{a.invitationColumns.name}</TableHead>
                  <TableHead className="text-xs">{a.invitationColumns.role}</TableHead>
                  <TableHead className="text-xs">{a.invitationColumns.status}</TableHead>
                  <TableHead className="text-xs">{a.invitationColumns.sent}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INVITATION_RECORDS.map((inv) => (
                  <TableRow key={inv.id} className="h-12" data-testid={`proto-invitation-row-${inv.id}`}>
                    <TableCell className="align-top font-medium">{inv.name}</TableCell>
                    <TableCell className="align-top text-sm">{c.roles[inv.role]}</TableCell>
                    <TableCell className="align-top text-sm">{a.invitationPending}</TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">{inv.sent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="space-y-2 md:hidden">
            {INVITATION_RECORDS.map((inv) => (
              <li
                key={inv.id}
                className="min-w-0 rounded-lg border border-border bg-card p-3"
                data-testid={`proto-invitation-card-${inv.id}`}
              >
                <p className="min-w-0 break-words font-medium">{inv.name}</p>
                <p className="text-sm">
                  {c.roles[inv.role]} · {a.invitationPending}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.invitationColumns.sent}: {inv.sent}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <ActionButton action="invite" variant="default" />
          </div>
        </div>
      ) : null}

      {canManage(role) && tab === "ownership" ? (
        <div className="min-w-0 space-y-3" data-testid="proto-employees-ownership">
          <h2 className="font-heading text-base font-semibold">{a.ownershipTitle}</h2>
          <p className="text-sm text-muted-foreground">{a.ownershipHint}</p>
          <p className="text-xs text-muted-foreground">
            {role === "owner" ? a.ownershipOwnerNote : a.ownershipAdminNote}
          </p>
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
            <ActionButton action="transferOwnership" variant="default" />
          </div>
        </div>
      ) : null}

      <AlertDialog open={pending !== null} onOpenChange={(open) => (open ? null : setPending(null))}>
        <AlertDialogContent data-testid="proto-employees-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{pending ? a.confirmTitles[pending] : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? a.confirmBodies[pending] : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={CONTROL}>{a.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={CONTROL}
              onClick={confirmAction}
              data-testid="proto-employees-dialog-confirm"
            >
              {a.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeesSection;
