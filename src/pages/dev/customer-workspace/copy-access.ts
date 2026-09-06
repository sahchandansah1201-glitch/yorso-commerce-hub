/**
 * P1 + P2 prototype dictionary (RU / EN / ES) — service review, employees and
 * access, plus the local sign-in / safe-return demo states.
 *
 * Local to the prototype route on purpose: the global i18n contract is not
 * touched. Wording keeps YORSO as the only visible system: no service names,
 * no words about transition or synchronization, no addresses, ports or keys.
 */
import type { ProtoLang } from "./copy";

export type CapabilityStatusKey =
  | "available"
  | "requiresVerification"
  | "requiresAnotherEdition"
  | "deferred"
  | "prohibited";

export type ServiceDecisionKey = "continueReview" | "pause" | "doNotUse";

export type EmployeesTabKey = "employees" | "invitations" | "ownership";

export type EmployeeActionKey =
  | "invite"
  | "changeRole"
  | "closeAccess"
  | "transferOwnership"
  | "leaveCompany";

type AccessDict = {
  // P1 — service review
  serviceScreenTitle: string;
  serviceScreenHint: string;
  readinessTitle: string;
  readinessFields: {
    edition: string;
    license: string;
    lastReview: string;
    ownerDecision: string;
  };
  editionValue: string;
  editionStatus: string;
  licenseValue: string;
  lastReviewValue: string;
  ownerDecisionPending: string;
  decisionLabel: string;
  decisions: Record<ServiceDecisionKey, string>;
  capabilityColumns: {
    feature: string;
    status: string;
    limitation: string;
    risk: string;
    decision: string;
  };
  capabilityStatuses: Record<CapabilityStatusKey, string>;
  recordDecision: string;
  recordDecisionTitle: string;
  recordDecisionBody: string;
  recordDecisionConfirm: string;
  decisionRecordedNote: string;
  accessReviewTitle: string;
  accessChecks: {
    companyFound: string;
    rulesApplied: string;
    revocation: string;
    contentHidden: string;
  };
  checkPassed: string;
  checkRequiresReview: string;

  // P2 — employees and access
  employeesTabs: Record<EmployeesTabKey, string>;
  employeesTabsLabel: string;
  employeeActions: Record<EmployeeActionKey, string>;
  employeeColumns: {
    name: string;
    role: string;
    status: string;
    since: string;
  };
  ownRecordTitle: string;
  ownRecordHint: string;
  ownRecordRole: string;
  invitationsHint: string;
  invitationColumns: { name: string; role: string; status: string; addedAt: string };
  invitationPending: string;
  ownershipTitle: string;
  ownershipHint: string;
  ownershipOwnerNote: string;
  ownershipAdminNote: string;
  ownershipNoRight: string;
  firstRegistrantNote: string;
  noEmployeeList: string;
  confirmTitles: Record<EmployeeActionKey, string>;
  confirmBodies: Record<EmployeeActionKey, string>;
  confirm: string;
  cancel: string;
  actionRecorded: string;
  inviteEmailLabel: string;
  inviteRoleLabel: string;
  employeeTargetLabel: string;
  newRoleLabel: string;
  selectPlaceholder: string;
  inviteEmailInvalid: string;
  confirmSelection: string;
  invitedResult: string;
  roleChangedResult: string;
  accessClosedResult: string;

  // Revoked access + sign-in demo
  accessClosedTitle: string;
  accessClosedBody: string;
  returnToSignIn: string;
  signInTitle: string;
  signInReturnHint: string;
  returnToSectionTemplate: string;
  signInAction: string;
  checkingAccess: string;
  sessionEnded: string;
  continueLabel: string;
  noAccess: string;
  accessClosedShort: string;
  backLabel: string;
};

