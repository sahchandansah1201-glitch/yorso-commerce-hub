import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type {
  AdminIncident,
  AdminIncidentAssignmentFilter,
  AdminIncidentEscalationLevel,
  AdminIncidentSeverity,
  AdminIncidentSlaStatus,
  AdminIncidentSource,
  AdminIncidentStatus,
} from "@/lib/admin-incidents-api";
import { useAdminIncidents } from "@/lib/use-admin-incidents";
import { cn } from "@/lib/utils";

type IncidentStatusFilter = AdminIncidentStatus | "all";
type IncidentSeverityFilter = AdminIncidentSeverity | "all";
type IncidentSourceFilter = AdminIncidentSource | "all";
type IncidentAssignmentFilter = AdminIncidentAssignmentFilter | "all";
type IncidentEscalationFilter = AdminIncidentEscalationLevel | "all";
type IncidentSlaFilter = AdminIncidentSlaStatus | "all";

type IncidentsCopy = {
  acknowledge: string;
  actions: string;
  assign: string;
  assigned: string;
  assigneePlaceholder: string;
  bulkAssign: string;
  bulkComment: string;
  bulkEscalate: string;
  bulkHint: string;
  bulkResolve: string;
  bulkSelected: string;
  bulkTitle: string;
  clearSelection: string;
  allSeverities: string;
  allSlaStatuses: string;
  allSources: string;
  allStatuses: string;
  allAssignments: string;
  allEscalations: string;
  assignedOnly: string;
  comment: string;
  due: string;
  escalate: string;
  escalation: string;
  exportCsv: string;
  exportJson: string;
  exportReady: string;
  disabledBody: string;
  disabledTitle: string;
  errorTitle: string;
  evidence: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  openDetail: string;
  highSignal: string;
  loading: string;
  noIncidents: string;
  notePlaceholder: string;
  open: string;
  refresh: string;
  resolve: string;
  route: string;
  runbook: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  selectIncident: string;
  sla: string;
  source: string;
  subtitle: string;
  summaryAcknowledged: string;
  summaryAssignmentCoverage: string;
  summaryAssigned: string;
  summaryAtRisk: string;
  summaryBreachRate: string;
  summaryBreached: string;
  summaryCritical: string;
  summaryEscalationLoad: string;
  summaryEscalated: string;
  summaryHigh: string;
  summaryOldestOpen: string;
  summaryOpen: string;
  summaryOpenCritical: string;
  summarySourceMix: string;
  summaryUnassigned: string;
  timeline: string;
  title: string;
  unassignedOnly: string;
  workflow: string;
};

