import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
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
  useAdminAccessReview,
  type AdminAccessReviewItem,
  type AdminAccessReviewStatusFilter,
} from "@/lib/use-admin-access-review";

type AccessReviewCopy = {
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
  all: string;
  open: string;
  sent: string;
  pending: string;
  approved: string;
  rejected: string;
  revoked: string;
  total: string;
  accessQueue: string;
  accessQueueBody: string;
  buyer: string;
  supplier: string;
  intent: string;
  exactPrice: string;
  requested: string;
  message: string;
  noMessage: string;
  approve: string;
  reject: string;
  markPending: string;
  revoke: string;
  deciding: string;
  emptyTitle: string;
  emptyBody: string;
  slaFresh: string;
  slaDueToday: string;
  slaOverdue: string;
  selfHostedOnly: string;
  selfHostedOnlyBody: string;
  reviewRuntime: string;
  previous: string;
  next: string;
  showing: (from: number, to: number, total: number) => string;
  hours: (hours: number) => string;
};

const COPY: Record<Language, AccessReviewCopy> = {
  en: {
    title: "Supplier access review",
    subtitle: "Approve or reject buyer requests for supplier identity and exact price access.",
    disabledTitle: "Self-hosted API is not connected",
    disabledBody: "Set VITE_YORSO_API_URL to review live access requests. The page does not invent backend data in prototype mode.",
    sessionTitle: "Self-hosted session required",
    sessionBody: "Sign in through the self-hosted auth flow before reviewing access requests.",
    sessionCta: "Sign in",
    forbiddenTitle: "Admin role required",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    errorTitle: "Access requests could not be loaded",
    loading: "Loading review queue...",
    refresh: "Refresh queue",
    search: "Search buyer, supplier, request or message",
    status: "Status",
    all: "All",
    open: "Open",
    sent: "Sent",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    revoked: "Revoked",
    total: "Total",
    accessQueue: "Review queue",
    accessQueueBody: "Only admin sessions can read this queue. Buyer emails, phones and raw session data are not shown.",
    buyer: "Buyer",
    supplier: "Supplier",
    intent: "Intent",
    exactPrice: "Exact price access",
    requested: "Requested",
    message: "Message",
    noMessage: "No message",
    approve: "Approve",
    reject: "Reject",
    markPending: "Mark pending",
    revoke: "Revoke",
    deciding: "Saving...",
    emptyTitle: "No requests in this view",
    emptyBody: "Change the filter or wait for new buyer requests.",
    slaFresh: "Fresh",
    slaDueToday: "Due today",
    slaOverdue: "Overdue",
    selfHostedOnly: "Self-hosted review path",
    selfHostedOnlyBody: "Decisions call `/v1/admin/access-requests/:id/decision`, create grants, and notify the buyer.",
    reviewRuntime: "Runtime status",
    previous: "Previous",
    next: "Next",
    showing: (from, to, total) => `Showing ${from}-${to} of ${total}`,
    hours: (hours) => `${Math.round(hours)} h`,
  },
  ru: {
    title: "Проверка запросов доступа",
    subtitle: "Подтверждайте или отклоняйте запросы покупателей на данные поставщика и точные цены.",
    disabledTitle: "Self-hosted API не подключён",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы проверять реальные запросы доступа. В режиме прототипа страница не придумывает backend-данные.",
    sessionTitle: "Нужна self-hosted сессия",
    sessionBody: "Войдите через self-hosted auth flow перед проверкой запросов доступа.",
    sessionCta: "Войти",
    forbiddenTitle: "Нужна роль администратора",
    forbiddenBody: "Backend отклонил эту сессию, потому что у неё нет роли admin.",
    errorTitle: "Не удалось загрузить запросы доступа",
    loading: "Загружаем очередь...",
    refresh: "Обновить очередь",
    search: "Искать покупателя, поставщика, запрос или сообщение",
    status: "Статус",
    all: "Все",
    open: "Открытые",
    sent: "Отправлен",
    pending: "В работе",
    approved: "Одобрен",
    rejected: "Отклонён",
    revoked: "Отозван",
    total: "Всего",
    accessQueue: "Очередь проверки",
    accessQueueBody: "Очередь доступна только admin-сессиям. Email, телефоны и raw session data не показываются.",
    buyer: "Покупатель",
    supplier: "Поставщик",
    intent: "Цель",
    exactPrice: "Доступ к точной цене",
    requested: "Запрошено",
    message: "Сообщение",
    noMessage: "Без сообщения",
    approve: "Одобрить",
    reject: "Отклонить",
    markPending: "В работу",
    revoke: "Отозвать",
    deciding: "Сохраняем...",
    emptyTitle: "В этом фильтре нет запросов",
    emptyBody: "Измените фильтр или дождитесь новых запросов покупателей.",
    slaFresh: "Новый",
    slaDueToday: "Сегодня",
    slaOverdue: "Просрочен",
    selfHostedOnly: "Self-hosted review path",
    selfHostedOnlyBody: "Решения идут в `/v1/admin/access-requests/:id/decision`, создают grants и уведомляют покупателя.",
    reviewRuntime: "Runtime status",
    previous: "Назад",
    next: "Вперёд",
    showing: (from, to, total) => `Показаны ${from}-${to} из ${total}`,
    hours: (hours) => `${Math.round(hours)} ч`,
  },
  es: {
    title: "Revisión de accesos",
    subtitle: "Aprueba o rechaza solicitudes de compradores para identidad del proveedor y precios exactos.",
    disabledTitle: "La API self-hosted no está conectada",
    disabledBody: "Define VITE_YORSO_API_URL para revisar solicitudes reales. En prototipo la página no inventa datos backend.",
    sessionTitle: "Se requiere sesión self-hosted",
    sessionBody: "Inicia sesión mediante el flujo auth self-hosted antes de revisar solicitudes.",
    sessionCta: "Iniciar sesión",
    forbiddenTitle: "Se requiere rol admin",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    errorTitle: "No se pudieron cargar las solicitudes",
    loading: "Cargando cola...",
    refresh: "Actualizar cola",
    search: "Buscar comprador, proveedor, solicitud o mensaje",
    status: "Estado",
    all: "Todas",
    open: "Abiertas",
    sent: "Enviada",
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    revoked: "Revocada",
    total: "Total",
    accessQueue: "Cola de revisión",
    accessQueueBody: "Solo sesiones admin pueden leer esta cola. No se muestran emails, teléfonos ni raw session data.",
    buyer: "Comprador",
    supplier: "Proveedor",
    intent: "Objetivo",
    exactPrice: "Acceso a precio exacto",
    requested: "Solicitado",
    message: "Mensaje",
    noMessage: "Sin mensaje",
    approve: "Aprobar",
    reject: "Rechazar",
    markPending: "Marcar pendiente",
    revoke: "Revocar",
    deciding: "Guardando...",
    emptyTitle: "No hay solicitudes en esta vista",
    emptyBody: "Cambia el filtro o espera nuevas solicitudes.",
    slaFresh: "Nueva",
    slaDueToday: "Vence hoy",
    slaOverdue: "Atrasada",
    selfHostedOnly: "Self-hosted review path",
    selfHostedOnlyBody: "Las decisiones llaman a `/v1/admin/access-requests/:id/decision`, crean grants y notifican al comprador.",
    reviewRuntime: "Runtime status",
    previous: "Anterior",
    next: "Siguiente",
    showing: (from, to, total) => `Mostrando ${from}-${to} de ${total}`,
    hours: (hours) => `${Math.round(hours)} h`,
  },
};

