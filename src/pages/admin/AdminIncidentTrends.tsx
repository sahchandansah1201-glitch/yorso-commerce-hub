import { Link } from "react-router-dom";
import { AlertTriangle, AreaChart, CheckCircle2, Download, FileText, Filter, RefreshCw, Siren, TrendingUp, XCircle } from "lucide-react";
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
  AdminIncidentSource,
  AdminIncidentTrendAnomaly,
  AdminIncidentTrendAction,
  AdminIncidentTrendBriefingResponse,
  AdminIncidentTrendBucket,
  AdminIncidentTrendDimension,
  AdminIncidentTrendGranularity,
  AdminIncidentTrendResponse,
  AdminIncidentTrendRouteRisk,
  AdminIncidentTrendWindow,
  AdminIncidentSeverity,
  AdminIncidentStatus,
} from "@/lib/admin-incidents-api";
import { useAdminIncidentTrends } from "@/lib/use-admin-incident-trends";
import { cn } from "@/lib/utils";

type TrendCopy = {
  allSeverities: string;
  allSources: string;
  allStatuses: string;
  anomalies: string;
  anomalyLoad: string;
  actions: string;
  actionsAccepted: string;
  actionsDismissed: string;
  actionsLoad: string;
  actionsReady: string;
  briefing: string;
  briefingLoad: string;
  briefingReady: string;
  buckets: string;
  criticalOpen: string;
  disabledBody: string;
  disabledTitle: string;
  errorTitle: string;
  exportCsv: string;
  exportJson: string;
  exportReady: string;
  filter: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  granularity: string;
  includeResolved: string;
  loading: string;
  noAnomalies: string;
  noActions: string;
  noBuckets: string;
  routeRisks: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  severityMix: string;
  slaPosture: string;
  sourceMix: string;
  statusMix: string;
  subtitle: string;
  summaryLoad: string;
  summaryOldest: string;
  summaryOverdue: string;
  summaryTrend: string;
  summaryTotal: string;
  title: string;
  window: string;
};

