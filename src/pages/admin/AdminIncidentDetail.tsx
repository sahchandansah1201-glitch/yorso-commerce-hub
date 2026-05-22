import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Wrench,
  UserRoundCheck,
} from "lucide-react";
import { useState } from "react";
import { AdminOperatorNav } from "@/components/admin/AdminOperatorNav";
import Header from "@/components/landing/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import type {
  AdminIncident,
  AdminIncidentEscalationLevel,
  AdminIncidentSeverity,
  AdminIncidentTimelineEvent,
} from "@/lib/admin-incidents-api";
import { useAdminIncidentDetail } from "@/lib/use-admin-incident-detail";
import { cn } from "@/lib/utils";

type DetailCopy = {
  actions: string;
  acknowledge: string;
  assign: string;
  assigneePlaceholder: string;
  back: string;
  comment: string;
  disabledBody: string;
  disabledTitle: string;
  due: string;
  errorTitle: string;
  evidence: string;
  escalation: string;
  exportJson: string;
  exportMarkdown: string;
  forbiddenBody: string;
  forbiddenTitle: string;
  handoff: string;
  handoffDescription: string;
  handoffReady: string;
  loading: string;
  notePlaceholder: string;
  noteUnsafe: string;
  postmortem: string;
  postmortemDescription: string;
  postmortemExportJson: string;
  postmortemExportMarkdown: string;
  postmortemReady: string;
  readiness: string;
  readinessAssigned: string;
  readinessAssignedDetail: string;
  readinessCapacity: string;
  readinessCapacityDetail: string;
  readinessDescription: string;
  readinessEvidence: string;
  readinessEvidenceDetail: string;
  readinessHandoff: string;
  readinessNeedsAttention: string;
  readinessReady: string;
  readinessRunbook: string;
  readinessRunbookDetail: string;
  readinessSla: string;
  readinessSlaDetail: string;
  refresh: string;
  remediation: string;
  remediationDescription: string;
  remediationLoad: string;
  remediationReady: string;
  resolve: string;
  route: string;
  runbook: string;
  sessionBody: string;
  sessionCta: string;
  sessionTitle: string;
  snapshot: string;
  timeline: string;
  timelineHint: string;
  title: string;
  workflow: string;
};