const ru: AccessDict = {
  serviceScreenTitle: "Служебная проверка",
  serviceScreenHint: "Закрытый экран. Записи компаний и содержимое клиентов здесь не показываются.",
  readinessTitle: "Готовность возможностей",
  readinessFields: {
    edition: "Рассматриваемая редакция",
    license: "Лицензия",
    lastReview: "Последний обзор",
    ownerDecision: "Решение владельца",
  },
  editionValue: "Редакция-кандидат 2.6.0",
  editionStatus: "Требует решения",
  licenseValue: "Не согласована",
  lastReviewValue: "6 сентября 2026, 14:20",
  ownerDecisionPending: "Решение не выбрано",
  decisionLabel: "Решение по обзору",
  decisions: {
    continueReview: "Продолжить проверку",
    pause: "Приостановить",
    doNotUse: "Не использовать",
  },
  capabilityColumns: {
    feature: "Возможность",
    status: "Состояние",
    limitation: "Ограничение",
    risk: "Риск",
    decision: "Решение",
  },
  capabilityStatuses: {
    available: "Доступно",
    requiresVerification: "Требует проверки",
    requiresAnotherEdition: "Требует другой редакции",
    deferred: "Отложено",
    prohibited: "Запрещено",
  },
  recordDecision: "Записать решение",
  recordDecisionTitle: "Записать решение по обзору",
  recordDecisionBody:
    "Решение действует только на этой странице и не означает согласования редакции или лицензии.",
  recordDecisionConfirm: "Записать",
  decisionRecordedNote: "Решение записано. Редакция и лицензия остаются несогласованными.",
  accessReviewTitle: "Обзор доступа",
  accessChecks: {
    companyFound: "Компания найдена",
    rulesApplied: "Правила доступа применены",
    revocation: "Отзыв доступа",
    contentHidden: "Содержимое записей скрыто",
  },
  checkPassed: "Подтверждено",
  checkRequiresReview: "Требует обзора",

  employeesTabs: {
    employees: "Сотрудники",
    invitations: "Приглашения",
    ownership: "Передача владения",
  },
  employeesTabsLabel: "Разделы сотрудников",
  employeeActions: {
    invite: "Пригласить сотрудника",
    changeRole: "Изменить роль",
    closeAccess: "Закрыть доступ",
    transferOwnership: "Передать владение",
    leaveCompany: "Покинуть компанию",
  },
  employeeColumns: { name: "Сотрудник", role: "Роль", status: "Статус", since: "В компании с" },
  ownRecordTitle: "Ваша запись",
  ownRecordHint: "Вы видите только свою запись и роль.",
  ownRecordRole: "Ваша роль",
  invitationsHint: "Приглашения находятся в списке на этой странице.",
  invitationColumns: { name: "Приглашённый", role: "Роль", status: "Статус", addedAt: "Добавлено" },
  invitationPending: "Добавлено в список",
  ownershipTitle: "Передача владения",
  ownershipHint: "Владение передаётся одному сотруднику компании.",
  ownershipOwnerNote: "Покинуть компанию можно только после передачи владения.",
  ownershipAdminNote: "Передавать владение может только владелец компании.",
  ownershipNoRight: "У вашей роли нет этого действия.",
  firstRegistrantNote: "Первый зарегистрировавшийся сотрудник показан как владелец.",
  noEmployeeList: "Список сотрудников доступен владельцу и администратору.",
  confirmTitles: {
    invite: "Пригласить сотрудника",
    changeRole: "Изменить роль сотрудника",
    closeAccess: "Закрыть доступ сотруднику",
    transferOwnership: "Передать владение компанией",
    leaveCompany: "Покинуть компанию",
  },
  confirmBodies: {
    invite: "Укажите электронную почту и роль. Приглашение появится в списке на этой странице.",
    changeRole: "Права сотрудника изменятся сразу после подтверждения.",
    closeAccess: "Сотрудник потеряет доступ к записям компании.",
    transferOwnership: "После передачи вы останетесь администратором компании.",
    leaveCompany: "Вы потеряете доступ к записям этой компании.",
  },
  confirm: "Подтвердить",
  cancel: "Отмена",
  actionRecorded: "Действие выполнено.",
  inviteEmailLabel: "Электронная почта",
  inviteRoleLabel: "Роль приглашённого",
  employeeTargetLabel: "Сотрудник",
  newRoleLabel: "Новая роль",
  selectPlaceholder: "Выберите значение",
  inviteEmailInvalid: "Укажите электронную почту.",
  confirmSelection: "Выбрано",
  invitedResult: "Приглашение для {name} добавлено в список на этой странице.",
  roleChangedResult: "Роль изменена: {name} · {role}.",
  accessClosedResult: "Доступ закрыт: {name}.",

  accessClosedTitle: "Доступ к компании закрыт",
  accessClosedBody: "Записи и действия компании больше не показываются.",
  returnToSignIn: "Вернуться ко входу",
  signInTitle: "Вход в YORSO",
  signInReturnHint: "После входа вы вернётесь в «Сотрудники»",
  returnToSectionTemplate: "После входа вы вернётесь в «{section}»",
  signInAction: "Войти в YORSO",
  checkingAccess: "Проверяем доступ",
  sessionEnded: "Сеанс завершён. Войдите снова",
  continueLabel: "Продолжить",
  noAccess: "Нет доступа",
  accessClosedShort: "Доступ закрыт",
  backLabel: "Назад",
};

