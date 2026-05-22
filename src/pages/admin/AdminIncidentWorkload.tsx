import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, Download, Filter, GitBranch, RefreshCw, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type {
  AdminIncidentCorrelationResponse,
  AdminIncidentExecutionOwnerRole,
  AdminIncidentExecutionPriority,
  AdminIncidentExecutionStatus,
  AdminIncidentSource,
  AdminIncidentWorkloadForecastResponse,
  AdminIncidentWorkloadHotIncident,
  AdminIncidentWorkloadOwner,
  AdminIncidentWorkloadResponse,
} from "@/lib/admin-incidents-api";
import { useAdminIncidentWorkload } from "@/lib/use-admin-incident-workload";
import { cn } from "@/lib/utils";

type WorkloadCopy = {
  allOwners: string;
  allPriorities: string;
  allSources: string;
  allStatuses: string;
  blocked: string;
  capacityForecast: string;
  correlation: string;
  disabledBody: string;
  disabledTitle: string;
  done: string;
  errorTitle: string;
  exportCsv: string;
  exportJson: string;
  exportReady: string;
  filter: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  hotIncidents: string;
  includeResolved: string;
  loadCorrelation: string;
  loadForecast: string;
  loadScore: string;
  loading: string;
  noIncidents: string;
  open: string;
  overdue: string;
  overdueOnly: string;
  ownerLoad: string;
  projectedOpen: string;
  projectedOverdue: string;
  refresh: string;
  risk: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  subtitle: string;
  summaryAssigned: string;
  summaryBlocked: string;
  summaryHot: string;
  summaryOverdue: string;
  summaryScore: string;
  summaryTotal: string;
  title: string;
  unassigned: string;
};

