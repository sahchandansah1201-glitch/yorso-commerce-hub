import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileClock,
  Gauge,
  KeyRound,
  ListChecks,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import Header from "@/components/landing/Header";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type { AdminOperationsOverview } from "@/lib/admin-operations-api";
import { useAdminOperationsOverview } from "@/lib/use-admin-operations-overview";

type OperationsCopy = {
  activeGrants: string;
  auditBody: string;
  auditFailures: string;
  auditSample: string;
  auditTrail: string;
  baseline: string;
  capacityPlan: string;
  disabledBody: string;
  disabledTitle: string;
  errorTitle: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  grantsBody: string;
  loading: string;
  noSecrets: string;
  openRequests: string;
  operatorActions: string;
  overview: string;
  pending: string;
  readiness: string;
  readinessBody: string;
  readProfile: string;
  recentAudit: string;
  recentGrants: string;
  recentRequests: string;
  refresh: string;
  requestsBody: string;
  runtimeBody: string;
  runtimeStatus: string;
  selfHosted: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  subtitle: string;
  title: string;
  totalGrants: string;
  totalRequests: string;
  writeProfile: string;
  statusPass: string;
  statusWarn: string;
  statusFail: string;
};

const COPY: Record<Language, OperationsCopy> = {
  en: {
    activeGrants: "Active grants",
    auditBody: "Recent audit sample is bounded to 25 events for summary and five visible rows for scanning.",
    auditFailures: "Audit failures",
    auditSample: "Audit sample",
    auditTrail: "Audit trail",
    baseline: "10,000 concurrent users baseline",
    capacityPlan: "Capacity plan",
    disabledBody: "Set VITE_YORSO_API_URL to open the self-hosted operator hub. The page will not fabricate backend data in prototype mode.",
    disabledTitle: "Self-hosted API is not connected",
    errorTitle: "Operations overview could not be loaded",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    grantsBody: "Active grants are bounded to the first five rows. Use the grants console for filtering and revocation.",
    loading: "Loading operations overview...",
    noSecrets: "No session ids, emails or connection strings are rendered.",
    openRequests: "Open requests",
    operatorActions: "Operator actions",
    overview: "Operations overview",
    pending: "Pending",
    readiness: "Readiness",
    readinessBody: "Checklist derived from runtime diagnostics, audit activity, access queues and self-hosted policy.",
    readProfile: "Read profile",
    recentAudit: "Recent audit activity",
    recentGrants: "Recent grants",
    recentRequests: "Recent requests",
    refresh: "Refresh overview",
    requestsBody: "Open requests are bounded to five recent rows. Decisions stay inside the access review console.",
    runtimeBody: "Runtime status, diagnostics and production policy are sanitized for operator use.",
    runtimeStatus: "Runtime status",
    selfHosted: "Self-hosted only",
    sessionBody: "Sign in through the self-hosted auth flow before opening the admin operator hub.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    subtitle: "A single operator entry point for runtime health, access queues, active grants and production-scale readiness.",
    title: "Admin operations hub",
    totalGrants: "Total grants",
    totalRequests: "Total requests",
    writeProfile: "Write profile",
    statusPass: "Pass",
    statusWarn: "Warn",
    statusFail: "Fail",
  },
  ru: {
    activeGrants: "Активные доступы",
    auditBody: "Recent audit sample ограничен 25 событиями для summary и пятью видимыми строками для сканирования.",
    auditFailures: "Audit failures",
    auditSample: "Audit sample",
    auditTrail: "Журнал аудита",
    baseline: "Baseline 10 000 одновременных пользователей",
    capacityPlan: "Capacity plan",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть self-hosted operator hub. В prototype-режиме страница не придумывает backend-данные.",
    disabledTitle: "Self-hosted API не подключен",
    errorTitle: "Operations overview не загрузился",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    grantsBody: "Активные доступы ограничены первыми пятью строками. Для фильтрации и отзыва используйте grants console.",
    loading: "Загружаем operations overview...",
    noSecrets: "Session id, emails и connection strings не отображаются.",
    openRequests: "Открытые запросы",
    operatorActions: "Operator actions",
    overview: "Operations overview",
    pending: "Pending",
    readiness: "Readiness",
    readinessBody: "Checklist формируется из runtime diagnostics, audit activity, access queue и self-hosted policy.",
    readProfile: "Read profile",
    recentAudit: "Recent audit activity",
    recentGrants: "Последние доступы",
    recentRequests: "Последние запросы",
    refresh: "Обновить overview",
    requestsBody: "Открытые запросы ограничены пятью последними строками. Решения остаются в access review console.",
    runtimeBody: "Runtime status, diagnostics и production policy очищены для operator view.",
    runtimeStatus: "Runtime status",
    selfHosted: "Только self-hosted",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть admin operator hub.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    subtitle: "Единая точка оператора для runtime health, access queue, active grants и production-scale readiness.",
    title: "Admin operations hub",
    totalGrants: "Всего доступов",
    totalRequests: "Всего запросов",
    writeProfile: "Write profile",
    statusPass: "Pass",
    statusWarn: "Warn",
    statusFail: "Fail",
  },
  es: {
    activeGrants: "Accesos activos",
    auditBody: "Recent audit sample se limita a 25 eventos para summary y cinco filas visibles para revisión rápida.",
    auditFailures: "Audit failures",
    auditSample: "Audit sample",
    auditTrail: "Audit trail",
    baseline: "Baseline de 10.000 usuarios simultáneos",
    capacityPlan: "Capacity plan",
    disabledBody: "Define VITE_YORSO_API_URL para abrir el operator hub self-hosted. La página no inventa datos backend en modo prototipo.",
    disabledTitle: "La API self-hosted no está conectada",
    errorTitle: "No se pudo cargar operations overview",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    grantsBody: "Los accesos activos están limitados a las primeras cinco filas. Usa grants console para filtrar y revocar.",
    loading: "Cargando operations overview...",
    noSecrets: "No se muestran session ids, emails ni connection strings.",
    openRequests: "Solicitudes abiertas",
    operatorActions: "Operator actions",
    overview: "Operations overview",
    pending: "Pending",
    readiness: "Readiness",
    readinessBody: "Checklist derivado de runtime diagnostics, audit activity, access queues y self-hosted policy.",
    readProfile: "Read profile",
    recentAudit: "Recent audit activity",
    recentGrants: "Accesos recientes",
    recentRequests: "Solicitudes recientes",
    refresh: "Actualizar overview",
    requestsBody: "Las solicitudes abiertas están limitadas a cinco filas recientes. Las decisiones quedan en access review console.",
    runtimeBody: "Runtime status, diagnostics y production policy están sanitizados para operadores.",
    runtimeStatus: "Runtime status",
    selfHosted: "Solo self-hosted",
    sessionBody: "Inicia sesión mediante el auth flow self-hosted antes de abrir el admin operator hub.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    subtitle: "Punto único de operador para runtime health, access queues, active grants y readiness de escala.",
    title: "Admin operations hub",
    totalGrants: "Accesos totales",
    totalRequests: "Solicitudes totales",
    writeProfile: "Write profile",
    statusPass: "Pass",
    statusWarn: "Warn",
    statusFail: "Fail",
  },
};

