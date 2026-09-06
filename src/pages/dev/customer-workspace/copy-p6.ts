/**
 * P6 dictionary — operations, update readiness, backup and recovery (RU/EN/ES).
 * Customer side only ever sees one neutral temporary state.
 */
import type { ProtoLang } from "./copy";

export type P6QueueKey =
  | "completed"
  | "waiting"
  | "processing"
  | "retryScheduled"
  | "exhausted";

export type P6Dict = {
  /** Neutral customer-facing temporary state. */
  customerUnavailable: string;
  serviceTabOperations: string;
  operationsTitle: string;
  queueTitle: string;
  queueTotal: string;
  queueStatuses: Record<P6QueueKey, string>;
  queueOldest: string;
  queueOldestValue: string;
  alertsTitle: string;
  alertColumns: { id: string; responsible: string; age: string; reason: string };
  scheduleRetry: string;
  scheduleRetryTitle: string;
  scheduleRetryBody: string;
  reasonLabel: string;
  reasonRequired: string;
  confirm: string;
  cancel: string;
  scheduledNote: string;
  readinessTitle: string;
  readinessCounts: string;
  checkStatuses: { pass: string; warning: string; blocker: string };
  candidateVersion: string;
  currentVersion: string;
  changeSummary: string;
  changeSummaryValue: string;
  backupPrerequisite: string;
  backupPrerequisiteValue: string;
  rollbackPlan: string;
  rollbackPlanValue: string;
  updateNotApproved: string;
  backupTitle: string;
  backupId: string;
  backupScope: string;
  backupScopeValue: string;
  backupVerification: string;
  backupVerificationValue: string;
  backupAge: string;
  backupAgeValue: string;
  backupRetention: string;
  backupRetentionValue: string;
  drillTitle: string;
  drillHint: string;
  drillFirstLabel: string;
  drillSecondLabel: string;
  drillFirstConfirm: string;
  drillSecondConfirm: string;
  drillFirstRecorded: string;
  drillDone: string;
  drillSameBlocked: string;
  targetsTitle: string;
  targetColumns: { metric: string; target: string; status: string };
  targetStatus: string;
  targets: {
    availability: string;
    warning: string;
    processingDelay: string;
    recoveryPoint: string;
    recoveryTime: string;
    load: string;
  };
  targetValues: {
    availability: string;
    warning: string;
    processingDelay: string;
    recoveryPoint: string;
    recoveryTime: string;
    load: string;
  };
};

const ru: P6Dict = {
  customerUnavailable:
    "Часть данных временно недоступна. Повторите попытку позже или продолжите работу в другом разделе.",
  serviceTabOperations: "Эксплуатация",
  operationsTitle: "Эксплуатация",
  queueTitle: "Очередь обработки",
  queueTotal: "Всего задач",
  queueStatuses: {
    completed: "Завершено",
    waiting: "Ожидает",
    processing: "В обработке",
    retryScheduled: "Повтор запланирован",
    exhausted: "Попытки исчерпаны",
  },
  queueOldest: "Самая старая задача",
  queueOldestValue: "34 минуты",
  alertsTitle: "Оповещения",
  alertColumns: { id: "Идентификатор", responsible: "Ответственный сотрудник", age: "Возраст", reason: "Причина" },
  scheduleRetry: "Запланировать повтор",
  scheduleRetryTitle: "Запланировать повтор",
  scheduleRetryBody: "Укажите причину. Отметка действует только на этой странице.",
  reasonLabel: "Причина",
  reasonRequired: "Укажите причину.",
  confirm: "Подтвердить",
  cancel: "Отменить",
  scheduledNote: "Повтор отмечен на этой странице.",
  readinessTitle: "Готовность обновления",
  readinessCounts: "Проверок: 8 — успешно 6, предупреждение 1, блокирующая 1",
  checkStatuses: { pass: "Успешно", warning: "Предупреждение", blocker: "Блокирующая" },
  candidateVersion: "Проверяемая версия",
  currentVersion: "Текущая версия",
  changeSummary: "Состав изменений",
  changeSummaryValue: "Обработка очереди, отчёты, устойчивость восстановления",
  backupPrerequisite: "Обязательное условие: резервная копия",
  backupPrerequisiteValue: "Требуется проверенная копия не старше 24 часов",
  rollbackPlan: "План возврата",
  rollbackPlanValue: "Возврат на текущую версию из последней проверенной копии",
  updateNotApproved: "Обновление не согласовано",
  backupTitle: "Реестр резервных копий",
  backupId: "Идентификатор копии",
  backupScope: "Состав",
  backupScopeValue: "База данных и файлы",
  backupVerification: "Проверка копии",
  backupVerificationValue: "Проверена, чтение восстановлено выборочно",
  backupAge: "Возраст копии",
  backupAgeValue: "1 час 20 минут",
  backupRetention: "Срок хранения",
  backupRetentionValue: "Ежедневно 14 дней, ежемесячно 6 месяцев",
  drillTitle: "Учебное восстановление",
  drillHint: "Требуется подтверждение двух разных служебных сотрудников.",
  drillFirstLabel: "Первое подтверждение",
  drillSecondLabel: "Второе подтверждение",
  drillFirstConfirm: "Подтвердить первым",
  drillSecondConfirm: "Подтвердить вторым",
  drillFirstRecorded: "Первое подтверждение записано на этой странице: {name}.",
  drillDone: "Учебное восстановление подтверждено на этой странице. Восстановление данных не выполнялось.",
  drillSameBlocked: "Второй сотрудник должен отличаться от первого.",
  targetsTitle: "Целевые показатели",
  targetColumns: { metric: "Показатель", target: "Цель", status: "Состояние" },
  targetStatus: "Цель — не измерено",
  targets: {
    availability: "Доступность",
    warning: "Время до оповещения",
    processingDelay: "Задержка обработки",
    recoveryPoint: "Точка восстановления",
    recoveryTime: "Время восстановления",
    load: "Нагрузка",
  },
  targetValues: {
    availability: "99,9%",
    warning: "5 минут",
    processingDelay: "30 минут",
    recoveryPoint: "4 часа",
    recoveryTime: "15 минут",
    load: "10 000 одновременных пользователей",
  },
};

