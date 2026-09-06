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
  backupLocation: string;
  backupLocationValue: string;
  backupTransferState: string;
  backupTransferStateValue: string;
  backupAvailability: string;
  backupAvailabilityValue: string;
  drillTitle: string;
  drillHint: string;
  drillFirstLabel: string;
  drillSecondLabel: string;
  drillFirstConfirm: string;
  drillSecondConfirm: string;
  drillFirstRecorded: string;
  drillDone: string;
  drillSameBlocked: string;
  drillIdentities: string;
  serviceDataNotice: string;
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
  readinessCounts: "Проверок: {total} — успешно {pass}, предупреждение {warning}, блокирующая {blocker}",
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
  backupVerificationValue: "Проверена по контрольной сумме",
  backupAge: "Возраст копии",
  backupAgeValue: "1 час 20 минут",
  backupRetention: "Срок хранения",
  backupRetentionValue: "Ежедневно 14 дней, ежемесячно 6 месяцев",
  backupLocation: "Место хранения",
  backupLocationValue: "Удалённый сервер Synology",
  backupTransferState: "Состояние передачи",
  backupTransferStateValue: "Ожидает проверки",
  backupAvailability: "Доступность копии",
  backupAvailabilityValue: "Не измерено",
  drillTitle: "Учебное восстановление",
  drillHint: "Требуется подтверждение двух разных служебных сотрудников.",
  drillFirstLabel: "Первое подтверждение",
  drillSecondLabel: "Второе подтверждение",
  drillFirstConfirm: "Подтвердить первым",
  drillSecondConfirm: "Подтвердить вторым",
  drillFirstRecorded: "Первое подтверждение записано на этой странице: {name}.",
  drillDone: "Подтверждения записаны на этой странице. Восстановление данных не выполнялось.",
  drillSameBlocked: "Второй сотрудник должен отличаться от первого.",
  drillIdentities: "Подтвердившие сотрудники",
  serviceDataNotice: "Проверочные данные для согласования интерфейса.",
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
    recoveryPoint: "15 минут",
    recoveryTime: "4 часа",
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
  readinessCounts: "Checks: {total} — {pass} pass, {warning} warning, {blocker} blocker",
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
  backupVerificationValue: "Verified by checksum",
  backupAge: "Backup age",
  backupAgeValue: "1 hour 20 minutes",
  backupRetention: "Retention",
  backupRetentionValue: "Daily for 14 days, monthly for 6 months",
  backupLocation: "Storage location",
  backupLocationValue: "Remote Synology server",
  backupTransferState: "Transfer state",
  backupTransferStateValue: "Awaiting verification",
  backupAvailability: "Backup availability",
  backupAvailabilityValue: "Not measured",
  drillTitle: "Recovery drill",
  drillHint: "Confirmation by two different service employees is required.",
  drillFirstLabel: "First confirmation",
  drillSecondLabel: "Second confirmation",
  drillFirstConfirm: "Confirm as first",
  drillSecondConfirm: "Confirm as second",
  drillFirstRecorded: "The first confirmation was recorded on this page: {name}.",
  drillDone: "The confirmations were recorded on this page. No data recovery was performed.",
  drillSameBlocked: "The second employee must differ from the first.",
  drillIdentities: "Confirming employees",
  serviceDataNotice: "Check data for interface review.",
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
    recoveryPoint: "15 minutes",
    recoveryTime: "4 hours",
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
  readinessCounts: "Comprobaciones: {total} — {pass} correctas, {warning} advertencia, {blocker} bloqueante",
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
  backupVerificationValue: "Verificada por suma de comprobación",
  backupAge: "Antigüedad de la copia",
  backupAgeValue: "1 hora 20 minutos",
  backupRetention: "Conservación",
  backupRetentionValue: "Diaria 14 días, mensual 6 meses",
  backupLocation: "Lugar de almacenamiento",
  backupLocationValue: "Servidor Synology remoto",
  backupTransferState: "Estado de la transferencia",
  backupTransferStateValue: "Pendiente de verificación",
  backupAvailability: "Disponibilidad de la copia",
  backupAvailabilityValue: "No medido",
  drillTitle: "Recuperación de prueba",
  drillHint: "Se requiere la confirmación de dos empleados de servicio distintos.",
  drillFirstLabel: "Primera confirmación",
  drillSecondLabel: "Segunda confirmación",
  drillFirstConfirm: "Confirmar como primero",
  drillSecondConfirm: "Confirmar como segundo",
  drillFirstRecorded: "La primera confirmación se registró en esta página: {name}.",
  drillDone: "Las confirmaciones se registraron en esta página. No se realizó ninguna recuperación de datos.",
  drillSameBlocked: "El segundo empleado debe ser distinto del primero.",
  drillIdentities: "Empleados que confirmaron",
  serviceDataNotice: "Datos de comprobación para la revisión de la interfaz.",
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
    recoveryPoint: "15 minutos",
    recoveryTime: "4 horas",
    load: "10 000 usuarios simultáneos",
  },
};

export const protoP6Copy: Record<ProtoLang, P6Dict> = { ru, en, es };
