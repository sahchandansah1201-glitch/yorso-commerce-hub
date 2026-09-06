/**
 * P5 dictionary — data transfer interface (RU / EN / ES).
 *
 * YORSO is one system for the user: no service names, no integration or
 * synchronization wording, no internal routes, keys or technologies.
 */
import type { ProtoLang } from "./copy";

export type P5StepKey =
  | "source"
  | "matching"
  | "preview"
  | "matches"
  | "execution"
  | "result";

export const P5_STEPS: P5StepKey[] = [
  "source",
  "matching",
  "preview",
  "matches",
  "execution",
  "result",
];

export type P5Choice = "link" | "create" | "skip";
export type P5Classification = "exact" | "ambiguous" | "new" | "error";

export type P5Dict = {
  wizardTitle: string;
  wizardHint: string;
  stepLabel: string;
  steps: Record<P5StepKey, string>;
  back: string;
  next: string;
  cancel: string;
  close: string;
  fileNotice: string;
  sourceLabel: string;
  sourceRows: string;
  columnSource: string;
  columnTarget: string;
  fields: Record<string, string>;
  previewHint: string;
  totalRows: string;
  totalCompanies: string;
  totalContacts: string;
  rowName: string;
  rowKind: string;
  kinds: { company: string; contact: string };
  classification: string;
  classifications: Record<P5Classification, string>;
  choice: string;
  choices: Record<P5Choice, string>;
  choiceRequired: string;
  errorNotExecutable: string;
  executionHint: string;
  executionConfirm: string;
  executionProgress: string;
  executionRunning: string;
  executionDone: string;
  resultTitle: string;
  resultCompleted: string;
  resultTemporaryFailure: string;
  resultRejected: string;
  resultSkipped: string;
  resultNotice: string;
  reportShow: string;
  reportHide: string;
  reportTitle: string;
  reportRowOutcome: string;
  outcomes: {
    completed: string;
    temporaryFailure: string;
    rejected: string;
    skipped: string;
  };
  /** Service-side data transfer tab. */
  serviceTabTransfer: string;
  serviceTransferTitle: string;
  serviceRunId: string;
  serviceChecksum: string;
  serviceSourceCounts: string;
  serviceWriteMode: string;
  serviceWriteModeValue: string;
  serviceOutcome: string;
  serviceOutcomeValue: string;
  serviceRowIds: string;
  serviceFailedIds: string;
  serviceRetry: string;
  serviceRetryTitle: string;
  serviceRetryBody: string;
  serviceReasonLabel: string;
  serviceReasonRequired: string;
  serviceRetryConfirm: string;
  serviceRetryResult: string;
};

const ru: P5Dict = {
  wizardTitle: "Загрузка данных",
  wizardHint: "Шесть шагов: источник, соответствие колонок, просмотр, совпадения, выполнение, результат.",
  stepLabel: "Шаг",
  steps: {
    source: "Файл и источник",
    matching: "Соответствие колонок",
    preview: "Просмотр",
    matches: "Совпадения и дубликаты",
    execution: "Выполнение",
    result: "Результат",
  },
  back: "Назад",
  next: "Далее",
  cancel: "Отменить",
  close: "Закрыть",
  fileNotice: "Файл проверяется только на этой странице. Данные не сохраняются.",
  sourceLabel: "Выберите проверочный файл",
  sourceRows: "строк",
  columnSource: "Колонка файла",
  columnTarget: "Поле YORSO",
  fields: {
    skip: "Не использовать",
    companyName: "Название компании",
    country: "Страна",
    contactName: "Имя контакта",
    email: "Электронная почта",
    phone: "Телефон",
    note: "Заметка",
  },
  previewHint: "Показаны отдельные строки файла и итоговые количества.",
  totalRows: "Всего строк",
  totalCompanies: "Компании",
  totalContacts: "Контакты",
  rowName: "Значение из файла",
  rowKind: "Тип записи",
  kinds: { company: "Компания", contact: "Контакт" },
  classification: "Состояние сравнения",
  classifications: {
    exact: "Точное совпадение",
    ambiguous: "Неоднозначное совпадение",
    new: "Новая запись",
    error: "Ошибка в строке",
  },
  choice: "Решение по строке",
  choices: { link: "Связать", create: "Создать", skip: "Пропустить" },
  choiceRequired: "Для неоднозначных строк выберите решение.",
  errorNotExecutable: "Строка с ошибкой не выполняется.",
  executionHint: "Проверьте решения по строкам и подтвердите выполнение. После подтверждения отмена недоступна.",
  executionConfirm: "Подтвердить выполнение",
  executionProgress: "Обработано {done} из {total}",
  executionRunning: "Выполняется на этой странице",
  executionDone: "Обработка завершена",
  resultTitle: "Результат загрузки",
  resultCompleted: "Обработано {done} из {total} строк",
  resultTemporaryFailure: "Временная неудача: {count}",
  resultRejected: "Отклонено из-за ошибок: {count}",
  resultSkipped: "Пропущено: {count}",
  resultNotice: "Результат показан на этой странице. Данные компании не изменены.",
  reportShow: "Показать отчёт",
  reportHide: "Скрыть отчёт",
  reportTitle: "Отчёт по строкам на этой странице",
  reportRowOutcome: "Итог",
  outcomes: {
    completed: "Обработано",
    temporaryFailure: "Временная неудача",
    rejected: "Отклонено",
    skipped: "Пропущено",
  },
  serviceTabTransfer: "Перенос данных",
  serviceTransferTitle: "Перенос данных",
  serviceRunId: "Идентификатор запуска",
  serviceChecksum: "Контрольная сумма",
  serviceSourceCounts: "Количество строк в источнике",
  serviceWriteMode: "Режим",
  serviceWriteModeValue: "Проверочный проход, запись не выполняется",
  serviceOutcome: "Итог",
  serviceOutcomeValue: "Частичный: {done} из {total}",
  serviceRowIds: "Идентификаторы строк",
  serviceFailedIds: "Строки с неудачей",
  serviceRetry: "Повторить выбранные ошибки",
  serviceRetryTitle: "Повторить выбранные ошибки",
  serviceRetryBody: "Укажите причину. Отметка действует только на этой странице и не изменяет данные.",
  serviceReasonLabel: "Причина",
  serviceReasonRequired: "Укажите причину.",
  serviceRetryConfirm: "Подтвердить",
  serviceRetryResult: "Итог на этой странице: {done} из {total}.",
};