export default function AdminOperations() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const overview = useAdminOperationsOverview(session);
  const data = overview.data;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-operations-page">
        <AdminOperatorNav />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {copy.selfHosted}
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {copy.title}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  {copy.subtitle}
                </p>
              </div>
              <Button data-testid="admin-operations-refresh" onClick={overview.refresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.refresh}
              </Button>
            </div>
          </div>

          <Card className="border-orange-200 bg-orange-50/70">
            <CardHeader>
              <CardTitle className="text-base">{copy.baseline}</CardTitle>
              <CardDescription>{copy.noSecrets}</CardDescription>
            </CardHeader>
          </Card>
        </section>

        {overview.status === "disabled" && (
          <Alert data-testid="admin-operations-disabled">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.disabledTitle}</AlertTitle>
            <AlertDescription>{copy.disabledBody}</AlertDescription>
          </Alert>
        )}

        {overview.status === "session_required" && (
          <Alert data-testid="admin-operations-session-required">
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

        {overview.status === "forbidden" && (
          <Alert data-testid="admin-operations-forbidden" variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
            <AlertDescription>{copy.forbiddenBody}</AlertDescription>
          </Alert>
        )}

        {overview.status === "error" && (
          <Alert data-testid="admin-operations-error" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{overview.error.message}</AlertDescription>
          </Alert>
        )}

        {overview.status === "loading" && !data && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{copy.loading}</CardContent>
          </Card>
        )}

        {data && (
          <OperationsContent copy={copy} data={data} />
        )}
      </main>
    </div>
  );
}

