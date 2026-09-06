/**
 * P4 dictionary — customer work lists, record cards and the prototype access
 * scenario (RU / EN / ES).
 *
 * The access scenario is a prototype scenario control only: it is not a user
 * control and it is not proof of authorization. It is deliberately independent
 * from the role selector.
 */
import type { ProtoLang } from "./copy";

export type P4Scenario =
  | "view"
  | "createEdit"
  | "import"
  | "export"
  | "deleted"
  | "denied";

export type P4RecordKind = "company" | "contact" | "task" | "note";
export type P4TabKey = "overview" | "contacts" | "tasks" | "notes" | "related";
export type P4SortKey = "titleAsc" | "titleDesc" | "updatedDesc";

export type P4Dict = {
  scenarioLabel: string;
  scenarioNotice: string;
  scenarios: Record<P4Scenario, string>;
  searchLabel: string;
  searchPlaceholder: string;
  filters: string;
  filterAll: string;
  filterActive: string;
  filterInactive: string;
  sort: string;
  sorts: Record<P4SortKey, string>;
  resultCount: string;
  previous: string;
  next: string;
  pageOf: string;
  listActions: string;
  open: string;
  back: string;
  tabs: Record<P4TabKey, string>;
  kinds: Record<P4RecordKind, string>;
  mainDetails: string;
  companyField: string;
  relatedRecords: string;
  noRelated: string;
  actions: {
    createCompany: string;
    addContact: string;
    createTask: string;
    addNote: string;
    importEntry: string;
    exportEntry: string;
    openDeleted: string;
    restore: string;
  };
  createTitle: string;
  createHint: string;
  titleField: string;
  save: string;
  cancel: string;
  importTitle: string;
  importBody: string;
  exportTitle: string;
  exportBody: string;
  deletedTitle: string;
  deletedBody: string;
  restoreTitle: string;
  restoreBody: string;
  restoreConfirm: string;
  restored: string;
  deniedTitle: string;
  deniedBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  emptyTitle: string;
  emptyBody: string;
  emptySearchTitle: string;
  emptySearchBody: string;
  validating: string;
  savingLabel: string;
  successTitle: string;
  successBody: string;
  conflictTitle: string;
  conflictBody: string;
  keepMine: string;
  keepTheirs: string;
  viewOnlyTitle: string;
  viewOnlyBody: string;
  status: string;
  updated: string;
  responsible: string;
};

const ru: P4Dict = {
  scenarioLabel: "Сценарий доступа",
  scenarioNotice: "Сценарий доступа — только для показа образца. Он не выдаёт права.",
  scenarios: {
    view: "Просмотр разрешён",
    createEdit: "Создание и изменение разрешены",
    import: "Загрузка разрешена",
    export: "Выгрузка разрешена",
    deleted: "Удалённые записи разрешены",
    denied: "Доступ не предоставлен",
  },
  searchLabel: "Поиск",
  searchPlaceholder: "Название, имя или текст",
  filters: "Фильтры",
  filterAll: "Все записи",
  filterActive: "Активные",
  filterInactive: "Неактивные",
  sort: "Сортировка",
  sorts: {
    titleAsc: "Название: А–Я",
    titleDesc: "Название: Я–А",
    updatedDesc: "Сначала новые",
  },
  resultCount: "Найдено записей",
  previous: "Назад",
  next: "Далее",
  pageOf: "Страница",
  listActions: "Действия со списком",
  open: "Открыть",
  back: "К списку",
  tabs: {
    overview: "Обзор",
    contacts: "Контакты",
    tasks: "Задачи",
    notes: "Заметки",
    related: "Связанные записи",
  },
  kinds: { company: "Компания", contact: "Контакт", task: "Задача", note: "Заметка" },
  mainDetails: "Основные данные",
  companyField: "Компания",
  relatedRecords: "Связанные записи",
  noRelated: "Связанных записей нет.",
  actions: {
    createCompany: "Создать компанию",
    addContact: "Добавить контакт",
    createTask: "Создать задачу",
    addNote: "Добавить заметку",
    importEntry: "Загрузка",
    exportEntry: "Выгрузка",
    openDeleted: "Удалённые записи",
    restore: "Восстановить",
  },
  createTitle: "Новая запись",
  createHint: "Образец формы: запись появляется только в этом экране.",
  titleField: "Название",
  save: "Сохранить",
  cancel: "Отмена",
  importTitle: "Загрузка записей",
  importBody: "Начальный экран загрузки. Пошаговый разбор файла появится в следующем пакете.",
  exportTitle: "Выгрузка записей",
  exportBody: "Начальный экран выгрузки: состав полей и формат согласуются отдельно.",
  deletedTitle: "Удалённые записи",
  deletedBody: "Записи можно посмотреть и восстановить.",
  restoreTitle: "Восстановить запись",
  restoreBody: "Запись вернётся в основной список.",
  restoreConfirm: "Восстановить",
  restored: "Запись восстановлена в образце.",
  deniedTitle: "Раздел недоступен",
  deniedBody: "Этот раздел недоступен для вашей учётной записи. Обратитесь к владельцу компании.",
  unavailableTitle: "Раздел временно недоступен",
  unavailableBody: "Раздел временно недоступен. Попробуйте позже.",
  emptyTitle: "Пока нет записей",
  emptyBody: "Здесь появятся записи текущей компании.",
  emptySearchTitle: "Ничего не найдено",
  emptySearchBody: "Измените запрос или снимите фильтры.",
  validating: "Проверяем данные",
  savingLabel: "Сохраняем",
  successTitle: "Изменения сохранены",
  successBody: "Список обновлён.",
  conflictTitle: "Запись изменена другим сотрудником",
  conflictBody: "Выберите, какую версию оставить.",
  keepMine: "Оставить мою версию",
  keepTheirs: "Оставить версию коллеги",
  viewOnlyTitle: "Только просмотр",
  viewOnlyBody: "В этом сценарии доступен только просмотр записей.",
  status: "Статус",
  updated: "Обновлено",
  responsible: "Ответственный",
};

