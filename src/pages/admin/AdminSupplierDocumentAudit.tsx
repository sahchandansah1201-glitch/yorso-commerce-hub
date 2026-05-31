import { Link } from "react-router-dom";
import { AlertTriangle, FileClock, Filter, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type {
  AdminSupplierDocumentAuditItem,
  AdminSupplierDocumentAuditKind,
  AdminSupplierDocumentAuditStatus,
} from "@/lib/admin-supplier-document-audit-api";
import { useAdminSupplierDocumentAudit } from "@/lib/use-admin-supplier-document-audit";

type DocumentAuditStatusFilter = AdminSupplierDocumentAuditStatus | "all";

type DocumentAuditCopy = {
  allStatuses: string;
  buyerUserId: string;
  createdAt: string;
  disabledBody: string;
  disabledTitle: string;
  documentId: string;
  downloadEvents: string;
  empty: string;
  errorTitle: string;
  expiresAt: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  grantAttempts: string;
  grantedAt: string;
  grantId: string;
  kind: string;
  loading: string;
  reason: string;
  refresh: string;
  requestId: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  status: string;
  subtitle: string;
  supplierId: string;
  title: string;
};

const COPY: Record<Language, DocumentAuditCopy> = {
  en: {
    allStatuses: "All statuses",
    buyerUserId: "Buyer user ID",
    createdAt: "Created",
    disabledBody: "Set VITE_YORSO_API_URL to inspect supplier document grants and downloads through the self-hosted API.",
    disabledTitle: "Self-hosted API is not connected",
    documentId: "Document",
    downloadEvents: "Download events",
    empty: "No supplier document audit rows match these filters.",
    errorTitle: "Supplier document audit could not be loaded",
    expiresAt: "Expires",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    grantAttempts: "Grant attempts",
    grantedAt: "Granted",
    grantId: "Grant",
    kind: "Audit list",
    loading: "Loading supplier document audit...",
    reason: "Reason",
    refresh: "Refresh audit",
    requestId: "Request",
    sessionBody: "Sign in through the self-hosted auth flow before opening supplier document audit.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    status: "Status",
    subtitle: "Read-only operator review for restricted supplier document grant attempts and download events. Browser-facing rows keep file assets and backend file paths out of the UI.",
    supplierId: "Supplier",
    title: "Supplier document audit",
  },
  ru: {
    allStatuses: "Все статусы",
    buyerUserId: "ID buyer user",
    createdAt: "Создано",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы проверить выдачу grant и скачивания документов поставщика через self-hosted API.",
    disabledTitle: "Self-hosted API не подключен",
    documentId: "Документ",
    downloadEvents: "События скачивания",
    empty: "По этим фильтрам audit rows документов поставщика не найдены.",
    errorTitle: "Audit документов поставщика не загрузился",
    expiresAt: "Истекает",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    grantAttempts: "Попытки grant",
    grantedAt: "Выдано",
    grantId: "Grant",
    kind: "Audit list",
    loading: "Загружаем audit документов поставщика...",
    reason: "Причина",
    refresh: "Обновить audit",
    requestId: "Request",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть audit документов поставщика.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    status: "Статус",
    subtitle: "Read-only проверка для операторов: grant attempts и download events restricted-документов поставщика. UI не показывает file assets и backend file paths.",
    supplierId: "Поставщик",
    title: "Audit документов поставщика",
  },
  es: {
    allStatuses: "Todos los estados",
    buyerUserId: "ID de buyer user",
    createdAt: "Creado",
    disabledBody: "Define VITE_YORSO_API_URL para revisar grants y descargas de documentos de proveedor mediante la API self-hosted.",
    disabledTitle: "La API self-hosted no está conectada",
    documentId: "Documento",
    downloadEvents: "Eventos de descarga",
    empty: "No hay filas de audit de documentos de proveedor para estos filtros.",
    errorTitle: "No se pudo cargar el audit de documentos de proveedor",
    expiresAt: "Expira",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    grantAttempts: "Intentos de grant",
    grantedAt: "Concedido",
    grantId: "Grant",
    kind: "Audit list",
    loading: "Cargando audit de documentos de proveedor...",
    reason: "Motivo",
    refresh: "Actualizar audit",
    requestId: "Request",
    sessionBody: "Inicia sesión mediante el auth flow self-hosted antes de abrir el audit de documentos de proveedor.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    status: "Estado",
    subtitle: "Revisión read-only para operadores: grant attempts y download events de documentos restringidos de proveedor. La UI no muestra file assets ni rutas backend de archivos.",
    supplierId: "Proveedor",
    title: "Audit de documentos de proveedor",
  },
};

const statusOptions: Record<AdminSupplierDocumentAuditKind, AdminSupplierDocumentAuditStatus[]> = {
  download_events: [
    "downloaded",
    "grant_not_found",
    "grant_denied",
    "grant_expired",
    "access_denied",
    "document_unavailable",
    "file_unavailable",
  ],
  download_grants: ["granted", "access_denied", "document_not_found", "document_unavailable"],
};

const kindOptions: AdminSupplierDocumentAuditKind[] = ["download_grants", "download_events"];

export default function AdminSupplierDocumentAudit() {
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const [kind, setKind] = useState<AdminSupplierDocumentAuditKind>("download_grants");
  const [status, setStatus] = useState<DocumentAuditStatusFilter>("all");
  const [supplierId, setSupplierId] = useState("");
  const [buyerUserId, setBuyerUserId] = useState("");

  useEffect(() => {
    setStatus("all");
  }, [kind]);

  const query = useMemo(() => ({
    buyerUserId,
    limit: 25,
    offset: 0,
    status,
    supplierId,
  }), [buyerUserId, status, supplierId]);
  const audit = useAdminSupplierDocumentAudit(session, kind, query);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
        data-testid="admin-document-audit-page"
      >
        <AdminOperatorNav />

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Self-hosted supplier audit
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{copy.subtitle}</p>
            </div>
            <Button data-testid="admin-document-audit-refresh" onClick={audit.refresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {copy.refresh}
            </Button>
          </div>
        </section>

        {audit.status === "disabled" && (
          <Alert data-testid="admin-document-audit-disabled">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.disabledTitle}</AlertTitle>
            <AlertDescription>{copy.disabledBody}</AlertDescription>
          </Alert>
        )}

        {audit.status === "session_required" && (
          <Alert data-testid="admin-document-audit-session-required">
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
          <Alert data-testid="admin-document-audit-forbidden" variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
            <AlertDescription>{copy.forbiddenBody}</AlertDescription>
          </Alert>
        )}

        {audit.status === "error" && (
          <Alert data-testid="admin-document-audit-error" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{audit.error.message}</AlertDescription>
          </Alert>
        )}

        <Card data-testid="admin-document-audit-filters">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              {copy.kind}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 pt-0 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs">{copy.kind}</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as AdminSupplierDocumentAuditKind)}>
                <SelectTrigger aria-label={copy.kind} data-testid="admin-document-audit-kind-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kindOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "download_grants" ? copy.grantAttempts : copy.downloadEvents}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{copy.status}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as DocumentAuditStatusFilter)}>
                <SelectTrigger aria-label={copy.status} data-testid="admin-document-audit-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.allStatuses}</SelectItem>
                  {statusOptions[kind].map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs" htmlFor="admin-document-audit-supplier">
                {copy.supplierId}
              </Label>
              <Input
                data-testid="admin-document-audit-supplier-filter"
                id="admin-document-audit-supplier"
                onChange={(event) => setSupplierId(event.target.value)}
                placeholder="sup-no-001"
                value={supplierId}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs" htmlFor="admin-document-audit-buyer">
                {copy.buyerUserId}
              </Label>
              <Input
                data-testid="admin-document-audit-buyer-filter"
                id="admin-document-audit-buyer"
                onChange={(event) => setBuyerUserId(event.target.value)}
                placeholder="00000000-0000-4000-8000-000000000001"
                value={buyerUserId}
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
          <DocumentAuditRows copy={copy} items={audit.data.items} />
        )}
      </main>
    </div>
  );
}