const COPY: Record<Language, TrendCopy> = {
  en: {
    allSeverities: "All severities",
    allSources: "All sources",
    allStatuses: "All statuses",
    anomalies: "Trend anomalies",
    anomalyLoad: "Load anomalies",
    actions: "Trend action loop",
    actionsAccepted: "Accepted",
    actionsDismissed: "Dismissed",
    actionsLoad: "Load actions",
    actionsReady: "Action updated",
    briefing: "Operator briefing",
    briefingLoad: "Generate briefing",
    briefingReady: "Briefing ready",
    buckets: "Trend buckets",
    criticalOpen: "Open critical",
    disabledBody: "Set VITE_YORSO_API_URL to inspect incident trend analytics from the self-hosted API.",
    disabledTitle: "Self-hosted API is not connected",
    errorTitle: "Incident trends could not be loaded",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    exportReady: "Trend export ready",
    filter: "Filter trends",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    granularity: "Granularity",
    includeResolved: "Include resolved",
    loading: "Loading incident trends...",
    noAnomalies: "No anomalies for this trend window.",
    noActions: "No trend actions for this window.",
    noBuckets: "No buckets were returned for this trend window.",
    routeRisks: "Route risk register",
    sessionBody: "Sign in through the self-hosted auth flow before opening incident trends.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    severityMix: "Severity mix",
    slaPosture: "SLA posture",
    sourceMix: "Source mix",
    statusMix: "Status mix",
    subtitle: "Time-bucketed incident pressure, SLA risk, route hotspots and operator briefing for the self-hosted admin control plane.",
    summaryLoad: "Load score",
    summaryOldest: "Oldest open minutes",
    summaryOverdue: "Overdue",
    summaryTotal: "Total incidents",
    summaryTrend: "Trend",
    title: "Admin incident trends",
    window: "Window",
  },
  ru: {
    allSeverities: "Все уровни",
    allSources: "Все источники",
    allStatuses: "Все статусы",
    anomalies: "Аномалии тренда",
    anomalyLoad: "Загрузить аномалии",
    actions: "Trend action loop",
    actionsAccepted: "Принято",
    actionsDismissed: "Отклонено",
    actionsLoad: "Загрузить actions",
    actionsReady: "Action обновлен",
    briefing: "Operator briefing",
    briefingLoad: "Сформировать briefing",
    briefingReady: "Briefing готов",
    buckets: "Trend buckets",
    criticalOpen: "Открытые critical",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть incident trend analytics из self-hosted API.",
    disabledTitle: "Self-hosted API не подключен",
    errorTitle: "Incident trends не загрузились",
    exportCsv: "Экспорт CSV",
    exportJson: "Экспорт JSON",
    exportReady: "Trend export готов",
    filter: "Фильтровать trends",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    granularity: "Гранулярность",
    includeResolved: "Включить resolved",
    loading: "Загружаем incident trends...",
    noAnomalies: "В этом окне аномалий нет.",
    noActions: "В этом окне trend actions нет.",
    noBuckets: "Для этого окна buckets не вернулись.",
    routeRisks: "Route risk register",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть incident trends.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    severityMix: "Severity mix",
    slaPosture: "SLA posture",
    sourceMix: "Source mix",
    statusMix: "Status mix",
    subtitle: "Временные buckets по incident pressure, SLA risk, route hotspots и operator briefing для self-hosted admin control plane.",
    summaryLoad: "Load score",
    summaryOldest: "Oldest open minutes",
    summaryOverdue: "Overdue",
    summaryTotal: "Всего incidents",
    summaryTrend: "Trend",
    title: "Admin incident trends",
    window: "Окно",
  },
  es: {
    allSeverities: "Todas las severidades",
    allSources: "Todas las fuentes",
    allStatuses: "Todos los estados",
    anomalies: "Anomalías de tendencia",
    anomalyLoad: "Cargar anomalías",
    actions: "Trend action loop",
    actionsAccepted: "Aceptada",
    actionsDismissed: "Descartada",
    actionsLoad: "Cargar actions",
    actionsReady: "Action actualizada",
    briefing: "Operator briefing",
    briefingLoad: "Generar briefing",
    briefingReady: "Briefing listo",
    buckets: "Trend buckets",
    criticalOpen: "Critical abiertos",
    disabledBody: "Define VITE_YORSO_API_URL para abrir incident trend analytics desde la API self-hosted.",
    disabledTitle: "La API self-hosted no está conectada",
    errorTitle: "No se pudieron cargar incident trends",
    exportCsv: "Exportar CSV",
    exportJson: "Exportar JSON",
    exportReady: "Trend export listo",
    filter: "Filtrar trends",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    granularity: "Granularidad",
    includeResolved: "Incluir resolved",
    loading: "Cargando incident trends...",
    noAnomalies: "No hay anomalías para esta ventana.",
    noActions: "No hay trend actions para esta ventana.",
    noBuckets: "No hay buckets para esta ventana.",
    routeRisks: "Route risk register",
    sessionBody: "Inicia sesión con self-hosted auth antes de abrir incident trends.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    severityMix: "Severity mix",
    slaPosture: "SLA posture",
    sourceMix: "Source mix",
    statusMix: "Status mix",
    subtitle: "Buckets temporales de incident pressure, SLA risk, route hotspots y operator briefing para self-hosted admin control plane.",
    summaryLoad: "Load score",
    summaryOldest: "Oldest open minutes",
    summaryOverdue: "Overdue",
    summaryTotal: "Total incidents",
    summaryTrend: "Trend",
    title: "Admin incident trends",
    window: "Ventana",
  },
};