const en: P6Dict = {
  customerUnavailable:
    "Some data is temporarily unavailable. Try again later or continue in another section.",
  serviceTabOperations: "Operations",
  operationsTitle: "Operations",
  queueTitle: "Processing queue",
  queueTotal: "Total tasks",
  queueStatuses: {
    completed: "Completed",
    waiting: "Waiting",
    processing: "Processing",
    retryScheduled: "Retry scheduled",
    exhausted: "Attempts exhausted",
  },
  queueOldest: "Oldest task",
  queueOldestValue: "34 minutes",
  alertsTitle: "Alerts",
  alertColumns: { id: "Identifier", responsible: "Responsible employee", age: "Age", reason: "Reason" },
  scheduleRetry: "Schedule retry",
  scheduleRetryTitle: "Schedule retry",
  scheduleRetryBody: "Enter a reason. The mark applies on this page only.",
  reasonLabel: "Reason",
  reasonRequired: "Enter a reason.",
  confirm: "Confirm",
  cancel: "Cancel",
  scheduledNote: "The retry was marked on this page.",
  readinessTitle: "Update readiness",
  readinessCounts: "Checks: 8 — 6 pass, 1 warning, 1 blocker",
  checkStatuses: { pass: "Pass", warning: "Warning", blocker: "Blocker" },
  candidateVersion: "Candidate version",
  currentVersion: "Current version",
  changeSummary: "Change summary",
  changeSummaryValue: "Queue processing, reports, recovery resilience",
  backupPrerequisite: "Prerequisite: backup",
  backupPrerequisiteValue: "A verified backup no older than 24 hours is required",
  rollbackPlan: "Rollback plan",
  rollbackPlanValue: "Return to the current version from the latest verified backup",
  updateNotApproved: "Update is not approved",
  backupTitle: "Backup register",
  backupId: "Backup identifier",
  backupScope: "Scope",
  backupScopeValue: "Database and files",
  backupVerification: "Backup verification",
  backupVerificationValue: "Verified, sample read restored",
  backupAge: "Backup age",
  backupAgeValue: "1 hour 20 minutes",
  backupRetention: "Retention",
  backupRetentionValue: "Daily for 14 days, monthly for 6 months",
  drillTitle: "Recovery drill",
  drillHint: "Confirmation by two different service employees is required.",
  drillFirstLabel: "First confirmation",
  drillSecondLabel: "Second confirmation",
  drillFirstConfirm: "Confirm as first",
  drillSecondConfirm: "Confirm as second",
  drillFirstRecorded: "The first confirmation was recorded on this page: {name}.",
  drillDone: "The recovery drill was confirmed on this page. No data recovery was performed.",
  drillSameBlocked: "The second employee must differ from the first.",
  targetsTitle: "Targets",
  targetColumns: { metric: "Metric", target: "Target", status: "State" },
  targetStatus: "Target — not measured",
  targets: {
    availability: "Availability",
    warning: "Time to alert",
    processingDelay: "Processing delay",
    recoveryPoint: "Recovery point",
    recoveryTime: "Recovery time",
    load: "Load",
  },
  targetValues: {
    availability: "99.9%",
    warning: "5 minutes",
    processingDelay: "30 minutes",
    recoveryPoint: "4 hours",
    recoveryTime: "15 minutes",
    load: "10,000 concurrent users",
  },
};