const en: P5Dict = {
  wizardTitle: "Data upload",
  wizardHint: "Six steps: source, column matching, preview, matches, execution, result.",
  stepLabel: "Step",
  steps: {
    source: "File and source",
    matching: "Column matching",
    preview: "Preview",
    matches: "Matches and duplicates",
    execution: "Execution",
    result: "Result",
  },
  back: "Back",
  next: "Next",
  cancel: "Cancel",
  close: "Close",
  fileNotice: "The file is reviewed on this page only. No data is saved.",
  sourceLabel: "Select a check file",
  sourceRows: "rows",
  columnSource: "File column",
  columnTarget: "YORSO field",
  fields: {
    skip: "Do not use",
    companyName: "Company name",
    country: "Country",
    contactName: "Contact name",
    email: "Email address",
    phone: "Phone",
    note: "Note",
  },
  previewHint: "Selected file rows and exact totals are shown.",
  totalRows: "Total rows",
  totalCompanies: "Companies",
  totalContacts: "Contacts",
  rowName: "Value from file",
  rowKind: "Record type",
  kinds: { company: "Company", contact: "Contact" },
  classification: "Comparison state",
  classifications: {
    exact: "Exact match",
    ambiguous: "Ambiguous match",
    new: "New record",
    error: "Row error",
  },
  choice: "Row decision",
  choices: { link: "Link", create: "Create", skip: "Skip" },
  choiceRequired: "Choose a decision for every ambiguous row.",
  errorNotExecutable: "A row with an error is not executed.",
  executionHint: "Review the row decisions and confirm execution. Cancel is unavailable after confirmation.",
  executionConfirm: "Confirm execution",
  executionProgress: "Processed {done} of {total}",
  executionRunning: "Running on this page",
  executionDone: "Processing finished",
  resultTitle: "Upload result",
  resultCompleted: "Processed {done} of {total} rows",
  resultTemporaryFailure: "Temporary failure: {count}",
  resultRejected: "Rejected because of errors: {count}",
  resultSkipped: "Skipped: {count}",
  resultNotice: "The result is shown on this page. Company data was not changed.",
  reportShow: "Show report",
  reportHide: "Hide report",
  reportTitle: "Row report on this page",
  reportRowOutcome: "Outcome",
  outcomes: {
    completed: "Processed",
    temporaryFailure: "Temporary failure",
    rejected: "Rejected",
    skipped: "Skipped",
  },
  serviceTabTransfer: "Data transfer",
  serviceTransferTitle: "Data transfer",
  serviceRunId: "Run identifier",
  serviceChecksum: "Checksum",
  serviceSourceCounts: "Source row counts",
  serviceWriteMode: "Mode",
  serviceWriteModeValue: "Check pass, no write performed",
  serviceOutcome: "Outcome",
  serviceOutcomeValue: "Partial: {done} of {total}",
  serviceRowIds: "Row identifiers",
  serviceFailedIds: "Failed rows",
  serviceRetry: "Retry selected failures",
  serviceRetryTitle: "Retry selected failures",
  serviceRetryBody: "Enter a reason. The mark applies on this page only and does not change data.",
  serviceReasonLabel: "Reason",
  serviceReasonRequired: "Enter a reason.",
  serviceRetryConfirm: "Confirm",
  serviceRetryResult: "Outcome on this page: {done} of {total}.",
};