const en: AccessDict = {
  serviceScreenTitle: "Service review",
  serviceScreenHint: "Closed screen. Company records and customer content are not shown here.",
  readinessTitle: "Feature readiness",
  readinessFields: {
    edition: "Candidate edition",
    license: "License",
    lastReview: "Last review",
    ownerDecision: "Owner decision",
  },
  editionValue: "Candidate 2.6.0",
  editionStatus: "Requires decision",
  licenseValue: "Not approved",
  lastReviewValue: "6 September 2026, 14:20",
  ownerDecisionPending: "No decision selected",
  decisionLabel: "Review decision",
  decisions: {
    continueReview: "Continue the review",
    pause: "Pause",
    doNotUse: "Do not use",
  },
  capabilityColumns: {
    feature: "Feature",
    status: "Status",
    limitation: "Limitation",
    risk: "Risk",
    decision: "Decision",
  },
  capabilityStatuses: {
    available: "Available",
    requiresVerification: "Requires verification",
    requiresAnotherEdition: "Requires another edition",
    deferred: "Deferred",
    prohibited: "Prohibited",
  },
  recordDecision: "Record decision",
  recordDecisionTitle: "Record the review decision",
  recordDecisionBody:
    "The decision applies on this page only and does not mean the edition or the license is approved.",
  recordDecisionConfirm: "Record",
  decisionRecordedNote: "Decision recorded. The edition and the license stay unapproved.",
  accessReviewTitle: "Access review",
  accessChecks: {
    companyFound: "Company found",
    rulesApplied: "Access rules applied",
    revocation: "Access revocation",
    contentHidden: "Record content hidden",
  },
  checkPassed: "Confirmed",
  checkRequiresReview: "Requires review",

  employeesTabs: {
    employees: "Employees",
    invitations: "Invitations",
    ownership: "Ownership transfer",
  },
  employeesTabsLabel: "Employee sections",
  employeeActions: {
    invite: "Invite employee",
    changeRole: "Change role",
    closeAccess: "Close access",
    transferOwnership: "Transfer ownership",
    leaveCompany: "Leave company",
  },
  employeeColumns: { name: "Employee", role: "Role", status: "Status", since: "In company since" },
  ownRecordTitle: "Your record",
  ownRecordHint: "You see only your own record and role.",
  ownRecordRole: "Your role",
  invitationsHint: "The invitations are in the list on this page.",
  invitationColumns: { name: "Invited", role: "Role", status: "Status", addedAt: "Added" },
  invitationPending: "Added to list",
  ownershipTitle: "Ownership transfer",
  ownershipHint: "Ownership is passed to one employee of the company.",
  ownershipOwnerNote: "You can leave the company only after transferring ownership.",
  ownershipAdminNote: "Only the company owner can transfer ownership.",
  ownershipNoRight: "Your role does not have this action.",
  firstRegistrantNote: "The first registered employee is shown as the owner.",
  noEmployeeList: "The employee list is available to the owner and the administrator.",
  confirmTitles: {
    invite: "Invite employee",
    changeRole: "Change the employee role",
    closeAccess: "Close access for the employee",
    transferOwnership: "Transfer company ownership",
    leaveCompany: "Leave company",
  },
  confirmBodies: {
    invite: "Enter an email address and role. The invitation will appear in the list on this page.",
    changeRole: "The employee rights change right after confirmation.",
    closeAccess: "The employee will lose access to the company records.",
    transferOwnership: "After the transfer you stay an administrator of the company.",
    leaveCompany: "You will lose access to the records of this company.",
  },
  confirm: "Confirm",
  cancel: "Cancel",
  actionRecorded: "The action is done.",
  inviteEmailLabel: "Email",
  inviteRoleLabel: "Role of the invited employee",
  employeeTargetLabel: "Employee",
  newRoleLabel: "New role",
  selectPlaceholder: "Select a value",
  inviteEmailInvalid: "Enter an email address.",
  confirmSelection: "Selected",
  invitedResult: "The invitation for {name} was added to the list on this page.",
  roleChangedResult: "Role changed: {name} · {role}.",
  accessClosedResult: "Access closed: {name}.",

  accessClosedTitle: "Access to the company is closed",
  accessClosedBody: "Company records and actions are no longer shown.",
  returnToSignIn: "Return to sign in",
  signInTitle: "Sign in to YORSO",
  signInReturnHint: "After signing in, you will return to Employees",
  returnToSectionTemplate: "After signing in, you will return to {section}",
  signInAction: "Sign in to YORSO",
  checkingAccess: "Checking access",
  sessionEnded: "Session ended. Sign in again",
  continueLabel: "Continue",
  noAccess: "No access",
  accessClosedShort: "Access closed",
  backLabel: "Back",
};

