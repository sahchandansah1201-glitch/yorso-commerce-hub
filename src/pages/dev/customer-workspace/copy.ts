/**
 * P0 prototype dictionary (RU / EN / ES).
 *
 * Local to the prototype route on purpose: the global i18n contract in
 * src/i18n/translations.ts is not touched by this package. Wording follows the
 * project rule that YORSO is one system for the user — no service names,
 * addresses, ports, keys, and no words about transition or synchronization.
 */

export type ProtoLang = "ru" | "en" | "es";

export type ProtoSectionKey =
  | "overview"
  | "companies"
  | "contacts"
  | "products"
  | "tasks"
  | "notes"
  | "search";

export type ProtoRoleKey = "owner" | "admin" | "manager" | "viewer" | "service";

export type ProtoStateKey =
  | "loading"
  | "empty"
  | "ready"
  | "viewOnly"
  | "denied"
  | "unavailable"
  | "conflict"
  | "saving"
  | "success"
  | "destructive";

type Dict = {
  brand: string;
  workspaceRoot: string;
  breadcrumbRoot: string;
  currentCompany: string;
  language: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  role: string;
  scenario: string;
  updatedAt: string;
  prototypeNotice: string;
  sections: Record<ProtoSectionKey, string>;
  sectionHints: Record<ProtoSectionKey, string>;
  primaryActions: Record<ProtoSectionKey, string>;
  roles: Record<ProtoRoleKey, string>;
  states: Record<ProtoStateKey, string>;
  columns: {
    name: string;
    kind: string;
    responsible: string;
    volume: string;
    status: string;
    updated: string;
    rowActions: string;
    open: string;
  };
  statusActive: string;
  statusInactive: string;
  loadingLabel: string;
  emptyTitle: string;
  emptyBody: string;
  viewOnlyTitle: string;
  viewOnlyBody: string;
  deniedTitle: string;
  deniedBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  retry: string;
  conflictTitle: string;
  conflictBody: string;
  keepMine: string;
  keepTheirs: string;
  savingLabel: string;
  successTitle: string;
  successBody: string;
  destructiveAction: string;
  destructiveTitle: string;
  destructiveBody: string;
  destructiveConfirm: string;
  cancel: string;
  serviceTitle: string;
  serviceBody: string;
  searchPlaceholder: string;
  searchEmptyQuery: string;
  overviewHeading: string;
  overviewItems: string[];
};

const ru: Dict = {
  brand: "YORSO",
  workspaceRoot: "Работа с клиентами",
  breadcrumbRoot: "YORSO",
  currentCompany: "Текущая компания",
  language: "Язык",
  theme: "Оформление",
  themeLight: "Светлое",
  themeDark: "Тёмное",
  role: "Роль",
  scenario: "Состояние",
  updatedAt: "Обновлено",
  prototypeNotice: "Рабочий образец интерфейса для согласования. Данные демонстрационные.",
  sections: {
    overview: "Обзор",
    companies: "Компании",
    contacts: "Контакты",
    products: "Продукция",
    tasks: "Задачи",
    notes: "Заметки",
    search: "Поиск",
  },
  sectionHints: {
    overview: "Что требует внимания в текущей компании",
    companies: "Компании, с которыми вы работаете",
    contacts: "Люди на стороне компаний",
    products: "Продукция компании",
    tasks: "Обязательства с датой",
    notes: "Договорённости и наблюдения",
    search: "Поиск по записям текущей компании",
  },
  primaryActions: {
    overview: "Обновить",
    companies: "Создать компанию",
    contacts: "Создать контакт",
    products: "Редактировать",
    tasks: "Создать задачу",
    notes: "Добавить заметку",
    search: "Найти",
  },
  roles: {
    owner: "Владелец",
    admin: "Администратор",
    manager: "Менеджер",
    viewer: "Наблюдатель",
    service: "Служебный сотрудник YORSO",
  },
  states: {
    loading: "Загрузка",
    empty: "Пусто",
    ready: "Готово",
    viewOnly: "Только просмотр",
    denied: "Нет доступа",
    unavailable: "Раздел временно недоступен",
    conflict: "Конфликт изменений",
    saving: "Сохранение",
    success: "Успех",
    destructive: "Подтверждение необратимого действия",
  },
  columns: {
    name: "Название",
    kind: "Вид",
    responsible: "Ответственный",
    volume: "Объём в месяц",
    status: "Статус",
    updated: "Обновлено",
    rowActions: "Действия",
    open: "Открыть",
  },
  statusActive: "Активен",
  statusInactive: "Неактивен",
  loadingLabel: "Загружаем раздел",
  emptyTitle: "Пока нет записей",
  emptyBody: "Здесь появятся записи текущей компании.",
  viewOnlyTitle: "Только просмотр",
  viewOnlyBody: "Изменения вносят владелец или администратор компании.",
  deniedTitle: "Нет доступа",
  deniedBody: "У вашей роли нет прав на этот раздел. Обратитесь к владельцу компании.",
  unavailableTitle: "Раздел временно недоступен",
  unavailableBody: "Повторите попытку. Остальные разделы работают.",
  retry: "Повторить",
  conflictTitle: "Запись изменена другим сотрудником",
  conflictBody: "Выберите, какую версию оставить.",
  keepMine: "Оставить мою версию",
  keepTheirs: "Оставить версию коллеги",
  savingLabel: "Сохраняем",
  successTitle: "Изменения сохранены",
  successBody: "Список обновлён.",
  destructiveAction: "Сделать неактивной",
  destructiveTitle: "Сделать позицию неактивной",
  destructiveBody: 'Позиция «Атлантический лосось» перестанет показываться как активная. Восстановить сможет владелец или администратор.',
  destructiveConfirm: "Сделать неактивной",
  cancel: "Отмена",
  serviceTitle: "Служебная работа ведётся отдельно",
  serviceBody: "Этот раздел предназначен сотрудникам компании. Служебные экраны находятся вне пользовательской навигации.",
  searchPlaceholder: "Название компании, контакт или позиция",
  searchEmptyQuery: "Введите запрос, чтобы начать поиск.",
  overviewHeading: "Требует внимания",
  overviewItems: [
    "3 задачи с датой на этой неделе",
    "2 позиции продукции без объёма",
    "1 контакт без телефона",
  ],
};

