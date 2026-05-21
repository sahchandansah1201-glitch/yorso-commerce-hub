import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  EyeOff,
  Gauge,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type { AdminRuntimeDiagnosticCheck, AdminRuntimeDiagnostics, AdminRuntimeStatus } from "@/lib/admin-runtime-api";
import { useAdminRuntimeStatus } from "@/lib/use-admin-runtime-status";

type RuntimeCopy = {
  title: string;
  subtitle: string;
  disabledTitle: string;
  disabledBody: string;
  sessionTitle: string;
  sessionBody: string;
  sessionCta: string;
  forbiddenTitle: string;
  forbiddenBody: string;
  errorTitle: string;
  loading: string;
  refresh: string;
  refreshed: string;
  selfHosted: string;
  targetUsers: string;
  targetUsersBody: string;
  policyRequired: string;
  productionPolicy: string;
  productionPolicyBody: string;
  runtimeDrivers: string;
  runtimeDriversBody: string;
  authProtection: string;
  authProtectionBody: string;
  requestGuardrails: string;
  requestGuardrailsBody: string;
  adminAudit: string;
  adminAuditBody: string;
  lifecycle: string;
  lifecycleBody: string;
  noSecrets: string;
  noSecretsBody: string;
  apiConfigured: string;
  notConfigured: string;
  adminOnly: string;
  enabled: string;
  disabled: string;
  yes: string;
  no: string;
  activeRequests: string;
  draining: string;
  drainSignal: string;
  started: string;
  timeout: string;
  bodyIdle: string;
  headers: string;
  keepAlive: string;
  maxHeaders: string;
  jsonLimit: string;
  uploadLimit: string;
  exportWindow: string;
  retention: string;
  auditBackpressure: string;
  accountRepository: string;
  storage: string;
  metrics: string;
  requestLogs: string;
  errorLogs: string;
  authLogs: string;
  audit: string;
  rateLimit: string;
  failMode: string;
  sessionCache: string;
  sessionTtl: string;
  attempts: string;
  window: string;
  diagnostics: string;
  diagnosticsBody: string;
  overall: string;
  checksPassed: string;
  checksWarned: string;
  checksFailed: string;
  productionReady: string;
  needsAttention: string;
  capacityPlan: string;
  readProfile: string;
  writeProfile: string;
  cacheStrategy: string;
  backpressureStrategy: string;
  databaseStrategy: string;
  failureMode: string;
  observabilityPlan: string;
  loadTestPlan: string;
};

