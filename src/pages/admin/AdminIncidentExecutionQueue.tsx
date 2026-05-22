import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Download, Filter, ListChecks, RefreshCw, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type {
  AdminIncidentExecutionAssignmentFilter,
  AdminIncidentExecutionOwnerRole,
  AdminIncidentExecutionPriority,
  AdminIncidentExecutionQueueItem,
  AdminIncidentExecutionSource,
  AdminIncidentExecutionStatus,
  AdminIncidentSeverity,
  AdminIncidentSlaStatus,
  AdminIncidentStatus,
} from "@/lib/admin-incidents-api";
import { useAdminIncidentExecutionQueue } from "@/lib/use-admin-incident-execution-queue";
import { cn } from "@/lib/utils";

type QueueCopy = {
  allAssignments: string;
  allIncidentSeverities: string;
  allIncidentSla: string;
  allIncidentStatuses: string;
  allOwners: string;
  allPriorities: string;
  allSources: string;
  allStatuses: string;
  assignedOnly: string;
  blockedReason: string;
  bulkBlock: string;
  bulkDone: string;
  bulkHint: string;
  bulkStart: string;
  clearSelection: string;
  disabledBody: string;
  disabledTitle: string;
  errorTitle: string;
  evidenceNote: string;
  exportCsv: string;
  exportJson: string;
  exportReady: string;
  filter: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  loading: string;
  noItems: string;
  note: string;
  overdueOnly: string;
  refresh: string;
  selected: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  subtitle: string;
  summaryAssigned: string;
  summaryBlocked: string;
  summaryDone: string;
  summaryInProgress: string;
  summaryOpen: string;
  summaryOverdue: string;
  summaryTotal: string;
  summaryUnassigned: string;
  title: string;
  unassignedOnly: string;
};

