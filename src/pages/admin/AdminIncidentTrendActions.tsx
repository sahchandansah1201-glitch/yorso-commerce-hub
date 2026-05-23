import { Link } from "react-router-dom";
import { CheckCircle2, Download, Filter, RefreshCw, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type {
  AdminIncidentTrendAction,
  AdminIncidentTrendActionDecisionStatus,
  AdminIncidentTrendActionKind,
  AdminIncidentTrendActionQueueQuery,
  AdminIncidentTrendActionQueueResponse,
  AdminIncidentTrendWindow,
  AdminIncidentExecutionPriority,
} from "@/lib/admin-incidents-api";
import { useAdminIncidentTrendActionQueue } from "@/lib/use-admin-incident-trend-action-queue";

type ActionCopy = {
  accept: string;
  allDecisions: string;
  allKinds: string;
  allOwners: string;
  allPriorities: string;
  disabledBody: string;
  disabledTitle: string;
  dismiss: string;
  errorTitle: string;
  exportCsv: string;
  exportJson: string;
  exportReady: string;
  filter: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  loading: string;
  noActions: string;
  refresh: string;
  related: string;
  selected: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  subtitle: string;
  summaryAccepted: string;
  summaryDismissed: string;
  summaryImmediate: string;
  summaryProposed: string;
  summaryTotal: string;
  title: string;
  window: string;
};

const COPY: Record<Language, ActionCopy> = {
  en: {
    accept: "Accept selected",
    allDecisions: "All decisions",
    allKinds: "All action types",
    allOwners: "All owner roles",
    allPriorities: "All priorities",
    disabledBody: "Set VITE_YORSO_API_URL to inspect trend actions from the self-hosted API.",
    disabledTitle: "Self-hosted API is not connected",
    dismiss: "Dismiss selected",
    errorTitle: "Trend actions could not be loaded",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    exportReady: "Trend action export ready",
    filter: "Filter trend actions",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    loading: "Loading trend actions...",
    noActions: "No trend actions match these filters.",
    refresh: "Refresh actions",
    related: "Related incidents",
    selected: "selected",
    sessionBody: "Sign in through the self-hosted auth flow before opening trend actions.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    subtitle: "Bounded action queue for incident trend decisions, exports and bulk operator handling.",
    summaryAccepted: "Accepted",
    summaryDismissed: "Dismissed",
    summaryImmediate: "Immediate",
    summaryProposed: "Proposed",
    summaryTotal: "Total",
    title: "Incident trend actions",
    window: "Window",
  },
  ru: {
    accept: "Принять выбранные",
    allDecisions: "Все решения",
    allKinds: "Все типы действий",
    allOwners: "Все роли владельца",
    allPriorities: "Все приоритеты",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть trend actions из self-hosted API.",
    disabledTitle: "Self-hosted API не подключен",
    dismiss: "Отклонить выбранные",
    errorTitle: "Trend actions не загрузились",
    exportCsv: "Экспорт CSV",
    exportJson: "Экспорт JSON",
    exportReady: "Экспорт trend actions готов",
    filter: "Фильтровать trend actions",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    loading: "Загружаем trend actions...",
    noActions: "По этим фильтрам trend actions нет.",
    refresh: "Обновить actions",
    related: "Связанные инциденты",
    selected: "выбрано",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть trend actions.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    subtitle: "Ограниченная очередь решений по incident trends, экспортам и bulk operator handling.",
    summaryAccepted: "Принято",
    summaryDismissed: "Отклонено",
    summaryImmediate: "Immediate",
    summaryProposed: "Предложено",
    summaryTotal: "Всего",
    title: "Incident trend actions",
    window: "Окно",
  },
  es: {
    accept: "Aceptar seleccionadas",
    allDecisions: "Todas las decisiones",
    allKinds: "Todos los tipos",
    allOwners: "Todos los roles",
    allPriorities: "Todas las prioridades",
    disabledBody: "Define VITE_YORSO_API_URL para abrir trend actions desde la API self-hosted.",
    disabledTitle: "La API self-hosted no está conectada",
    dismiss: "Descartar seleccionadas",
    errorTitle: "No se pudieron cargar trend actions",
    exportCsv: "Exportar CSV",
    exportJson: "Exportar JSON",
    exportReady: "Export de trend actions listo",
    filter: "Filtrar trend actions",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene rol admin.",
    forbiddenTitle: "Rol admin requerido",
    loading: "Cargando trend actions...",
    noActions: "No hay trend actions para estos filtros.",
    refresh: "Actualizar actions",
    related: "Incidentes relacionados",
    selected: "seleccionadas",
    sessionBody: "Inicia sesión mediante self-hosted auth antes de abrir trend actions.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Sesión self-hosted requerida",
    subtitle: "Cola acotada para decisiones de incident trends, exports y bulk operator handling.",
    summaryAccepted: "Aceptadas",
    summaryDismissed: "Descartadas",
    summaryImmediate: "Immediate",
    summaryProposed: "Propuestas",
    summaryTotal: "Total",
    title: "Incident trend actions",
    window: "Ventana",
  },
};

const windows: AdminIncidentTrendWindow[] = ["24h", "7d", "30d"];
const decisions: Array<AdminIncidentTrendActionDecisionStatus | "all"> = ["all", "proposed", "accepted", "dismissed"];
const kinds: Array<AdminIncidentTrendActionKind | "all"> = ["all", "anomaly_follow_up", "route_risk_review", "sla_recovery", "capacity_rebalance"];
const priorities: Array<AdminIncidentExecutionPriority | "all"> = ["all", "immediate", "next", "follow_up"];
const owners: Array<AdminIncidentTrendAction["ownerRole"] | "all"> = ["all", "operator", "engineering", "security", "founder"];

export default function AdminIncidentTrendActions() {
  const { lang } = useLanguage();
  const copy = COPY[lang] ?? COPY.en;
  const { session } = useBuyerSession();
  const [windowValue, setWindowValue] = useState<AdminIncidentTrendWindow>("7d");
  const [decision, setDecision] = useState<AdminIncidentTrendActionDecisionStatus | "all">("all");
  const [kind, setKind] = useState<AdminIncidentTrendActionKind | "all">("all");
  const [priority, setPriority] = useState<AdminIncidentExecutionPriority | "all">("all");
  const [ownerRole, setOwnerRole] = useState<AdminIncidentTrendAction["ownerRole"] | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const query = useMemo<AdminIncidentTrendActionQueueQuery>(() => ({
    decision,
    kind,
    limit: 50,
    offset: 0,
    ownerRole,
    priority,
    window: windowValue,
  }), [decision, kind, ownerRole, priority, windowValue]);
  const queue = useAdminIncidentTrendActionQueue(session, query);
  const data = queue.state.data;

  const visibleIds = data?.actions.map((action) => action.actionId) ?? [];
  const selectedVisible = selected.filter((id) => visibleIds.includes(id));

  const exportJson = async () => {
    await queue.exportJson();
    setExportStatus(copy.exportReady);
  };
  const exportCsv = async () => {
    await queue.exportCsv();
    setExportStatus(copy.exportReady);
  };
  const bulk = async (nextDecision: "accept" | "dismiss") => {
    if (selectedVisible.length === 0) return;
    const result = await queue.bulkDecide({
      actionIds: selectedVisible,
      decision: nextDecision,
      note: `${nextDecision === "accept" ? "Accepted" : "Dismissed"} from trend action queue.`,
    });
    setSelected((current) => current.filter((id) => !result.updatedActions.some((action) => action.actionId === id)));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AdminOperatorNav />
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" data-testid="admin-incident-trend-actions-page">
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border bg-card p-5 shadow-sm lg:flex-row lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Batch #109</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{copy.title}</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{copy.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button data-testid="admin-incident-trend-actions-refresh" onClick={queue.refresh} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {copy.refresh}
                </Button>
                <Button data-testid="admin-incident-trend-actions-export-json" onClick={() => void exportJson()} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {copy.exportJson}
                </Button>
                <Button data-testid="admin-incident-trend-actions-export-csv" onClick={() => void exportCsv()} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {copy.exportCsv}
                </Button>
              </div>
            </div>

            {exportStatus && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" data-testid="admin-incident-trend-actions-export-status">
                {exportStatus}
              </p>
            )}

            <StateBlock copy={copy} status={queue.state.status} error={queue.state.error} />

            {data && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-testid="admin-incident-trend-actions-summary">
                  {summaryCards(copy, data.summary).map((card) => (
                    <Card key={card.label}>
                      <CardContent className="p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{card.label}</div>
                        <div className="mt-2 text-2xl font-bold text-slate-950">{card.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <BulkBar
                  copy={copy}
                  disabled={selectedVisible.length === 0}
                  onAccept={() => void bulk("accept")}
                  onDismiss={() => void bulk("dismiss")}
                  selected={selectedVisible.length}
                />

                <div className="space-y-3" data-testid="admin-incident-trend-actions-list">
                  {data.actions.length === 0 && <p className="text-sm text-muted-foreground">{copy.noActions}</p>}
                  {data.actions.map((action) => (
                    <ActionRow
                      action={action}
                      copy={copy}
                      key={action.actionId}
                      selected={selected.includes(action.actionId)}
                      toggle={() => setSelected((current) =>
                        current.includes(action.actionId)
                          ? current.filter((id) => id !== action.actionId)
                          : [...current, action.actionId],
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <Filters
              copy={copy}
              decision={decision}
              kind={kind}
              ownerRole={ownerRole}
              priority={priority}
              setDecision={setDecision}
              setKind={setKind}
              setOwnerRole={setOwnerRole}
              setPriority={setPriority}
              setWindowValue={setWindowValue}
              windowValue={windowValue}
            />
          </aside>
        </section>
      </main>
    </div>
  );
}

function StateBlock({ copy, error, status }: {
  copy: ActionCopy;
  error: Error | null;
  status: "disabled" | "error" | "forbidden" | "loading" | "ready" | "session_required";
}) {
  if (status === "ready") return null;
  if (status === "loading") return <p className="text-sm text-muted-foreground">{copy.loading}</p>;
  if (status === "disabled") {
    return <Message title={copy.disabledTitle}>{copy.disabledBody}</Message>;
  }
  if (status === "session_required") {
    return (
      <Message title={copy.sessionTitle}>
        {copy.sessionBody} <Link className="font-semibold underline" to="/signin">{copy.sessionCta}</Link>
      </Message>
    );
  }
  if (status === "forbidden") return <Message title={copy.forbiddenTitle}>{copy.forbiddenBody}</Message>;
  return <Message title={copy.errorTitle}>{error?.message ?? copy.errorTitle}</Message>;
}

function Message({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

function Filters(props: {
  copy: ActionCopy;
  decision: AdminIncidentTrendActionDecisionStatus | "all";
  kind: AdminIncidentTrendActionKind | "all";
  ownerRole: AdminIncidentTrendAction["ownerRole"] | "all";
  priority: AdminIncidentExecutionPriority | "all";
  setDecision: (value: AdminIncidentTrendActionDecisionStatus | "all") => void;
  setKind: (value: AdminIncidentTrendActionKind | "all") => void;
  setOwnerRole: (value: AdminIncidentTrendAction["ownerRole"] | "all") => void;
  setPriority: (value: AdminIncidentExecutionPriority | "all") => void;
  setWindowValue: (value: AdminIncidentTrendWindow) => void;
  windowValue: AdminIncidentTrendWindow;
}) {
  return (
    <Card data-testid="admin-incident-trend-actions-filters">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-orange-700" />
          {props.copy.filter}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select onValueChange={props.setWindowValue} value={props.windowValue}>
          <SelectTrigger data-testid="admin-incident-trend-actions-window-filter">
            <SelectValue aria-label={props.copy.window} />
          </SelectTrigger>
          <SelectContent>{windows.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={props.setDecision} value={props.decision}>
          <SelectTrigger data-testid="admin-incident-trend-actions-decision-filter">
            <SelectValue aria-label={props.copy.allDecisions} />
          </SelectTrigger>
          <SelectContent>{decisions.map((value) => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={props.setKind} value={props.kind}>
          <SelectTrigger data-testid="admin-incident-trend-actions-kind-filter">
            <SelectValue aria-label={props.copy.allKinds} />
          </SelectTrigger>
          <SelectContent>{kinds.map((value) => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={props.setPriority} value={props.priority}>
          <SelectTrigger data-testid="admin-incident-trend-actions-priority-filter">
            <SelectValue aria-label={props.copy.allPriorities} />
          </SelectTrigger>
          <SelectContent>{priorities.map((value) => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={props.setOwnerRole} value={props.ownerRole}>
          <SelectTrigger data-testid="admin-incident-trend-actions-owner-filter">
            <SelectValue aria-label={props.copy.allOwners} />
          </SelectTrigger>
          <SelectContent>{owners.map((value) => <SelectItem key={value} value={value}>{label(value)}</SelectItem>)}</SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function BulkBar({ copy, disabled, onAccept, onDismiss, selected }: {
  copy: ActionCopy;
  disabled: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  selected: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" data-testid="admin-incident-trend-actions-bulk">
      <div className="text-sm font-semibold text-slate-950">{selected} {copy.selected}</div>
      <div className="flex flex-wrap gap-2">
        <Button data-testid="admin-incident-trend-actions-bulk-accept" disabled={disabled} onClick={onAccept} size="sm">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {copy.accept}
        </Button>
        <Button data-testid="admin-incident-trend-actions-bulk-dismiss" disabled={disabled} onClick={onDismiss} size="sm" variant="outline">
          <XCircle className="mr-2 h-4 w-4" />
          {copy.dismiss}
        </Button>
      </div>
    </div>
  );
}

function ActionRow({ action, copy, selected, toggle }: {
  action: AdminIncidentTrendAction;
  copy: ActionCopy;
  selected: boolean;
  toggle: () => void;
}) {
  return (
    <article className="rounded-[1.25rem] border bg-card p-4 shadow-sm" data-testid={`admin-incident-trend-action-queue-row-${action.actionId}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <label className="flex min-w-0 items-start gap-3">
          <input
            checked={selected}
            className="mt-1 h-4 w-4"
            data-testid={`admin-incident-trend-action-select-${action.actionId}`}
            onChange={toggle}
            type="checkbox"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-950">{action.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{action.recommendedAction}</span>
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Badge variant={action.status === "proposed" ? "outline" : "secondary"}>{label(action.status)}</Badge>
          <Badge variant={action.priority === "immediate" ? "destructive" : "outline"}>{label(action.priority)}</Badge>
          <Badge variant="outline">{label(action.ownerRole)}</Badge>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-4">
        <Metric label="Load" value={action.loadScore} />
        <Metric label={copy.related} value={action.relatedIncidentIds.length} />
        <Metric label="Kind" value={label(action.kind)} />
        <Metric label="Route" value={action.route ?? "none"} />
      </div>
    </article>
  );
}

function Metric({ label: metricLabel, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/40 p-2">
      <div className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{metricLabel}</div>
      <div className="mt-1 truncate text-sm font-bold text-slate-950">{value}</div>
    </div>
  );
}

function summaryCards(copy: ActionCopy, summary: AdminIncidentTrendActionQueueResponse["summary"]) {
  return [
    { label: copy.summaryTotal, value: summary.total },
    { label: copy.summaryProposed, value: summary.proposed },
    { label: copy.summaryAccepted, value: summary.accepted },
    { label: copy.summaryDismissed, value: summary.dismissed },
    { label: copy.summaryImmediate, value: summary.immediate },
  ];
}

function label(value: string) {
  return value.split("_").join(" ");
}