const COPY: Record<Language, RuntimeCopy> = {
  en: {
    title: "Admin runtime status",
    subtitle: "Operational view of the self-hosted YORSO backend. It exposes safe runtime facts, not secrets.",
    disabledTitle: "Self-hosted API is not connected",
    disabledBody: "Set VITE_YORSO_API_URL to open the live runtime status. The page stays available in prototype mode, but it will not invent backend data.",
    sessionTitle: "Self-hosted session required",
    sessionBody: "Sign in through the self-hosted auth flow before opening admin runtime status.",
    sessionCta: "Sign in",
    forbiddenTitle: "Admin role required",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    errorTitle: "Runtime status could not be loaded",
    loading: "Loading runtime status...",
    refresh: "Refresh status",
    refreshed: "Live status",
    selfHosted: "Self-hosted backend",
    targetUsers: "10,000 concurrent users",
    targetUsersBody: "Production baseline is policy-required for runtime, storage, queues and observability decisions.",
    policyRequired: "Policy required",
    productionPolicy: "Production policy",
    productionPolicyBody: "No hosted BaaS is allowed as the production backend. Supabase can only remain a prototype boundary.",
    runtimeDrivers: "Runtime drivers",
    runtimeDriversBody: "Configured drivers for the API process. Values are sanitized and operational only.",
    authProtection: "Auth protection",
    authProtectionBody: "Backpressure, session cache and auth observability settings for the self-hosted auth runtime.",
    requestGuardrails: "Request guardrails",
    requestGuardrailsBody: "Timeouts and size limits that protect API workers under load.",
    adminAudit: "Admin audit",
    adminAuditBody: "Retention, export window and backpressure limits for durable operator audit logs.",
    lifecycle: "Lifecycle",
    lifecycleBody: "Drain state for graceful shutdown and rolling deployment safety.",
    noSecrets: "No secrets in payload",
    noSecretsBody: "The endpoint must not expose emails, raw user ids, session ids, connection strings or storage endpoints.",
    apiConfigured: "API configured",
    notConfigured: "Not configured",
    adminOnly: "Admin only",
    enabled: "Enabled",
    disabled: "Disabled",
    yes: "Yes",
    no: "No",
    activeRequests: "Active requests",
    draining: "Draining",
    drainSignal: "Drain signal",
    started: "Drain started",
    timeout: "Request timeout",
    bodyIdle: "Body idle timeout",
    headers: "Headers timeout",
    keepAlive: "Keep-alive timeout",
    maxHeaders: "Max header bytes",
    jsonLimit: "JSON body limit",
    uploadLimit: "Upload limit",
    exportWindow: "Export window",
    retention: "Retention",
    auditBackpressure: "Audit max in flight",
    accountRepository: "Account repository",
    storage: "Storage",
    metrics: "Metrics",
    requestLogs: "Request logs",
    errorLogs: "Error logs",
    authLogs: "Auth logs",
    audit: "Audit",
    rateLimit: "Rate limit",
    failMode: "Fail mode",
    sessionCache: "Session cache",
    sessionTtl: "Session cache TTL",
    attempts: "Failed attempts",
    window: "Failure window",
    diagnostics: "Runtime diagnostics",
    diagnosticsBody: "Actionable checks for production readiness. The list is derived from sanitized runtime configuration.",
    overall: "Overall",
    checksPassed: "Passed",
    checksWarned: "Warnings",
    checksFailed: "Failed",
    productionReady: "Production ready",
    needsAttention: "Needs attention",
    capacityPlan: "Capacity plan",
    readProfile: "Read profile",
    writeProfile: "Write profile",
    cacheStrategy: "Cache strategy",
    backpressureStrategy: "Backpressure strategy",
    databaseStrategy: "Database strategy",
    failureMode: "Failure mode",
    observabilityPlan: "Observability plan",
    loadTestPlan: "Load-test plan",
  },
  ru: {
    title: "Статус runtime администратора",
    subtitle: "Операционный экран self-hosted backend YORSO. Здесь только безопасные runtime-факты, без секретов.",
    disabledTitle: "Self-hosted API не подключён",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть live runtime status. В режиме прототипа страница доступна, но не придумывает backend-данные.",
    sessionTitle: "Нужна self-hosted сессия",
    sessionBody: "Войдите через self-hosted auth flow перед открытием admin runtime status.",
    sessionCta: "Войти",
    forbiddenTitle: "Нужна роль администратора",
    forbiddenBody: "Backend отклонил эту сессию, потому что у неё нет роли admin.",
    errorTitle: "Не удалось загрузить runtime status",
    loading: "Загружаем runtime status...",
    refresh: "Обновить статус",
    refreshed: "Live status",
    selfHosted: "Self-hosted backend",
    targetUsers: "10 000 одновременных пользователей",
    targetUsersBody: "Production baseline обязателен для решений по runtime, storage, очередям и observability.",
    policyRequired: "Policy required",
    productionPolicy: "Production policy",
    productionPolicyBody: "Hosted BaaS не допускается как production backend. Supabase может оставаться только prototype boundary.",
    runtimeDrivers: "Runtime drivers",
    runtimeDriversBody: "Настроенные drivers API-процесса. Значения очищены и имеют только операционный смысл.",
    authProtection: "Auth protection",
    authProtectionBody: "Backpressure, session cache и auth observability для self-hosted auth runtime.",
    requestGuardrails: "Request guardrails",
    requestGuardrailsBody: "Timeouts и size limits, которые защищают API workers под нагрузкой.",
    adminAudit: "Admin audit",
    adminAuditBody: "Retention, export window и backpressure limits для durable operator audit logs.",
    lifecycle: "Lifecycle",
    lifecycleBody: "Drain state для graceful shutdown и безопасного rolling deployment.",
    noSecrets: "В payload нет секретов",
    noSecretsBody: "Endpoint не должен отдавать emails, raw user ids, session ids, connection strings или storage endpoints.",
    apiConfigured: "API подключён",
    notConfigured: "Не подключён",
    adminOnly: "Только admin",
    enabled: "Включено",
    disabled: "Выключено",
    yes: "Да",
    no: "Нет",
    activeRequests: "Активные запросы",
    draining: "Draining",
    drainSignal: "Drain signal",
    started: "Drain started",
    timeout: "Request timeout",
    bodyIdle: "Body idle timeout",
    headers: "Headers timeout",
    keepAlive: "Keep-alive timeout",
    maxHeaders: "Max header bytes",
    jsonLimit: "JSON body limit",
    uploadLimit: "Upload limit",
    exportWindow: "Export window",
    retention: "Retention",
    auditBackpressure: "Audit max in flight",
    accountRepository: "Account repository",
    storage: "Storage",
    metrics: "Metrics",
    requestLogs: "Request logs",
    errorLogs: "Error logs",
    authLogs: "Auth logs",
    audit: "Audit",
    rateLimit: "Rate limit",
    failMode: "Fail mode",
    sessionCache: "Session cache",
    sessionTtl: "Session cache TTL",
    attempts: "Failed attempts",
    window: "Failure window",
    diagnostics: "Runtime diagnostics",
    diagnosticsBody: "Actionable checks для production readiness. Список построен из безопасной runtime-конфигурации.",
    overall: "Итог",
    checksPassed: "Пройдено",
    checksWarned: "Warnings",
    checksFailed: "Failed",
    productionReady: "Production ready",
    needsAttention: "Требует внимания",
    capacityPlan: "Capacity plan",
    readProfile: "Read profile",
    writeProfile: "Write profile",
    cacheStrategy: "Cache strategy",
    backpressureStrategy: "Backpressure strategy",
    databaseStrategy: "Database strategy",
    failureMode: "Failure mode",
    observabilityPlan: "Observability plan",
    loadTestPlan: "Load-test plan",
  },
  es: {
    title: "Estado runtime de administrador",
    subtitle: "Vista operativa del backend self-hosted de YORSO. Expone datos seguros de runtime, no secretos.",
    disabledTitle: "La API self-hosted no está conectada",
    disabledBody: "Define VITE_YORSO_API_URL para abrir el estado runtime en vivo. En prototipo la página sigue disponible, pero no inventa datos backend.",
    sessionTitle: "Se requiere sesión self-hosted",
    sessionBody: "Inicia sesión mediante el flujo auth self-hosted antes de abrir el estado runtime de administrador.",
    sessionCta: "Iniciar sesión",
    forbiddenTitle: "Se requiere rol admin",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    errorTitle: "No se pudo cargar el runtime status",
    loading: "Cargando runtime status...",
    refresh: "Actualizar estado",
    refreshed: "Live status",
    selfHosted: "Backend self-hosted",
    targetUsers: "10.000 usuarios simultáneos",
    targetUsersBody: "El baseline de producción es obligatorio para decisiones de runtime, storage, colas y observability.",
    policyRequired: "Policy required",
    productionPolicy: "Production policy",
    productionPolicyBody: "Hosted BaaS no puede ser backend de producción. Supabase solo puede quedar como límite de prototipo.",
    runtimeDrivers: "Runtime drivers",
    runtimeDriversBody: "Drivers configurados del proceso API. Los valores son sanitizados y solo operativos.",
    authProtection: "Auth protection",
    authProtectionBody: "Backpressure, session cache y auth observability para el auth runtime self-hosted.",
    requestGuardrails: "Request guardrails",
    requestGuardrailsBody: "Timeouts y límites de tamaño que protegen los API workers bajo carga.",
    adminAudit: "Admin audit",
    adminAuditBody: "Retention, export window y backpressure limits para logs audit durables.",
    lifecycle: "Lifecycle",
    lifecycleBody: "Drain state para graceful shutdown y rolling deployment seguro.",
    noSecrets: "Sin secretos en payload",
    noSecretsBody: "El endpoint no debe exponer emails, raw user ids, session ids, connection strings ni storage endpoints.",
    apiConfigured: "API configurada",
    notConfigured: "No configurada",
    adminOnly: "Solo admin",
    enabled: "Activado",
    disabled: "Desactivado",
    yes: "Sí",
    no: "No",
    activeRequests: "Solicitudes activas",
    draining: "Draining",
    drainSignal: "Drain signal",
    started: "Drain started",
    timeout: "Request timeout",
    bodyIdle: "Body idle timeout",
    headers: "Headers timeout",
    keepAlive: "Keep-alive timeout",
    maxHeaders: "Max header bytes",
    jsonLimit: "JSON body limit",
    uploadLimit: "Upload limit",
    exportWindow: "Export window",
    retention: "Retention",
    auditBackpressure: "Audit max in flight",
    accountRepository: "Account repository",
    storage: "Storage",
    metrics: "Metrics",
    requestLogs: "Request logs",
    errorLogs: "Error logs",
    authLogs: "Auth logs",
    audit: "Audit",
    rateLimit: "Rate limit",
    failMode: "Fail mode",
    sessionCache: "Session cache",
    sessionTtl: "Session cache TTL",
    attempts: "Failed attempts",
    window: "Failure window",
    diagnostics: "Runtime diagnostics",
    diagnosticsBody: "Checks accionables para production readiness. La lista se deriva de configuración runtime sanitizada.",
    overall: "General",
    checksPassed: "Pasados",
    checksWarned: "Warnings",
    checksFailed: "Failed",
    productionReady: "Production ready",
    needsAttention: "Requiere atención",
    capacityPlan: "Capacity plan",
    readProfile: "Read profile",
    writeProfile: "Write profile",
    cacheStrategy: "Cache strategy",
    backpressureStrategy: "Backpressure strategy",
    databaseStrategy: "Database strategy",
    failureMode: "Failure mode",
    observabilityPlan: "Observability plan",
    loadTestPlan: "Load-test plan",
  },
};