const es: P5Dict = {
  wizardTitle: "Carga de datos",
  wizardHint: "Seis pasos: origen, correspondencia de columnas, vista previa, coincidencias, ejecución, resultado.",
  stepLabel: "Paso",
  steps: {
    source: "Archivo y origen",
    matching: "Correspondencia de columnas",
    preview: "Vista previa",
    matches: "Coincidencias y duplicados",
    execution: "Ejecución",
    result: "Resultado",
  },
  back: "Atrás",
  next: "Siguiente",
  cancel: "Cancelar",
  close: "Cerrar",
  fileNotice: "El archivo se revisa solo en esta página. Los datos no se guardan.",
  sourceLabel: "Seleccione un archivo de comprobación",
  sourceRows: "filas",
  columnSource: "Columna del archivo",
  columnTarget: "Campo de YORSO",
  fields: {
    skip: "No utilizar",
    companyName: "Nombre de la empresa",
    country: "País",
    contactName: "Nombre del contacto",
    email: "Correo electrónico",
    phone: "Teléfono",
    note: "Nota",
  },
  previewHint: "Se muestran filas del archivo y los totales exactos.",
  totalRows: "Filas totales",
  totalCompanies: "Empresas",
  totalContacts: "Contactos",
  rowName: "Valor del archivo",
  rowKind: "Tipo de registro",
  kinds: { company: "Empresa", contact: "Contacto" },
  classification: "Estado de comparación",
  classifications: {
    exact: "Coincidencia exacta",
    ambiguous: "Coincidencia ambigua",
    new: "Registro nuevo",
    error: "Error en la fila",
  },
  choice: "Decisión de la fila",
  choices: { link: "Vincular", create: "Crear", skip: "Omitir" },
  choiceRequired: "Elija una decisión para cada fila ambigua.",
  errorNotExecutable: "Una fila con error no se ejecuta.",
  executionHint: "Revise las decisiones de las filas y confirme la ejecución. Cancelar no está disponible después de confirmar.",
  executionConfirm: "Confirmar la ejecución",
  executionProgress: "Procesadas {done} de {total}",
  executionRunning: "En curso en esta página",
  executionDone: "Procesamiento finalizado",
  resultTitle: "Resultado de la carga",
  resultCompleted: "Procesadas {done} de {total} filas",
  resultTemporaryFailure: "Fallo temporal: {count}",
  resultRejected: "Rechazadas por errores: {count}",
  resultSkipped: "Omitidas: {count}",
  resultNotice: "El resultado se muestra en esta página. Los datos de la empresa no se modificaron.",
  reportShow: "Mostrar el informe",
  reportHide: "Ocultar el informe",
  reportTitle: "Informe de filas en esta página",
  reportRowOutcome: "Resultado",
  outcomes: {
    completed: "Procesada",
    temporaryFailure: "Fallo temporal",
    rejected: "Rechazada",
    skipped: "Omitida",
  },
  serviceTabTransfer: "Transferencia de datos",
  serviceTransferTitle: "Transferencia de datos",
  serviceRunId: "Identificador de la ejecución",
  serviceChecksum: "Suma de comprobación",
  serviceSourceCounts: "Recuento de filas del origen",
  serviceWriteMode: "Modo",
  serviceWriteModeValue: "Pasada de comprobación, sin escritura",
  serviceOutcome: "Resultado",
  serviceOutcomeValue: "Parcial: {done} de {total}",
  serviceRowIds: "Identificadores de filas",
  serviceFailedIds: "Filas con fallo",
  serviceRetry: "Reintentar errores seleccionados",
  serviceRetryTitle: "Reintentar errores seleccionados",
  serviceRetryBody: "Indique el motivo. La marca solo se aplica en esta página y no cambia los datos.",
  serviceReasonLabel: "Motivo",
  serviceReasonRequired: "Indique el motivo.",
  serviceRetryConfirm: "Confirmar",
  serviceRetryResult: "Resultado en esta página: {done} de {total}.",
};

export const protoP5Copy: Record<ProtoLang, P5Dict> = { ru, en, es };
