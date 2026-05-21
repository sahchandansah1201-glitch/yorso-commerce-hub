import { Link } from "react-router-dom";
import { AlertTriangle, Download, Lock, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type { AdminAuditEvent, AdminAuditOutcome, AdminAuditStatusClass } from "@/lib/admin-audit-api";
import { useAdminAuditEvents } from "@/lib/use-admin-audit-events";

type AuditOutcomeFilter = AdminAuditOutcome | "all";
type AuditStatusClassFilter = AdminAuditStatusClass | "all";

type AuditCopy = {
  action: string;
  actor: string;
  allOutcomes: string;
  allStatus: string;
  blocked: string;
  disabledBody: string;
  disabledTitle: string;
  downloadCsv: string;
  errorTitle: string;
  failure: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  loading: string;
  noEvents: string;
  outcome: string;
  refresh: string;
  route: string;
  routeFilter: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  statusClass: string;
  success: string;
  subtitle: string;
  title: string;
};

const COPY: Record<Language, AuditCopy> = {
  en: {
    action: "Action",
    actor: "Actor hash",
    allOutcomes: "All outcomes",
    allStatus: "All status classes",
    blocked: "Blocked",
    disabledBody: "Set VITE_YORSO_API_URL to inspect the self-hosted audit trail. The page does not use Supabase or hosted BaaS in production mode.",
    disabledTitle: "Self-hosted API is not connected",
    downloadCsv: "Download CSV",
    errorTitle: "Audit events could not be loaded",
    failure: "Failure",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    loading: "Loading audit events...",
    noEvents: "No audit events match these filters.",
    outcome: "Outcome",
    refresh: "Refresh audit",
    route: "Route",
    routeFilter: "Filter by route",
    sessionBody: "Sign in through the self-hosted auth flow before opening the audit console.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    statusClass: "Status class",
    success: "Success",
    subtitle: "Bounded audit review for operator actions, blocked access and backend failures. Identifiers remain hashed.",
    title: "Admin audit trail",
  },
  ru: {
    action: "Действие",
    actor: "Хэш пользователя",
    allOutcomes: "Все исходы",
    allStatus: "Все классы статуса",
    blocked: "Заблокировано",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть self-hosted audit trail. Страница не использует Supabase или hosted BaaS в production-режиме.",
    disabledTitle: "Self-hosted API не подключен",
    downloadCsv: "Скачать CSV",
    errorTitle: "Audit events не загрузились",
    failure: "Ошибка",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    loading: "Загружаем audit events...",
    noEvents: "По этим фильтрам audit events не найдены.",
    outcome: "Исход",
    refresh: "Обновить audit",
    route: "Route",
    routeFilter: "Фильтр по route",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть audit console.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    statusClass: "Класс статуса",
    success: "Успех",
    subtitle: "Ограниченный audit review для operator actions, blocked access и backend failures. Идентификаторы остаются хэшированными.",
    title: "Admin audit trail",
  },
  es: {
    action: "Acción",
    actor: "Hash de actor",
    allOutcomes: "Todos los resultados",
    allStatus: "Todas las clases",
    blocked: "Bloqueado",
    disabledBody: "Define VITE_YORSO_API_URL para inspeccionar el audit trail self-hosted. La página no usa Supabase ni hosted BaaS en producción.",
    disabledTitle: "La API self-hosted no está conectada",
    downloadCsv: "Descargar CSV",
    errorTitle: "No se pudieron cargar audit events",
    failure: "Fallo",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    loading: "Cargando audit events...",
    noEvents: "No hay audit events para estos filtros.",
    outcome: "Resultado",
    refresh: "Actualizar audit",
    route: "Ruta",
    routeFilter: "Filtrar por ruta",
    sessionBody: "Inicia sesión mediante el auth flow self-hosted antes de abrir audit console.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    statusClass: "Clase de estado",
    success: "Éxito",
    subtitle: "Revisión audit acotada para operator actions, blocked access y backend failures. Los identificadores siguen hasheados.",
    title: "Admin audit trail",
  },
};

export default function AdminAuditEvents() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const [outcome, setOutcome] = useState<AuditOutcomeFilter>("all");
  const [statusClass, setStatusClass] = useState<AuditStatusClassFilter>("all");
  const [route, setRoute] = useState("");
  const query = useMemo(() => ({
    limit: 25,
    outcome,
    route,
    statusClass,
  }), [outcome, route, statusClass]);
  const audit = useAdminAuditEvents(session, query);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-audit-page">
        <AdminOperatorNav />

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Self-hosted audit
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{copy.subtitle}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button data-testid="admin-audit-refresh" onClick={audit.refresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.refresh}
              </Button>
              <Button asChild disabled={!audit.exportUrl} variant="outline">
                <a data-testid="admin-audit-export-csv" href={audit.exportUrl || "#"}>
                  <Download className="mr-2 h-4 w-4" />
                  {copy.downloadCsv}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {audit.status === "disabled" && (
          <Alert data-testid="admin-audit-disabled">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.disabledTitle}</AlertTitle>
            <AlertDescription>{copy.disabledBody}</AlertDescription>
          </Alert>
        )}

        {audit.status === "session_required" && (
          <Alert data-testid="admin-audit-session-required">
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

        {audit.status === "forbidden" && (
          <Alert data-testid="admin-audit-forbidden" variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
            <AlertDescription>{copy.forbiddenBody}</AlertDescription>
          </Alert>
        )}

        {audit.status === "error" && (
          <Alert data-testid="admin-audit-error" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{audit.error.message}</AlertDescription>
          </Alert>
        )}

        <Card data-testid="admin-audit-filters">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[180px_180px_minmax(0,1fr)]">
            <Select value={outcome} onValueChange={(value) => setOutcome(value as AuditOutcomeFilter)}>
              <SelectTrigger data-testid="admin-audit-outcome-filter">
                <SelectValue aria-label={copy.outcome} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allOutcomes}</SelectItem>
                <SelectItem value="success">{copy.success}</SelectItem>
                <SelectItem value="failure">{copy.failure}</SelectItem>
                <SelectItem value="blocked">{copy.blocked}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusClass} onValueChange={(value) => setStatusClass(value as AuditStatusClassFilter)}>
              <SelectTrigger data-testid="admin-audit-status-filter">
                <SelectValue aria-label={copy.statusClass} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allStatus}</SelectItem>
                <SelectItem value="2xx">2xx</SelectItem>
                <SelectItem value="3xx">3xx</SelectItem>
                <SelectItem value="4xx">4xx</SelectItem>
                <SelectItem value="5xx">5xx</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                data-testid="admin-audit-route-filter"
                onChange={(event) => setRoute(event.target.value)}
                placeholder={copy.routeFilter}
                value={route}
              />
            </div>
          </CardContent>
        </Card>

        {audit.status === "loading" && !audit.data && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{copy.loading}</CardContent>
          </Card>
        )}

        {audit.data && (
          <AuditEventsTable copy={copy} events={audit.data.events} />
        )}
      </main>
    </div>
  );
}

function AuditEventsTable({ copy, events }: { copy: AuditCopy; events: AdminAuditEvent[] }) {
  if (events.length === 0) {
    return (
      <Card data-testid="admin-audit-empty">
        <CardContent className="p-6 text-sm text-muted-foreground">{copy.noEvents}</CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="admin-audit-events">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{events.length} events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <article className="rounded-2xl border bg-background p-4" data-testid="admin-audit-event-row" key={event.auditId}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={event.outcome === "success" ? "default" : event.outcome === "blocked" ? "secondary" : "destructive"}>
                    {event.outcome}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">{event.action}</span>
                </div>
                <p className="mt-2 truncate text-sm text-muted-foreground">
                  {copy.route}: {event.httpMethod ?? "GET"} {event.route ?? "unknown"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {copy.actor}: {event.actorUserHash ?? "none"}
                </p>
              </div>
              <div className="text-left text-xs text-muted-foreground md:text-right">
                <p>{new Date(event.occurredAt).toLocaleString()}</p>
                <p>{copy.statusClass}: {event.statusCode ?? "none"}</p>
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