const formatMs = (value: number) => `${value.toLocaleString()} ms`;
const formatDays = (value: number) => `${value.toLocaleString()} d`;
const formatBytes = (value: number) => {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value.toLocaleString()} B`;
};

const boolLabel = (value: boolean, copy: RuntimeCopy) => (value ? copy.yes : copy.no);

const valueClassName = (good: boolean) =>
  good ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800";

const StatusBadge = ({ children, good = true }: { children: string; good?: boolean }) => (
  <Badge variant="outline" className={valueClassName(good)}>{children}</Badge>
);

const MetricTile = ({
  icon: Icon,
  label,
  value,
  description,
  testId,
}: {
  icon: typeof Server;
  label: string;
  value: string;
  description: string;
  testId: string;
}) => (
  <Card className="border-slate-200 bg-white shadow-sm" data-testid={testId}>
    <CardHeader className="space-y-3 pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <StatusBadge good>{value}</StatusBadge>
      </div>
      <CardTitle className="text-lg">{label}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
);

const RuntimeRow = ({ label, value }: { label: string; value: string | number | boolean }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
    <dt className="min-w-0 text-sm text-muted-foreground">{label}</dt>
    <dd className="max-w-[60%] text-right text-sm font-semibold text-slate-900">{String(value)}</dd>
  </div>
);

const RuntimeCard = ({
  children,
  description,
  icon: Icon,
  testId,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: typeof Server;
  testId: string;
  title: string;
}) => (
  <Card className="border-slate-200 bg-white shadow-sm" data-testid={testId}>
    <CardHeader className="pb-3">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <dl>{children}</dl>
    </CardContent>
  </Card>
);

const RuntimeGrid = ({ copy, status }: { copy: RuntimeCopy; status: AdminRuntimeStatus }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <RuntimeCard
      description={copy.runtimeDriversBody}
      icon={Database}
      testId="admin-runtime-drivers"
      title={copy.runtimeDrivers}
    >
      <RuntimeRow label={copy.accountRepository} value={status.runtime.accountRepository} />
      <RuntimeRow label={copy.storage} value={status.runtime.storageDriver} />
      <RuntimeRow label={copy.metrics} value={status.runtime.metricsDriver} />
      <RuntimeRow label={copy.requestLogs} value={status.runtime.requestObservabilityDriver} />
      <RuntimeRow label={copy.errorLogs} value={status.runtime.errorObservabilityDriver} />
      <RuntimeRow label={copy.authLogs} value={status.runtime.authObservabilityDriver} />
      <RuntimeRow label={copy.audit} value={status.runtime.auditDriver} />
    </RuntimeCard>

    <RuntimeCard
      description={copy.authProtectionBody}
      icon={ShieldCheck}
      testId="admin-runtime-auth"
      title={copy.authProtection}
    >
      <RuntimeRow label={copy.rateLimit} value={status.auth.rateLimitDriver} />
      <RuntimeRow label={copy.failMode} value={status.auth.rateLimitFailMode} />
      <RuntimeRow label={copy.attempts} value={status.auth.signInMaxFailedAttempts} />
      <RuntimeRow label={copy.window} value={formatMs(status.auth.signInFailureWindowMs)} />
      <RuntimeRow label={copy.sessionCache} value={status.auth.sessionCacheDriver} />
      <RuntimeRow label={copy.sessionTtl} value={formatMs(status.auth.sessionCacheTtlMs)} />
    </RuntimeCard>

    <RuntimeCard
      description={copy.requestGuardrailsBody}
      icon={Gauge}
      testId="admin-runtime-guardrails"
      title={copy.requestGuardrails}
    >
      <RuntimeRow label={copy.timeout} value={formatMs(status.requestGuardrails.requestTimeoutMs)} />
      <RuntimeRow label={copy.bodyIdle} value={formatMs(status.requestGuardrails.requestBodyIdleTimeoutMs)} />
      <RuntimeRow label={copy.headers} value={formatMs(status.requestGuardrails.headersTimeoutMs)} />
      <RuntimeRow label={copy.keepAlive} value={formatMs(status.requestGuardrails.keepAliveTimeoutMs)} />
      <RuntimeRow label={copy.maxHeaders} value={formatBytes(status.requestGuardrails.maxHeaderBytes)} />
      <RuntimeRow label={copy.jsonLimit} value={formatBytes(status.requestGuardrails.jsonBodyMaxBytes)} />
      <RuntimeRow label={copy.uploadLimit} value={formatBytes(status.requestGuardrails.maxUploadBytes)} />
    </RuntimeCard>

    <RuntimeCard
      description={copy.adminAuditBody}
      icon={Activity}
      testId="admin-runtime-audit"
      title={copy.adminAudit}
    >
      <RuntimeRow label={copy.exportWindow} value={formatDays(status.adminAudit.exportMaxWindowDays)} />
      <RuntimeRow label={copy.retention} value={formatDays(status.adminAudit.retentionDays)} />
      <RuntimeRow label={copy.auditBackpressure} value={status.adminAudit.auditMaxInFlight} />
    </RuntimeCard>

    <RuntimeCard
      description={copy.lifecycleBody}
      icon={Clock}
      testId="admin-runtime-lifecycle"
      title={copy.lifecycle}
    >
      <RuntimeRow label={copy.activeRequests} value={status.lifecycle.activeRequests} />
      <RuntimeRow label={copy.draining} value={boolLabel(status.lifecycle.draining, copy)} />
      <RuntimeRow label={copy.drainSignal} value={boolLabel(status.lifecycle.drainSignalPresent, copy)} />
      <RuntimeRow label={copy.started} value={boolLabel(status.lifecycle.drainStarted, copy)} />
      <RuntimeRow label={copy.timeout} value={formatMs(status.lifecycle.shutdownGraceTimeoutMs)} />
    </RuntimeCard>

    <RuntimeCard
      description={copy.productionPolicyBody}
      icon={Lock}
      testId="admin-runtime-policy"
      title={copy.productionPolicy}
    >
      <RuntimeRow label="Supabase production backend" value={boolLabel(status.productionPolicy.supabaseProductionBackend, copy)} />
      <RuntimeRow label="Hosted BaaS production backend" value={boolLabel(status.productionPolicy.hostedBaasProductionBackend, copy)} />
      <RuntimeRow label="Prototype Supabase configured" value={boolLabel(status.productionPolicy.prototypeSupabaseConfigured, copy)} />
      <RuntimeRow label="Secrets included" value={boolLabel(status.productionPolicy.secretsIncluded, copy)} />
    </RuntimeCard>
  </div>
);

const diagnosticClassName = (status: AdminRuntimeDiagnosticCheck["status"]) => {
  if (status === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "warn") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
};

const DiagnosticsPanel = ({
  copy,
  diagnostics,
}: {
  copy: RuntimeCopy;
  diagnostics: AdminRuntimeDiagnostics;
}) => {
  const planRows = [
    [copy.readProfile, diagnostics.capacityPlan.readProfile],
    [copy.writeProfile, diagnostics.capacityPlan.writeProfile],
    [copy.cacheStrategy, diagnostics.capacityPlan.cacheStrategy],
    [copy.backpressureStrategy, diagnostics.capacityPlan.backpressureStrategy],
    [copy.databaseStrategy, diagnostics.capacityPlan.databaseStrategy],
    [copy.failureMode, diagnostics.capacityPlan.failureMode],
    [copy.observabilityPlan, diagnostics.capacityPlan.observabilityPlan],
    [copy.loadTestPlan, diagnostics.capacityPlan.loadTestPlan],
  ] as const;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]" data-testid="admin-runtime-diagnostics">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">{copy.diagnostics}</CardTitle>
              <CardDescription>{copy.diagnosticsBody}</CardDescription>
            </div>
            <Badge
              variant="outline"
              className={diagnosticClassName(diagnostics.diagnostics.overallStatus)}
              data-testid="admin-runtime-diagnostics-overall"
            >
              {copy.overall}: {diagnostics.diagnostics.overallStatus}
            </Badge>
          </div>
          <div className="grid gap-2 pt-2 sm:grid-cols-4">
            <StatusCount label={copy.checksPassed} value={diagnostics.diagnostics.passCount} tone="pass" />
            <StatusCount label={copy.checksWarned} value={diagnostics.diagnostics.warnCount} tone="warn" />
            <StatusCount label={copy.checksFailed} value={diagnostics.diagnostics.failCount} tone="fail" />
            <StatusCount
              label={diagnostics.diagnostics.productionReady ? copy.productionReady : copy.needsAttention}
              value={diagnostics.diagnostics.productionReady ? copy.yes : copy.no}
              tone={diagnostics.diagnostics.productionReady ? "pass" : "warn"}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="admin-runtime-diagnostics-checks">
            {diagnostics.diagnostics.checks.map((check) => (
              <article key={check.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">{check.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{check.summary}</p>
                  </div>
                  <Badge variant="outline" className={diagnosticClassName(check.status)}>
                    {check.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-slate-700">{check.action}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm" data-testid="admin-runtime-capacity-plan">
        <CardHeader>
          <CardTitle className="text-xl">{copy.capacityPlan}</CardTitle>
          <CardDescription>{copy.targetUsersBody}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {planRows.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </section>
  );
};

const StatusCount = ({
  label,
  tone,
  value,
}: {
  label: string;
  tone: AdminRuntimeDiagnosticCheck["status"];
  value: number | string;
}) => (
  <div className={`rounded-2xl border px-3 py-2 ${diagnosticClassName(tone)}`}>
    <div className="text-lg font-semibold">{value}</div>
    <div className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">{label}</div>
  </div>
);

const StatePanel = ({
  children,
  icon: Icon,
  testId,
  title,
}: {
  children: ReactNode;
  icon: typeof AlertTriangle;
  testId: string;
  title: string;
}) => (
  <div className="min-h-screen bg-slate-50">
    <Header />
    <main className="container max-w-3xl py-12" data-testid={testId}>
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto rounded-2xl bg-slate-100 p-4 text-slate-700">
            <Icon className="h-7 w-7" aria-hidden />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </main>
  </div>
);

export default function AdminRuntimeStatusPage() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const runtime = useAdminRuntimeStatus(session);

  if (runtime.status === "disabled") {
    return (
      <StatePanel icon={Server} testId="admin-runtime-disabled" title={copy.disabledTitle}>
        <p>{copy.disabledBody}</p>
      </StatePanel>
    );
  }

  if (runtime.status === "session_required") {
    return (
      <StatePanel icon={Lock} testId="admin-runtime-session-required" title={copy.sessionTitle}>
        <div className="space-y-4">
          <p>{copy.sessionBody}</p>
          <Button asChild>
            <Link to="/signin">{copy.sessionCta}</Link>
          </Button>
        </div>
      </StatePanel>
    );
  }

  if (runtime.status === "forbidden") {
    return (
      <StatePanel icon={ShieldCheck} testId="admin-runtime-forbidden" title={copy.forbiddenTitle}>
        <p>{copy.forbiddenBody}</p>
      </StatePanel>
    );
  }

  const status = runtime.data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container max-w-7xl py-8 lg:py-12" data-testid="admin-runtime-page">
        <AdminOperatorNav />
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
              {copy.adminOnly}
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-950 lg:text-5xl">
              {copy.title}
            </h1>
            <p className="text-base text-muted-foreground lg:text-lg">
              {copy.subtitle}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center bg-white lg:w-auto"
            onClick={runtime.refresh}
            disabled={runtime.status === "loading"}
            data-testid="admin-runtime-refresh"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${runtime.status === "loading" ? "animate-spin" : ""}`} aria-hidden />
            {copy.refresh}
          </Button>
        </div>

        {runtime.status === "error" ? (
          <Alert variant="destructive" className="mb-6" data-testid="admin-runtime-error">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{runtime.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {runtime.status === "loading" && !status ? (
          <Card className="border-slate-200 bg-white shadow-sm" data-testid="admin-runtime-loading">
            <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
              {copy.loading}
            </CardContent>
          </Card>
        ) : null}

        {status ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3" data-testid="admin-runtime-status">
              <MetricTile
                description={copy.runtimeDriversBody}
                icon={Server}
                label={copy.selfHosted}
                testId="admin-runtime-self-hosted"
                value={status.selfHostedBackend ? copy.enabled : copy.disabled}
              />
              <MetricTile
                description={copy.targetUsersBody}
                icon={Gauge}
                label={copy.targetUsers}
                testId="admin-runtime-scale"
                value={copy.policyRequired}
              />
              <MetricTile
                description={copy.noSecretsBody}
                icon={EyeOff}
                label={copy.noSecrets}
                testId="admin-runtime-no-secrets"
                value={status.productionPolicy.secretsIncluded ? copy.no : copy.yes}
              />
            </div>

            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden />
              <AlertTitle>{copy.refreshed}</AlertTitle>
              <AlertDescription>
                {copy.selfHosted}: {copy.enabled}. {copy.targetUsers}: {copy.policyRequired}.
              </AlertDescription>
            </Alert>

            <RuntimeGrid copy={copy} status={status} />
            {runtime.diagnostics ? (
              <DiagnosticsPanel copy={copy} diagnostics={runtime.diagnostics} />
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