const COPY: Record<Language, DetailCopy> = {
  en: {
    actions: "Recommended actions",
    acknowledge: "Acknowledge",
    assign: "Assign owner",
    assigneePlaceholder: "Assignee user UUID",
    back: "Back to incidents",
    comment: "Comment",
    disabledBody: "Set VITE_YORSO_API_URL to inspect incident detail from the self-hosted API.",
    disabledTitle: "Self-hosted API is not connected",
    due: "Due",
    errorTitle: "Incident detail could not be loaded",
    evidence: "Evidence",
    escalation: "Escalation",
    exportJson: "Export JSON handoff",
    exportMarkdown: "Export Markdown handoff",
    forbiddenBody: "The backend rejected this session because it does not have the admin role.",
    forbiddenTitle: "Admin role required",
    handoff: "Operator handoff",
    handoffDescription: "Sanitized, bounded operator context for shift changes.",
    handoffReady: "Sanitized handoff ready",
    loading: "Loading incident detail...",
    notePlaceholder: "Operator note, no emails, session ids or secrets",
    noteUnsafe: "Remove raw emails, UUIDs, tokens, passwords or session ids from the operator note.",
    postmortem: "Postmortem draft",
    postmortemDescription: "Executive summary, impact, hypotheses, action items and capacity review for after-action review.",
    postmortemExportJson: "Export JSON postmortem",
    postmortemExportMarkdown: "Export Markdown postmortem",
    postmortemReady: "Postmortem draft ready",
    readiness: "Operator readiness",
    readinessAssigned: "Owner assigned",
    readinessAssignedDetail: "Assign an owner before shift handoff.",
    readinessCapacity: "Capacity review",
    readinessCapacityDetail: "Confirm the incident is control-plane only or document capacity risk.",
    readinessDescription: "Pre-handoff checks for the next operator.",
    readinessEvidence: "Evidence captured",
    readinessEvidenceDetail: "Evidence and timeline are present.",
    readinessHandoff: "Handoff gate",
    readinessNeedsAttention: "Needs attention",
    readinessReady: "Ready",
    readinessRunbook: "Runbook selected",
    readinessRunbookDetail: "Runbook steps are attached.",
    readinessSla: "SLA reviewed",
    readinessSlaDetail: "Escalate breached or at-risk incidents before handoff.",
    refresh: "Refresh detail",
    remediation: "Remediation plan",
    remediationDescription: "Bounded next steps, verification checks, rollback and scale notes.",
    remediationLoad: "Load remediation plan",
    remediationReady: "Remediation plan ready",
    resolve: "Resolve",
    route: "Route",
    runbook: "Runbook",
    sessionBody: "Sign in through the self-hosted auth flow before opening incident detail.",
    sessionCta: "Sign in",
    sessionTitle: "Self-hosted session required",
    snapshot: "Incident snapshot",
    timeline: "Timeline",
    timelineHint: "Hashed actors only. Raw session ids and emails must not appear here.",
    title: "Admin incident detail",
    workflow: "Workflow",
  },
  ru: {
    actions: "Рекомендованные действия",
    acknowledge: "Принять в работу",
    assign: "Назначить ответственного",
    assigneePlaceholder: "UUID ответственного пользователя",
    back: "Назад к инцидентам",
    comment: "Комментарий",
    disabledBody: "Укажите VITE_YORSO_API_URL, чтобы открыть detail инцидента из self-hosted API.",
    disabledTitle: "Self-hosted API не подключен",
    due: "Срок",
    errorTitle: "Detail инцидента не загрузился",
    evidence: "Evidence",
    escalation: "Эскалация",
    exportJson: "Экспорт JSON handoff",
    exportMarkdown: "Экспорт Markdown handoff",
    forbiddenBody: "Backend отклонил сессию, потому что у нее нет роли администратора.",
    forbiddenTitle: "Нужна роль администратора",
    handoff: "Operator handoff",
    handoffDescription: "Очищенный и ограниченный контекст для передачи смены.",
    handoffReady: "Очищенный handoff готов",
    loading: "Загружаем detail инцидента...",
    notePlaceholder: "Заметка оператора, без email, session id и секретов",
    noteUnsafe: "Уберите raw email, UUID, token, password или session id из заметки оператора.",
    postmortem: "Postmortem draft",
    postmortemDescription: "Executive summary, impact, hypotheses, action items и capacity review для разбора после инцидента.",
    postmortemExportJson: "Экспорт JSON postmortem",
    postmortemExportMarkdown: "Экспорт Markdown postmortem",
    postmortemReady: "Postmortem draft готов",
    readiness: "Готовность оператора",
    readinessAssigned: "Ответственный назначен",
    readinessAssignedDetail: "Назначьте ответственного до передачи смены.",
    readinessCapacity: "Capacity review",
    readinessCapacityDetail: "Подтвердите, что инцидент control-plane only, или зафиксируйте риск нагрузки.",
    readinessDescription: "Проверки перед handoff следующему оператору.",
    readinessEvidence: "Evidence собран",
    readinessEvidenceDetail: "Evidence и timeline присутствуют.",
    readinessHandoff: "Handoff gate",
    readinessNeedsAttention: "Требует внимания",
    readinessReady: "Готово",
    readinessRunbook: "Runbook выбран",
    readinessRunbookDetail: "Runbook steps приложены.",
    readinessSla: "SLA проверен",
    readinessSlaDetail: "Инциденты breached или at-risk нужно эскалировать до handoff.",
    refresh: "Обновить detail",
    remediation: "План исправления",
    remediationDescription: "Ограниченные шаги, проверки, rollback и заметки по нагрузке.",
    remediationLoad: "Загрузить план исправления",
    remediationReady: "План исправления готов",
    resolve: "Закрыть",
    route: "Route",
    runbook: "Runbook",
    sessionBody: "Войдите через self-hosted auth flow, чтобы открыть detail инцидента.",
    sessionCta: "Войти",
    sessionTitle: "Нужна self-hosted сессия",
    snapshot: "Incident snapshot",
    timeline: "Timeline",
    timelineHint: "Только хешированные участники. Raw session id и email не должны появляться здесь.",
    title: "Admin incident detail",
    workflow: "Workflow",
  },
  es: {
    actions: "Acciones recomendadas",
    acknowledge: "Reconocer",
    assign: "Asignar responsable",
    assigneePlaceholder: "UUID del usuario responsable",
    back: "Volver a incidentes",
    comment: "Comentario",
    disabledBody: "Define VITE_YORSO_API_URL para abrir el detalle desde la API self-hosted.",
    disabledTitle: "La API self-hosted no está conectada",
    due: "Vence",
    errorTitle: "No se pudo cargar el detalle del incidente",
    evidence: "Evidencia",
    escalation: "Escalación",
    exportJson: "Exportar handoff JSON",
    exportMarkdown: "Exportar handoff Markdown",
    forbiddenBody: "El backend rechazó esta sesión porque no tiene el rol admin.",
    forbiddenTitle: "Se requiere rol admin",
    handoff: "Operator handoff",
    handoffDescription: "Contexto sanitizado y acotado para cambios de turno.",
    handoffReady: "Handoff sanitizado listo",
    loading: "Cargando detalle del incidente...",
    notePlaceholder: "Nota de operador, sin emails, session ids ni secretos",
    noteUnsafe: "Elimina raw emails, UUIDs, tokens, passwords o session ids de la nota.",
    postmortem: "Postmortem draft",
    postmortemDescription: "Executive summary, impacto, hipótesis, action items y revisión de capacidad.",
    postmortemExportJson: "Exportar postmortem JSON",
    postmortemExportMarkdown: "Exportar postmortem Markdown",
    postmortemReady: "Postmortem draft listo",
    readiness: "Preparación del operador",
    readinessAssigned: "Responsable asignado",
    readinessAssignedDetail: "Asigna un responsable antes del cambio de turno.",
    readinessCapacity: "Revisión de capacidad",
    readinessCapacityDetail: "Confirma que el incidente es control-plane only o documenta el riesgo de capacidad.",
    readinessDescription: "Checks previos al handoff para el siguiente operador.",
    readinessEvidence: "Evidencia capturada",
    readinessEvidenceDetail: "Evidencia y timeline presentes.",
    readinessHandoff: "Handoff gate",
    readinessNeedsAttention: "Requiere atención",
    readinessReady: "Listo",
    readinessRunbook: "Runbook seleccionado",
    readinessRunbookDetail: "Runbook steps adjuntos.",
    readinessSla: "SLA revisado",
    readinessSlaDetail: "Escala incidentes breached o at-risk antes del handoff.",
    refresh: "Actualizar detalle",
    remediation: "Plan de remediación",
    remediationDescription: "Pasos acotados, verificaciones, rollback y notas de escala.",
    remediationLoad: "Cargar plan de remediación",
    remediationReady: "Plan de remediación listo",
    resolve: "Resolver",
    route: "Ruta",
    runbook: "Runbook",
    sessionBody: "Inicia sesión mediante el auth flow self-hosted antes de abrir incident detail.",
    sessionCta: "Iniciar sesión",
    sessionTitle: "Se requiere sesión self-hosted",
    snapshot: "Incident snapshot",
    timeline: "Timeline",
    timelineHint: "Solo actores hasheados. Raw session ids y emails no deben aparecer aquí.",
    title: "Admin incident detail",
    workflow: "Workflow",
  },
};