const es: P6Dict = {
  customerUnavailable:
    "Algunos datos no están disponibles temporalmente. Inténtelo más tarde o continúe en otra sección.",
  serviceTabOperations: "Operaciones",
  operationsTitle: "Operaciones",
  queueTitle: "Cola de procesamiento",
  queueTotal: "Tareas totales",
  queueStatuses: {
    completed: "Finalizadas",
    waiting: "En espera",
    processing: "En proceso",
    retryScheduled: "Reintento programado",
    exhausted: "Intentos agotados",
  },
  queueOldest: "Tarea más antigua",
  queueOldestValue: "34 minutos",
  alertsTitle: "Avisos",
  alertColumns: { id: "Identificador", responsible: "Empleado responsable", age: "Antigüedad", reason: "Motivo" },
  scheduleRetry: "Programar el reintento",
  scheduleRetryTitle: "Programar el reintento",
  scheduleRetryBody: "Indique el motivo. La marca solo se aplica en esta página.",
  reasonLabel: "Motivo",
  reasonRequired: "Indique el motivo.",
  confirm: "Confirmar",
  cancel: "Cancelar",
  scheduledNote: "El reintento se marcó en esta página.",
  readinessTitle: "Preparación de la actualización",
  readinessCounts: "Comprobaciones: 8 — 6 correctas, 1 advertencia, 1 bloqueante",
  checkStatuses: { pass: "Correcta", warning: "Advertencia", blocker: "Bloqueante" },
  candidateVersion: "Versión candidata",
  currentVersion: "Versión actual",
  changeSummary: "Resumen de cambios",
  changeSummaryValue: "Procesamiento de la cola, informes, resistencia de la recuperación",
  backupPrerequisite: "Requisito previo: copia de seguridad",
  backupPrerequisiteValue: "Se requiere una copia verificada de menos de 24 horas",
  rollbackPlan: "Plan de reversión",
  rollbackPlanValue: "Volver a la versión actual desde la última copia verificada",
  updateNotApproved: "La actualización no está aprobada",
  backupTitle: "Registro de copias de seguridad",
  backupId: "Identificador de la copia",
  backupScope: "Alcance",
  backupScopeValue: "Base de datos y archivos",
  backupVerification: "Verificación de la copia",
  backupVerificationValue: "Verificada, lectura de muestra restaurada",
  backupAge: "Antigüedad de la copia",
  backupAgeValue: "1 hora 20 minutos",
  backupRetention: "Conservación",
  backupRetentionValue: "Diaria 14 días, mensual 6 meses",
  drillTitle: "Recuperación de prueba",
  drillHint: "Se requiere la confirmación de dos empleados de servicio distintos.",
  drillFirstLabel: "Primera confirmación",
  drillSecondLabel: "Segunda confirmación",
  drillFirstConfirm: "Confirmar como primero",
  drillSecondConfirm: "Confirmar como segundo",
  drillFirstRecorded: "La primera confirmación se registró en esta página: {name}.",
  drillDone: "La recuperación de prueba se confirmó en esta página. No se recuperaron datos.",
  drillSameBlocked: "El segundo empleado debe ser distinto del primero.",
  targetsTitle: "Objetivos",
  targetColumns: { metric: "Métrica", target: "Objetivo", status: "Estado" },
  targetStatus: "Objetivo — no medido",
  targets: {
    availability: "Disponibilidad",
    warning: "Tiempo hasta el aviso",
    processingDelay: "Retraso de procesamiento",
    recoveryPoint: "Punto de recuperación",
    recoveryTime: "Tiempo de recuperación",
    load: "Carga",
  },
  targetValues: {
    availability: "99,9 %",
    warning: "5 minutos",
    processingDelay: "30 minutos",
    recoveryPoint: "4 horas",
    recoveryTime: "15 minutos",
    load: "10 000 usuarios simultáneos",
  },
};

export const protoP6Copy: Record<ProtoLang, P6Dict> = { ru, en, es };
