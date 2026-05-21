import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Lock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
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
  AdminIncident,
  AdminIncidentSeverity,
  AdminIncidentSource,
  AdminIncidentStatus,
} from "@/lib/admin-incidents-api";
import { useAdminIncidents } from "@/lib/use-admin-incidents";
import { cn } from "@/lib/utils";

type IncidentStatusFilter = AdminIncidentStatus | "all";
type IncidentSeverityFilter = AdminIncidentSeverity | "all";
type IncidentSourceFilter = AdminIncidentSource | "all";

type IncidentsCopy = {
  acknowledge: string;
  actions: string;
  allSeverities: string;
  allSources: string;
  allStatuses: string;
  disabledBody: string;
  disabledTitle: string;
  errorTitle: string;
  evidence: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  highSignal: string;
  loading: string;
  noIncidents: string;
  notePlaceholder: string;
  open: string;
  refresh: string;
  resolve: string;
  route: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  source: string;
  subtitle: string;
  summaryAcknowledged: string;
  summaryCritical: string;
  summaryHigh: string;
  summaryOpen: string;
  title: string;
};

const COPY: Record<Language, IncidentsCopy> = {
  en: {
    acknowledge: "Acknowledge",
    actions: "Recommended actions",
    allSeverities: "All severities",
    allSources: "All sources",
    allStatuses: "All statuses",
    disabledBody: "Set VITE_YORSO_API_URL to inspect derived incidents from the self-hosted API. Prototype mode does not fabricate incident data.",
    disabledTitle: "Self-hosted API is not connected",
    errorTitle: "Incidents could not be loaded",
    evidence: "Evidence",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    highSignal: "Derived from runtime diagnostics and sanitized audit events",
    loading: "Loading incidents...",
    noIncidents: "No incidents match these filters.",
    notePlaceholder: "Operator note, no emails, session ids or secrets",
    open: "Open",
    refresh: "Refresh incidents",
    resolve: "Resolve",
    route: "Route",
    sessionBody: "Sign in through the self-hosted auth flow before opening incident response.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    source: "Source",
    subtitle: "Triage production runtime, audit and access signals without exposing raw identifiers.",
    summaryAcknowledged: "Acknowledged",
    summaryCritical: "Critical",
    summaryHigh: "High",
    summaryOpen: "Open incidents",
    title: "Admin incident response",
  },
  ru: {
    acknowledge: "Принять в работу",
    actions: "Рекомендованные действия",
    allSeverities: "Все уровни",
    allSources: "Все источники",
    allStatuses: "Все статусы",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы смотреть инциденты из self-hosted API. Prototype-режим не придумывает incident data.",
    disabledTitle: "Self-hosted API не подключен",
    errorTitle: "Инциденты не загрузились",
    evidence: "Evidence",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    highSignal: "Формируется из runtime diagnostics и очищенных audit events",
    loading: "Загружаем инциденты...",
    noIncidents: "По этим фильтрам инцидентов нет.",
    notePlaceholder: "Заметка оператора, без email, session id и секретов",
    open: "Открытые",
    refresh: "Обновить инциденты",
    resolve: "Закрыть",
    route: "Route",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть incident response.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    source: "Источник",
    subtitle: "Triage production runtime, audit и access signals без раскрытия raw identifiers.",
    summaryAcknowledged: "В работе",
    summaryCritical: "Critical",
    summaryHigh: "High",
    summaryOpen: "Открытые инциденты",
    title: "Admin incident response",
  },
  es: {
    acknowledge: "Reconocer",
    actions: "Acciones recomendadas",
    allSeverities: "Todas las severidades",
    allSources: "Todas las fuentes",
    allStatuses: "Todos los estados",
    disabledBody: "Define VITE_YORSO_API_URL para revisar incidentes derivados de la API self-hosted. El modo prototipo no inventa incident data.",
    disabledTitle: "La API self-hosted no está conectada",
    errorTitle: "No se pudieron cargar incidentes",
    evidence: "Evidencia",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    highSignal: "Derivado de runtime diagnostics y audit events sanitizados",
    loading: "Cargando incidentes...",
    noIncidents: "No hay incidentes para estos filtros.",
    notePlaceholder: "Nota de operador, sin emails, session ids ni secretos",
    open: "Abiertos",
    refresh: "Actualizar incidentes",
    resolve: "Resolver",
    route: "Ruta",
    sessionBody: "Inicia sesión mediante el auth flow self-hosted antes de abrir incident response.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    source: "Fuente",
    subtitle: "Triage de production runtime, audit y access signals sin exponer identificadores crudos.",
    summaryAcknowledged: "Reconocidos",
    summaryCritical: "Críticos",
    summaryHigh: "Altos",
    summaryOpen: "Incidentes abiertos",
    title: "Admin incident response",
  },
};

export default function AdminIncidents() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const [status, setStatus] = useState<IncidentStatusFilter>("open");
  const [severity, setSeverity] = useState<IncidentSeverityFilter>("all");
  const [source, setSource] = useState<IncidentSourceFilter>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const query = useMemo(() => ({ limit: 25, severity, source, status }), [severity, source, status]);
  const incidents = useAdminIncidents(session, query);
  const data = incidents.data;

  const updateNote = (incidentId: string, value: string) => {
    setNotes((current) => ({ ...current, [incidentId]: value }));
  };

  const acknowledge = async (incidentId: string, nextStatus: "acknowledged" | "resolved") => {
    await incidents.acknowledge(incidentId, {
      note: notes[incidentId],
      status: nextStatus,
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
            </div>
          </div>

          <SummaryPanel copy={copy} summary={data?.summary ?? null} />
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
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
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
          </CardContent>
        </Card>

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
                note={notes[incident.id] ?? ""}
                onAcknowledge={(nextStatus) => acknowledge(incident.id, nextStatus)}
                onNoteChange={(value) => updateNote(incident.id, value)}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryPanel({ copy, summary }: { copy: IncidentsCopy; summary: { acknowledged: number; critical: number; high: number; open: number } | null }) {
  const items = [
    { label: copy.summaryOpen, value: summary?.open ?? 0 },
    { label: copy.summaryCritical, value: summary?.critical ?? 0 },
    { label: copy.summaryHigh, value: summary?.high ?? 0 },
    { label: copy.summaryAcknowledged, value: summary?.acknowledged ?? 0 },
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

function FilterSelect({
  label,
  onValueChange,
  options,
  testId,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
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
            {option === "all" ? label : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function IncidentCard({
  copy,
  incident,
  mutating,
  note,
  onAcknowledge,
  onNoteChange,
}: {
  copy: IncidentsCopy;
  incident: AdminIncident;
  mutating: boolean;
  note: string;
  onAcknowledge: (status: "acknowledged" | "resolved") => void;
  onNoteChange: (value: string) => void;
}) {
  return (
    <Card data-testid="admin-incident-row">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={incident.severity} />
              <Badge variant={incident.status === "open" ? "destructive" : "secondary"}>{incident.status}</Badge>
              <Badge variant="outline">{incident.source}</Badge>
              <Badge variant="outline">{incident.count} events</Badge>
            </div>
            <CardTitle className="mt-3 text-xl">{incident.title}</CardTitle>
            <CardDescription className="mt-2 max-w-3xl">{incident.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(incident.lastSeenAt).toLocaleString()}</span>
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
        </div>

        <div className="rounded-2xl border bg-muted/30 p-4">
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
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