const statusOptions: AdminAccessReviewStatusFilter[] = [
  "open",
  "all",
  "sent",
  "pending",
  "approved",
  "rejected",
  "revoked",
];

const pageSize = 25;

export default function AdminAccessRequests() {
  const { lang } = useLanguage();
  const copy = COPY[lang] ?? COPY.en;
  const { session } = useBuyerSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = normalizeStatus(searchParams.get("status"));
  const q = searchParams.get("q")?.trim() ?? "";
  const offset = normalizeOffset(searchParams.get("offset"));
  const review = useAdminAccessReview(session, {
    limit: pageSize,
    offset,
    q: q || undefined,
    status,
  });

  const updateParams = (patch: { q?: string; status?: AdminAccessReviewStatusFilter; offset?: number }) => {
    const next = new URLSearchParams(searchParams);
    if (patch.q !== undefined) {
      if (patch.q.trim()) next.set("q", patch.q.trim());
      else next.delete("q");
      next.delete("offset");
    }
    if (patch.status !== undefined) {
      if (patch.status === "open") next.delete("status");
      else next.set("status", patch.status);
      next.delete("offset");
    }
    if (patch.offset !== undefined) {
      if (patch.offset > 0) next.set("offset", String(patch.offset));
      else next.delete("offset");
    }
    setSearchParams(next, { replace: true });
  };

  const data = review.data;
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-access-review-page">
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
                  <Link to="/admin/runtime">{copy.reviewRuntime}</Link>
                </Button>
                <Button
                  data-testid="admin-access-review-refresh"
                  onClick={review.refresh}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {copy.refresh}
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-orange-200 bg-orange-50/70">
            <CardHeader>
              <CardTitle className="text-base">{copy.selfHostedOnly}</CardTitle>
              <CardDescription>{copy.selfHostedOnlyBody}</CardDescription>
            </CardHeader>
          </Card>
        </section>

        {review.status === "disabled" && (
          <Alert data-testid="admin-access-review-disabled">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.disabledTitle}</AlertTitle>
            <AlertDescription>{copy.disabledBody}</AlertDescription>
          </Alert>
        )}

        {review.status === "session_required" && (
          <Alert data-testid="admin-access-review-session-required">
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

        {review.status === "forbidden" && (
          <Alert data-testid="admin-access-review-forbidden" variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
            <AlertDescription>{copy.forbiddenBody}</AlertDescription>
          </Alert>
        )}

        {review.status === "error" && (
          <Alert data-testid="admin-access-review-error" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{review.error.message}</AlertDescription>
          </Alert>
        )}

        {(review.status === "loading" || review.status === "ready") && data && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" data-testid="admin-access-review-summary">
              <SummaryPill label={copy.open} value={data.summary.open} tone="orange" />
              <SummaryPill label={copy.sent} value={data.summary.sent} tone="slate" />
              <SummaryPill label={copy.pending} value={data.summary.pending} tone="blue" />
              <SummaryPill label={copy.approved} value={data.summary.approved} tone="green" />
              <SummaryPill label={copy.rejected} value={data.summary.rejected} tone="red" />
              <SummaryPill label={copy.total} value={total} tone="slate" />
            </section>

            <Card data-testid="admin-access-review-queue">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>{copy.accessQueue}</CardTitle>
                    <CardDescription>{copy.accessQueueBody}</CardDescription>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(220px,360px)_180px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label={copy.search}
                        className="pl-9"
                        data-testid="admin-access-review-search"
                        defaultValue={q}
                        onChange={(event) => updateParams({ q: event.target.value })}
                        placeholder={copy.search}
                      />
                    </div>
                    <Select
                      value={status}
                      onValueChange={(value) => updateParams({ status: normalizeStatus(value) })}
                    >
                      <SelectTrigger data-testid="admin-access-review-status-filter">
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
              <CardContent className="space-y-4">
                {review.status === "loading" && !data.items.length && (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                    {copy.loading}
                  </div>
                )}

                {data.items.length === 0 && review.status === "ready" && (
                  <div className="rounded-2xl border border-dashed border-border p-8" data-testid="admin-access-review-empty">
                    <h2 className="text-lg font-semibold">{copy.emptyTitle}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p>
                  </div>
                )}

                {data.items.map((item) => (
                  <AccessRequestRow
                    copy={copy}
                    item={item}
                    key={item.request.id}
                    onApprove={() => review.decide(item.request.id, "approved")}
                    onPending={() => review.decide(item.request.id, "pending")}
                    onReject={() => review.decide(item.request.id, "rejected")}
                    onRevoke={() => review.decide(item.request.id, "revoked")}
                    saving={review.decidingId === item.request.id}
                  />
                ))}

                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground" data-testid="admin-access-review-page-summary">
                    {copy.showing(from, to, total)}
                  </p>
                  <div className="flex gap-2" data-testid="admin-access-review-pagination">
                    <Button
                      disabled={offset === 0}
                      onClick={() => updateParams({ offset: Math.max(0, offset - pageSize) })}
                      variant="outline"
                    >
                      {copy.previous}
                    </Button>
                    <Button
                      disabled={offset + pageSize >= total}
                      onClick={() => updateParams({ offset: offset + pageSize })}
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

function AccessRequestRow({
  copy,
  item,
  onApprove,
  onPending,
  onReject,
  onRevoke,
  saving,
}: {
  copy: AccessReviewCopy;
  item: AdminAccessReviewItem;
  onApprove: () => void;
  onPending: () => void;
  onReject: () => void;
  onRevoke: () => void;
  saving: boolean;
}) {
  return (
    <article
      className="grid gap-5 rounded-3xl border border-border bg-background p-4 shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)_auto]"
      data-testid={`admin-access-review-row-${item.request.id}`}
    >
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge copy={copy} status={item.request.status} />
          <SlaBadge copy={copy} sla={item.decisionSla} />
          <span className="text-xs text-muted-foreground">{copy.hours(item.ageHours)}</span>
        </div>
        <h2 className="truncate text-lg font-semibold text-foreground">
          {item.buyer.companyName ?? item.buyer.displayName ?? item.buyer.userId}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.buyer}: {item.buyer.accountRole ?? "buyer"}
          {item.buyer.countryCode ? ` · ${item.buyer.countryCode}` : ""}
        </p>
        <div className="mt-4 rounded-2xl bg-muted/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {copy.message}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {item.request.message || copy.noMessage}
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {copy.supplier}
        </p>
        <p className="mt-2 truncate text-base font-semibold text-foreground">
          {item.supplier.companyName ?? item.supplier.maskedName ?? item.supplier.supplierId}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {[item.supplier.city, item.supplier.country].filter(Boolean).join(", ") || item.supplier.supplierId}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRight className="h-4 w-4 text-orange-500" />
          {copy.intent}: {copy.exactPrice}
        </p>
      </div>

      <div className="flex flex-col gap-2 lg:min-w-[150px]">
        {(item.request.status === "sent" || item.request.status === "pending") && (
          <>
            <Button data-testid={`admin-access-review-approve-${item.request.id}`} disabled={saving} onClick={onApprove}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {saving ? copy.deciding : copy.approve}
            </Button>
            {item.request.status === "sent" && (
              <Button disabled={saving} onClick={onPending} variant="outline">
                <Clock3 className="mr-2 h-4 w-4" />
                {copy.markPending}
              </Button>
            )}
            <Button disabled={saving} onClick={onReject} variant="outline">
              <XCircle className="mr-2 h-4 w-4" />
              {copy.reject}
            </Button>
          </>
        )}
        {item.request.status === "approved" && (
          <Button data-testid={`admin-access-review-revoke-${item.request.id}`} disabled={saving} onClick={onRevoke} variant="outline">
            <XCircle className="mr-2 h-4 w-4" />
            {saving ? copy.deciding : copy.revoke}
          </Button>
        )}
      </div>
    </article>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" | "orange" | "red" | "slate" }) {
  const toneClass = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    green: "border-green-200 bg-green-50 text-green-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    red: "border-red-200 bg-red-50 text-red-800",
    slate: "border-slate-200 bg-slate-50 text-slate-800",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ copy, status }: { copy: AccessReviewCopy; status: AdminAccessReviewItem["request"]["status"] }) {
  const tone = {
    approved: "bg-green-100 text-green-700 hover:bg-green-100",
    pending: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100",
    revoked: "bg-slate-100 text-slate-700 hover:bg-slate-100",
    sent: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  }[status];
  return <Badge className={tone}>{copy[status]}</Badge>;
}

function SlaBadge({ copy, sla }: { copy: AccessReviewCopy; sla: AdminAccessReviewItem["decisionSla"] }) {
  const label = sla === "overdue" ? copy.slaOverdue : sla === "due_today" ? copy.slaDueToday : copy.slaFresh;
  const tone = sla === "overdue"
    ? "border-red-200 bg-red-50 text-red-700"
    : sla === "due_today"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}

function normalizeStatus(value: string | null | undefined): AdminAccessReviewStatusFilter {
  return statusOptions.includes(value as AdminAccessReviewStatusFilter)
    ? value as AdminAccessReviewStatusFilter
    : "open";
}

function normalizeOffset(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}