export default function AdminIncidentDetail() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const { lang } = useLanguage();
  const copy = COPY[lang];
  const { session } = useBuyerSession();
  const detail = useAdminIncidentDetail(session, incidentId);
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [escalation, setEscalation] = useState<AdminIncidentEscalationLevel>("engineering");

  const incident = detail.data?.incident ?? null;
  const timeline = detail.data?.timeline ?? [];
  const noteUnsafe = hasUnsafeOperatorNote(note);

  const assign = async () => {
    await detail.workflow({ action: "assign", assignedToUserId: assignee, note });
  };

  const escalate = async () => {
    await detail.workflow({ action: "escalate", escalationLevel: escalation, note });
  };

  const comment = async () => {
    await detail.workflow({ action: "comment", note });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-incident-detail-page">
        <AdminOperatorNav />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" className="w-fit">
            <Link to="/admin/incidents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.back}
            </Link>
          </Button>
          <Button data-testid="admin-incident-detail-refresh" onClick={detail.refresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {copy.refresh}
          </Button>
        </div>

        {detail.status === "disabled" && (
          <Alert data-testid="admin-incident-detail-disabled">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.disabledTitle}</AlertTitle>
            <AlertDescription>{copy.disabledBody}</AlertDescription>
          </Alert>
        )}

        {detail.status === "session_required" && (
          <Alert data-testid="admin-incident-detail-session-required">
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

        {detail.status === "forbidden" && (
          <Alert data-testid="admin-incident-detail-forbidden" variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>{copy.forbiddenTitle}</AlertTitle>
            <AlertDescription>{copy.forbiddenBody}</AlertDescription>
          </Alert>
        )}

        {detail.status === "error" && (
          <Alert data-testid="admin-incident-detail-error" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{detail.error.message}</AlertDescription>
          </Alert>
        )}

        {detail.status === "loading" && !incident && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{copy.loading}</CardContent>
          </Card>
        )}

        {incident && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-6">
              <IncidentHero copy={copy} incident={incident} />
              <IncidentEvidence copy={copy} incident={incident} />
              <IncidentTimeline copy={copy} timeline={timeline} />
            </div>

            <aside className="grid h-fit gap-4 lg:sticky lg:top-6">
              <IncidentReadiness copy={copy} incident={incident} timeline={timeline} />

              <Card data-testid="admin-incident-detail-workflow">
                <CardHeader>
                  <CardTitle>{copy.workflow}</CardTitle>
                  <CardDescription>{copy.notePlaceholder}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Textarea
                    data-testid="admin-incident-detail-note"
                    maxLength={500}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={copy.notePlaceholder}
                    value={note}
                  />
                  {noteUnsafe && (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="admin-incident-detail-note-unsafe">
                      {copy.noteUnsafe}
                    </p>
                  )}
                  <Input
                    data-testid="admin-incident-detail-assignee"
                    onChange={(event) => setAssignee(event.target.value)}
                    placeholder={copy.assigneePlaceholder}
                    value={assignee}
                  />
                  <Select value={escalation} onValueChange={(value) => setEscalation(value as AdminIncidentEscalationLevel)}>
                    <SelectTrigger data-testid="admin-incident-detail-escalation">
                      <SelectValue aria-label={copy.escalation} />
                    </SelectTrigger>
                    <SelectContent>
                      {["lead", "engineering", "executive"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid gap-2">
                    <Button data-testid="admin-incident-detail-assign" disabled={detail.mutating || !assignee.trim() || noteUnsafe} onClick={assign} variant="outline">
                      <UserRoundCheck className="mr-2 h-4 w-4" />
                      {copy.assign}
                    </Button>
                    <Button data-testid="admin-incident-detail-escalate" disabled={detail.mutating || noteUnsafe} onClick={escalate} variant="outline">
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      {copy.escalation}
                    </Button>
                    <Button data-testid="admin-incident-detail-comment" disabled={detail.mutating || !note.trim() || noteUnsafe} onClick={comment} variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {copy.comment}
                    </Button>
                    <Button
                      data-testid="admin-incident-detail-ack"
                      disabled={detail.mutating || incident.status !== "open" || noteUnsafe}
                      onClick={() => detail.acknowledge("acknowledged", note)}
                      variant="outline"
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      {copy.acknowledge}
                    </Button>
                    <Button
                      data-testid="admin-incident-detail-resolve"
                      disabled={detail.mutating || incident.status === "resolved" || noteUnsafe}
                      onClick={() => detail.acknowledge("resolved", note)}
                    >
                      {copy.resolve}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="admin-incident-detail-handoff">
                <CardHeader>
                  <CardTitle>{copy.handoff}</CardTitle>
                  <CardDescription>{copy.handoffDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button data-testid="admin-incident-detail-handoff-json" onClick={() => detail.exportHandoffJson()} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    {copy.exportJson}
                  </Button>
                  <Button data-testid="admin-incident-detail-handoff-markdown" onClick={() => detail.exportHandoffMarkdown()} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    {copy.exportMarkdown}
                  </Button>
                  {detail.handoffStatus && (
                    <p className="text-sm text-muted-foreground" data-testid="admin-incident-detail-handoff-status">
                      {copy.handoffReady}: {detail.handoffStatus}
                    </p>
                  )}
                  {detail.handoffJson && (
                    <div className="rounded-2xl border bg-muted/30 p-3 text-sm" data-testid="admin-incident-detail-handoff-preview">
                      <p className="font-semibold">{detail.handoffJson.handoffId}</p>
                      <p className="mt-1 text-muted-foreground">{detail.handoffJson.sections.map((section) => section.title).join(", ")}</p>
                    </div>
                  )}
                  {detail.handoffMarkdown && (
                    <pre className="max-h-44 overflow-auto rounded-2xl border bg-muted/30 p-3 text-xs" data-testid="admin-incident-detail-handoff-markdown-preview">
                      {detail.handoffMarkdown}
                    </pre>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="admin-incident-detail-remediation">
                <CardHeader>
                  <CardTitle>{copy.remediation}</CardTitle>
                  <CardDescription>{copy.remediationDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button data-testid="admin-incident-detail-remediation-load" onClick={() => detail.loadRemediationPlan()} variant="outline">
                    <Wrench className="mr-2 h-4 w-4" />
                    {copy.remediationLoad}
                  </Button>
                  {detail.remediationStatus && (
                    <p className="text-sm text-muted-foreground" data-testid="admin-incident-detail-remediation-status">
                      {copy.remediationReady}: {detail.remediationStatus}
                    </p>
                  )}
                  {detail.remediationPlan && (
                    <div className="grid gap-3" data-testid="admin-incident-detail-remediation-plan">
                      <div className="rounded-2xl border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Steps</p>
                        <ul className="mt-2 grid gap-2">
                          {detail.remediationPlan.steps.map((step) => (
                            <li className="text-sm" key={`${step.priority}-${step.title}`}>
                              <span className="font-semibold">{step.title}</span>
                              <span className="text-muted-foreground"> · {step.ownerRole} · {step.targetMinutes} min</span>
                              <p className="mt-1 text-muted-foreground">{step.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <ChecklistBlock title="Verification checks" items={detail.remediationPlan.verificationChecks} />
                      <ChecklistBlock title="Rollback plan" items={detail.remediationPlan.rollbackPlan} />
                      <ChecklistBlock title="Capacity notes" items={detail.remediationPlan.capacityNotes} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="admin-incident-detail-postmortem">
                <CardHeader>
                  <CardTitle>{copy.postmortem}</CardTitle>
                  <CardDescription>{copy.postmortemDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button data-testid="admin-incident-detail-postmortem-json" onClick={() => detail.exportPostmortemJson()} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    {copy.postmortemExportJson}
                  </Button>
                  <Button data-testid="admin-incident-detail-postmortem-markdown" onClick={() => detail.exportPostmortemMarkdown()} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    {copy.postmortemExportMarkdown}
                  </Button>
                  {detail.postmortemStatus && (
                    <p className="text-sm text-muted-foreground" data-testid="admin-incident-detail-postmortem-status">
                      {copy.postmortemReady}: {detail.postmortemStatus}
                    </p>
                  )}
                  {detail.postmortemJson && (
                    <div className="grid gap-3 rounded-2xl border bg-muted/30 p-3 text-sm" data-testid="admin-incident-detail-postmortem-preview">
                      <p className="font-semibold">{detail.postmortemJson.postmortemId}</p>
                      <p className="text-muted-foreground">{detail.postmortemJson.executiveSummary}</p>
                      <ChecklistBlock title="Root-cause hypotheses" items={detail.postmortemJson.rootCauseHypotheses} />
                      <ChecklistBlock title="Action items" items={detail.postmortemJson.actionItems.map((item) => item.title)} />
                      <ChecklistBlock title="Prevention checks" items={detail.postmortemJson.preventionChecks} />
                    </div>
                  )}
                  {detail.postmortemMarkdown && (
                    <pre className="max-h-44 overflow-auto rounded-2xl border bg-muted/30 p-3 text-xs" data-testid="admin-incident-detail-postmortem-markdown-preview">
                      {detail.postmortemMarkdown}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

type ReadinessItem = {
  detail: string;
  id: string;
  label: string;
  status: "ready" | "needs_attention";
};

function IncidentReadiness({
  copy,
  incident,
  timeline,
}: {
  copy: DetailCopy;
  incident: AdminIncident;
  timeline: AdminIncidentTimelineEvent[];
}) {
  const items = buildReadinessItems(copy, incident, timeline);
  const readyCount = items.filter((item) => item.status === "ready").length;

  return (
    <Card data-testid="admin-incident-detail-readiness">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{copy.readiness}</CardTitle>
            <CardDescription>{copy.readinessDescription}</CardDescription>
          </div>
          <Badge variant={readyCount === items.length ? "secondary" : "destructive"}>
            {readyCount}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {items.map((item) => (
          <div
            className={cn(
              "rounded-2xl border p-3 text-sm",
              item.status === "ready" ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70",
            )}
            data-testid={`admin-incident-readiness-${item.id}`}
            key={item.label}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{item.label}</p>
              <Badge variant={item.status === "ready" ? "outline" : "secondary"}>
                {item.status === "ready" ? copy.readinessReady : copy.readinessNeedsAttention}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function buildReadinessItems(
  copy: DetailCopy,
  incident: AdminIncident,
  timeline: AdminIncidentTimelineEvent[],
): ReadinessItem[] {
  const hasEvidence = incident.evidence.length > 0 && timeline.length > 0;
  const hasRunbook = incident.runbook.length > 0;
  const hasOwner = Boolean(incident.assignedToUserHash);
  const slaReviewed = incident.slaStatus === "ok" || incident.escalationLevel !== "none" || incident.status === "resolved";
  const capacityReady = incident.source !== "runtime" || incident.severity !== "critical" || incident.escalationLevel !== "none";

  return [
    {
      detail: hasEvidence ? copy.readinessEvidenceDetail : copy.timelineHint,
      id: "evidence",
      label: copy.readinessEvidence,
      status: hasEvidence ? "ready" : "needs_attention",
    },
    {
      detail: hasRunbook ? copy.readinessRunbookDetail : copy.remediationDescription,
      id: "runbook",
      label: copy.readinessRunbook,
      status: hasRunbook ? "ready" : "needs_attention",
    },
    {
      detail: hasOwner ? incident.assignedToUserHash ?? copy.readinessAssignedDetail : copy.readinessAssignedDetail,
      id: "owner",
      label: copy.readinessAssigned,
      status: hasOwner ? "ready" : "needs_attention",
    },
    {
      detail: slaReviewed ? `${incident.slaStatus} · ${incident.escalationLevel}` : copy.readinessSlaDetail,
      id: "sla",
      label: copy.readinessSla,
      status: slaReviewed ? "ready" : "needs_attention",
    },
    {
      detail: capacityReady ? copy.readinessCapacityDetail : `${copy.readinessCapacityDetail} ${copy.readinessHandoff}.`,
      id: "capacity",
      label: copy.readinessCapacity,
      status: capacityReady ? "ready" : "needs_attention",
    },
  ];
}

function IncidentHero({ copy, incident }: { copy: DetailCopy; incident: AdminIncident }) {
  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm" data-testid="admin-incident-detail-hero">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={incident.severity} />
        <Badge variant={incident.status === "open" ? "destructive" : "secondary"}>{incident.status}</Badge>
        <Badge variant="outline">{incident.source}</Badge>
        <Badge variant={incident.slaStatus === "breached" ? "destructive" : "outline"}>SLA: {incident.slaStatus}</Badge>
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{incident.title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{incident.description}</p>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3" data-testid="admin-incident-detail-snapshot">
        <SnapshotItem label={copy.due} value={new Date(incident.dueAt).toLocaleString()} />
        <SnapshotItem label={copy.route} value={incident.route ?? "none"} />
        <SnapshotItem label={copy.escalation} value={incident.escalationLevel} />
        <SnapshotItem label={copy.assign} value={incident.assignedToUserHash ?? "none"} />
      </div>
    </section>
  );
}

function IncidentEvidence({ copy, incident }: { copy: DetailCopy; incident: AdminIncident }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card data-testid="admin-incident-detail-evidence">
        <CardHeader>
          <CardTitle>{copy.evidence}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {incident.evidence.map((item) => (
            <div className="rounded-2xl border bg-background p-3 text-sm" key={`${incident.id}-${item.label}`}>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
              <p className="mt-1 break-words font-medium">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-testid="admin-incident-detail-runbook">
        <CardHeader>
          <CardTitle>{copy.runbook}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {incident.runbook.map((step) => (
            <div className="rounded-2xl border bg-background p-3 text-sm" key={`${incident.id}-${step.label}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{step.ownerRole}</Badge>
                <span className="text-xs text-muted-foreground">{step.targetMinutes} min</span>
              </div>
              <p className="mt-2 font-semibold">{step.label}</p>
              <p className="mt-1 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2" data-testid="admin-incident-detail-actions">
        <CardHeader>
          <CardTitle>{copy.actions}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2">
            {incident.recommendedActions.map((action) => (
              <li className="flex gap-2 text-sm text-muted-foreground" key={action}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function IncidentTimeline({ copy, timeline }: { copy: DetailCopy; timeline: AdminIncidentTimelineEvent[] }) {
  return (
    <Card data-testid="admin-incident-detail-timeline">
      <CardHeader>
        <CardTitle>{copy.timeline}</CardTitle>
        <CardDescription>{copy.timelineHint}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3">
          {timeline.map((event) => (
            <li className="rounded-2xl border bg-background p-3 text-sm" key={event.eventId}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{event.type}</Badge>
                {event.status && <Badge variant="secondary">{event.status}</Badge>}
                <span className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</span>
              </div>
              {event.note && <p className="mt-2 text-muted-foreground">{event.note}</p>}
              {event.actorUserHash && <p className="mt-2 text-xs text-muted-foreground">{event.actorUserHash}</p>}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ChecklistBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li className="flex gap-2 text-muted-foreground" key={item}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-semibold">{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AdminIncidentSeverity }) {
  return (
    <Badge
      className={cn(
        severity === "critical" && "bg-red-600 text-white hover:bg-red-600",
        severity === "high" && "bg-orange-500 text-white hover:bg-orange-500",
        severity === "medium" && "bg-amber-100 text-amber-800 hover:bg-amber-100",
        severity === "low" && "bg-slate-100 text-slate-700 hover:bg-slate-100",
      )}
    >
      {severity}
    </Badge>
  );
}

function hasUnsafeOperatorNote(value: string) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) ||
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(value) ||
    /\b(session|token|secret|password)\s*[:=]\s*\S+/i.test(value);
}