const en: Dict = {
  brand: "YORSO",
  workspaceRoot: "Customer work",
  breadcrumbRoot: "YORSO",
  currentCompany: "Current company",
  language: "Language",
  theme: "Appearance",
  themeLight: "Light",
  themeDark: "Dark",
  role: "Role",
  scenario: "State",
  updatedAt: "Updated",
  prototypeNotice: "Working interface sample for review. The data is for demonstration.",
  sections: {
    overview: "Overview",
    companies: "Companies",
    contacts: "Contacts",
    products: "Products",
    tasks: "Tasks",
    notes: "Notes",
    search: "Search",
  },
  sectionHints: {
    overview: "What needs attention in the current company",
    companies: "Companies you work with",
    contacts: "People on the company side",
    products: "Company products",
    tasks: "Commitments with a date",
    notes: "Agreements and observations",
    search: "Search records of the current company",
  },
  primaryActions: {
    overview: "Refresh",
    companies: "Create company",
    contacts: "Create contact",
    products: "Edit",
    tasks: "Create task",
    notes: "Add note",
    search: "Search",
  },
  roles: {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    viewer: "Viewer",
    service: "YORSO service employee",
  },
  states: {
    loading: "Loading",
    empty: "Empty",
    ready: "Ready",
    viewOnly: "View only",
    denied: "No access",
    unavailable: "Section temporarily unavailable",
    conflict: "Edit conflict",
    saving: "Saving",
    success: "Success",
    destructive: "Irreversible action confirmation",
  },
  columns: {
    name: "Name",
    kind: "Kind",
    responsible: "Owner",
    volume: "Monthly volume",
    status: "Status",
    updated: "Updated",
    rowActions: "Actions",
    open: "Open",
  },
  statusActive: "Active",
  statusInactive: "Inactive",
  loadingLabel: "Loading the section",
  emptyTitle: "No records yet",
  emptyBody: "Records of the current company will appear here.",
  viewOnlyTitle: "View only",
  viewOnlyBody: "Changes are made by the company owner or an administrator.",
  deniedTitle: "No access",
  deniedBody: "Your role has no rights for this section. Ask the company owner.",
  unavailableTitle: "Section temporarily unavailable",
  unavailableBody: "Try again. The other sections keep working.",
  retry: "Try again",
  conflictTitle: "The record was changed by another employee",
  conflictBody: "Choose which version to keep.",
  keepMine: "Keep my version",
  keepTheirs: "Keep the other version",
  savingLabel: "Saving",
  successTitle: "Changes saved",
  successBody: "The list is up to date.",
  destructiveAction: "Make inactive",
  destructiveTitle: "Make the item inactive",
  destructiveBody: 'The item "Atlantic salmon" will stop showing as active. The owner or an administrator can restore it.',
  destructiveConfirm: "Make inactive",
  cancel: "Cancel",
  serviceTitle: "Service work is kept separate",
  serviceBody: "This section is for company employees. Service screens stay outside the user navigation.",
  searchPlaceholder: "Company name, contact or item",
  searchEmptyQuery: "Enter a query to start searching.",
  overviewHeading: "Needs attention",
  overviewItems: [
    "3 tasks dated this week",
    "2 product items without volume",
    "1 contact without a phone number",
  ],
};

