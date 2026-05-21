import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Clock3,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
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
import {
  useAdminAccessGrants,
  type AdminAccessGrantItem,
  type AdminAccessGrantStatusFilter,
} from "@/lib/use-admin-access-grants";

type AccessGrantsCopy = {
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
  search: string;
  status: string;
  active: string;
  expired: string;
  all: string;
  total: string;
  grantConsole: string;
  grantConsoleBody: string;
  buyer: string;
  supplier: string;
  scopes: string;
  granted: string;
  expires: string;
  never: string;
  revoke: string;
  revoking: string;
  request: string;
  noRequest: string;
  emptyTitle: string;
  emptyBody: string;
  reviewQueue: string;
  runtime: string;
  previous: string;
  next: string;
  selfHostedOnly: string;
  selfHostedOnlyBody: string;
  showing: (from: number, to: number, total: number) => string;
  hours: (hours: number) => string;
};

const COPY: Record<Language, AccessGrantsCopy> = {
  en: {
    title: "Access grants",
    subtitle: "Review active supplier and price access grants, then revoke access when a commercial reason ends.",
    disabledTitle: "Self-hosted API is not connected",
    disabledBody: "Set VITE_YORSO_API_URL to review live access grants. This page does not invent grants in prototype mode.",
    sessionTitle: "Self-hosted session required",
    sessionBody: "Sign in through the self-hosted auth flow before managing access grants.",
    sessionCta: "Sign in",
    forbiddenTitle: "Admin role required",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    errorTitle: "Access grants could not be loaded",
    loading: "Loading grants...",
    refresh: "Refresh grants",
    search: "Search buyer, supplier, grant or request",
    status: "Status",
    active: "Active",
    expired: "Expired",
    all: "All",
    total: "Total",
    grantConsole: "Grant console",
    grantConsoleBody: "Revoke expires supplier identity and offer price grants together. Catalog rows must mask again after revoke.",
    buyer: "Buyer",
    supplier: "Supplier",
    scopes: "Scopes",
    granted: "Granted",
    expires: "Expires",
    never: "Active until revoked",
    revoke: "Revoke access",
    revoking: "Revoking...",
    request: "Request",
    noRequest: "No linked request",
    emptyTitle: "No grants in this view",
    emptyBody: "Change the filter or wait for approved access requests.",
    reviewQueue: "Review queue",
    runtime: "Runtime status",
    previous: "Previous",
    next: "Next",
    selfHostedOnly: "Self-hosted access control",
    selfHostedOnlyBody: "This page calls `/v1/admin/access-grants` and `/v1/admin/access-grants/:id/revoke` through an admin session.",
    showing: (from, to, total) => `Showing ${from}-${to} of ${total}`,
    hours: (hours) => `${Math.round(hours)} h`,
  },
  ru: {
    title: "Выданные доступы",
    subtitle: "Проверяйте активные доступы к поставщику и точной цене, затем отзывайте доступ, когда коммерческое основание закончилось.",
    disabledTitle: "Self-hosted API не подключён",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы управлять реальными grants. В режиме прототипа страница не придумывает доступы.",
    sessionTitle: "Нужна self-hosted сессия",
    sessionBody: "Войдите через self-hosted auth flow перед управлением доступами.",
    sessionCta: "Войти",
    forbiddenTitle: "Нужна роль администратора",
    forbiddenBody: "Backend отклонил эту сессию, потому что у неё нет роли admin.",
    errorTitle: "Не удалось загрузить доступы",
    loading: "Загружаем доступы...",
    refresh: "Обновить доступы",
    search: "Искать покупателя, поставщика, grant или запрос",
    status: "Статус",
    active: "Активные",
    expired: "Истёкшие",
    all: "Все",
    total: "Всего",
    grantConsole: "Консоль доступов",
    grantConsoleBody: "Отзыв одновременно закрывает supplier identity и offer price grants. После отзыва каталог снова должен маскироваться.",
    buyer: "Покупатель",
    supplier: "Поставщик",
    scopes: "Доступы",
    granted: "Выдан",
    expires: "Истекает",
    never: "Активен до отзыва",
    revoke: "Отозвать доступ",
    revoking: "Отзываем...",
    request: "Запрос",
    noRequest: "Нет связанного запроса",
    emptyTitle: "В этом фильтре нет доступов",
    emptyBody: "Измените фильтр или дождитесь одобренных запросов.",
    reviewQueue: "Очередь проверки",
    runtime: "Runtime status",
    previous: "Назад",
    next: "Вперёд",
    selfHostedOnly: "Self-hosted access control",
    selfHostedOnlyBody: "Страница вызывает `/v1/admin/access-grants` и `/v1/admin/access-grants/:id/revoke` через admin-сессию.",
    showing: (from, to, total) => `Показаны ${from}-${to} из ${total}`,
    hours: (hours) => `${Math.round(hours)} ч`,
  },
  es: {
    title: "Accesos concedidos",
    subtitle: "Revisa accesos activos a proveedor y precio exacto, y revócalos cuando termine la razón comercial.",
    disabledTitle: "La API self-hosted no está conectada",
    disabledBody: "Define VITE_YORSO_API_URL para gestionar grants reales. En prototipo esta página no inventa accesos.",
    sessionTitle: "Se requiere sesión self-hosted",
    sessionBody: "Inicia sesión mediante el flujo auth self-hosted antes de gestionar accesos.",
    sessionCta: "Iniciar sesión",
    forbiddenTitle: "Se requiere rol admin",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    errorTitle: "No se pudieron cargar los accesos",
    loading: "Cargando accesos...",
    refresh: "Actualizar accesos",
    search: "Buscar comprador, proveedor, grant o solicitud",
    status: "Estado",
    active: "Activos",
    expired: "Expirados",
    all: "Todos",
    total: "Total",
    grantConsole: "Consola de accesos",
    grantConsoleBody: "Revocar expira juntos supplier identity y offer price grants. El catálogo debe volver a ocultar datos.",
    buyer: "Comprador",
    supplier: "Proveedor",
    scopes: "Accesos",
    granted: "Concedido",
    expires: "Expira",
    never: "Activo hasta revocación",
    revoke: "Revocar acceso",
    revoking: "Revocando...",
    request: "Solicitud",
    noRequest: "Sin solicitud vinculada",
    emptyTitle: "No hay accesos en esta vista",
    emptyBody: "Cambia el filtro o espera solicitudes aprobadas.",
    reviewQueue: "Cola de revisión",
    runtime: "Runtime status",
    previous: "Anterior",
    next: "Siguiente",
    selfHostedOnly: "Self-hosted access control",
    selfHostedOnlyBody: "Esta página llama a `/v1/admin/access-grants` y `/v1/admin/access-grants/:id/revoke` con sesión admin.",
    showing: (from, to, total) => `Mostrando ${from}-${to} de ${total}`,
    hours: (hours) => `${Math.round(hours)} h`,
  },
};