const en: P4Dict = {
  scenarioLabel: "Access scenario",
  scenarioNotice: "The access scenario is a prototype control only. It grants no rights.",
  scenarios: {
    view: "View allowed",
    createEdit: "Create and edit allowed",
    import: "Import allowed",
    export: "Export allowed",
    deleted: "Deleted records allowed",
    denied: "Access not granted",
  },
  searchLabel: "Search",
  searchPlaceholder: "Title, name or text",
  filters: "Filters",
  filterAll: "All records",
  filterActive: "Active",
  filterInactive: "Inactive",
  sort: "Sort",
  sorts: { titleAsc: "Title: A–Z", titleDesc: "Title: Z–A", updatedDesc: "Newest first" },
  resultCount: "Records found",
  previous: "Previous",
  next: "Next",
  pageOf: "Page",
  listActions: "List actions",
  open: "Open",
  back: "Back to list",
  tabs: {
    overview: "Overview",
    contacts: "Contacts",
    tasks: "Tasks",
    notes: "Notes",
    related: "Related records",
  },
  kinds: { company: "Company", contact: "Contact", task: "Task", note: "Note" },
  mainDetails: "Main details",
  companyField: "Company",
  relatedRecords: "Related records",
  noRelated: "There are no related records.",
  actions: {
    createCompany: "Create company",
    addContact: "Add contact",
    createTask: "Create task",
    addNote: "Add note",
    importEntry: "Import",
    exportEntry: "Export",
    openDeleted: "Deleted records",
    restore: "Restore",
  },
  createTitle: "New record",
  createHint: "Sample form: the record appears only inside this screen.",
  titleField: "Title",
  save: "Save",
  cancel: "Cancel",
  importTitle: "Import records",
  importBody: "Import entry screen. Step-by-step file review comes in the next package.",
  exportTitle: "Export records",
  exportBody: "Export entry screen: field set and format are agreed separately.",
  deletedTitle: "Deleted records",
  deletedBody: "Records can be reviewed and restored.",
  restoreTitle: "Restore the record",
  restoreBody: "The record returns to the main list.",
  restoreConfirm: "Restore",
  restored: "The record is restored in the sample.",
  deniedTitle: "Section unavailable",
  deniedBody: "This section is unavailable for your account. Contact the company owner.",
  unavailableTitle: "Section temporarily unavailable",
  unavailableBody: "This section is temporarily unavailable. Try again later.",
  emptyTitle: "No records yet",
  emptyBody: "Records of the current company will appear here.",
  emptySearchTitle: "Nothing found",
  emptySearchBody: "Change the query or clear the filters.",
  validating: "Checking the data",
  savingLabel: "Saving",
  successTitle: "Changes saved",
  successBody: "The list is updated.",
  conflictTitle: "The record was changed by another employee",
  conflictBody: "Choose which version to keep.",
  keepMine: "Keep my version",
  keepTheirs: "Keep the other version",
  viewOnlyTitle: "Read only",
  viewOnlyBody: "This scenario allows reviewing records only.",
  status: "Status",
  updated: "Updated",
  responsible: "Responsible",
};