const COPY: Record<Language, WorkloadCopy> = {
  en: {
    allOwners: "All owner roles",
    allPriorities: "All priorities",
    allSources: "All incident sources",
    allStatuses: "All execution statuses",
    blocked: "Blocked",
    capacityForecast: "Capacity forecast",
    correlation: "Correlation drill-down",
    disabledBody: "Set VITE_YORSO_API_URL to inspect incident workload from the self-hosted API.",
    disabledTitle: "Self-hosted API is not connected",
    done: "Done",
    errorTitle: "Incident workload could not be loaded",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    exportReady: "Workload export ready",
    filter: "Filter workload",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    hotIncidents: "Hot incidents",
    includeResolved: "Include resolved",
    loadCorrelation: "Load correlation",
    loadForecast: "Load 24h forecast",
    loadScore: "Load score",
    loading: "Loading incident workload...",
    noIncidents: "No hot incidents match these filters.",
    open: "Open",
    overdue: "Overdue",
    overdueOnly: "Overdue only",
    ownerLoad: "Owner workload",
    projectedOpen: "Projected open",
    projectedOverdue: "Projected overdue",
    refresh: "Refresh workload",
    risk: "Risk",
    sessionBody: "Sign in through the self-hosted auth flow before opening incident workload.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    subtitle: "Operator workload, overdue pressure and audit correlation for the self-hosted admin incident queue.",
    summaryAssigned: "Assigned",
    summaryBlocked: "Blocked",
    summaryHot: "Hot incidents",
    summaryOverdue: "Overdue",
    summaryScore: "Load score",
    summaryTotal: "Total items",
    title: "Admin incident workload",
    unassigned: "Unassigned",
  },
  ru: {
    allOwners: "Все роли владельца",
    allPriorities: "Все приоритеты",
    allSources: "Все источники инцидентов",
    allStatuses: "Все execution статусы",
    blocked: "Заблокировано",
    capacityForecast: "Capacity forecast",
    correlation: "Correlation drill-down",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть incident workload из self-hosted API.",
    disabledTitle: "Self-hosted API не подключен",
    done: "Готово",
    errorTitle: "Incident workload не загрузился",
    exportCsv: "Экспорт CSV",
    exportJson: "Экспорт JSON",
    exportReady: "Workload export готов",
    filter: "Фильтровать workload",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    hotIncidents: "Горячие инциденты",
    includeResolved: "Включить resolved",
    loadCorrelation: "Загрузить correlation",
    loadForecast: "Загрузить прогноз 24ч",
    loadScore: "Load score",
    loading: "Загружаем incident workload...",
    noIncidents: "По этим фильтрам горячих инцидентов нет.",
    open: "Открыто",
    overdue: "Просрочено",
    overdueOnly: "Только просроченные",
    ownerLoad: "Нагрузка по владельцам",
    projectedOpen: "Projected open",
    projectedOverdue: "Projected overdue",
    refresh: "Обновить workload",
    risk: "Risk",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть incident workload.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    subtitle: "Операторская нагрузка, overdue pressure и audit correlation для self-hosted admin incident queue.",
    summaryAssigned: "Назначено",
    summaryBlocked: "Заблокировано",
    summaryHot: "Горячие",
    summaryOverdue: "Просрочено",
    summaryScore: "Load score",
    summaryTotal: "Всего items",
    title: "Admin incident workload",
    unassigned: "Без владельца",
  },
  es: {
    allOwners: "Todos los roles",
    allPriorities: "Todas las prioridades",
    allSources: "Todas las fuentes",
    allStatuses: "Todos los estados",
    blocked: "Bloqueados",
    capacityForecast: "Capacity forecast",
    correlation: "Correlation drill-down",
    disabledBody: "Define VITE_YORSO_API_URL para abrir incident workload desde la API self-hosted.",
    disabledTitle: "La API self-hosted no está conectada",
    done: "Listos",
    errorTitle: "No se pudo cargar incident workload",
    exportCsv: "Exportar CSV",
    exportJson: "Exportar JSON",
    exportReady: "Workload export listo",
    filter: "Filtrar workload",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    hotIncidents: "Incidentes calientes",
    includeResolved: "Incluir resolved",
    loadCorrelation: "Cargar correlation",
    loadForecast: "Cargar forecast 24h",
    loadScore: "Load score",
    loading: "Cargando incident workload...",
    noIncidents: "No hay incidentes calientes para estos filtros.",
    open: "Abiertos",
    overdue: "Vencidos",
    overdueOnly: "Solo vencidos",
    ownerLoad: "Carga por responsable",
    projectedOpen: "Projected open",
    projectedOverdue: "Projected overdue",
    refresh: "Actualizar workload",
    risk: "Risk",
    sessionBody: "Inicia sesión con self-hosted auth antes de abrir incident workload.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    subtitle: "Carga operativa, presión overdue y audit correlation para self-hosted admin incident queue.",
    summaryAssigned: "Asignados",
    summaryBlocked: "Bloqueados",
    summaryHot: "Calientes",
    summaryOverdue: "Vencidos",
    summaryScore: "Load score",
    summaryTotal: "Total items",
    title: "Admin incident workload",
    unassigned: "Sin responsable",
  },
};