const es: Dict = {
  brand: "YORSO",
  workspaceRoot: "Trabajo con clientes",
  breadcrumbRoot: "YORSO",
  currentCompany: "Empresa actual",
  language: "Idioma",
  theme: "Apariencia",
  themeLight: "Claro",
  themeDark: "Oscuro",
  role: "Rol",
  scenario: "Estado",
  updatedAt: "Actualizado",
  prototypeNotice: "Muestra de interfaz para revisión. Los datos son de demostración.",
  sections: {
    overview: "Resumen",
    companies: "Empresas",
    contacts: "Contactos",
    products: "Productos",
    tasks: "Tareas",
    notes: "Notas",
    search: "Buscar",
  },
  sectionHints: {
    overview: "Lo que requiere atención en la empresa actual",
    companies: "Empresas con las que trabaja",
    contacts: "Personas del lado de las empresas",
    products: "Productos de la empresa",
    tasks: "Compromisos con fecha",
    notes: "Acuerdos y observaciones",
    search: "Buscar registros de la empresa actual",
  },
  primaryActions: {
    overview: "Actualizar",
    companies: "Crear empresa",
    contacts: "Crear contacto",
    products: "Editar",
    tasks: "Crear tarea",
    notes: "Añadir nota",
    search: "Buscar",
  },
  roles: {
    owner: "Propietario",
    admin: "Administrador",
    manager: "Gestor",
    viewer: "Observador",
    service: "Empleado de servicio de YORSO",
  },
  states: {
    loading: "Cargando",
    empty: "Vacío",
    ready: "Listo",
    viewOnly: "Solo lectura",
    denied: "Sin acceso",
    unavailable: "Sección no disponible temporalmente",
    conflict: "Conflicto de cambios",
    saving: "Guardando",
    success: "Correcto",
    destructive: "Confirmación de acción irreversible",
  },
  columns: {
    name: "Nombre",
    kind: "Tipo",
    responsible: "Responsable",
    volume: "Volumen mensual",
    status: "Estado",
    updated: "Actualizado",
    rowActions: "Acciones",
    open: "Abrir",
  },
  statusActive: "Activo",
  statusInactive: "Inactivo",
  loadingLabel: "Cargando la sección",
  emptyTitle: "Todavía no hay registros",
  emptyBody: "Aquí aparecerán los registros de la empresa actual.",
  viewOnlyTitle: "Solo lectura",
  viewOnlyBody: "Los cambios los realiza el propietario o un administrador de la empresa.",
  deniedTitle: "Sin acceso",
  deniedBody: "Su rol no tiene permisos para esta sección. Consulte al propietario de la empresa.",
  unavailableTitle: "Sección no disponible temporalmente",
  unavailableBody: "Vuelva a intentarlo. Las demás secciones siguen funcionando.",
  retry: "Volver a intentar",
  conflictTitle: "Otro empleado cambió el registro",
  conflictBody: "Elija qué versión conservar.",
  keepMine: "Conservar mi versión",
  keepTheirs: "Conservar la versión del colega",
  savingLabel: "Guardando",
  successTitle: "Cambios guardados",
  successBody: "La lista está actualizada.",
  destructiveAction: "Marcar como inactivo",
  destructiveTitle: "Marcar el artículo como inactivo",
  destructiveBody: 'El artículo «Salmón atlántico» dejará de mostrarse como activo. El propietario o un administrador puede restaurarlo.',
  destructiveConfirm: "Marcar como inactivo",
  cancel: "Cancelar",
  serviceTitle: "El trabajo de servicio se mantiene aparte",
  serviceBody: "Esta sección es para empleados de la empresa. Las pantallas de servicio quedan fuera de la navegación del usuario.",
  searchPlaceholder: "Nombre de empresa, contacto o artículo",
  searchEmptyQuery: "Escriba una consulta para empezar a buscar.",
  overviewHeading: "Requiere atención",
  overviewItems: [
    "3 tareas con fecha de esta semana",
    "2 artículos de productos sin volumen",
    "1 contacto sin teléfono",
  ],
};

export const protoCopy: Record<ProtoLang, Dict> = { ru, en, es };

export const PROTO_LANGS: ProtoLang[] = ["ru", "en", "es"];
export const PROTO_SECTIONS: ProtoSectionKey[] = [
  "overview",
  "companies",
  "contacts",
  "products",
  "tasks",
  "notes",
  "search",
];
export const PROTO_ROLES: ProtoRoleKey[] = ["owner", "admin", "manager", "viewer", "service"];
export const PROTO_STATES: ProtoStateKey[] = [
  "loading",
  "empty",
  "ready",
  "viewOnly",
  "denied",
  "unavailable",
  "conflict",
  "saving",
  "success",
  "destructive",
];