function OperationsContent({ copy, data }: { copy: OperationsCopy; data: AdminOperationsOverview }) {
  return (
    <div className="space-y-6" data-testid="admin-operations-overview">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          description={copy.requestsBody}
          icon={<ClipboardCheck className="h-5 w-5" />}
          label={copy.openRequests}
          testId="admin-operations-review-card"
          value={data.access.review.summary.open}
        />
        <MetricCard
          description={copy.grantsBody}
          icon={<KeyRound className="h-5 w-5" />}
          label={copy.activeGrants}
          testId="admin-operations-grants-card"
          value={data.access.grants.summary.active}
        />
        <MetricCard
          description={copy.runtimeBody}
          icon={<Activity className="h-5 w-5" />}
          label={copy.runtimeStatus}
          testId="admin-operations-runtime-card"
          value={data.runtime.diagnostics.diagnostics.overallStatus}
        />
        <MetricCard
          description={copy.noSecrets}
          icon={<Database className="h-5 w-5" />}
          label={copy.baseline}
          testId="admin-operations-baseline-card"
          value={data.productionScaleBaseline.targetConcurrentUsers.toLocaleString("en-US")}
        />
        <MetricCard
          description={copy.auditBody}
          icon={<FileClock className="h-5 w-5" />}
          label={copy.auditFailures}
          testId="admin-operations-audit-card"
          value={data.audit.summary.failure + data.audit.summary.blocked}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card data-testid="admin-operations-recent-requests">
          <CardHeader>
            <CardTitle>{copy.recentRequests}</CardTitle>
            <CardDescription>
              {copy.totalRequests}: {data.access.review.total}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.access.review.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.pending}: 0</p>
            ) : data.access.review.recent.map((item) => (
              <div className="rounded-2xl border bg-background p-4" key={item.request.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.buyer.companyName ?? item.buyer.displayName ?? "Buyer"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.supplier.maskedName ?? item.supplier.supplierId}</p>
                  </div>
                  <Badge variant="outline">{item.request.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="admin-operations-recent-grants">
          <CardHeader>
            <CardTitle>{copy.recentGrants}</CardTitle>
            <CardDescription>
              {copy.totalGrants}: {data.access.grants.total}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.access.grants.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.activeGrants}: 0</p>
            ) : data.access.grants.recent.map((item) => (
              <div className="rounded-2xl border bg-background p-4" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.buyer.companyName ?? item.buyer.displayName ?? "Buyer"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.supplier.companyName ?? item.supplier.maskedName ?? item.supplierId}</p>
                  </div>
                  <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? copy.activeGrants : "Expired"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card data-testid="admin-operations-readiness">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-orange-700" />
              {copy.readiness}
            </CardTitle>
            <CardDescription>{copy.readinessBody}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {data.readiness.items.map((item) => (
              <div className="rounded-2xl border bg-background p-4" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                  </div>
                  <Badge variant={item.status === "fail" ? "destructive" : item.status === "warn" ? "secondary" : "default"}>
                    {statusLabel(copy, item.status)}
                  </Badge>
                </div>
                {item.route && (
                  <Link className="mt-3 inline-flex text-sm font-semibold text-orange-700 hover:text-orange-800" to={item.route}>
                    {item.action}
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="admin-operations-actions">
          <CardHeader>
            <CardTitle>{copy.operatorActions}</CardTitle>
            <CardDescription>{copy.noSecrets}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.operatorActions.map((action) => (
              <OperatorActionButton action={action} key={action.id} />
            ))}
          </CardContent>
        </Card>
      </section>

      <Card data-testid="admin-operations-audit-feed">
        <CardHeader>
          <CardTitle>{copy.recentAudit}</CardTitle>
          <CardDescription>
            {copy.auditSample}: {data.audit.summary.sampleSize}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.audit.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.auditSample}: 0</p>
          ) : data.audit.recent.map((event) => (
            <div className="rounded-2xl border bg-background p-4" key={event.auditId}>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={event.outcome === "success" ? "default" : event.outcome === "blocked" ? "secondary" : "destructive"}>
                      {event.outcome}
                    </Badge>
                    <p className="font-semibold text-foreground">{event.action}</p>
                  </div>
                  <p className="mt-2 truncate text-sm text-muted-foreground">{event.route ?? "unknown route"}</p>
                </div>
                <p className="text-xs text-muted-foreground">{event.statusCode ?? "no status"}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-testid="admin-operations-capacity-plan">
        <CardHeader>
          <CardTitle>{copy.capacityPlan}</CardTitle>
          <CardDescription>{copy.baseline}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <PlanItem label={copy.readProfile} value={data.capacityPlan.readProfile} />
          <PlanItem label={copy.writeProfile} value={data.capacityPlan.writeProfile} />
          <PlanItem label="Cache" value={data.capacityPlan.cacheStrategy} />
          <PlanItem label="Backpressure" value={data.capacityPlan.backpressureStrategy} />
          <PlanItem label="Database" value={data.capacityPlan.databaseStrategy} />
          <PlanItem label="Failure mode" value={data.capacityPlan.failureMode} />
          <PlanItem label="Observability" value={data.capacityPlan.observabilityPlan} />
          <PlanItem label="Load test" value={data.capacityPlan.loadTestPlan} />
        </CardContent>
      </Card>
    </div>
  );
}

function statusLabel(copy: OperationsCopy, status: "pass" | "warn" | "fail") {
  if (status === "fail") return copy.statusFail;
  if (status === "warn") return copy.statusWarn;
  return copy.statusPass;
}

function OperatorActionButton({ action }: { action: AdminOperationsOverview["operatorActions"][number] }) {
  const content = (
    <>
      <span>
        <span className="block font-semibold">{action.label}</span>
        <span className="mt-1 block text-xs font-normal opacity-80">{action.description}</span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0" />
    </>
  );
  const className = "h-auto w-full justify-between gap-3 rounded-2xl px-4 py-3 text-left";
  const variant = action.priority === "primary" ? "default" : action.priority === "danger" ? "destructive" : "outline";

  if (action.href.startsWith("/admin")) {
    return (
      <Button asChild className={className} variant={variant}>
        <Link to={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button asChild className={className} variant={variant}>
      <a href={action.href}>{content}</a>
    </Button>
  );
}

function MetricCard({
  description,
  icon,
  label,
  testId,
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  testId: string;
  value: number | string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-2xl bg-orange-100 p-2 text-orange-700">{icon}</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}
