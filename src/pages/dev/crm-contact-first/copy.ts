/**
 * Contact-first workspace dictionary (RU / EN / ES).
 *
 * Local to the isolated prototype route on purpose: the global i18n contract in
 * src/i18n/translations.ts is not touched. YORSO is one system for the user, so
 * no service names, hosts, technical transitions or internal wording appear.
 */

export type CrmLang = "ru" | "en" | "es";

export type CrmRoleKey = "owner" | "admin" | "manager" | "limitedManager" | "observer";

export type CrmScenarioKey =
  | "loading"
  | "ready"
  | "activeFilters"
  | "emptySearch"
  | "emptyBase"
  | "unavailable"
  | "denied"
  | "viewOnly"
  | "inactive";

/** Approved stage values, identical in every language. */
export const CRM_STAGES = [
  "New",
  "Negotiation",
  "Qualified",
  "Unqualified",
  "Irrelevant",
  "No Response",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export const CRM_LANGS: CrmLang[] = ["ru", "en", "es"];

export const CRM_ROLES: CrmRoleKey[] = [
  "owner",
  "admin",
  "manager",
  "limitedManager",
  "observer",
];

export const CRM_SCENARIOS: CrmScenarioKey[] = [
  "loading",
  "ready",
  "activeFilters",
  "emptySearch",
  "emptyBase",
  "unavailable",
  "denied",
  "viewOnly",
  "inactive",
];

type Dict = {
  nav_contacts: string;
  nav_deals: string;
  nav_tasks: string;
  nav_companies: string;
  nav_soon: string;
  proto_note: string;
  proto_lang: string;
  proto_theme_light: string;
  proto_theme_dark: string;
  proto_role: string;
  proto_scenario: string;
  role_owner: string;
  role_admin: string;
  role_manager: string;
  role_limitedManager: string;
  role_observer: string;
  scn_loading: string;
  scn_ready: string;
  scn_activeFilters: string;
  scn_emptySearch: string;
  scn_emptyBase: string;
  scn_unavailable: string;
  scn_denied: string;
  scn_viewOnly: string;
  scn_inactive: string;
  list_title: string;
  list_create: string;
  list_count: string;
  list_search: string;
  list_searchPlaceholder: string;
  f_owner: string;
  f_stage: string;
  f_country: string;
  f_product: string;
  f_any: string;
  f_active: string;
  f_reset: string;
  col_name: string;
  col_contacts: string;
  col_company: string;
  col_stage: string;
  col_owner: string;
  col_activity: string;
  col_actions: string;
  act_copy_email: string;
  act_copy_phone: string;
  act_copied: string;
  act_call: string;
  act_email: string;
  act_open: string;
  st_loading: string;
  st_unavailable_title: string;
  st_unavailable_body: string;
  st_retry: string;
  st_denied_title: string;
  st_denied_body: string;
  st_empty_title: string;
  st_empty_body: string;
  st_emptySearch_title: string;
  st_emptySearch_body: string;
  badge_viewOnly: string;
  badge_inactive: string;
  pg_prev: string;
  pg_next: string;
  pg_page: string;
  form_title: string;
  form_name: string;
  form_surname: string;
  form_company: string;
  form_company_new: string;
  form_company_newName: string;
  form_company_newCountry: string;
  form_stage: string;
  form_email: string;
  form_phone: string;
  form_language: string;
  form_submit: string;
  form_cancel: string;
  form_ownerNote: string;
  form_close: string;
  err_required: string;
  err_email: string;
  err_phone: string;
  err_channel: string;
  rec_back: string;
  rec_owner: string;
  rec_details: string;
  rec_edit: string;
  rec_save: string;
  rec_cancel: string;
  rec_saved: string;
  rec_company: string;
  rec_country: string;
  rec_tags: string;
  rec_jobTitle: string;
  rec_stage: string;
  rec_language: string;
  rec_email: string;
  rec_phone: string;
  tab_activity: string;
  tab_tasks: string;
  tab_notes: string;
  act_filter: string;
  act_all: string;
  act_demoNote: string;
  a_created: string;
  a_stage: string;
  a_email: string;
  a_call: string;
  a_note: string;
  a_task: string;
  task_placeholder: string;
  task_add: string;
  task_complete: string;
  task_completed: string;
  task_empty: string;
  note_placeholder: string;
  note_add: string;
  note_empty: string;
  lang_ru: string;
  lang_en: string;
  lang_es: string;
};

export const crmCopy: Record<CrmLang, Dict> = {
  ru: {
    nav_contacts: "Контакты",
    nav_deals: "Сделки",
    nav_tasks: "Задачи",
    nav_companies: "Компании",
    nav_soon: "Раздел пока недоступен на этой странице",
    proto_note: "Изменения на этой странице не сохраняются.",
    proto_lang: "Язык страницы",
    proto_theme_light: "Светлая тема",
    proto_theme_dark: "Тёмная тема",
    proto_role: "Просмотр от роли",
    proto_scenario: "Состояние списка",
    role_owner: "Владелец",
    role_admin: "Администратор",
    role_manager: "Менеджер",
    role_limitedManager: "Ограниченный менеджер",
    role_observer: "Наблюдатель",
    scn_loading: "Загрузка",
    scn_ready: "Готовый список",
    scn_activeFilters: "Активные фильтры",
    scn_emptySearch: "Поиск без результата",
    scn_emptyBase: "Пустая база",
    scn_unavailable: "Временная недоступность",
    scn_denied: "Нет права",
    scn_viewOnly: "Только просмотр",
    scn_inactive: "Неактивная запись",
    list_title: "Контакты",
    list_create: "Создать клиента",
    list_count: "Записей: {n}",
    list_search: "Поиск по контактам",
    list_searchPlaceholder: "Имя, email, телефон или компания",
    f_owner: "Ответственный",
    f_stage: "Этап работы",
    f_country: "Страна компании",
    f_product: "Продукция",
    f_any: "Любой",
    f_active: "Активные фильтры",
    f_reset: "Сбросить фильтры",
    col_name: "Имя",
    col_contacts: "Email и телефон",
    col_company: "Компания и страна",
    col_stage: "Этап работы",
    col_owner: "Ответственный",
    col_activity: "Последняя активность",
    col_actions: "Действия",
    act_copy_email: "Копировать email",
    act_copy_phone: "Копировать телефон",
    act_copied: "Скопировано",
    act_call: "Позвонить",
    act_email: "Написать письмо",
    act_open: "Открыть карточку",
    st_loading: "Список загружается",
    st_unavailable_title: "Список сейчас недоступен",
    st_unavailable_body: "Попробуйте повторить через минуту.",
    st_retry: "Повторить",
    st_denied_title: "Раздел закрыт для вашей роли",
    st_denied_body: "Обратитесь к владельцу учётной записи компании.",
    st_empty_title: "Контактов пока нет",
    st_empty_body: "Создайте первого клиента, чтобы начать работу.",
    st_emptySearch_title: "Ничего не найдено",
    st_emptySearch_body: "Запрос и фильтры сохранены. Измените их или сбросьте фильтры.",
    badge_viewOnly: "Только просмотр",
    badge_inactive: "Неактивная запись",
    pg_prev: "Назад",
    pg_next: "Далее",
    pg_page: "Страница {n} из {m}",
    form_title: "Создать клиента",
    form_name: "Имя",
    form_surname: "Фамилия",
    form_company: "Компания",
    form_company_new: "Новая компания",
    form_company_newName: "Название компании",
    form_company_newCountry: "Страна компании",
    form_stage: "Этап работы",
    form_email: "Email",
    form_phone: "Телефон",
    form_language: "Язык общения",
    form_submit: "Создать",
    form_cancel: "Отмена",
    form_ownerNote: "Ответственным станет {name}.",
    form_close: "Закрыть",
    err_required: "Заполните поле",
    err_email: "Проверьте адрес email",
    err_phone: "Проверьте номер телефона",
    err_channel: "Укажите email или телефон",
    rec_back: "К списку контактов",
    rec_owner: "Ответственный",
    rec_details: "Основные данные",
    rec_edit: "Редактировать",
    rec_save: "Сохранить",
    rec_cancel: "Отмена",
    rec_saved: "Изменения приняты на этой странице",
    rec_company: "Компания",
    rec_country: "Страна",
    rec_tags: "Метки",
    rec_jobTitle: "Должность",
    rec_stage: "Этап работы",
    rec_language: "Язык общения",
    rec_email: "Email",
    rec_phone: "Телефон",
    tab_activity: "Действия",
    tab_tasks: "Задачи",
    tab_notes: "Заметки",
    act_filter: "Тип события",
    act_all: "Все типы",
    act_demoNote: "Лента показывает события по этому контакту.",
    a_created: "Контакт создан",
    a_stage: "Этап работы: {stage}",
    a_email: "Письмо",
    a_call: "Звонок",
    a_note: "Заметка",
    a_task: "Задача",
    task_placeholder: "Что нужно сделать",
    task_add: "Добавить задачу",
    task_complete: "Завершить задачу",
    task_completed: "Завершена",
    task_empty: "Задач пока нет",
    note_placeholder: "Текст заметки",
    note_add: "Добавить заметку",
    note_empty: "Заметок пока нет",
    lang_ru: "Русский",
    lang_en: "Английский",
    lang_es: "Испанский",
  },
  en: {
    nav_contacts: "Contacts",
    nav_deals: "Deals",
    nav_tasks: "Tasks",
    nav_companies: "Companies",
    nav_soon: "This section is not available on this page yet",
    proto_note: "Changes on this page are not saved.",
    proto_lang: "Page language",
    proto_theme_light: "Light theme",
    proto_theme_dark: "Dark theme",
    proto_role: "View as role",
    proto_scenario: "List state",
    role_owner: "Owner",
    role_admin: "Administrator",
    role_manager: "Manager",
    role_limitedManager: "Limited manager",
    role_observer: "Observer",
    scn_loading: "Loading",
    scn_ready: "Ready list",
    scn_activeFilters: "Active filters",
    scn_emptySearch: "Search with no result",
    scn_emptyBase: "Empty base",
    scn_unavailable: "Temporarily unavailable",
    scn_denied: "No permission",
    scn_viewOnly: "View only",
    scn_inactive: "Inactive record",
    list_title: "Contacts",
    list_create: "Create client",
    list_count: "Records: {n}",
    list_search: "Search contacts",
    list_searchPlaceholder: "Name, email, phone or company",
    f_owner: "Contact owner",
    f_stage: "Contact stage",
    f_country: "Company country",
    f_product: "Products",
    f_any: "Any",
    f_active: "Active filters",
    f_reset: "Reset filters",
    col_name: "Name",
    col_contacts: "Email and phone",
    col_company: "Company and country",
    col_stage: "Contact stage",
    col_owner: "Contact owner",
    col_activity: "Last activity",
    col_actions: "Actions",
    act_copy_email: "Copy email",
    act_copy_phone: "Copy phone",
    act_copied: "Copied",
    act_call: "Call",
    act_email: "Write an email",
    act_open: "Open record",
    st_loading: "The list is loading",
    st_unavailable_title: "The list is unavailable right now",
    st_unavailable_body: "Try again in a minute.",
    st_retry: "Try again",
    st_denied_title: "This section is closed for your role",
    st_denied_body: "Ask the owner of the company account.",
    st_empty_title: "No contacts yet",
    st_empty_body: "Create the first client to start working.",
    st_emptySearch_title: "Nothing found",
    st_emptySearch_body: "The query and filters are kept. Change them or reset the filters.",
    badge_viewOnly: "View only",
    badge_inactive: "Inactive record",
    pg_prev: "Back",
    pg_next: "Next",
    pg_page: "Page {n} of {m}",
    form_title: "Create client",
    form_name: "First name",
    form_surname: "Last name",
    form_company: "Company",
    form_company_new: "New company",
    form_company_newName: "Company name",
    form_company_newCountry: "Company country",
    form_stage: "Contact stage",
    form_email: "Email",
    form_phone: "Phone",
    form_language: "Communication language",
    form_submit: "Create",
    form_cancel: "Cancel",
    form_ownerNote: "{name} becomes the contact owner.",
    form_close: "Close",
    err_required: "Fill in this field",
    err_email: "Check the email address",
    err_phone: "Check the phone number",
    err_channel: "Enter an email address or a phone number",
    rec_back: "Back to contacts",
    rec_owner: "Contact owner",
    rec_details: "Main details",
    rec_edit: "Edit",
    rec_save: "Save",
    rec_cancel: "Cancel",
    rec_saved: "Changes accepted on this page",
    rec_company: "Company",
    rec_country: "Country",
    rec_tags: "Tags",
    rec_jobTitle: "Job title",
    rec_stage: "Contact stage",
    rec_language: "Communication language",
    rec_email: "Email",
    rec_phone: "Phone",
    tab_activity: "Activity",
    tab_tasks: "Tasks",
    tab_notes: "Notes",
    act_filter: "Event type",
    act_all: "All types",
    act_demoNote: "The feed shows events for this contact.",
    a_created: "Contact created",
    a_stage: "Contact stage: {stage}",
    a_email: "Email",
    a_call: "Call",
    a_note: "Note",
    a_task: "Task",
    task_placeholder: "What needs to be done",
    task_add: "Add task",
    task_complete: "Complete task",
    task_completed: "Completed",
    task_empty: "No tasks yet",
    note_placeholder: "Note text",
    note_add: "Add note",
    note_empty: "No notes yet",
    lang_ru: "Russian",
    lang_en: "English",
    lang_es: "Spanish",
  },
  es: {
    nav_contacts: "Contactos",
    nav_deals: "Negociaciones",
    nav_tasks: "Tareas",
    nav_companies: "Empresas",
    nav_soon: "Esta sección todavía no está disponible en esta página",
    proto_note: "Los cambios en esta página no se guardan.",
    proto_lang: "Idioma de la página",
    proto_theme_light: "Tema claro",
    proto_theme_dark: "Tema oscuro",
    proto_role: "Ver como rol",
    proto_scenario: "Estado de la lista",
    role_owner: "Propietario",
    role_admin: "Administrador",
    role_manager: "Gerente",
    role_limitedManager: "Gerente limitado",
    role_observer: "Observador",
    scn_loading: "Cargando",
    scn_ready: "Lista preparada",
    scn_activeFilters: "Filtros activos",
    scn_emptySearch: "Búsqueda sin resultados",
    scn_emptyBase: "Base vacía",
    scn_unavailable: "No disponible temporalmente",
    scn_denied: "Sin permiso",
    scn_viewOnly: "Solo lectura",
    scn_inactive: "Registro inactivo",
    list_title: "Contactos",
    list_create: "Crear cliente",
    list_count: "Registros: {n}",
    list_search: "Buscar contactos",
    list_searchPlaceholder: "Nombre, correo, teléfono o empresa",
    f_owner: "Responsable",
    f_stage: "Etapa de trabajo",
    f_country: "País de la empresa",
    f_product: "Productos",
    f_any: "Cualquiera",
    f_active: "Filtros activos",
    f_reset: "Restablecer filtros",
    col_name: "Nombre",
    col_contacts: "Correo y teléfono",
    col_company: "Empresa y país",
    col_stage: "Etapa de trabajo",
    col_owner: "Responsable",
    col_activity: "Última actividad",
    col_actions: "Acciones",
    act_copy_email: "Copiar correo",
    act_copy_phone: "Copiar teléfono",
    act_copied: "Copiado",
    act_call: "Llamar",
    act_email: "Escribir un correo",
    act_open: "Abrir registro",
    st_loading: "La lista se está cargando",
    st_unavailable_title: "La lista no está disponible ahora",
    st_unavailable_body: "Inténtelo de nuevo en un minuto.",
    st_retry: "Reintentar",
    st_denied_title: "Esta sección está cerrada para su rol",
    st_denied_body: "Consulte al propietario de la cuenta de la empresa.",
    st_empty_title: "Todavía no hay contactos",
    st_empty_body: "Cree el primer cliente para empezar a trabajar.",
    st_emptySearch_title: "No se encontró nada",
    st_emptySearch_body:
      "La consulta y los filtros se mantienen. Cámbielos o restablezca los filtros.",
    badge_viewOnly: "Solo lectura",
    badge_inactive: "Registro inactivo",
    pg_prev: "Atrás",
    pg_next: "Siguiente",
    pg_page: "Página {n} de {m}",
    form_title: "Crear cliente",
    form_name: "Nombre",
    form_surname: "Apellido",
    form_company: "Empresa",
    form_company_new: "Nueva empresa",
    form_company_newName: "Nombre de la empresa",
    form_company_newCountry: "País de la empresa",
    form_stage: "Etapa de trabajo",
    form_email: "Correo electrónico",
    form_phone: "Teléfono",
    form_language: "Idioma de comunicación",
    form_submit: "Crear",
    form_cancel: "Cancelar",
    form_ownerNote: "{name} será el responsable.",
    form_close: "Cerrar",
    err_required: "Complete este campo",
    err_email: "Revise el correo electrónico",
    err_phone: "Revise el número de teléfono",
    err_channel: "Indique un correo electrónico o un teléfono",
    rec_back: "Volver a contactos",
    rec_owner: "Responsable",
    rec_details: "Datos principales",
    rec_edit: "Editar",
    rec_save: "Guardar",
    rec_cancel: "Cancelar",
    rec_saved: "Los cambios se aceptaron en esta página",
    rec_company: "Empresa",
    rec_country: "País",
    rec_tags: "Etiquetas",
    rec_jobTitle: "Cargo",
    rec_stage: "Etapa de trabajo",
    rec_language: "Idioma de comunicación",
    rec_email: "Correo electrónico",
    rec_phone: "Teléfono",
    tab_activity: "Actividad",
    tab_tasks: "Tareas",
    tab_notes: "Notas",
    act_filter: "Tipo de evento",
    act_all: "Todos los tipos",
    act_demoNote: "La cronología muestra los eventos de este contacto.",
    a_created: "Contacto creado",
    a_stage: "Etapa de trabajo: {stage}",
    a_email: "Correo",
    a_call: "Llamada",
    a_note: "Nota",
    a_task: "Tarea",
    task_placeholder: "Qué hay que hacer",
    task_add: "Añadir tarea",
    task_complete: "Completar tarea",
    task_completed: "Completada",
    task_empty: "Todavía no hay tareas",
    note_placeholder: "Texto de la nota",
    note_add: "Añadir nota",
    note_empty: "Todavía no hay notas",
    lang_ru: "Ruso",
    lang_en: "Inglés",
    lang_es: "Español",
  },
};

export const fillCopy = (template: string, values: Record<string, string>): string =>
  Object.entries(values).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(value),
    template,
  );