const COPY: Record<Language, IncidentsCopy> = {
  en: {
    acknowledge: "Acknowledge",
    actions: "Recommended actions",
    assign: "Assign",
    assigned: "Assigned",
    assigneePlaceholder: "Assignee user UUID",
    bulkAssign: "Assign selected",
    bulkComment: "Comment selected",
    bulkEscalate: "Escalate selected",
    bulkHint: "Bulk actions apply only to currently selected incidents. Notes must not contain raw emails, session ids or secrets.",
    bulkResolve: "Resolve selected",
    bulkSelected: "selected",
    bulkTitle: "Bulk workflow",
    clearSelection: "Clear selection",
    allSeverities: "All severities",
    allSlaStatuses: "All SLA states",
    allSources: "All sources",
    allStatuses: "All statuses",
    allAssignments: "All assignment states",
    allEscalations: "All escalation levels",
    assignedOnly: "Assigned only",
    comment: "Add comment",
    due: "Due",
    escalate: "Escalate",
    escalation: "Escalation",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    exportReady: "Sanitized export ready",
    disabledBody: "Set VITE_YORSO_API_URL to inspect derived incidents from the self-hosted API. Prototype mode does not fabricate incident data.",
    disabledTitle: "Self-hosted API is not connected",
    errorTitle: "Incidents could not be loaded",
    evidence: "Evidence",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    openDetail: "Open detail",
    highSignal: "Derived from runtime diagnostics and sanitized audit events",
    loading: "Loading incidents...",
    noIncidents: "No incidents match these filters.",
    notePlaceholder: "Operator note, no emails, session ids or secrets",
    open: "Open",
    refresh: "Refresh incidents",
    resolve: "Resolve",
    route: "Route",
    runbook: "Runbook",
    sessionBody: "Sign in through the self-hosted auth flow before opening incident response.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    selectIncident: "Select incident",
    sla: "SLA",
    source: "Source",
    subtitle: "Triage production runtime, audit and access signals without exposing raw identifiers.",
    summaryAcknowledged: "Acknowledged",
    summaryAssignmentCoverage: "Assignment coverage",
    summaryAssigned: "Assigned",
    summaryAtRisk: "SLA at risk",
    summaryBreachRate: "Breach rate",
    summaryBreached: "SLA breached",
    summaryCritical: "Critical",
    summaryEscalationLoad: "Escalation load",
    summaryEscalated: "Escalated",
    summaryHigh: "High",
    summaryOldestOpen: "Oldest open",
    summaryOpen: "Open incidents",
    summaryOpenCritical: "Open critical",
    summarySourceMix: "Source mix",
    summaryUnassigned: "Unassigned",
    timeline: "Timeline",
    title: "Admin incident response",
    unassignedOnly: "Unassigned only",
    workflow: "Workflow",
  },
  ru: {
    acknowledge: "Принять в работу",
    actions: "Рекомендованные действия",
    assign: "Назначить",
    assigned: "Назначен",
    assigneePlaceholder: "UUID ответственного пользователя",
    bulkAssign: "Назначить выбранные",
    bulkComment: "Комментировать выбранные",
    bulkEscalate: "Эскалировать выбранные",
    bulkHint: "Массовые действия применяются только к выбранным инцидентам. В заметках нельзя указывать email, session id и секреты.",
    bulkResolve: "Закрыть выбранные",
    bulkSelected: "выбрано",
    bulkTitle: "Массовый workflow",
    clearSelection: "Очистить выбор",
    allSeverities: "Все уровни",
    allSlaStatuses: "Все SLA состояния",
    allSources: "Все источники",
    allStatuses: "Все статусы",
    allAssignments: "Все состояния назначения",
    allEscalations: "Все уровни эскалации",
    assignedOnly: "Только назначенные",
    comment: "Добавить комментарий",
    due: "Срок",
    escalate: "Эскалировать",
    escalation: "Эскалация",
    exportCsv: "Экспорт CSV",
    exportJson: "Экспорт JSON",
    exportReady: "Очищенный экспорт готов",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы смотреть инциденты из self-hosted API. Prototype-режим не придумывает incident data.",
    disabledTitle: "Self-hosted API не подключен",
    errorTitle: "Инциденты не загрузились",
    evidence: "Evidence",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    openDetail: "Открыть detail",
    highSignal: "Формируется из runtime diagnostics и очищенных audit events",
    loading: "Загружаем инциденты...",
    noIncidents: "По этим фильтрам инцидентов нет.",
    notePlaceholder: "Заметка оператора, без email, session id и секретов",
    open: "Открытые",
    refresh: "Обновить инциденты",
    resolve: "Закрыть",
    route: "Route",
    runbook: "Runbook",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть incident response.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    selectIncident: "Выбрать инцидент",
    sla: "SLA",
    source: "Источник",
    subtitle: "Triage production runtime, audit и access signals без раскрытия raw identifiers.",
    summaryAcknowledged: "В работе",
    summaryAssignmentCoverage: "Покрытие назначений",
    summaryAssigned: "Назначены",
    summaryAtRisk: "SLA под риском",
    summaryBreachRate: "Доля нарушений",
    summaryBreached: "SLA нарушен",
    summaryCritical: "Critical",
    summaryEscalationLoad: "Нагрузка эскалаций",
    summaryEscalated: "Эскалированы",
    summaryHigh: "High",
    summaryOldestOpen: "Самый старый открытый",
    summaryOpen: "Открытые инциденты",
    summaryOpenCritical: "Открытые critical",
    summarySourceMix: "Источники",
    summaryUnassigned: "Без ответственного",
    timeline: "Timeline",
    title: "Admin incident response",
    unassignedOnly: "Только без ответственного",
    workflow: "Workflow",
  },
  es: {
    acknowledge: "Reconocer",
    actions: "Acciones recomendadas",
    assign: "Asignar",
    assigned: "Asignado",
    assigneePlaceholder: "UUID del usuario responsable",
    bulkAssign: "Asignar seleccionados",
    bulkComment: "Comentar seleccionados",
    bulkEscalate: "Escalar seleccionados",
    bulkHint: "Las acciones masivas solo se aplican a incidentes seleccionados. Las notas no deben contener emails, session ids ni secretos.",
    bulkResolve: "Resolver seleccionados",
    bulkSelected: "seleccionados",
    bulkTitle: "Workflow masivo",
    clearSelection: "Limpiar selección",
    allSeverities: "Todas las severidades",
    allSlaStatuses: "Todos los estados SLA",
    allSources: "Todas las fuentes",
    allStatuses: "Todos los estados",
    allAssignments: "Todos los estados de asignación",
    allEscalations: "Todos los niveles de escalación",
    assignedOnly: "Solo asignados",
    comment: "Añadir comentario",
    due: "Vence",
    escalate: "Escalar",
    escalation: "Escalación",
    exportCsv: "Exportar CSV",
    exportJson: "Exportar JSON",
    exportReady: "Exportación sanitizada lista",
    disabledBody: "Define VITE_YORSO_API_URL para revisar incidentes derivados de la API self-hosted. El modo prototipo no inventa incident data.",
    disabledTitle: "La API self-hosted no está conectada",
    errorTitle: "No se pudieron cargar incidentes",
    evidence: "Evidencia",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    openDetail: "Abrir detalle",
    highSignal: "Derivado de runtime diagnostics y audit events sanitizados",
    loading: "Cargando incidentes...",
    noIncidents: "No hay incidentes para estos filtros.",
    notePlaceholder: "Nota de operador, sin emails, session ids ni secretos",
    open: "Abiertos",
    refresh: "Actualizar incidentes",
    resolve: "Resolver",
    route: "Ruta",
    runbook: "Runbook",
    sessionBody: "Inicia sesión mediante el auth flow self-hosted antes de abrir incident response.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    selectIncident: "Seleccionar incidente",
    sla: "SLA",
    source: "Fuente",
    subtitle: "Triage de production runtime, audit y access signals sin exponer identificadores crudos.",
    summaryAcknowledged: "Reconocidos",
    summaryAssignmentCoverage: "Cobertura de asignación",
    summaryAssigned: "Asignados",
    summaryAtRisk: "SLA en riesgo",
    summaryBreachRate: "Tasa de vencimiento",
    summaryBreached: "SLA vencido",
    summaryCritical: "Críticos",
    summaryEscalationLoad: "Carga de escalación",
    summaryEscalated: "Escalados",
    summaryHigh: "Altos",
    summaryOldestOpen: "Más antiguo abierto",
    summaryOpen: "Incidentes abiertos",
    summaryOpenCritical: "Críticos abiertos",
    summarySourceMix: "Origen",
    summaryUnassigned: "Sin asignar",
    timeline: "Timeline",
    title: "Admin incident response",
    unassignedOnly: "Solo sin asignar",
    workflow: "Workflow",
  },
};