const statusOptions: AdminAccessGrantStatusFilter[] = ["active", "expired", "all"];
const pageSize = 25;

export default function AdminAccessGrants() {
  const { lang } = useLanguage();
  const copy = COPY[lang] ?? COPY.en;
  const { session } = useBuyerSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = normalizeStatus(searchParams.get("status"));
  const q = searchParams.get("q")?.trim() ?? "";
  const offset = normalizeOffset(searchParams.get("offset"));
  const grants = useAdminAccessGrants(session, {
    limit: pageSize,
    offset,
    q: q || undefined,
    status,
  });

  const updateParams = (patch: { q?: string; status?: AdminAccessGrantStatusFilter; offset?: number }) => {
    const next = new URLSearchParams(searchParams);
    if (patch.q !== undefined) {
      if (patch.q.trim()) next.set("q", patch.q.trim());
      else next.delete("q");
      next.delete("offset");
    }
    if (patch.status !== undefined) {
      if (patch.status === "active") next.delete("status");
      else next.set("status", patch.status);
      next.delete("offset");
    }
    if (patch.offset !== undefined) {
      if (patch.offset > 0) next.set("offset", String(patch.offset));
      else next.delete("offset");
    }
    setSearchParams(next, { replace: true });
  };

  const data = grants.data;
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-access-grants-page">
        <AdminOperatorNav />
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {copy.selfHostedOnly}
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {copy.title}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  {copy.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link to="/admin/access-requests">{copy.reviewQueue}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/runtime">{copy.runtime}</Link>
                </Button>
                <Button data-testid="admin-access-grants-refresh" onClick={grants.refresh} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {copy.refresh}
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-orange-200 bg-orange-50/70">
            <CardHeader>
              <CardTitle className="text-base">{copy.grantConsole}</CardTitle>
              <CardDescription>{copy.grantConsoleBody}</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <AccessStateAlerts copy={copy} status={grants.status} error={grants.status === "error" ? grants.error : null} />

        {data && (
          <>
            <section className="grid gap-3 sm:grid-cols-3" data-testid="admin-access-grants-summary">
              <MetricCard label={copy.active} value={data.summary.active} />
              <MetricCard label={copy.expired} value={data.summary.expired} />
              <MetricCard label={copy.total} value={data.summary.total} />
            </section>

            <Card>
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{copy.grantConsole}</CardTitle>
                    <CardDescription>{copy.selfHostedOnlyBody}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label={copy.search}
                        className="min-w-[260px] pl-9"
                        data-testid="admin-access-grants-search"
                        defaultValue={q}
                        onChange={(event) => updateParams({ q: event.target.value })}
                        placeholder={copy.search}
                      />
                    </div>
                    <Select value={status} onValueChange={(value) => updateParams({ status: normalizeStatus(value) })}>
                      <SelectTrigger className="w-[190px]" data-testid="admin-access-grants-status-filter">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue aria-label={copy.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {copy[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {grants.status === "loading" && !data.items.length ? (
                  <p className="text-sm text-muted-foreground">{copy.loading}</p>
                ) : data.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground" data-testid="admin-access-grants-empty">
                    <p className="font-medium text-foreground">{copy.emptyTitle}</p>
                    <p className="mt-1">{copy.emptyBody}</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="admin-access-grants-table">
                    {data.items.map((item) => (
                      <GrantRow
                        copy={copy}
                        item={item}
                        key={item.id}
                        onRevoke={() => void grants.revoke(item.id, "Admin revoked access from console")}
                        revoking={grants.revokingId === item.id}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between" data-testid="admin-access-grants-pagination">
                  <span>{copy.showing(from, to, total)}</span>
                  <div className="flex gap-2">
                    <Button
                      data-testid="admin-access-grants-prev"
                      disabled={offset <= 0}
                      onClick={() => updateParams({ offset: Math.max(0, offset - pageSize) })}
                      size="sm"
                      variant="outline"
                    >
                      {copy.previous}
                    </Button>
                    <Button
                      data-testid="admin-access-grants-next"
                      disabled={offset + pageSize >= total}
                      onClick={() => updateParams({ offset: offset + pageSize })}
                      size="sm"
                      variant="outline"
                    >
                      {copy.next}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function AccessStateAlerts({
  copy,
  error,
  status,
}: {
  copy: AccessGrantsCopy;
  error: Error | null;
  status: ReturnType<typeof useAdminAccessGrants>["status"];
}) {
  if (status === "disabled") {
    return (
      <Alert data-testid="admin-access-grants-disabled">
        <Lock className="h-4 w-4" />
        <AlertTitle>{copy.disabledTitle}</AlertTitle>
        <AlertDescription>{copy.disabledBody}</AlertDescription>
      </Alert>
    );
  }

  if (status === "session_required") {
    return (
      <Alert data-testid="admin-access-grants-session-required">
        <Lock className="h-4 w-4" />
        <AlertTitle>{copy.sessionTitle}</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{copy.sessionBody}</span>
          <Button asChild size="sm">
            <Link to="/signin">{copy.sessionCta}</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "forbidden") {
    return (
      <Alert data-testid="admin-access-grants-forbidden" variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
        <AlertDescription>{copy.forbiddenBody}</AlertDescription>
      </Alert>
    );
  }

  if (status === "error" && error) {
    return (
      <Alert data-testid="admin-access-grants-error" variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>{copy.errorTitle}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return null;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function GrantRow({
  copy,
  item,
  onRevoke,
  revoking,
}: {
  copy: AccessGrantsCopy;
  item: AdminAccessGrantItem;
  onRevoke: () => void;
  revoking: boolean;
}) {
  const supplierName = item.supplier.companyName ?? item.supplier.maskedName ?? item.supplierId;
  const buyerName = item.buyer.companyName ?? item.buyer.displayName ?? item.buyerUserId;
  return (
    <article
      className="grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_220px]"
      data-testid={`admin-access-grants-row-${item.id}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.isActive ? "default" : "outline"}>
            {item.isActive ? copy.active : copy.expired}
          </Badge>
          <Badge variant="outline">
            <ArrowLeftRight className="mr-1 h-3.5 w-3.5" />
            {item.scopes.join(", ")}
          </Badge>
          <Badge variant="outline">
            <Clock3 className="mr-1 h-3.5 w-3.5" />
            {copy.hours(item.ageHours)}
          </Badge>
        </div>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.buyer}</p>
            <p className="mt-1 break-words font-semibold text-foreground">{buyerName}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{item.buyerUserId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.supplier}</p>
            <p className="mt-1 break-words font-semibold text-foreground">{supplierName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.supplier.country ?? item.supplierId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.granted}</p>
            <p className="mt-1 text-foreground">{formatDate(item.grantedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.expires}</p>
            <p className="mt-1 text-foreground">{item.expiresAt ? formatDate(item.expiresAt) : copy.never}</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{copy.request}: </span>
          {item.request ? `${item.request.status} · ${item.request.id}` : copy.noRequest}
        </div>
      </div>
      <div className="flex items-start justify-end">
        <Button
          data-testid={`admin-access-grants-revoke-${item.id}`}
          disabled={!item.isActive || revoking}
          onClick={onRevoke}
          variant={item.isActive ? "destructive" : "outline"}
        >
          <ShieldX className="mr-2 h-4 w-4" />
          {revoking ? copy.revoking : copy.revoke}
        </Button>
      </div>
    </article>
  );
}

function normalizeStatus(value: string | null): AdminAccessGrantStatusFilter {
  if (value === "expired" || value === "all") return value;
  return "active";
}

function normalizeOffset(value: string | null) {
  const parsed = Number(value ?? "0");
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