export default function AdminIncidentWorkload() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const [ownerRole, setOwnerRole] = useState<AdminIncidentExecutionOwnerRole | "all">("all");
  const [priority, setPriority] = useState<AdminIncidentExecutionPriority | "all">("all");
  const [source, setSource] = useState<AdminIncidentSource | "all">("all");
  const [status, setStatus] = useState<AdminIncidentExecutionStatus | "all">("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const query = useMemo(() => ({
    includeResolved,
    limit: 20,
    offset: 0,
    overdueOnly,
    ownerRole,
    priority,
    source,
    status,
  }), [includeResolved, overdueOnly, ownerRole, priority, source, status]);

  const workload = useAdminIncidentWorkload(session, query);

  const exportJson = async () => {
    const payload = await workload.exportJson();
    setExportStatus(`${copy.exportReady}: ${payload.hotIncidents.length} incidents`);
  };

  const exportCsv = async () => {
    const payload = await workload.exportCsv();
    setExportStatus(`${copy.exportReady}: ${payload.split("\n").filter(Boolean).length - 1} CSV rows`);
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AdminOperatorNav />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]" data-testid="admin-incident-workload-page">
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge className="bg-orange-100 text-orange-800" variant="secondary">
                    Batch #106
                  </Badge>
                  <h1 className="mt-3 text-3xl font-bold text-slate-950">{copy.title}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{copy.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button data-testid="admin-incident-workload-refresh" onClick={workload.refresh} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {copy.refresh}
                  </Button>
                  <Button data-testid="admin-incident-workload-export-json" onClick={() => void exportJson()} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {copy.exportJson}
                  </Button>
                  <Button data-testid="admin-incident-workload-export-csv" onClick={() => void exportCsv()} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {copy.exportCsv}
                  </Button>
                  <Button data-testid="admin-incident-workload-forecast-load" onClick={() => void workload.loadForecast(24)} variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {copy.loadForecast}
                  </Button>
                </div>
              </div>
              {exportStatus && (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" data-testid="admin-incident-workload-export-status">
                  {exportStatus}
                </p>
              )}
            </div>

            {workload.status === "disabled" && <StateAlert title={copy.disabledTitle} body={copy.disabledBody} />}
            {workload.status === "session_required" && (
              <StateAlert
                title={copy.sessionTitle}
                body={copy.sessionBody}
                action={<Button asChild><Link to="/signin">{copy.sessionCta}</Link></Button>}
              />
            )}
            {workload.status === "forbidden" && <StateAlert title={copy.forbiddenTitle} body={copy.forbiddenBody} />}
            {workload.status === "error" && <StateAlert title={copy.errorTitle} body={workload.error.message} />}

            {(workload.status === "loading" || workload.status === "ready") && (
              <>
                <WorkloadFilters
                  copy={copy}
                  includeResolved={includeResolved}
                  onIncludeResolved={setIncludeResolved}
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

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="admin-incident-workload-summary">
                  {summaryCards(copy, workload.data?.summary).map((item) => (
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
                      <ShieldAlert className="h-5 w-5 text-orange-700" />
                      {copy.hotIncidents}
                    </CardTitle>
                    <CardDescription>{workload.status === "loading" ? copy.loading : `${workload.data?.hotIncidents.length ?? 0} visible incidents`}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3" data-testid="admin-incident-workload-hot-incidents">
                    {workload.data?.hotIncidents.length === 0 && <p className="text-sm text-muted-foreground">{copy.noIncidents}</p>}
                    {workload.data?.hotIncidents.map((incident) => (
                      <HotIncidentRow
                        copy={copy}
                        incident={incident}
                        key={incident.incidentId}
                        onCorrelation={() => void workload.loadCorrelation(incident.incidentId)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <Card data-testid="admin-incident-workload-owner-load">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-700" />
                  {copy.ownerLoad}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workload.data?.owners.map((owner) => <OwnerLoadCard copy={copy} key={owner.ownerRole} owner={owner} />)}
              </CardContent>
            </Card>
            <ForecastPanel copy={copy} data={workload.forecast.data} status={workload.forecast.status} />
            <CorrelationPanel copy={copy} data={workload.correlation.data} status={workload.correlation.status} />
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

function WorkloadFilters(props: {
  copy: WorkloadCopy;
  includeResolved: boolean;
  onIncludeResolved: (value: boolean) => void;
  onOverdueOnly: (value: boolean) => void;
  onOwnerRole: (value: AdminIncidentExecutionOwnerRole | "all") => void;
  onPriority: (value: AdminIncidentExecutionPriority | "all") => void;
  onSource: (value: AdminIncidentSource | "all") => void;
  onStatus: (value: AdminIncidentExecutionStatus | "all") => void;
  overdueOnly: boolean;
  ownerRole: AdminIncidentExecutionOwnerRole | "all";
  priority: AdminIncidentExecutionPriority | "all";
  source: AdminIncidentSource | "all";
  status: AdminIncidentExecutionStatus | "all";
}) {
  return (
    <Card data-testid="admin-incident-workload-filters">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4 text-orange-700" />
          {props.copy.filter}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          onChange={props.onOwnerRole}
          options={["operator", "engineering", "security", "founder"]}
          placeholder={props.copy.allOwners}
          testId="admin-incident-workload-owner-filter"
          value={props.ownerRole}
        />
        <FilterSelect
          onChange={props.onPriority}
          options={["immediate", "next", "follow_up"]}
          placeholder={props.copy.allPriorities}
          testId="admin-incident-workload-priority-filter"
          value={props.priority}
        />
        <FilterSelect
          onChange={props.onSource}
          options={["runtime", "audit", "access", "security", "policy"]}
          placeholder={props.copy.allSources}
          testId="admin-incident-workload-source-filter"
          value={props.source}
        />
        <FilterSelect
          onChange={props.onStatus}
          options={["open", "in_progress", "blocked", "done", "skipped"]}
          placeholder={props.copy.allStatuses}
          testId="admin-incident-workload-status-filter"
          value={props.status}
        />
        <Button
          className={cn(props.overdueOnly && "bg-orange-100 text-orange-800")}
          data-testid="admin-incident-workload-overdue-filter"
          onClick={() => props.onOverdueOnly(!props.overdueOnly)}
          type="button"
          variant="outline"
        >
          {props.copy.overdueOnly}
        </Button>
        <Button
          className={cn(props.includeResolved && "bg-orange-100 text-orange-800")}
          data-testid="admin-incident-workload-include-resolved"
          onClick={() => props.onIncludeResolved(!props.includeResolved)}
          type="button"
          variant="outline"
        >
          {props.copy.includeResolved}
        </Button>
      </CardContent>
    </Card>
  );
}

function FilterSelect<T extends string>(props: {
  onChange: (value: T | "all") => void;
  options: T[];
  placeholder: string;
  testId: string;
  value: T | "all";
}) {
  return (
    <Select onValueChange={(value) => props.onChange(value as T | "all")} value={props.value}>
      <SelectTrigger data-testid={props.testId}>
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{props.placeholder}</SelectItem>
        {props.options.map((option) => (
          <SelectItem key={option} value={option}>{label(option)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HotIncidentRow(props: {
  copy: WorkloadCopy;
  incident: AdminIncidentWorkloadHotIncident;
  onCorrelation: () => void;
}) {
  const { copy, incident } = props;
  return (
    <article
      className="rounded-2xl border bg-background p-4"
      data-testid={`admin-incident-workload-hot-${incident.incidentId}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={incident.severity === "critical" ? "destructive" : "secondary"}>{incident.severity}</Badge>
            <Badge variant="outline">{incident.source}</Badge>
            <Badge variant="outline">{incident.slaStatus}</Badge>
            {incident.topOwnerRole && <Badge className="bg-orange-100 text-orange-800" variant="secondary">{incident.topOwnerRole}</Badge>}
          </div>
          <h3 className="mt-2 font-semibold text-slate-950">{incident.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{incident.incidentId}</p>
        </div>
        <Button data-testid={`admin-incident-workload-correlation-${incident.incidentId}`} onClick={props.onCorrelation} variant="outline">
          <GitBranch className="mr-2 h-4 w-4" />
          {copy.loadCorrelation}
        </Button>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
        <Metric label={copy.loadScore} value={incident.loadScore} />
        <Metric label={copy.open} value={incident.openItems} />
        <Metric label={copy.blocked} value={incident.blockedItems} />
        <Metric label={copy.overdue} value={incident.overdueItems} />
        <Metric label={copy.unassigned} value={incident.unassignedItems} />
      </div>
    </article>
  );
}

function OwnerLoadCard({ copy, owner }: { copy: WorkloadCopy; owner: AdminIncidentWorkloadOwner }) {
  return (
    <div className="rounded-2xl border bg-background p-3" data-testid={`admin-incident-workload-owner-${owner.ownerRole}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold capitalize">{owner.ownerRole}</div>
        <Badge className="bg-orange-100 text-orange-800" variant="secondary">{owner.loadScore}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Metric label={copy.open} value={owner.open} />
        <Metric label={copy.blocked} value={owner.blocked} />
        <Metric label={copy.overdue} value={owner.overdue} />
        <Metric label={copy.unassigned} value={owner.unassigned} />
      </div>
    </div>
  );
}

function CorrelationPanel(props: {
  copy: WorkloadCopy;
  data: AdminIncidentCorrelationResponse | null;
  status: "idle" | "loading" | "ready" | "error";
}) {
  return (
    <Card data-testid="admin-incident-workload-correlation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-orange-700" />
          {props.copy.correlation}
        </CardTitle>
        <CardDescription>{props.status === "loading" ? props.copy.loading : props.data?.incident.title ?? "Select a hot incident"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.data && (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Audit events" value={props.data.summary.auditEvents} />
              <Metric label="Open items" value={props.data.summary.openItems} />
              <Metric label="Blocked items" value={props.data.summary.blockedItems} />
              <Metric label="Timeline" value={props.data.summary.timelineEvents} />
            </div>
            <div className="space-y-2" data-testid="admin-incident-workload-correlation-signals">
              {props.data.signals.slice(0, 6).map((signal) => (
                <div className="rounded-xl border bg-muted/30 p-3 text-xs" key={`${signal.source}-${signal.label}-${signal.occurredAt ?? "none"}`}>
                  <div className="font-semibold">{signal.label}</div>
                  <div className="mt-1 text-muted-foreground">{signal.source} · {signal.status ?? "no status"}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ForecastPanel({ copy, data, status }: {
  copy: WorkloadCopy;
  data: AdminIncidentWorkloadForecastResponse | null;
  status: "idle" | "loading" | "ready" | "error";
}) {
  return (
    <Card data-testid="admin-incident-workload-forecast">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-700" />
          {copy.capacityForecast}
        </CardTitle>
        <CardDescription>
          {status === "loading" ? copy.loading : data ? `${data.horizonHours}h · ${data.summary.recommendedAction}` : copy.loadForecast}
        </CardDescription>
      </CardHeader>
      {data && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm" data-testid="admin-incident-workload-forecast-summary">
            <Metric label={copy.risk} value={data.summary.capacityRisk} />
            <Metric label={copy.projectedOpen} value={data.summary.projectedOpen} />
            <Metric label={copy.projectedOverdue} value={data.summary.projectedOverdue} />
          </div>
          <div className="space-y-2" data-testid="admin-incident-workload-forecast-owners">
            {data.owners.map((owner) => (
              <div className="rounded-2xl border bg-slate-50 p-3" key={owner.ownerRole}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{owner.ownerRole}</span>
                  <Badge variant={owner.capacityRisk === "critical" || owner.capacityRisk === "high" ? "destructive" : "outline"}>
                    {owner.capacityRisk}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-600">{owner.recommendedAction}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {data.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-950">{value}</div>
    </div>
  );
}

function summaryCards(copy: WorkloadCopy, summary: AdminIncidentWorkloadResponse["summary"] | undefined) {
  return [
    { label: copy.summaryScore, value: summary?.loadScore ?? "..." },
    { label: copy.summaryTotal, value: summary?.total ?? "..." },
    { label: copy.summaryOverdue, value: summary?.overdue ?? "..." },
    { label: copy.summaryBlocked, value: summary?.blocked ?? "..." },
    { label: copy.summaryAssigned, value: summary?.assigned ?? "..." },
    { label: copy.summaryHot, value: summary?.hotIncidentCount ?? "..." },
  ];
}

function label(value: string) {
  return value.split("_").join(" ");
}