export default function AdminIncidents() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const [status, setStatus] = useState<IncidentStatusFilter>("open");
  const [severity, setSeverity] = useState<IncidentSeverityFilter>("all");
  const [source, setSource] = useState<IncidentSourceFilter>("all");
  const [assigned, setAssigned] = useState<IncidentAssignmentFilter>("all");
  const [escalationLevel, setEscalationLevel] = useState<IncidentEscalationFilter>("all");
  const [slaStatus, setSlaStatus] = useState<IncidentSlaFilter>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [escalations, setEscalations] = useState<Record<string, AdminIncidentEscalationLevel>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkEscalation, setBulkEscalation] = useState<AdminIncidentEscalationLevel>("lead");
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const query = useMemo(
    () => ({ assigned, escalationLevel, limit: 25, severity, slaStatus, source, status }),
    [assigned, escalationLevel, severity, slaStatus, source, status],
  );
  const incidents = useAdminIncidents(session, query);
  const data = incidents.data;

  const updateNote = (incidentId: string, value: string) => {
    setNotes((current) => ({ ...current, [incidentId]: value }));
  };

  const updateAssignee = (incidentId: string, value: string) => {
    setAssignees((current) => ({ ...current, [incidentId]: value }));
  };

  const updateEscalation = (incidentId: string, value: AdminIncidentEscalationLevel) => {
    setEscalations((current) => ({ ...current, [incidentId]: value }));
  };

  const toggleIncident = (incidentId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) return current.includes(incidentId) ? current : [...current, incidentId];
      return current.filter((id) => id !== incidentId);
    });
  };

  const acknowledge = async (incidentId: string, nextStatus: "acknowledged" | "resolved") => {
    await incidents.acknowledge(incidentId, {
      note: notes[incidentId],
      status: nextStatus,
    });
  };

  const assign = async (incidentId: string) => {
    await incidents.workflow(incidentId, {
      action: "assign",
      assignedToUserId: assignees[incidentId],
      note: notes[incidentId],
    });
  };

  const bulkAssign = async () => {
    await incidents.bulkWorkflow({
      action: "assign",
      assignedToUserId: bulkAssignee,
      incidentIds: selectedIds,
      note: bulkNote,
    });
  };

  const bulkEscalate = async () => {
    await incidents.bulkWorkflow({
      action: "escalate",
      escalationLevel: bulkEscalation,
      incidentIds: selectedIds,
      note: bulkNote,
    });
  };

  const bulkComment = async () => {
    await incidents.bulkWorkflow({
      action: "comment",
      incidentIds: selectedIds,
      note: bulkNote,
    });
  };

  const bulkResolve = async () => {
    await incidents.bulkWorkflow({
      action: "resolve",
      incidentIds: selectedIds,
      note: bulkNote,
    });
  };

  const exportJson = async () => {
    const result = await incidents.exportJson();
    setExportStatus(`${copy.exportReady}: JSON ${result.count}`);
  };

  const exportCsv = async () => {
    const result = await incidents.exportCsv();
    setExportStatus(`${copy.exportReady}: CSV ${result.split("\n").filter(Boolean).length - 1}`);
  };

  const escalate = async (incidentId: string) => {
    await incidents.workflow(incidentId, {
      action: "escalate",
      escalationLevel: escalations[incidentId] ?? "lead",
      note: notes[incidentId],
    });
  };

  const comment = async (incidentId: string) => {
    await incidents.workflow(incidentId, {
      action: "comment",
      note: notes[incidentId],
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-incidents-page">
        <AdminOperatorNav />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <Badge className="mb-4 bg-red-100 text-red-700 hover:bg-red-100">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              {copy.highSignal}
            </Badge>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{copy.title}</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{copy.subtitle}</p>
              </div>
              <Button data-testid="admin-incidents-refresh" onClick={incidents.refresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.refresh}
              </Button>
              <Button
                data-testid="admin-incidents-export-json"
                disabled={incidents.status !== "ready"}
                onClick={exportJson}
                variant="outline"
              >
                {copy.exportJson}
              </Button>
              <Button
                data-testid="admin-incidents-export-csv"
                disabled={incidents.status !== "ready"}
                onClick={exportCsv}
                variant="outline"
              >
                {copy.exportCsv}
              </Button>
            </div>
            {exportStatus && (
              <p className="mt-3 text-sm text-muted-foreground" data-testid="admin-incidents-export-status">
                {exportStatus}
              </p>
            )}
          </div>

          <div className="grid gap-4">
            <SummaryPanel copy={copy} summary={data?.summary ?? null} />
            <WorkflowLoadPanel copy={copy} summary={data?.summary ?? null} />
          </div>
        </section>

        {incidents.status === "disabled" && (
          <Alert data-testid="admin-incidents-disabled">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.disabledTitle}</AlertTitle>
            <AlertDescription>{copy.disabledBody}</AlertDescription>
          </Alert>
        )}

        {incidents.status === "session_required" && (
          <Alert data-testid="admin-incidents-session-required">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.sessionTitle}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{copy.sessionBody}</span>
              <Button asChild size="sm">
                <Link to="/signin">{copy.sessionCta}</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {incidents.status === "forbidden" && (
          <Alert data-testid="admin-incidents-forbidden" variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
            <AlertDescription>{copy.forbiddenBody}</AlertDescription>
          </Alert>
        )}

        {incidents.status === "error" && (
          <Alert data-testid="admin-incidents-error" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{incidents.error.message}</AlertDescription>
          </Alert>
        )}

        <Card data-testid="admin-incidents-filters">
          <CardContent className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
            <FilterSelect
              label={copy.allStatuses}
              options={["all", "open", "acknowledged", "resolved"]}
              testId="admin-incidents-status-filter"
              value={status}
              onValueChange={(value) => setStatus(value as IncidentStatusFilter)}
            />
            <FilterSelect
              label={copy.allSeverities}
              options={["all", "critical", "high", "medium", "low"]}
              testId="admin-incidents-severity-filter"
              value={severity}
              onValueChange={(value) => setSeverity(value as IncidentSeverityFilter)}
            />
            <FilterSelect
              label={copy.allSources}
              options={["all", "runtime", "audit", "access", "security", "policy"]}
              testId="admin-incidents-source-filter"
              value={source}
              onValueChange={(value) => setSource(value as IncidentSourceFilter)}
            />
            <FilterSelect
              label={copy.allAssignments}
              optionLabels={{
                assigned: copy.assignedOnly,
                unassigned: copy.unassignedOnly,
              }}
              options={["all", "assigned", "unassigned"]}
              testId="admin-incidents-assigned-filter"
              value={assigned}
              onValueChange={(value) => setAssigned(value as IncidentAssignmentFilter)}
            />
            <FilterSelect
              label={copy.allEscalations}
              options={["all", "none", "lead", "engineering", "executive"]}
              testId="admin-incidents-escalation-filter"
              value={escalationLevel}
              onValueChange={(value) => setEscalationLevel(value as IncidentEscalationFilter)}
            />
            <FilterSelect
              label={copy.allSlaStatuses}
              options={["all", "ok", "at_risk", "breached"]}
              testId="admin-incidents-sla-filter"
              value={slaStatus}
              onValueChange={(value) => setSlaStatus(value as IncidentSlaFilter)}
            />
          </CardContent>
        </Card>

        {data && data.incidents.length > 0 && (
          <BulkWorkflowPanel
            assignee={bulkAssignee}
            copy={copy}
            disabled={incidents.mutatingId === "bulk" || selectedIds.length === 0}
            escalation={bulkEscalation}
            note={bulkNote}
            selectedCount={selectedIds.length}
            onAssign={bulkAssign}
            onAssigneeChange={setBulkAssignee}
            onClear={() => setSelectedIds([])}
            onComment={bulkComment}
            onEscalate={bulkEscalate}
            onEscalationChange={setBulkEscalation}
            onNoteChange={setBulkNote}
            onResolve={bulkResolve}
          />
        )}

        {incidents.status === "loading" && !data && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{copy.loading}</CardContent>
          </Card>
        )}

        {data && data.incidents.length === 0 && (
          <Card data-testid="admin-incidents-empty">
            <CardContent className="p-6 text-sm text-muted-foreground">{copy.noIncidents}</CardContent>
          </Card>
        )}

        {data && data.incidents.length > 0 && (
          <section className="grid gap-4" data-testid="admin-incidents-list">
            {data.incidents.map((incident) => (
              <IncidentCard
                copy={copy}
                incident={incident}
                key={incident.id}
                mutating={incidents.mutatingId === incident.id}
                selected={selectedIds.includes(incident.id)}
                assignee={assignees[incident.id] ?? ""}
                escalation={escalations[incident.id] ?? "lead"}
                note={notes[incident.id] ?? ""}
                onAcknowledge={(nextStatus) => acknowledge(incident.id, nextStatus)}
                onAssign={() => assign(incident.id)}
                onAssigneeChange={(value) => updateAssignee(incident.id, value)}
                onComment={() => comment(incident.id)}
                onEscalate={() => escalate(incident.id)}
                onEscalationChange={(value) => updateEscalation(incident.id, value)}
                onNoteChange={(value) => updateNote(incident.id, value)}
                onToggleSelected={(checked) => toggleIncident(incident.id, checked)}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryPanel({
  copy,
  summary,
}: {
  copy: IncidentsCopy;
  summary: {
    acknowledged: number;
    assigned: number;
    breached: number;
    critical: number;
    escalated: number;
    high: number;
    open: number;
  } | null;
}) {
  const items = [
    { label: copy.summaryOpen, value: summary?.open ?? 0 },
    { label: copy.summaryCritical, value: summary?.critical ?? 0 },
    { label: copy.summaryHigh, value: summary?.high ?? 0 },
    { label: copy.summaryAcknowledged, value: summary?.acknowledged ?? 0 },
    { label: copy.summaryAssigned, value: summary?.assigned ?? 0 },
    { label: copy.summaryEscalated, value: summary?.escalated ?? 0 },
    { label: copy.summaryBreached, value: summary?.breached ?? 0 },
  ];
  return (
    <Card className="border-red-200 bg-red-50/60" data-testid="admin-incidents-summary">
      <CardContent className="grid grid-cols-2 gap-3 p-4">
        {items.map((item) => (
          <div className="rounded-2xl bg-background/80 p-4" key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorkflowLoadPanel({
  copy,
  summary,
}: {
  copy: IncidentsCopy;
  summary: {
    access: number;
    assignmentCoveragePct: number;
    atRisk: number;
    audit: number;
    breachRatePct: number;
    engineeringEscalations: number;
    executiveEscalations: number;
    leadEscalations: number;
    oldestOpenMinutes: number;
    openCritical: number;
    policy: number;
    runtime: number;
    security: number;
    unassigned: number;
  } | null;
}) {
  const coverage = summary?.assignmentCoveragePct ?? 0;
  const breachRate = summary?.breachRatePct ?? 0;
  const oldestOpen = summary?.oldestOpenMinutes ?? 0;
  const sourceItems = [
    ["runtime", summary?.runtime ?? 0],
    ["audit", summary?.audit ?? 0],
    ["access", summary?.access ?? 0],
    ["security", summary?.security ?? 0],
    ["policy", summary?.policy ?? 0],
  ];
  const escalationItems = [
    ["lead", summary?.leadEscalations ?? 0],
    ["engineering", summary?.engineeringEscalations ?? 0],
    ["executive", summary?.executiveEscalations ?? 0],
  ];

  return (
    <Card data-testid="admin-incidents-workload-summary">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{copy.summaryAssignmentCoverage}</CardTitle>
        <CardDescription>
          {copy.summaryUnassigned}: {summary?.unassigned ?? 0}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricTile label={copy.summaryAssignmentCoverage} value={`${coverage}%`} />
          <MetricTile label={copy.summaryBreachRate} value={`${breachRate}%`} />
          <MetricTile label={copy.summaryAtRisk} value={summary?.atRisk ?? 0} />
          <MetricTile label={copy.summaryOpenCritical} value={summary?.openCritical ?? 0} />
          <MetricTile label={copy.summaryOldestOpen} value={`${oldestOpen}m`} />
          <MetricTile label={copy.summaryUnassigned} value={summary?.unassigned ?? 0} />
        </div>

        <div data-testid="admin-incidents-escalation-load">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {copy.summaryEscalationLoad}
          </p>
          <div className="flex flex-wrap gap-2">
            {escalationItems.map(([label, value]) => (
              <Badge key={label} variant="outline">
                {label}: {value}
              </Badge>
            ))}
          </div>
        </div>

        <div data-testid="admin-incidents-source-mix">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {copy.summarySourceMix}
          </p>
          <div className="flex flex-wrap gap-2">
            {sourceItems.map(([label, value]) => (
              <Badge key={label} variant="secondary">
                {label}: {value}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  onValueChange,
  optionLabels = {},
  options,
  testId,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  optionLabels?: Record<string, string>;
  options: string[];
  testId: string;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger data-testid={testId}>
        <SelectValue aria-label={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option === "all" ? label : optionLabels[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BulkWorkflowPanel({
  assignee,
  copy,
  disabled,
  escalation,
  note,
  onAssign,
  onAssigneeChange,
  onClear,
  onComment,
  onEscalate,
  onEscalationChange,
  onNoteChange,
  onResolve,
  selectedCount,
}: {
  assignee: string;
  copy: IncidentsCopy;
  disabled: boolean;
  escalation: AdminIncidentEscalationLevel;
  note: string;
  onAssign: () => void;
  onAssigneeChange: (value: string) => void;
  onClear: () => void;
  onComment: () => void;
  onEscalate: () => void;
  onEscalationChange: (value: AdminIncidentEscalationLevel) => void;
  onNoteChange: (value: string) => void;
  onResolve: () => void;
  selectedCount: number;
}) {
  return (
    <Card data-testid="admin-incidents-bulk-workflow">
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-lg">{copy.bulkTitle}</CardTitle>
            <CardDescription>{copy.bulkHint}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={selectedCount > 0 ? "default" : "outline"} data-testid="admin-incidents-selected-count">
              {selectedCount} {copy.bulkSelected}
            </Badge>
            <Button disabled={selectedCount === 0} onClick={onClear} size="sm" variant="outline">
              {copy.clearSelection}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
        <Input
          data-testid="admin-incidents-bulk-assignee"
          onChange={(event) => onAssigneeChange(event.target.value)}
          placeholder={copy.assigneePlaceholder}
          value={assignee}
        />
        <Textarea
          data-testid="admin-incidents-bulk-note"
          maxLength={500}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={copy.notePlaceholder}
          value={note}
        />
        <div className="grid gap-2">
          <Select value={escalation} onValueChange={(value) => onEscalationChange(value as AdminIncidentEscalationLevel)}>
            <SelectTrigger data-testid="admin-incidents-bulk-escalation">
              <SelectValue aria-label={copy.escalation} />
            </SelectTrigger>
            <SelectContent>
              {["lead", "engineering", "executive"].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button
              data-testid="admin-incidents-bulk-assign"
              disabled={disabled || !assignee.trim()}
              onClick={onAssign}
              variant="outline"
            >
              {copy.bulkAssign}
            </Button>
            <Button
              data-testid="admin-incidents-bulk-escalate"
              disabled={disabled}
              onClick={onEscalate}
              variant="outline"
            >
              {copy.bulkEscalate}
            </Button>
            <Button
              data-testid="admin-incidents-bulk-comment"
              disabled={disabled || !note.trim()}
              onClick={onComment}
              variant="outline"
            >
              {copy.bulkComment}
            </Button>
            <Button
              data-testid="admin-incidents-bulk-resolve"
              disabled={disabled}
              onClick={onResolve}
            >
              {copy.bulkResolve}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IncidentCard({
  assignee,
  copy,
  escalation,
  incident,
  mutating,
  note,
  selected,
  onAcknowledge,
  onAssign,
  onAssigneeChange,
  onComment,
  onEscalate,
  onEscalationChange,
  onNoteChange,
  onToggleSelected,
}: {
  assignee: string;
  copy: IncidentsCopy;
  escalation: AdminIncidentEscalationLevel;
  incident: AdminIncident;
  mutating: boolean;
  note: string;
  selected: boolean;
  onAcknowledge: (status: "acknowledged" | "resolved") => void;
  onAssign: () => void;
  onAssigneeChange: (value: string) => void;
  onComment: () => void;
  onEscalate: () => void;
  onEscalationChange: (value: AdminIncidentEscalationLevel) => void;
  onNoteChange: (value: string) => void;
  onToggleSelected: (checked: boolean) => void;
}) {
  return (
    <Card data-testid="admin-incident-row">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <label className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-background">
              <span className="sr-only">{copy.selectIncident}</span>
              <input
                checked={selected}
                className="h-4 w-4 accent-primary"
                data-testid={`admin-incident-select-${incident.id}`}
                onChange={(event) => onToggleSelected(event.target.checked)}
                type="checkbox"
              />
            </label>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={incident.severity} />
              <Badge variant={incident.status === "open" ? "destructive" : "secondary"}>{incident.status}</Badge>
              <Badge variant="outline">{incident.source}</Badge>
              <Badge variant="outline">{incident.count} events</Badge>
              <Badge variant={incident.slaStatus === "breached" ? "destructive" : "outline"}>
                {copy.sla}: {incident.slaStatus}
              </Badge>
              {incident.escalationLevel !== "none" && (
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  {copy.escalation}: {incident.escalationLevel}
                </Badge>
              )}
            </div>
            <CardTitle className="mt-3 text-xl">{incident.title}</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">{incident.description}</CardDescription>
          </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(incident.lastSeenAt).toLocaleString()}</span>
            <Button asChild size="sm" variant="outline" data-testid={`admin-incident-open-detail-${incident.id}`}>
              <Link to={`/admin/incidents/${encodeURIComponent(incident.id)}`}>{copy.openDetail}</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.evidence}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {incident.evidence.map((item) => (
                <div className="rounded-2xl border bg-background p-3 text-sm" key={`${incident.id}-${item.label}`}>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 break-words font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.actions}</p>
            <ul className="mt-2 space-y-2">
              {incident.recommendedActions.map((action) => (
                <li className="flex gap-2 text-sm text-muted-foreground" key={action}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            {copy.route}: {incident.route ?? "none"}
          </p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.runbook}</p>
            <div className="mt-2 grid gap-2">
              {incident.runbook.map((step) => (
                <div className="rounded-2xl border bg-background p-3 text-sm" key={`${incident.id}-${step.label}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{step.ownerRole}</Badge>
                    <span className="text-xs text-muted-foreground">{step.targetMinutes} min</span>
                  </div>
                  <p className="mt-2 font-medium text-foreground">{step.label}</p>
                  <p className="mt-1 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <p>
              {copy.due}: <span className="font-medium text-foreground">{new Date(incident.dueAt).toLocaleString()}</span>
            </p>
            <p>
              {copy.assigned}: <span className="font-medium text-foreground">{incident.assignedToUserHash ?? "none"}</span>
            </p>
            <p>
              {copy.escalation}: <span className="font-medium text-foreground">{incident.escalationLevel}</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.timeline}</p>
            <ol className="mt-2 space-y-2" data-testid={`admin-incident-timeline-${incident.id}`}>
              {incident.timelinePreview.map((event) => (
                <li className="rounded-2xl border bg-background p-3 text-sm" key={event.eventId}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{event.type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</span>
                  </div>
                  {event.note && <p className="mt-1 text-muted-foreground">{event.note}</p>}
                  {event.actorUserHash && <p className="mt-1 text-xs text-muted-foreground">{event.actorUserHash}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="rounded-2xl border bg-muted/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {copy.workflow}
          </p>
          <Textarea
            data-testid={`admin-incident-note-${incident.id}`}
            maxLength={500}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={copy.notePlaceholder}
            value={note}
          />
          {incident.acknowledgedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              {incident.status} {new Date(incident.acknowledgedAt).toLocaleString()} by {incident.acknowledgedByUserHash}
            </p>
          )}
          <div className="mt-4 grid gap-2">
            <Input
              data-testid={`admin-incident-assignee-${incident.id}`}
              onChange={(event) => onAssigneeChange(event.target.value)}
              placeholder={copy.assigneePlaceholder}
              value={assignee}
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Select value={escalation} onValueChange={(value) => onEscalationChange(value as AdminIncidentEscalationLevel)}>
                <SelectTrigger data-testid={`admin-incident-escalation-${incident.id}`}>
                  <SelectValue aria-label={copy.escalation} />
                </SelectTrigger>
                <SelectContent>
                  {["lead", "engineering", "executive"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                data-testid={`admin-incident-escalate-${incident.id}`}
                disabled={mutating}
                onClick={onEscalate}
                variant="outline"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                {copy.escalate}
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              data-testid={`admin-incident-assign-${incident.id}`}
              disabled={mutating || !assignee.trim()}
              onClick={onAssign}
              variant="outline"
            >
              <UserRoundCheck className="mr-2 h-4 w-4" />
              {copy.assign}
            </Button>
            <Button
              data-testid={`admin-incident-comment-${incident.id}`}
              disabled={mutating || !note.trim()}
              onClick={onComment}
              variant="outline"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {copy.comment}
            </Button>
            <Button
              data-testid={`admin-incident-ack-${incident.id}`}
              disabled={mutating || incident.status !== "open"}
              onClick={() => onAcknowledge("acknowledged")}
              variant="outline"
            >
              {copy.acknowledge}
            </Button>
            <Button
              data-testid={`admin-incident-resolve-${incident.id}`}
              disabled={mutating || incident.status === "resolved"}
              onClick={() => onAcknowledge("resolved")}
            >
              {copy.resolve}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: AdminIncidentSeverity }) {
  return (
    <Badge
      className={cn(
        severity === "critical" && "bg-red-600 text-white hover:bg-red-600",
        severity === "high" && "bg-orange-500 text-white hover:bg-orange-500",
        severity === "medium" && "bg-amber-100 text-amber-800 hover:bg-amber-100",
        severity === "low" && "bg-slate-100 text-slate-700 hover:bg-slate-100",
      )}
    >
      {severity}
    </Badge>
  );
}
