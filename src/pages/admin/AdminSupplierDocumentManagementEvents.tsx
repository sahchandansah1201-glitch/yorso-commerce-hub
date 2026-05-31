import { Link } from "react-router-dom";
import { AlertTriangle, Check, Download, FileClock, Filter, Lock, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import {
  createAdminSupplierDocumentManagementEventsApiClient,
  type AdminSupplierDocumentManagementEventAction,
  type AdminSupplierDocumentManagementEventItem,
  type AdminSupplierDocumentManagementEventsQuery,
} from "@/lib/admin-supplier-document-management-events-api";
import { useAdminSupplierDocumentManagementEvents } from "@/lib/use-admin-supplier-document-management-events";

type ManagementEventActionFilter = AdminSupplierDocumentManagementEventAction | "all";
type DocumentUiAction = "approve" | "reject" | "expire" | "delete";

type ManagementEventsCopy = {
  action: string;
  actorRole: string;
  actorUserId: string;
  allActions: string;
  approve: string;
  actionComplete: string;
  actionReason: string;
  confirmCancel: string;
  confirmDescription: string;
  confirmSubmit: string;
  confirmTitle: string;
  createdAt: string;
  delete: string;
  disabledBody: string;
  disabledTitle: string;
  documentId: string;
  empty: string;
  errorTitle: string;
  exportCsv: string;
  exportJson: string;
  exportReady: string;
  expire: string;
  filter: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  loading: string;
  reason: string;
  reject: string;
  refresh: string;
  requestId: string;
  runActions: string;
  saving: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  statusTransition: string;
  subtitle: string;
  supplierId: string;
  title: string;
};

const COPY: Record<Language, ManagementEventsCopy> = {
  en: {
    action: "Action",
    actorRole: "Actor role",
    actorUserId: "Actor user ID",
    allActions: "All actions",
    approve: "Approve",
    actionComplete: "Document action completed",
    actionReason: "Action reason",
    confirmCancel: "Cancel",
    confirmDescription: "This action writes a durable admin audit event and refreshes the management event list. Review the reason before continuing.",
    confirmSubmit: "Confirm action",
    confirmTitle: "Confirm document action",
    createdAt: "Created",
    delete: "Delete",
    disabledBody: "Set VITE_YORSO_API_URL to inspect supplier document management events through the self-hosted API.",
    disabledTitle: "Self-hosted API is not connected",
    documentId: "Document",
    empty: "No supplier document management events match these filters.",
    errorTitle: "Supplier document management events could not be loaded",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    exportReady: "Management event export ready",
    expire: "Expire",
    filter: "Filter management events",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    loading: "Loading supplier document management events...",
    reason: "Reason",
    reject: "Reject",
    refresh: "Refresh events",
    requestId: "Request",
    runActions: "Document actions",
    saving: "Saving...",
    sessionBody: "Sign in through the self-hosted auth flow before opening supplier document management events.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    statusTransition: "Status transition",
    subtitle: "Read-only operator view over supplier document create, review, approval, expiry and delete events. The UI keeps backend file assets and file paths out of browser state.",
    supplierId: "Supplier",
    title: "Supplier document management events",
  },
  ru: {
    action: "Действие",
    actorRole: "Роль автора",
    actorUserId: "ID автора",
    allActions: "Все действия",
    approve: "Одобрить",
    actionComplete: "Действие с документом выполнено",
    actionReason: "Причина действия",
    confirmCancel: "Отмена",
    confirmDescription: "Это действие запишет durable admin audit event и обновит список событий управления. Проверьте причину перед продолжением.",
    confirmSubmit: "Подтвердить действие",
    confirmTitle: "Подтвердите действие с документом",
    createdAt: "Создано",
    delete: "Удалить",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы проверить события управления документами поставщика через self-hosted API.",
    disabledTitle: "Self-hosted API не подключен",
    documentId: "Документ",
    empty: "По этим фильтрам событий управления документами поставщика нет.",
    errorTitle: "События управления документами поставщика не загрузились",
    exportCsv: "Экспорт CSV",
    exportJson: "Экспорт JSON",
    exportReady: "Экспорт событий управления готов",
    expire: "Отметить истекшим",
    filter: "Фильтровать события управления",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    loading: "Загружаем события управления документами поставщика...",
    reason: "Причина",
    reject: "Отклонить",
    refresh: "Обновить события",
    requestId: "Request",
    runActions: "Действия с документом",
    saving: "Сохраняем...",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть события управления документами поставщика.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    statusTransition: "Переход статуса",
    subtitle: "Read-only экран оператора по событиям create, review, approval, expiry и delete для документов поставщика. UI не показывает backend file assets и file paths.",
    supplierId: "Поставщик",
    title: "События управления документами поставщика",
  },
  es: {
    action: "Acción",
    actorRole: "Rol del actor",
    actorUserId: "ID del actor",
    allActions: "Todas las acciones",
    approve: "Aprobar",
    actionComplete: "Acción del documento completada",
    actionReason: "Motivo de la acción",
    confirmCancel: "Cancelar",
    confirmDescription: "Esta acción escribe un evento durable de auditoría admin y actualiza la lista de eventos de gestión. Revisa el motivo antes de continuar.",
    confirmSubmit: "Confirmar acción",
    confirmTitle: "Confirmar acción del documento",
    createdAt: "Creado",
    delete: "Eliminar",
    disabledBody: "Define VITE_YORSO_API_URL para revisar eventos de gestión de documentos de proveedor mediante la API self-hosted.",
    disabledTitle: "La API self-hosted no está conectada",
    documentId: "Documento",
    empty: "No hay eventos de gestión de documentos de proveedor para estos filtros.",
    errorTitle: "No se pudieron cargar los eventos de gestión de documentos de proveedor",
    exportCsv: "Exportar CSV",
    exportJson: "Exportar JSON",
    exportReady: "Export de eventos de gestión listo",
    expire: "Marcar expirado",
    filter: "Filtrar eventos de gestión",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene rol admin.",
    forbiddenTitle: "Rol admin requerido",
    loading: "Cargando eventos de gestión de documentos de proveedor...",
    reason: "Motivo",
    reject: "Rechazar",
    refresh: "Actualizar eventos",
    requestId: "Request",
    runActions: "Acciones del documento",
    saving: "Guardando...",
    sessionBody: "Inicia sesión mediante self-hosted auth antes de abrir eventos de gestión de documentos de proveedor.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Sesión self-hosted requerida",
    statusTransition: "Transición de estado",
    subtitle: "Vista read-only para operadores sobre eventos create, review, approval, expiry y delete de documentos de proveedor. La UI no muestra backend file assets ni file paths.",
    supplierId: "Proveedor",
    title: "Eventos de gestión de documentos de proveedor",
  },
};

const actionOptions: ManagementEventActionFilter[] = [
  "all",
  "supplier_document.create",
  "supplier_document.update_metadata",
  "supplier_document.submit_for_review",
  "supplier_document.approve",
  "supplier_document.reject",
  "supplier_document.expire",
  "supplier_document.delete",
];

export default function AdminSupplierDocumentManagementEvents() {
  const { lang } = useLanguage();
  const copy = COPY[lang] ?? COPY.en;
  const { session } = useBuyerSession();
  const [action, setAction] = useState<ManagementEventActionFilter>("all");
  const [supplierId, setSupplierId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const query = useMemo<AdminSupplierDocumentManagementEventsQuery>(() => ({
    action,
    actorUserId,
    documentId,
    limit: 50,
    offset: 0,
    supplierId,
  }), [action, actorUserId, documentId, supplierId]);
  const events = useAdminSupplierDocumentManagementEvents(session, query);

  const exportEvents = async (format: "json" | "csv") => {
    const client = createAdminSupplierDocumentManagementEventsApiClient({ session });
    await client.exportEvents({ ...query, format });
    setExportStatus(copy.exportReady);
  };

  const runDocumentAction = async (
    item: AdminSupplierDocumentManagementEventItem,
    action: DocumentUiAction,
    reason?: string,
  ) => {
    const actionKey = `${item.id}:${action}`;
    setSavingAction(actionKey);
    setActionStatus(null);
    try {
      const client = createAdminSupplierDocumentManagementEventsApiClient({ session });
      await client.runDocumentAction({
        action,
        documentId: item.documentId,
        reason,
        supplierId: item.supplierId,
      });
      setActionStatus(copy.actionComplete);
      events.refresh();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : copy.errorTitle);
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
        data-testid="admin-document-management-events-page"
      >
        <AdminOperatorNav />

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Self-hosted supplier controls
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{copy.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button data-testid="admin-document-management-events-refresh" onClick={events.refresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {copy.refresh}
              </Button>
              <Button
                data-testid="admin-document-management-events-export-json"
                onClick={() => void exportEvents("json")}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                {copy.exportJson}
              </Button>
              <Button
                data-testid="admin-document-management-events-export-csv"
                onClick={() => void exportEvents("csv")}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                {copy.exportCsv}
              </Button>
            </div>
          </div>
        </section>

        {exportStatus && (
          <p
            className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
            data-testid="admin-document-management-events-export-status"
          >
            {exportStatus}
          </p>
        )}

        {actionStatus && (
          <p
            className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900"
            data-testid="admin-document-management-events-action-status"
          >
            {actionStatus}
          </p>
        )}

        {events.status === "disabled" && (
          <Alert data-testid="admin-document-management-events-disabled">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.disabledTitle}</AlertTitle>
            <AlertDescription>{copy.disabledBody}</AlertDescription>
          </Alert>
        )}

        {events.status === "session_required" && (
          <Alert data-testid="admin-document-management-events-session-required">
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

        {events.status === "forbidden" && (
          <Alert data-testid="admin-document-management-events-forbidden" variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
            <AlertDescription>{copy.forbiddenBody}</AlertDescription>
          </Alert>
        )}

        {events.status === "error" && (
          <Alert data-testid="admin-document-management-events-error" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{events.error.message}</AlertDescription>
          </Alert>
        )}

        <Card data-testid="admin-document-management-events-filters">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              {copy.filter}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 pt-0 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs">{copy.action}</Label>
              <Select value={action} onValueChange={(value) => setAction(value as ManagementEventActionFilter)}>
                <SelectTrigger aria-label={copy.action} data-testid="admin-document-management-events-action-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? copy.allActions : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FilterInput
              id="admin-document-management-events-supplier"
              label={copy.supplierId}
              onChange={setSupplierId}
              placeholder="sup-no-001"
              testId="admin-document-management-events-supplier-filter"
              value={supplierId}
            />
            <FilterInput
              id="admin-document-management-events-document"
              label={copy.documentId}
              onChange={setDocumentId}
              placeholder="sup-no-001-health-certificate"
              testId="admin-document-management-events-document-filter"
              value={documentId}
            />
            <FilterInput
              id="admin-document-management-events-actor"
              label={copy.actorUserId}
              onChange={setActorUserId}
              placeholder="00000000-0000-4000-8000-000000000099"
              testId="admin-document-management-events-actor-filter"
              value={actorUserId}
            />
          </CardContent>
        </Card>

        {events.status === "loading" && !events.data && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{copy.loading}</CardContent>
          </Card>
        )}

        {events.data && (
          <ManagementEventRows
            copy={copy}
            items={events.data.items}
            onRunAction={runDocumentAction}
            savingAction={savingAction}
          />
        )}
      </main>
    </div>
  );
}

function FilterInput({
  id,
  label,
  onChange,
  placeholder,
  testId,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  testId: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs" htmlFor={id}>
        {label}
      </Label>
      <Input
        data-testid={testId}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function ManagementEventRows({
  copy,
  items,
  onRunAction,
  savingAction,
}: {
  copy: ManagementEventsCopy;
  items: AdminSupplierDocumentManagementEventItem[];
  onRunAction: (
    item: AdminSupplierDocumentManagementEventItem,
    action: DocumentUiAction,
    reason?: string,
  ) => Promise<void>;
  savingAction: string | null;
}) {
  if (items.length === 0) {
    return (
      <Card data-testid="admin-document-management-events-empty">
        <CardContent className="p-6 text-sm text-muted-foreground">{copy.empty}</CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="admin-document-management-events-rows">
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
            data-testid="admin-document-management-events-row"
            key={item.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.nextStatus === "approved" ? "default" : "secondary"}>{item.action}</Badge>
                  <span className="break-all text-sm font-semibold text-foreground">{item.id}</span>
                </div>
                <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <Meta label={copy.supplierId} value={item.supplierId} />
                  <Meta label={copy.documentId} value={item.documentId} />
                  <Meta label={copy.actorRole} value={item.actorRole} />
                  <Meta label={copy.actorUserId} value={item.actorUserId} />
                  <Meta label={copy.statusTransition} value={formatTransition(item)} />
                  <Meta label={copy.reason} value={item.reason} />
                  <Meta label={copy.requestId} value={item.requestId} />
                </dl>
                <DocumentActionControls
                  copy={copy}
                  item={item}
                  onRunAction={onRunAction}
                  savingAction={savingAction}
                />
              </div>
              <dl className="grid min-w-0 gap-2 text-xs text-muted-foreground lg:max-w-xs lg:text-right">
                <Meta label={copy.createdAt} value={formatDate(item.createdAt)} />
              </dl>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function DocumentActionControls({
  copy,
  item,
  onRunAction,
  savingAction,
}: {
  copy: ManagementEventsCopy;
  item: AdminSupplierDocumentManagementEventItem;
  onRunAction: (
    item: AdminSupplierDocumentManagementEventItem,
    action: DocumentUiAction,
    reason?: string,
  ) => Promise<void>;
  savingAction: string | null;
}) {
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<DocumentUiAction | null>(null);
  const actions = allowedActions(item);
  if (actions.length === 0) return null;

  const run = (action: DocumentUiAction) => {
    void onRunAction(item, action, reason.trim() || undefined);
  };
  const requestAction = (action: DocumentUiAction) => {
    if (action === "approve") {
      run(action);
      return;
    }
    setPendingAction(action);
  };
  const confirmPendingAction = () => {
    if (!pendingAction) return;
    run(pendingAction);
    setPendingAction(null);
  };

  return (
    <div className="mt-4 rounded-xl border border-border/70 bg-muted/30 p-3" data-testid={`admin-document-management-events-actions-${item.id}`}>
      <Label className="text-xs" htmlFor={`admin-document-management-events-reason-${item.id}`}>
        {copy.actionReason}
      </Label>
      <Input
        className="mt-2"
        data-testid={`admin-document-management-events-reason-${item.id}`}
        id={`admin-document-management-events-reason-${item.id}`}
        onChange={(event) => setReason(event.target.value)}
        placeholder={copy.reason}
        value={reason}
      />
      <div className="mt-3 flex flex-wrap gap-2" aria-label={copy.runActions}>
        {actions.includes("approve") && (
          <Button
            data-testid={`admin-document-management-events-approve-${item.id}`}
            disabled={savingAction === `${item.id}:approve`}
            onClick={() => requestAction("approve")}
            size="sm"
          >
            <Check className="mr-2 h-4 w-4" />
            {savingAction === `${item.id}:approve` ? copy.saving : copy.approve}
          </Button>
        )}
        {actions.includes("reject") && (
          <Button
            data-testid={`admin-document-management-events-reject-${item.id}`}
            disabled={!reason.trim() || savingAction === `${item.id}:reject`}
            onClick={() => requestAction("reject")}
            size="sm"
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            {savingAction === `${item.id}:reject` ? copy.saving : copy.reject}
          </Button>
        )}
        {actions.includes("expire") && (
          <Button
            data-testid={`admin-document-management-events-expire-${item.id}`}
            disabled={!reason.trim() || savingAction === `${item.id}:expire`}
            onClick={() => requestAction("expire")}
            size="sm"
            variant="outline"
          >
            <FileClock className="mr-2 h-4 w-4" />
            {savingAction === `${item.id}:expire` ? copy.saving : copy.expire}
          </Button>
        )}
        {actions.includes("delete") && (
          <Button
            data-testid={`admin-document-management-events-delete-${item.id}`}
            disabled={!reason.trim() || savingAction === `${item.id}:delete`}
            onClick={() => requestAction("delete")}
            size="sm"
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {savingAction === `${item.id}:delete` ? copy.saving : copy.delete}
          </Button>
        )}
      </div>
      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent data-testid="admin-document-management-events-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="grid gap-2 rounded-xl bg-muted/40 p-3 text-sm">
            <Meta label={copy.action} value={pendingAction ?? ""} />
            <Meta label={copy.supplierId} value={item.supplierId} />
            <Meta label={copy.documentId} value={item.documentId} />
            <Meta label={copy.reason} value={reason.trim()} />
          </dl>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-document-management-events-confirm-cancel">
              {copy.confirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="admin-document-management-events-confirm-submit"
              onClick={confirmPendingAction}
            >
              {copy.confirmSubmit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const allowedActions = (item: AdminSupplierDocumentManagementEventItem): DocumentUiAction[] => {
  if (item.nextStatus === "review") return ["approve", "reject", "delete"];
  if (item.nextStatus === "approved") return ["expire"];
  if (item.nextStatus === "on_request" || item.nextStatus === "expired") return ["delete"];
  return [];
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}

const formatDate = (value: string) => new Date(value).toLocaleString();

const formatTransition = (item: AdminSupplierDocumentManagementEventItem) => {
  const previous = item.previousStatus ?? "none";
  const next = item.nextStatus ?? "none";
  return `${previous} → ${next}`;
};