const COPY: Record<Language, QueueCopy> = {
  en: {
    allAssignments: "All assignment states",
    allIncidentSeverities: "All incident severities",
    allIncidentSla: "All incident SLA states",
    allIncidentStatuses: "All incident statuses",
    allOwners: "All owner roles",
    allPriorities: "All priorities",
    allSources: "All execution sources",
    allStatuses: "All execution statuses",
    assignedOnly: "Assigned only",
    blockedReason: "Blocked reason",
    bulkBlock: "Block selected",
    bulkDone: "Mark selected done",
    bulkHint: "Bulk updates apply to selected execution items only. Notes must not contain emails, UUIDs, session ids or secrets.",
    bulkStart: "Start selected",
    clearSelection: "Clear selection",
    disabledBody: "Set VITE_YORSO_API_URL to inspect execution queue from the self-hosted API.",
    disabledTitle: "Self-hosted API is not connected",
    errorTitle: "Execution queue could not be loaded",
    evidenceNote: "Evidence note",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    exportReady: "Execution queue export ready",
    filter: "Filter queue",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    loading: "Loading execution queue...",
    noItems: "No execution items match these filters.",
    note: "Operator note",
    overdueOnly: "Overdue only",
    refresh: "Refresh queue",
    selected: "selected",
    sessionBody: "Sign in through the self-hosted auth flow before opening incident execution.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    subtitle: "Control remediation execution across incidents without opening every detail page.",
    summaryAssigned: "Assigned",
    summaryBlocked: "Blocked",
    summaryDone: "Done",
    summaryInProgress: "In progress",
    summaryOpen: "Open",
    summaryOverdue: "Overdue",
    summaryTotal: "Total",
    summaryUnassigned: "Unassigned",
    title: "Admin incident execution queue",
    unassignedOnly: "Unassigned only",
  },
  ru: {
    allAssignments: "Все состояния назначения",
    allIncidentSeverities: "Все уровни инцидентов",
    allIncidentSla: "Все SLA состояния",
    allIncidentStatuses: "Все статусы инцидентов",
    allOwners: "Все роли владельца",
    allPriorities: "Все приоритеты",
    allSources: "Все источники execution",
    allStatuses: "Все execution статусы",
    assignedOnly: "Только назначенные",
    blockedReason: "Причина блокировки",
    bulkBlock: "Заблокировать выбранные",
    bulkDone: "Отметить выбранные готовыми",
    bulkHint: "Массовые изменения применяются только к выбранным execution items. В заметках нельзя указывать email, UUID, session id и секреты.",
    bulkStart: "Начать выбранные",
    clearSelection: "Очистить выбор",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть execution queue из self-hosted API.",
    disabledTitle: "Self-hosted API не подключен",
    errorTitle: "Execution queue не загрузился",
    evidenceNote: "Evidence note",
    exportCsv: "Экспорт CSV",
    exportJson: "Экспорт JSON",
    exportReady: "Execution queue export готов",
    filter: "Фильтровать queue",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    loading: "Загружаем execution queue...",
    noItems: "По этим фильтрам execution items нет.",
    note: "Заметка оператора",
    overdueOnly: "Только просроченные",
    refresh: "Обновить queue",
    selected: "выбрано",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть incident execution.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    subtitle: "Контроль remediation execution across incidents без открытия каждой detail-страницы.",
    summaryAssigned: "Назначено",
    summaryBlocked: "Заблокировано",
    summaryDone: "Готово",
    summaryInProgress: "В работе",
    summaryOpen: "Открыто",
    summaryOverdue: "Просрочено",
    summaryTotal: "Всего",
    summaryUnassigned: "Без владельца",
    title: "Admin incident execution queue",
    unassignedOnly: "Только без владельца",
  },
  es: {
    allAssignments: "Todos los estados de asignación",
    allIncidentSeverities: "Todas las severidades",
    allIncidentSla: "Todos los estados SLA",
    allIncidentStatuses: "Todos los estados de incidente",
    allOwners: "Todos los roles",
    allPriorities: "Todas las prioridades",
    allSources: "Todas las fuentes",
    allStatuses: "Todos los estados",
    assignedOnly: "Solo asignados",
    blockedReason: "Razón de bloqueo",
    bulkBlock: "Bloquear seleccionados",
    bulkDone: "Marcar seleccionados listos",
    bulkHint: "Los cambios masivos aplican solo a execution items seleccionados. Las notas no deben incluir emails, UUIDs, session ids ni secretos.",
    bulkStart: "Iniciar seleccionados",
    clearSelection: "Limpiar selección",
    disabledBody: "Define VITE_YORSO_API_URL para abrir la execution queue desde la API self-hosted.",
    disabledTitle: "La API self-hosted no está conectada",
    errorTitle: "No se pudo cargar la execution queue",
    evidenceNote: "Evidence note",
    exportCsv: "Exportar CSV",
    exportJson: "Exportar JSON",
    exportReady: "Execution queue export listo",
    filter: "Filtrar queue",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    loading: "Cargando execution queue...",
    noItems: "No hay execution items para estos filtros.",
    note: "Nota del operador",
    overdueOnly: "Solo vencidos",
    refresh: "Actualizar queue",
    selected: "seleccionados",
    sessionBody: "Inicia sesión con self-hosted auth antes de abrir incident execution.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    subtitle: "Controla remediation execution across incidents sin abrir cada detalle.",
    summaryAssigned: "Asignados",
    summaryBlocked: "Bloqueados",
    summaryDone: "Listos",
    summaryInProgress: "En progreso",
    summaryOpen: "Abiertos",
    summaryOverdue: "Vencidos",
    summaryTotal: "Total",
    summaryUnassigned: "Sin responsable",
    title: "Admin incident execution queue",
    unassignedOnly: "Solo sin responsable",
  },
};

