/**
 * P7 dictionary — limited pilot notice, help, feedback (customer) and the
 * service-only pilot summary and decision (RU / EN / ES).
 */
import type { ProtoLang } from "./copy";

export type P7DecisionKey = "stop" | "continue" | "expand";

export const P7_DECISIONS: P7DecisionKey[] = ["stop", "continue", "expand"];

export type P7Dict = {
  pilotTitle: string;
  pilotBody: string;
  getHelp: string;
  addFeedback: string;
  helpTitle: string;
  helpNotice: string;
  helpContactLabel: string;
  helpHoursLabel: string;
  feedbackTitle: string;
  feedbackLabel: string;
  feedbackHint: string;
  feedbackRequired: string;
  save: string;
  cancel: string;
  close: string;
  feedbackSaved: string;
  serviceTabPilot: string;
  pilotSummaryTitle: string;
  companies: string;
  users: string;
  feedbackEntries: string;
  incidents: string;
  openIncidents: string;
  limitations: string;
  participants: string;
  decisionLabel: string;
  decisions: Record<P7DecisionKey, string>;
  reasonLabel: string;
  recordedReasonLabel: string;
  serviceDataNotice: string;
  reasonRequired: string;
  recordDecision: string;
  recordDecisionTitle: string;
  recordDecisionBody: string;
  confirm: string;
  decisionRecorded: string;
};

const ru: P7Dict = {
  pilotTitle: "Пилотный доступ",
  pilotBody:
    "Ваша компания участвует в ограниченном запуске этого раздела. Доступные возможности могут меняться.",
  getHelp: "Получить помощь",
  addFeedback: "Оставить отзыв",
  helpTitle: "Помощь по пилотному доступу",
  helpNotice: "Это сведения на этой странице. Обращение не создаётся.",
  helpContactLabel: "Ответственный за пилотный доступ",
  helpHoursLabel: "Часы работы",
  feedbackTitle: "Оставить отзыв",
  feedbackLabel: "Текст отзыва",
  feedbackHint: "Опишите, что работает и что мешает работе.",
  feedbackRequired: "Введите текст отзыва.",
  save: "Сохранить",
  cancel: "Отменить",
  close: "Закрыть",
  feedbackSaved: "Отзыв добавлен на этой странице и не будет сохранён после закрытия.",
  serviceTabPilot: "Пилот",
  pilotSummaryTitle: "Пилот",
  companies: "Компании",
  users: "Пользователи",
  feedbackEntries: "Записи отзывов",
  incidents: "Происшествия",
  openIncidents: "Открытые происшествия",
  limitations: "Известные ограничения",
  participants: "Участники",
  decisionLabel: "Решение по пилоту",
  decisions: { stop: "Остановить", continue: "Продолжить", expand: "Расширить" },
  reasonLabel: "Обоснование",
  recordedReasonLabel: "Зафиксированное обоснование",
  serviceDataNotice: "Проверочные данные для согласования интерфейса.",
  reasonRequired: "Укажите обоснование.",
  recordDecision: "Записать решение",
  recordDecisionTitle: "Записать решение по пилоту",
  recordDecisionBody: "Решение записывается только на этой странице и не изменяет действующий доступ.",
  confirm: "Подтвердить",
  decisionRecorded: "Решение записано на этой странице. Действующий доступ не изменён.",
};

const en: P7Dict = {
  pilotTitle: "Pilot access",
  pilotBody:
    "Your company takes part in a limited launch of this section. The available capabilities may change.",
  getHelp: "Get help",
  addFeedback: "Add feedback",
  helpTitle: "Help with pilot access",
  helpNotice: "This is information on this page. No request is created.",
  helpContactLabel: "Responsible for pilot access",
  helpHoursLabel: "Working hours",
  feedbackTitle: "Add feedback",
  feedbackLabel: "Feedback text",
  feedbackHint: "Describe what works and what gets in the way.",
  feedbackRequired: "Enter the feedback text.",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  feedbackSaved: "The feedback was added on this page and will not be saved after closing.",
  serviceTabPilot: "Pilot",
  pilotSummaryTitle: "Pilot",
  companies: "Companies",
  users: "Users",
  feedbackEntries: "Feedback entries",
  incidents: "Incidents",
  openIncidents: "Open incidents",
  limitations: "Known limitations",
  participants: "Participants",
  decisionLabel: "Pilot decision",
  decisions: { stop: "Stop", continue: "Continue", expand: "Expand" },
  reasonLabel: "Reason",
  recordedReasonLabel: "Recorded reason",
  serviceDataNotice: "Check data for interface review.",
  reasonRequired: "Enter a reason.",
  recordDecision: "Record the decision",
  recordDecisionTitle: "Record the pilot decision",
  recordDecisionBody: "The decision is recorded on this page only and does not change current access.",
  confirm: "Confirm",
  decisionRecorded: "The decision was recorded on this page. Current access was not changed.",
};

const es: P7Dict = {
  pilotTitle: "Acceso piloto",
  pilotBody:
    "Su empresa participa en un lanzamiento limitado de esta sección. Las capacidades disponibles pueden cambiar.",
  getHelp: "Obtener ayuda",
  addFeedback: "Añadir comentario",
  helpTitle: "Ayuda con el acceso piloto",
  helpNotice: "Esta es información en esta página. No se crea ninguna solicitud.",
  helpContactLabel: "Responsable del acceso piloto",
  helpHoursLabel: "Horario",
  feedbackTitle: "Añadir comentario",
  feedbackLabel: "Texto del comentario",
  feedbackHint: "Describa qué funciona y qué dificulta el trabajo.",
  feedbackRequired: "Escriba el texto del comentario.",
  save: "Guardar",
  cancel: "Cancelar",
  close: "Cerrar",
  feedbackSaved: "El comentario se ha añadido en esta página y no se guardará después de cerrarla.",
  serviceTabPilot: "Piloto",
  pilotSummaryTitle: "Piloto",
  companies: "Empresas",
  users: "Usuarios",
  feedbackEntries: "Comentarios registrados",
  incidents: "Incidencias",
  openIncidents: "Incidencias abiertas",
  limitations: "Limitaciones conocidas",
  participants: "Participantes",
  decisionLabel: "Decisión del piloto",
  decisions: { stop: "Detener", continue: "Continuar", expand: "Ampliar" },
  reasonLabel: "Motivo",
  recordedReasonLabel: "Motivo registrado",
  serviceDataNotice: "Datos de comprobación para la revisión de la interfaz.",
  reasonRequired: "Indique el motivo.",
  recordDecision: "Registrar la decisión",
  recordDecisionTitle: "Registrar la decisión del piloto",
  recordDecisionBody: "La decisión se registra solo en esta página y no cambia el acceso actual.",
  confirm: "Confirmar",
  decisionRecorded: "La decisión se registró en esta página. El acceso actual no cambió.",
};

export const protoP7Copy: Record<ProtoLang, P7Dict> = { ru, en, es };