export default function AdminIncidentTrends() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const [window, setWindow] = useState<AdminIncidentTrendWindow>("7d");
  const [granularity, setGranularity] = useState<AdminIncidentTrendGranularity>("day");
  const [source, setSource] = useState<AdminIncidentSource | "all">("all");
  const [severity, setSeverity] = useState<AdminIncidentSeverity | "all">("all");
  const [status, setStatus] = useState<AdminIncidentStatus | "all">("all");
  const [includeResolved, setIncludeResolved] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const query = useMemo(() => ({
    granularity,
    includeResolved,
    limit: 30,
    severity,
    source,
    status,
    window,
  }), [granularity, includeResolved, severity, source, status, window]);

  const trends = useAdminIncidentTrends(session, query);

  const exportJson = async () => {
    const payload = await trends.exportJson();
    setExportStatus(`${copy.exportReady}: ${payload.buckets.length} buckets`);
  };

  const exportCsv = async () => {
    const payload = await trends.exportCsv();
    setExportStatus(`${copy.exportReady}: ${payload.split("\n").filter(Boolean).length - 1} CSV rows`);
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AdminOperatorNav />
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]" data-testid="admin-incident-trends-page">
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge className="bg-orange-100 text-orange-800" variant="secondary">
                    Batch #107
                  </Badge>
                  <h1 className="mt-3 text-3xl font-bold text-slate-950">{copy.title}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{copy.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button data-testid="admin-incident-trends-refresh" onClick={trends.refresh} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button data-testid="admin-incident-trends-export-json" onClick={() => void exportJson()} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {copy.exportJson}
                  </Button>
                  <Button data-testid="admin-incident-trends-export-csv" onClick={() => void exportCsv()} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {copy.exportCsv}
                  </Button>
                </div>
              </div>
              {exportStatus && (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" data-testid="admin-incident-trends-export-status">
                  {exportStatus}
                </p>
              )}
            </div>

            {trends.status === "disabled" && <StateAlert title={copy.disabledTitle} body={copy.disabledBody} />}
            {trends.status === "session_required" && (
              <StateAlert
                title={copy.sessionTitle}
                body={copy.sessionBody}
                action={<Button asChild><Link to="/signin">{copy.sessionCta}</Link></Button>}
              />
            )}
            {trends.status === "forbidden" && <StateAlert title={copy.forbiddenTitle} body={copy.forbiddenBody} />}
            {trends.status === "error" && <StateAlert title={copy.errorTitle} body={trends.error.message} />}

            {(trends.status === "loading" || trends.status === "ready") && (
              <>
                <TrendFilters
                  copy={copy}
                  granularity={granularity}
                  includeResolved={includeResolved}
                  onGranularity={setGranularity}
                  onIncludeResolved={setIncludeResolved}
                  onSeverity={setSeverity}
                  onSource={setSource}
                  onStatus={setStatus}
                  onWindow={setWindow}
                  severity={severity}
                  source={source}
                  status={status}
                  window={window}
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-testid="admin-incident-trends-summary">
                  {summaryCards(copy, trends.data).map((item) => (
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
                      <AreaChart className="h-5 w-5 text-orange-700" />
                      {copy.buckets}
                    </CardTitle>
                    <CardDescription>{trends.status === "loading" ? copy.loading : `${trends.data?.buckets.length ?? 0} visible buckets`}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3" data-testid="admin-incident-trends-buckets">
                    {trends.data?.buckets.length === 0 && <p className="text-sm text-muted-foreground">{copy.noBuckets}</p>}
                    {trends.data?.buckets.map((bucket) => <TrendBucketCard bucket={bucket} key={bucket.key} />)}
                  </CardContent>
                </Card>

                <div className="grid gap-4 xl:grid-cols-3">
                  <DimensionPanel copy={copy} dimensions={trends.data?.sourceMix ?? []} testId="admin-incident-trends-source-mix" title={copy.sourceMix} />
                  <DimensionPanel copy={copy} dimensions={trends.data?.severityMix ?? []} testId="admin-incident-trends-severity-mix" title={copy.severityMix} />
                  <DimensionPanel copy={copy} dimensions={trends.data?.statusMix ?? []} testId="admin-incident-trends-status-mix" title={copy.statusMix} />
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <SlaPanel copy={copy} data={trends.data} />
            <RouteRiskPanel copy={copy} risks={trends.data?.routeRisks ?? []} />
            <AnomalyPanel
              anomalies={trends.anomalies.data?.anomalies ?? []}
              copy={copy}
              onLoad={() => void trends.loadAnomalies()}
              status={trends.anomalies.status}
            />
            <BriefingPanel
              copy={copy}
              data={trends.briefing.data}
              onLoad={() => void trends.loadBriefing()}
              status={trends.briefing.status}
            />
            <TrendActionsPanel
              actions={trends.actions.data?.actions ?? []}
              copy={copy}
              onAccept={(action) => void trends.decideAction(action.actionId, {
                decision: "accept",
                note: `Accepted from trend action loop: ${action.signal}`,
              })}
              onDismiss={(action) => void trends.decideAction(action.actionId, {
                decision: "dismiss",
                note: `Dismissed from trend action loop: ${action.signal}`,
              })}
              onLoad={() => void trends.loadActions()}
              status={trends.actions.status}
            />
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

function TrendFilters(props: {
  copy: TrendCopy;
  granularity: AdminIncidentTrendGranularity;
  includeResolved: boolean;
  onGranularity: (value: AdminIncidentTrendGranularity) => void;
  onIncludeResolved: (value: boolean) => void;
  onSeverity: (value: AdminIncidentSeverity | "all") => void;
  onSource: (value: AdminIncidentSource | "all") => void;
  onStatus: (value: AdminIncidentStatus | "all") => void;
  onWindow: (value: AdminIncidentTrendWindow) => void;
  severity: AdminIncidentSeverity | "all";
  source: AdminIncidentSource | "all";
  status: AdminIncidentStatus | "all";
  window: AdminIncidentTrendWindow;
}) {
  return (
    <Card data-testid="admin-incident-trends-filters">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4 text-orange-700" />
          {props.copy.filter}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select onValueChange={(value) => props.onWindow(value as AdminIncidentTrendWindow)} value={props.window}>
          <SelectTrigger data-testid="admin-incident-trends-window-filter">
            <SelectValue placeholder={props.copy.window} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24h</SelectItem>
            <SelectItem value="7d">7d</SelectItem>
            <SelectItem value="30d">30d</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => props.onGranularity(value as AdminIncidentTrendGranularity)} value={props.granularity}>
          <SelectTrigger data-testid="admin-incident-trends-granularity-filter">
            <SelectValue placeholder={props.copy.granularity} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">Hour</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectContent>
        </Select>
        <FilterSelect
          onChange={props.onSource}
          options={["runtime", "audit", "access", "security", "policy"]}
          placeholder={props.copy.allSources}
          testId="admin-incident-trends-source-filter"
          value={props.source}
        />
        <FilterSelect
          onChange={props.onSeverity}
          options={["low", "medium", "high", "critical"]}
          placeholder={props.copy.allSeverities}
          testId="admin-incident-trends-severity-filter"
          value={props.severity}
        />
        <FilterSelect
          onChange={props.onStatus}
          options={["open", "acknowledged", "resolved"]}
          placeholder={props.copy.allStatuses}
          testId="admin-incident-trends-status-filter"
          value={props.status}
        />
        <Button
          className={cn(props.includeResolved && "bg-orange-100 text-orange-800")}
          data-testid="admin-incident-trends-include-resolved"
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

function TrendBucketCard({ bucket }: { bucket: AdminIncidentTrendBucket }) {
  return (
    <article className="rounded-2xl border bg-background p-4" data-testid={`admin-incident-trends-bucket-${bucket.key}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-orange-100 text-orange-800" variant="secondary">{bucket.key}</Badge>
          <Badge variant={bucket.critical > 0 ? "destructive" : "outline"}>{bucket.breached > 0 ? "breached" : "stable"}</Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{new Date(bucket.startAt).toLocaleString()} to {new Date(bucket.endAt).toLocaleString()}</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-bold text-slate-950">{bucket.loadScore}</div>
          <div className="text-xs text-muted-foreground">load score</div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
        <Metric label="Total" value={bucket.total} />
        <Metric label="Open" value={bucket.open} />
        <Metric label="Breached" value={bucket.breached} />
        <Metric label="Critical" value={bucket.critical} />
        <Metric label="Done" value={bucket.executionDone} />
      </div>
    </article>
  );
}

function DimensionPanel({ dimensions, testId, title }: {
  copy: TrendCopy;
  dimensions: AdminIncidentTrendDimension[];
  testId: string;
  title: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {dimensions.map((item) => (
          <div className="rounded-2xl border bg-muted/30 p-3" key={item.key}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold">{item.label}</span>
              <Badge variant={item.critical > 0 ? "destructive" : "outline"}>{item.total}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <Metric label="Open" value={item.open} />
              <Metric label="Breached" value={item.breached} />
              <Metric label="Critical" value={item.critical} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SlaPanel({ copy, data }: { copy: TrendCopy; data: AdminIncidentTrendResponse | null | undefined }) {
  return (
    <Card data-testid="admin-incident-trends-sla">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Siren className="h-5 w-5 text-orange-700" />
          {copy.slaPosture}
        </CardTitle>
        <CardDescription>{data ? `${data.sla.acknowledgedPct}% acknowledged · ${data.sla.breachRatePct}% breached` : copy.loading}</CardDescription>
      </CardHeader>
      {data && (
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <Metric label={copy.summaryOverdue} value={data.sla.breached} />
          <Metric label={copy.criticalOpen} value={data.sla.openCritical} />
          <Metric label="Breach %" value={data.sla.breachRatePct} />
          <Metric label={copy.summaryOldest} value={data.sla.oldestOpenMinutes} />
        </CardContent>
      )}
    </Card>
  );
}

function RouteRiskPanel({ copy, risks }: { copy: TrendCopy; risks: AdminIncidentTrendRouteRisk[] }) {
  return (
    <Card data-testid="admin-incident-trends-route-risks">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-700" />
          {copy.routeRisks}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {risks.slice(0, 8).map((risk) => (
          <div className="rounded-2xl border bg-background p-3" key={risk.route}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-950">{risk.route}</div>
              <p className="mt-1 text-xs text-muted-foreground">{risk.recommendedAction}</p>
              </div>
              <Badge variant={risk.loadScore >= 100 ? "destructive" : "outline"}>{risk.loadScore}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <Metric label="Total" value={risk.total} />
              <Metric label="Blocked" value={risk.blocked} />
              <Metric label="Critical" value={risk.critical} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AnomalyPanel({ anomalies, copy, onLoad, status }: {
  anomalies: AdminIncidentTrendAnomaly[];
  copy: TrendCopy;
  onLoad: () => void;
  status: "idle" | "loading" | "ready" | "error";
}) {
  return (
    <Card data-testid="admin-incident-trends-anomalies">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-700" />
          {copy.anomalies}
        </CardTitle>
        <Button data-testid="admin-incident-trends-anomalies-load" onClick={onLoad} size="sm" variant="outline">
          {copy.anomalyLoad}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {status === "loading" && <p className="text-sm text-muted-foreground">{copy.loading}</p>}
        {status === "ready" && anomalies.length === 0 && <p className="text-sm text-muted-foreground">{copy.noAnomalies}</p>}
        {anomalies.map((anomaly) => (
          <div className="rounded-2xl border bg-muted/30 p-3" key={`${anomaly.signal}-${anomaly.severity}-${anomaly.current}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{anomaly.signal}</span>
              <Badge variant={anomaly.severity === "critical" ? "destructive" : "outline"}>{anomaly.severity}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{anomaly.recommendedAction}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <Metric label="Current" value={anomaly.current} />
              <Metric label="Baseline" value={anomaly.baseline} />
              <Metric label="Delta %" value={anomaly.deltaPct} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BriefingPanel({ copy, data, onLoad, status }: {
  copy: TrendCopy;
  data: AdminIncidentTrendBriefingResponse | null;
  onLoad: () => void;
  status: "idle" | "loading" | "ready" | "error";
}) {
  return (
    <Card data-testid="admin-incident-trends-briefing">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-700" />
          {copy.briefing}
        </CardTitle>
        <Button data-testid="admin-incident-trends-briefing-load" onClick={onLoad} size="sm" variant="outline">
          {copy.briefingLoad}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "loading" && <p className="text-sm text-muted-foreground">{copy.loading}</p>}
        {data && (
          <>
            <div className="rounded-2xl bg-orange-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">{copy.briefingReady}</div>
              <p className="mt-2 text-sm font-semibold text-slate-950">{data.summary.headline}</p>
            </div>
            {data.sections.map((section) => (
              <div className="rounded-2xl border bg-background p-3" key={section.title}>
                <div className="text-sm font-semibold text-slate-950">{section.title}</div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {section.body.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            ))}
            <ul className="space-y-1 text-xs text-muted-foreground">
              {data.operatorActions.map((action) => <li key={action}>{action}</li>)}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TrendActionsPanel({ actions, copy, onAccept, onDismiss, onLoad, status }: {
  actions: AdminIncidentTrendAction[];
  copy: TrendCopy;
  onAccept: (action: AdminIncidentTrendAction) => void;
  onDismiss: (action: AdminIncidentTrendAction) => void;
  onLoad: () => void;
  status: "idle" | "loading" | "ready" | "error";
}) {
  return (
    <Card data-testid="admin-incident-trends-actions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          {copy.actions}
        </CardTitle>
        <Button data-testid="admin-incident-trends-actions-load" onClick={onLoad} size="sm" variant="outline">
          {copy.actionsLoad}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "loading" && <p className="text-sm text-muted-foreground">{copy.loading}</p>}
        {status === "ready" && actions.length === 0 && <p className="text-sm text-muted-foreground">{copy.noActions}</p>}
        {actions.map((action) => (
          <article className="rounded-2xl border bg-background p-3" data-testid={`admin-incident-trend-action-${action.actionId}`} key={action.actionId}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-950">{action.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{action.recommendedAction}</p>
              </div>
              <Badge variant={action.priority === "immediate" ? "destructive" : "outline"}>{action.priority}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <Metric label="Load" value={action.loadScore} />
              <Metric label="Incidents" value={action.relatedIncidentIds.length} />
              <Metric label="Owner" value={action.ownerRole} />
            </div>
            {action.status !== "proposed" ? (
              <p className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                {action.status === "accepted" ? copy.actionsAccepted : copy.actionsDismissed}
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button data-testid={`admin-incident-trend-action-accept-${action.actionId}`} onClick={() => onAccept(action)} size="sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {copy.actionsAccepted}
                </Button>
                <Button data-testid={`admin-incident-trend-action-dismiss-${action.actionId}`} onClick={() => onDismiss(action)} size="sm" variant="outline">
                  <XCircle className="mr-2 h-4 w-4" />
                  {copy.actionsDismissed}
                </Button>
              </div>
            )}
          </article>
        ))}
      </CardContent>
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

function summaryCards(copy: TrendCopy, data: AdminIncidentTrendResponse | null | undefined) {
  return [
    { label: copy.summaryTotal, value: data?.summary.total ?? "..." },
    { label: copy.summaryOverdue, value: data?.summary.breached ?? "..." },
    { label: copy.criticalOpen, value: data?.summary.critical ?? "..." },
    { label: copy.summaryLoad, value: data?.summary.averageLoadScore ?? "..." },
    { label: copy.summaryTrend, value: data?.summary.trendDirection ?? "..." },
  ];
}

function label(value: string) {
  return value.split("_").join(" ");
}