function DocumentAuditRows({ copy, items }: { copy: DocumentAuditCopy; items: AdminSupplierDocumentAuditItem[] }) {
  if (items.length === 0) {
    return (
      <Card data-testid="admin-document-audit-empty">
        <CardContent className="p-6 text-sm text-muted-foreground">{copy.empty}</CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="admin-document-audit-rows">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileClock className="h-5 w-5" />
          {copy.title}
        </CardTitle>
        <CardDescription>{items.length} rows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <article
            className="rounded-2xl border bg-background p-4"
            data-testid="admin-document-audit-row"
            key={item.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.status === "granted" || item.status === "downloaded" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                  <span className="break-all text-sm font-semibold text-foreground">{item.id}</span>
                </div>
                <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <Meta label={copy.supplierId} value={item.supplierId} />
                  <Meta label={copy.documentId} value={item.documentId} />
                  <Meta label={copy.buyerUserId} value={item.buyerUserId} />
                  {item.grantId && <Meta label={copy.grantId} value={item.grantId} />}
                  <Meta label={copy.reason} value={item.reason ?? "none"} />
                  <Meta label={copy.requestId} value={item.requestId} />
                </dl>
              </div>
              <dl className="grid min-w-0 gap-2 text-xs text-muted-foreground sm:grid-cols-3 lg:max-w-xl lg:text-right">
                {item.grantedAt && <Meta label={copy.grantedAt} value={formatDate(item.grantedAt)} />}
                {item.expiresAt && <Meta label={copy.expiresAt} value={formatDate(item.expiresAt)} />}
                <Meta label={copy.createdAt} value={formatDate(item.createdAt)} />
              </dl>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}

const formatDate = (value: string) => new Date(value).toLocaleString();