const es: P4Dict = {
  scenarioLabel: "Escenario de acceso",
  scenarioNotice: "El escenario de acceso es solo un control de muestra. No concede permisos.",
  scenarios: {
    view: "Consulta permitida",
    createEdit: "Creación y edición permitidas",
    import: "Carga permitida",
    export: "Descarga permitida",
    deleted: "Registros eliminados permitidos",
    denied: "Acceso no concedido",
  },
  searchLabel: "Búsqueda",
  searchPlaceholder: "Título, nombre o texto",
  filters: "Filtros",
  filterAll: "Todos los registros",
  filterActive: "Activos",
  filterInactive: "Inactivos",
  sort: "Orden",
  sorts: { titleAsc: "Título: A–Z", titleDesc: "Título: Z–A", updatedDesc: "Más recientes primero" },
  resultCount: "Registros encontrados",
  previous: "Anterior",
  next: "Siguiente",
  pageOf: "Página",
  listActions: "Acciones de la lista",
  open: "Abrir",
  back: "Volver a la lista",
  tabs: {
    overview: "Resumen",
    contacts: "Contactos",
    tasks: "Tareas",
    notes: "Notas",
    related: "Registros relacionados",
  },
  kinds: { company: "Empresa", contact: "Contacto", task: "Tarea", note: "Nota" },
  mainDetails: "Datos principales",
  companyField: "Empresa",
  relatedRecords: "Registros relacionados",
  noRelated: "No hay registros relacionados.",
  actions: {
    createCompany: "Crear empresa",
    addContact: "Añadir contacto",
    createTask: "Crear tarea",
    addNote: "Añadir nota",
    importEntry: "Carga",
    exportEntry: "Descarga",
    openDeleted: "Registros eliminados",
    restore: "Restaurar",
  },
  createTitle: "Nuevo registro",
  createHint: "Formulario de muestra: el registro aparece solo en esta pantalla.",
  titleField: "Título",
  save: "Guardar",
  cancel: "Cancelar",
  importTitle: "Carga de registros",
  importBody: "Pantalla inicial de carga. La revisión paso a paso llega en el próximo paquete.",
  exportTitle: "Descarga de registros",
  exportBody: "Pantalla inicial de descarga: los campos y el formato se acuerdan por separado.",
  deletedTitle: "Registros eliminados",
  deletedBody: "Los registros se pueden revisar y restaurar.",
  restoreTitle: "Restaurar el registro",
  restoreBody: "El registro volverá a la lista principal.",
  restoreConfirm: "Restaurar",
  restored: "El registro se ha restaurado en la muestra.",
  deniedTitle: "Sección no disponible",
  deniedBody: "Esta sección no está disponible para su cuenta. Contacte con el propietario de la empresa.",
  unavailableTitle: "Sección temporalmente no disponible",
  unavailableBody: "Esta sección no está disponible temporalmente. Inténtelo más tarde.",
  emptyTitle: "Todavía no hay registros",
  emptyBody: "Aquí aparecerán los registros de la empresa actual.",
  emptySearchTitle: "No se ha encontrado nada",
  emptySearchBody: "Cambie la consulta o quite los filtros.",
  validating: "Comprobando los datos",
  savingLabel: "Guardando",
  successTitle: "Cambios guardados",
  successBody: "La lista se ha actualizado.",
  conflictTitle: "Otro empleado ha cambiado el registro",
  conflictBody: "Elija qué versión conservar.",
  keepMine: "Conservar mi versión",
  keepTheirs: "Conservar la versión del compañero",
  viewOnlyTitle: "Solo lectura",
  viewOnlyBody: "Este escenario solo permite consultar registros.",
  status: "Estado",
  updated: "Actualizado",
  responsible: "Responsable",
};

export const protoP4Copy: Record<ProtoLang, P4Dict> = { ru, en, es };

export const P4_SCENARIOS: P4Scenario[] = [
  "view",
  "createEdit",
  "import",
  "export",
  "deleted",
  "denied",
];

export const P4_SORTS: P4SortKey[] = ["titleAsc", "titleDesc", "updatedDesc"];
