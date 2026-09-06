/**
 * P2 — "Employees" customer section: employees, invitations, ownership transfer.
 *
 * Every mutating flow collects a real target (and role, where relevant) before
 * confirmation, the confirmation text repeats the selection, and confirming
 * updates the local in-memory list coherently. Role matrix mirrors the current
 * company-access contract. No storage, no network.
 */
import { useEffect, useMemo, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { protoCopy, type ProtoLang, type ProtoRoleKey } from "./copy";
import {
  EMPLOYEES_TABS,
  protoAccessCopy,
  type EmployeeActionKey,
  type EmployeesTabKey,
} from "./copy-access";
import {
  EMPLOYEE_RECORDS,
  INVITATION_RECORDS,
  SELF_RECORDS,
  type EmployeeRecord,
  type InvitationRecord,
} from "./data-access";
import { CONTROL } from "./ui";

type CustomerRole = Exclude<ProtoRoleKey, "service">;
type AssignableRole = Extract<CustomerRole, "admin" | "manager" | "viewer">;

const ASSIGNABLE_ROLES: AssignableRole[] = ["admin", "manager", "viewer"];

const DIALOG_CLOSE_44 =
  "[&>button[type=button]]:h-11 [&>button[type=button]]:w-11 [&>button[type=button]]:min-h-11 [&>button[type=button]]:min-w-11 [&>button[type=button]]:inline-flex [&>button[type=button]]:items-center [&>button[type=button]]:justify-center";

interface Props {
  lang: ProtoLang;
  role: CustomerRole;
  /** Identity of the current employee — stored separately from the role. */
  currentEmployeeId: string;
  /** Mutating actions exist only in the ready state; otherwise they are removed. */
  canMutate: boolean;
  /** Ownership transfer leaves the current employee as administrator. */
  onOwnershipTransferred: () => void;
  /** Leaving the company closes access to the company. */
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
  currentEmployeeId,
  onOwnershipTransferred,
  onLeftCompany,
}: Props) => {
  const c = protoCopy[lang];
  const a = protoAccessCopy[lang];
  const [tab, setTab] = useState<EmployeesTabKey>("employees");
  const [pending, setPending] = useState<EmployeeActionKey | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [employees, setEmployees] = useState<EmployeeRecord[]>(EMPLOYEE_RECORDS);
  const [invitations, setInvitations] = useState<InvitationRecord[]>(INVITATION_RECORDS);

  // Ввод для изменяющих действий — заполняется до подтверждения.
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AssignableRole>("manager");
  const [targetId, setTargetId] = useState("");
  const [newRole, setNewRole] = useState<AssignableRole>("manager");

  const actions = useMemo(() => allowedActions(role), [role]);
  const tabs = useMemo<EmployeesTabKey[]>(
    () => (canManage(role) ? EMPLOYEES_TABS.filter((t) => t !== "ownership" || role === "owner") : []),
    [role],
  );

  // Личность текущего сотрудника хранится отдельно от роли: она берётся из
  // изменяемого списка по устойчивому идентификатору.
  const self = useMemo(
    () =>
      employees.find((e) => e.id === currentEmployeeId) ??
      SELF_RECORDS[role] ??
      employees[0],
    [employees, currentEmployeeId, role],
  );

  // Цели действий: сотрудники компании, кроме текущего сотрудника и владельца.
  // Владельца можно изменить только действием «Передать владение».
  const list = useMemo(
    () => employees.filter((e) => e.id !== self.id && e.role !== "owner"),
    [employees, self.id],
  );
  const target = list.find((e) => e.id === targetId) ?? null;

  // Роль понижена или изменилась — закрываем открытую форму/диалог и убираем
  // устаревшее состояние, чтобы недоступные действия не оставались на экране.
  useEffect(() => {
    setPending(null);
    setNote(null);
    setTab((current) => (tabs.includes(current) ? current : "employees"));
  }, [role, tabs]);

  const openAction = (action: EmployeeActionKey) => {
    setNote(null);
    setEmail("");
    setInviteRole("manager");
    setNewRole("manager");
    setTargetId("");
    setPending(action);
  };

  const emailValid = /.+@.+\..+/.test(email.trim());
  const canConfirm = () => {
    if (pending === "invite") return emailValid;
    if (pending === "changeRole" || pending === "closeAccess" || pending === "transferOwnership") {
      return target !== null;
    }
    return pending === "leaveCompany";
  };

  const fill = (template: string, name: string, roleLabel?: string) =>
    template.replace("{name}", name).replace("{role}", roleLabel ?? "");

  const confirmAction = () => {
    if (!pending || !canConfirm()) return;

    if (pending === "invite") {
      const name = email.trim();
      setInvitations((prev) => [
        { id: `inv-${prev.length + 1}`, name, role: inviteRole, sent: "06.09.2026" },
        ...prev,
      ]);
      setNote(fill(a.invitedResult, name, c.roles[inviteRole]));
      setPending(null);
      return;
    }

    if (pending === "changeRole" && target) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === target.id ? { ...e, role: newRole } : e)),
      );
      setNote(fill(a.roleChangedResult, target.name, c.roles[newRole]));
      setPending(null);
      return;
    }

    if (pending === "closeAccess" && target) {
      setEmployees((prev) => prev.filter((e) => e.id !== target.id));
      setNote(fill(a.accessClosedResult, target.name));
      setPending(null);
      return;
    }

    if (pending === "transferOwnership" && target) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === target.id
            ? { ...e, role: "owner" }
            : e.id === self.id
              ? { ...e, role: "admin" }
              : e,
        ),
      );
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
        onClick={() => openAction(action)}
        data-testid={`proto-employees-action-${action}`}
      >
        {a.employeeActions[action]}
      </Button>
    ) : null;

  const RoleSelect = ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string;
    label: string;
    value: AssignableRole;
    onChange: (next: AssignableRole) => void;
  }) => (
    <div className="min-w-0">
      <label className="block text-[10.5px] uppercase text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as AssignableRole)}>
        <SelectTrigger id={id} className={CONTROL} data-testid={id}>
          <SelectValue aria-label={label} />
        </SelectTrigger>
        <SelectContent>
          {ASSIGNABLE_ROLES.map((key) => (
            <SelectItem key={key} value={key}>{c.roles[key]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const dialogSummary = () => {
    if (!pending) return "";
    const base = a.confirmBodies[pending];
    if (pending === "invite") {
      return emailValid
        ? `${base} ${a.confirmSelection}: ${email.trim()} · ${c.roles[inviteRole]}.`
        : base;
    }
    if (pending === "changeRole") {
      return target ? `${base} ${a.confirmSelection}: ${target.name} · ${c.roles[newRole]}.` : base;
    }
    if (pending === "closeAccess" || pending === "transferOwnership") {
      return target ? `${base} ${a.confirmSelection}: ${target.name}.` : base;
    }
    return base;
  };

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
              <dd className="text-sm font-medium">{c.roles[self.role]}</dd>
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
                {employees.map((e) => (
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
            {employees.map((e) => (
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
                {invitations.map((inv) => (
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
            {invitations.map((inv) => (
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

      <Dialog open={pending !== null} onOpenChange={(open) => (open ? null : setPending(null))}>
        <DialogContent className={DIALOG_CLOSE_44} data-testid="proto-employees-dialog">
          <DialogHeader>
            <DialogTitle>{pending ? a.confirmTitles[pending] : ""}</DialogTitle>
            <DialogDescription data-testid="proto-employees-dialog-summary">
              {dialogSummary()}
            </DialogDescription>
          </DialogHeader>

          {pending === "invite" ? (
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label
                  className="block text-[10.5px] uppercase text-muted-foreground"
                  htmlFor="proto-employees-invite-email"
                >
                  {a.inviteEmailLabel}
                </label>
                <Input
                  id="proto-employees-invite-email"
                  type="email"
                  className={CONTROL}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="proto-employees-invite-email"
                />
                {email.length > 0 && !emailValid ? (
                  <p className="mt-1 text-xs text-destructive">{a.inviteEmailInvalid}</p>
                ) : null}
              </div>
              <RoleSelect
                id="proto-employees-invite-role"
                label={a.inviteRoleLabel}
                value={inviteRole}
                onChange={setInviteRole}
              />
            </div>
          ) : null}

          {pending === "changeRole" || pending === "closeAccess" || pending === "transferOwnership" ? (
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label
                  className="block text-[10.5px] uppercase text-muted-foreground"
                  htmlFor="proto-employees-target"
                >
                  {a.employeeTargetLabel}
                </label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger
                    id="proto-employees-target"
                    className={CONTROL}
                    data-testid="proto-employees-target"
                  >
                    <SelectValue
                      placeholder={a.selectPlaceholder}
                      aria-label={a.employeeTargetLabel}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} · {c.roles[e.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pending === "changeRole" ? (
                <RoleSelect
                  id="proto-employees-new-role"
                  label={a.newRoleLabel}
                  value={newRole}
                  onChange={setNewRole}
                />
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" className={CONTROL} onClick={() => setPending(null)}>
              {a.cancel}
            </Button>
            <Button
              className={CONTROL}
              disabled={!canConfirm()}
              onClick={confirmAction}
              data-testid="proto-employees-dialog-confirm"
            >
              {a.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesSection;