const es: AccessDict = {
  serviceScreenTitle: "Revisión de servicio",
  serviceScreenHint: "Pantalla cerrada. Aquí no se muestran registros de empresas ni contenido de clientes.",
  readinessTitle: "Preparación de funciones",
  readinessFields: {
    edition: "Edición candidata",
    license: "Licencia",
    lastReview: "Última revisión",
    ownerDecision: "Decisión del propietario",
  },
  editionValue: "Candidata 2.6.0",
  editionStatus: "Requiere decisión",
  licenseValue: "No aprobada",
  lastReviewValue: "6 de septiembre de 2026, 14:20",
  ownerDecisionPending: "Sin decisión seleccionada",
  decisionLabel: "Decisión de la revisión",
  decisions: {
    continueReview: "Continuar la revisión",
    pause: "Pausar",
    doNotUse: "No utilizar",
  },
  capabilityColumns: {
    feature: "Función",
    status: "Estado",
    limitation: "Limitación",
    risk: "Riesgo",
    decision: "Decisión",
  },
  capabilityStatuses: {
    available: "Disponible",
    requiresVerification: "Requiere verificación",
    requiresAnotherEdition: "Requiere otra edición",
    deferred: "Aplazado",
    prohibited: "Prohibido",
  },
  recordDecision: "Registrar decisión",
  recordDecisionTitle: "Registrar la decisión de la revisión",
  recordDecisionBody:
    "La decisión se aplica solo en esta página y no significa que la edición o la licencia estén aprobadas.",
  recordDecisionConfirm: "Registrar",
  decisionRecordedNote: "Decisión registrada. La edición y la licencia siguen sin aprobar.",
  accessReviewTitle: "Revisión de acceso",
  accessChecks: {
    companyFound: "Empresa encontrada",
    rulesApplied: "Reglas de acceso aplicadas",
    revocation: "Revocación de acceso",
    contentHidden: "Contenido de registros oculto",
  },
  checkPassed: "Confirmado",
  checkRequiresReview: "Requiere revisión",

  employeesTabs: {
    employees: "Empleados",
    invitations: "Invitaciones",
    ownership: "Transferencia de propiedad",
  },
  employeesTabsLabel: "Secciones de empleados",
  employeeActions: {
    invite: "Invitar empleado",
    changeRole: "Cambiar rol",
    closeAccess: "Cerrar acceso",
    transferOwnership: "Transferir propiedad",
    leaveCompany: "Salir de la empresa",
  },
  employeeColumns: { name: "Empleado", role: "Rol", status: "Estado", since: "En la empresa desde" },
  ownRecordTitle: "Su registro",
  ownRecordHint: "Solo ve su propio registro y su rol.",
  ownRecordRole: "Su rol",
  invitationsHint: "Las invitaciones están en la lista de esta página.",
  invitationColumns: { name: "Invitado", role: "Rol", status: "Estado", addedAt: "Añadida" },
  invitationPending: "Añadida a la lista",
  ownershipTitle: "Transferencia de propiedad",
  ownershipHint: "La propiedad pasa a un empleado de la empresa.",
  ownershipOwnerNote: "Solo puede salir de la empresa después de transferir la propiedad.",
  ownershipAdminNote: "Solo el propietario de la empresa puede transferir la propiedad.",
  ownershipNoRight: "Su rol no tiene esta acción.",
  firstRegistrantNote: "El primer empleado registrado se muestra como propietario.",
  noEmployeeList: "La lista de empleados está disponible para el propietario y el administrador.",
  confirmTitles: {
    invite: "Invitar empleado",
    changeRole: "Cambiar el rol del empleado",
    closeAccess: "Cerrar el acceso del empleado",
    transferOwnership: "Transferir la propiedad de la empresa",
    leaveCompany: "Salir de la empresa",
  },
  confirmBodies: {
    invite: "Indique el correo electrónico y el rol. La invitación aparecerá en la lista de esta página.",
    changeRole: "Los permisos del empleado cambian justo después de confirmar.",
    closeAccess: "El empleado perderá el acceso a los registros de la empresa.",
    transferOwnership: "Después de la transferencia usted seguirá como administrador de la empresa.",
    leaveCompany: "Perderá el acceso a los registros de esta empresa.",
  },
  confirm: "Confirmar",
  cancel: "Cancelar",
  actionRecorded: "La acción se ha realizado.",
  inviteEmailLabel: "Correo electrónico",
  inviteRoleLabel: "Rol del empleado invitado",
  employeeTargetLabel: "Empleado",
  newRoleLabel: "Nuevo rol",
  selectPlaceholder: "Seleccione un valor",
  inviteEmailInvalid: "Indique un correo electrónico.",
  confirmSelection: "Seleccionado",
  invitedResult: "La invitación para {name} se ha añadido a la lista de esta página.",
  roleChangedResult: "Rol cambiado: {name} · {role}.",
  accessClosedResult: "Acceso cerrado: {name}.",

  accessClosedTitle: "El acceso a la empresa está cerrado",
  accessClosedBody: "Los registros y las acciones de la empresa ya no se muestran.",
  returnToSignIn: "Volver al inicio de sesión",
  signInTitle: "Iniciar sesión en YORSO",
  signInReturnHint: "Después de iniciar sesión volverá a «Empleados»",
  returnToSectionTemplate: "Después de iniciar sesión volverá a «{section}»",
  signInAction: "Inicie sesión en YORSO",
  checkingAccess: "Comprobando el acceso",
  sessionEnded: "Sesión finalizada. Inicie sesión de nuevo",
  continueLabel: "Continuar",
  noAccess: "Sin acceso",
  accessClosedShort: "Acceso cerrado",
  backLabel: "Atrás",
};

export const protoAccessCopy: Record<ProtoLang, AccessDict> = { ru, en, es };

export const SERVICE_DECISIONS: ServiceDecisionKey[] = [
  "continueReview",
  "pause",
  "doNotUse",
];

export const EMPLOYEES_TABS: EmployeesTabKey[] = ["employees", "invitations", "ownership"];