export default function AdminIncidentExecutionQueue() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const [status, setStatus] = useState<AdminIncidentExecutionStatus | "all">("all");
  const [priority, setPriority] = useState<AdminIncidentExecutionPriority | "all">("all");
  const [source, setSource] = useState<AdminIncidentExecutionSource | "all">("all");
  const [ownerRole, setOwnerRole] = useState<AdminIncidentExecutionOwnerRole | "all">("all");
  const [assigned, setAssigned] = useState<AdminIncidentExecutionAssignmentFilter | "all">("all");
  const [incidentStatus, setIncidentStatus] = useState<AdminIncidentStatus | "all">("all");
  const [incidentSeverity, setIncidentSeverity] = useState<AdminIncidentSeverity | "all">("all");
  const [incidentSlaStatus, setIncidentSlaStatus] = useState<AdminIncidentSlaStatus | "all">("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [note, setNote] = useState("Operator bulk update without secrets.");
  const [evidenceNote, setEvidenceNote] = useState("Execution evidence captured without secrets.");
  const [blockedReason, setBlockedReason] = useState("Waiting for owner confirmation.");
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const query = useMemo(() => ({
    assigned,
    incidentSeverity,
    incidentSlaStatus,
    incidentStatus,
    limit: 50,
    offset: 0,
    overdueOnly,
    ownerRole,
    priority,
    source,
    status,
  }), [assigned, incidentSeverity, incidentSlaStatus, incidentStatus, overdueOnly, ownerRole, priority, source, status]);

  const queue = useAdminIncidentExecutionQueue(session, query);
  const selectedRefs = useMemo(() => [...selected].map((key) => {
    const [incidentId, itemId] = key.split("\n");
    return { incidentId, itemId };
  }), [selected]);

  const runBulk = async (nextStatus: AdminIncidentExecutionStatus) => {
    if (selectedRefs.length === 0) return;
    const payload = {
      blockedReason: nextStatus === "blocked" ? blockedReason : undefined,
      evidenceNote: nextStatus === "done" ? evidenceNote : undefined,
      items: selectedRefs,
      note,
      status: nextStatus,
    };
    await queue.bulkUpdate(payload);
  };

  const exportJson = async () => {
    const payload = await queue.exportJson();
    setExportStatus(`${copy.exportReady}: ${payload.items.length} items`);
  };

  const exportCsv = async () => {
    const payload = await queue.exportCsv();
    setExportStatus(`${copy.exportReady}: ${payload.split("\n").filter(Boolean).length - 1} CSV rows`);
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AdminOperatorNav />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]" data-testid="admin-incident-execution-queue-page">
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge className="bg-orange-100 text-orange-800" variant="secondary">
                    Batch #105
                  </Badge>
                  <h1 className="mt-3 text-3xl font-bold text-slate-950">{copy.title}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{copy.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button data-testid="admin-incident-execution-refresh" onClick={queue.refresh} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {copy.refresh}
                  </Button>
                  <Button data-testid="admin-incident-execution-export-json" onClick={() => void exportJson()} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {copy.exportJson}
                  </Button>
                  <Button data-testid="admin-incident-execution-export-csv" onClick={() => void exportCsv()} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {copy.exportCsv}
                  </Button>
                </div>
              </div>
              {exportStatus && (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" data-testid="admin-incident-execution-export-status">
                  {exportStatus}
                </p>
              )}
            </div>

            {queue.status === "disabled" && <StateAlert title={copy.disabledTitle} body={copy.disabledBody} />}
            {queue.status === "session_required" && (
              <StateAlert
                title={copy.sessionTitle}
                body={copy.sessionBody}
                action={<Button asChild><Link to="/signin">{copy.sessionCta}</Link></Button>}
              />
            )}
            {queue.status === "forbidden" && <StateAlert title={copy.forbiddenTitle} body={copy.forbiddenBody} />}
            {queue.status === "error" && <StateAlert title={copy.errorTitle} body={queue.error.message} />}

            {(queue.status === "loading" || queue.status === "ready") && (
              <>
                <QueueFilters
                  assigned={assigned}
                  copy={copy}
                  incidentSeverity={incidentSeverity}
                  incidentSlaStatus={incidentSlaStatus}
                  incidentStatus={incidentStatus}
                  onAssigned={setAssigned}
                  onIncidentSeverity={setIncidentSeverity}
                  onIncidentSlaStatus={setIncidentSlaStatus}
                  onIncidentStatus={setIncidentStatus}
                  onOverdueOnly={setOverdueOnly}
                  onOwnerRole={setOwnerRole}
                  onPriority={setPriority}
                  onSource={setSource}
                  onStatus={setStatus}
                  overdueOnly={overdueOnly}
                  ownerRole={ownerRole}
                  priority={priority}
                  source={source}
                  status={status}
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="admin-incident-execution-summary">
                  {summaryCards(copy, queue.data?.summary).map((item) => (
                    <Card key={item.label}>
                      <CardContent className="p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                        <div className="mt-2 text-3xl font-bold text-slate-950">{item.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-orange-700" />
                      Execution items
                    </CardTitle>
                    <CardDescription>{queue.status === "loading" ? copy.loading : `${queue.data?.items.length ?? 0} visible items`}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3" data-testid="admin-incident-execution-items">
                    {queue.data?.items.length === 0 && <p className="text-sm text-muted-foreground">{copy.noItems}</p>}
                    {queue.data?.items.map((item) => (
                      <ExecutionRow
                        checked={selected.has(itemKey(item))}
                        item={item}
                        key={itemKey(item)}
                        onToggle={() => {
                          setSelected((current) => {
                            const next = new Set(current);
                            const key = itemKey(item);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                          });
                        }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <Card data-testid="admin-incident-execution-bulk">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-orange-700" />
                  Bulk execution
                </CardTitle>
                <CardDescription>{selected.size} {copy.selected}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{copy.bulkHint}</p>
                <Textarea
                  aria-label={copy.note}
                  data-testid="admin-incident-execution-note"
                  onChange={(event) => setNote(event.target.value)}
                  value={note}
                />
                <Textarea
                  aria-label={copy.evidenceNote}
                  data-testid="admin-incident-execution-evidence-note"
                  onChange={(event) => setEvidenceNote(event.target.value)}
                  value={evidenceNote}
                />
                <Textarea
                  aria-label={copy.blockedReason}
                  data-testid="admin-incident-execution-blocked-reason"
                  onChange={(event) => setBlockedReason(event.target.value)}
                  value={blockedReason}
                />
                <div className="grid gap-2">
                  <Button disabled={selected.size === 0 || queue.mutating} data-testid="admin-incident-execution-bulk-start" onClick={() => void runBulk("in_progress")}>
                    {copy.bulkStart}
                  </Button>
                  <Button disabled={selected.size === 0 || queue.mutating} data-testid="admin-incident-execution-bulk-done" onClick={() => void runBulk("done")} variant="secondary">
                    {copy.bulkDone}
                  </Button>
                  <Button disabled={selected.size === 0 || queue.mutating} data-testid="admin-incident-execution-bulk-block" onClick={() => void runBulk("blocked")} variant="outline">
                    {copy.bulkBlock}
                  </Button>
                  <Button disabled={selected.size === 0} data-testid="admin-incident-execution-clear-selection" onClick={() => setSelected(new Set())} variant="ghost">
                    {copy.clearSelection}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}

function StateAlert({ action, body, title }: { action?: ReactNode; body: string; title: string }) {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3">
        <span>{body}</span>
        {action}
      </AlertDescription>
    </Alert>
  );
}

function QueueFilters(props: {
  assigned: AdminIncidentExecutionAssignmentFilter | "all";
  copy: QueueCopy;
  incidentSeverity: AdminIncidentSeverity | "all";
  incidentSlaStatus: AdminIncidentSlaStatus | "all";
  incidentStatus: AdminIncidentStatus | "all";
  onAssigned: (value: AdminIncidentExecutionAssignmentFilter | "all") => void;
  onIncidentSeverity: (value: AdminIncidentSeverity | "all") => void;
  onIncidentSlaStatus: (value: AdminIncidentSlaStatus | "all") => void;
  onIncidentStatus: (value: AdminIncidentStatus | "all") => void;
  onOverdueOnly: (value: boolean) => void;
  onOwnerRole: (value: AdminIncidentExecutionOwnerRole | "all") => void;
  onPriority: (value: AdminIncidentExecutionPriority | "all") => void;
  onSource: (value: AdminIncidentExecutionSource | "all") => void;
  onStatus: (value: AdminIncidentExecutionStatus | "all") => void;
  overdueOnly: boolean;
  ownerRole: AdminIncidentExecutionOwnerRole | "all";
  priority: AdminIncidentExecutionPriority | "all";
  source: AdminIncidentExecutionSource | "all";
  status: AdminIncidentExecutionStatus | "all";
}) {
  return (
    <Card data-testid="admin-incident-execution-filters">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4 text-orange-700" />
          {props.copy.filter}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          onChange={props.onStatus}
          options={["open", "in_progress", "blocked", "done", "skipped"]}
          placeholder={props.copy.allStatuses}
          testId="admin-incident-execution-status-filter"
          value={props.status}
        />
        <FilterSelect
          onChange={props.onPriority}
          options={["immediate", "next", "follow_up"]}
          placeholder={props.copy.allPriorities}
          testId="admin-incident-execution-priority-filter"
          value={props.priority}
        />
        <FilterSelect
          onChange={props.onSource}
          options={["remediation_step", "verification_check", "rollback_step", "postmortem_action", "prevention_check"]}
          placeholder={props.copy.allSources}
          testId="admin-incident-execution-source-filter"
          value={props.source}
        />
        <FilterSelect
          onChange={props.onOwnerRole}
          options={["operator", "engineering", "security", "founder"]}
          placeholder={props.copy.allOwners}
          testId="admin-incident-execution-owner-filter"
          value={props.ownerRole}
        />
        <FilterSelect
          onChange={props.onAssigned}
          options={["assigned", "unassigned"]}
          placeholder={props.copy.allAssignments}
          testId="admin-incident-execution-assigned-filter"
          value={props.assigned}
        />
        <FilterSelect
          onChange={props.onIncidentStatus}
          options={["open", "acknowledged", "resolved"]}
          placeholder={props.copy.allIncidentStatuses}
          testId="admin-incident-execution-incident-status-filter"
          value={props.incidentStatus}
        />
        <FilterSelect
          onChange={props.onIncidentSeverity}
          options={["critical", "high", "medium", "low"]}
          placeholder={props.copy.allIncidentSeverities}
          testId="admin-incident-execution-severity-filter"
          value={props.incidentSeverity}
        />
        <FilterSelect
          onChange={props.onIncidentSlaStatus}
          options={["ok", "at_risk", "breached"]}
          placeholder={props.copy.allIncidentSla}
          testId="admin-incident-execution-sla-filter"
          value={props.incidentSlaStatus}
        />
        <Button
          aria-pressed={props.overdueOnly}
          className={cn(props.overdueOnly && "bg-orange-100 text-orange-800 hover:bg-orange-100")}
          data-testid="admin-incident-execution-overdue-filter"
          onClick={() => props.onOverdueOnly(!props.overdueOnly)}
          variant="outline"
        >
          {props.copy.overdueOnly}
        </Button>
      </CardContent>
    </Card>
  );
}

function FilterSelect<T extends string>({
  onChange,
  options,
  placeholder,
  testId,
  value,
}: {
  onChange: (value: T | "all") => void;
  options: T[];
  placeholder: string;
  testId: string;
  value: T | "all";
}) {
  return (
    <Select onValueChange={(next) => onChange(next as T | "all")} value={value}>
      <SelectTrigger data-testid={testId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ExecutionRow({
  checked,
  item,
  onToggle,
}: {
  checked: boolean;
  item: AdminIncidentExecutionQueueItem;
  onToggle: () => void;
}) {
  return (
    <article
      className={cn(
        "grid gap-3 rounded-3xl border p-4 transition lg:grid-cols-[auto_minmax(0,1fr)_180px]",
        checked ? "border-orange-300 bg-orange-50" : "border-border bg-white",
      )}
      data-testid={`admin-incident-execution-row-${item.itemId}`}
    >
      <input
        aria-label={`Select ${item.itemId}`}
        checked={checked}
        className="mt-1 h-4 w-4"
        data-testid={`admin-incident-execution-select-${item.itemId}`}
        onChange={onToggle}
        type="checkbox"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.overdue ? "destructive" : "secondary"}>{item.status}</Badge>
          <Badge variant="outline">{item.priority}</Badge>
          <Badge variant="outline">{item.ownerRole}</Badge>
          <Badge variant="outline">{item.source}</Badge>
        </div>
        <h2 className="mt-2 text-base font-semibold text-slate-950">{item.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
        <p className="mt-2 truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {item.incidentId} · {item.incidentTitle}
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {item.status === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-orange-700" />}
          <span className="font-semibold">{item.incidentSeverity}</span>
        </div>
        <div className="text-xs text-muted-foreground">Due {new Date(item.targetDueAt).toLocaleString()}</div>
        <Link className="text-xs font-semibold text-orange-700 hover:underline" to={`/admin/incidents/${encodeURIComponent(item.incidentId)}`}>
          Open incident
        </Link>
      </div>
    </article>
  );
}

function summaryCards(copy: QueueCopy, summary?: {
  assigned: number;
  blocked: number;
  done: number;
  inProgress: number;
  open: number;
  overdue: number;
  total: number;
  unassigned: number;
}) {
  return [
    { label: copy.summaryTotal, value: summary?.total ?? 0 },
    { label: copy.summaryOpen, value: summary?.open ?? 0 },
    { label: copy.summaryInProgress, value: summary?.inProgress ?? 0 },
    { label: copy.summaryBlocked, value: summary?.blocked ?? 0 },
    { label: copy.summaryDone, value: summary?.done ?? 0 },
    { label: copy.summaryOverdue, value: summary?.overdue ?? 0 },
    { label: copy.summaryAssigned, value: summary?.assigned ?? 0 },
    { label: copy.summaryUnassigned, value: summary?.unassigned ?? 0 },
  ];
}

function itemKey(item: AdminIncidentExecutionQueueItem) {
  return `${item.incidentId}\n${item.itemId}`;
}
