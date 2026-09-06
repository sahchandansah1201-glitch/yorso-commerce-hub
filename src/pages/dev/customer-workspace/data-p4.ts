/**
 * Deterministic in-memory records for the P4 prototype: companies, contacts,
 * tasks, notes and deleted records of the single current company.
 * No parallel API or data model, no storage, no network.
 *
 * Every visible value is localized (RU / EN / ES). `updated` is the machine
 * sortable value; `updatedLabel` is presentation only.
 */
import type { ProtoLang } from "./copy";
import type { P4RecordKind } from "./copy-p4";

export interface P4Detail {
  label: Record<ProtoLang, string>;
  value: Record<ProtoLang, string>;
}

export interface P4Record {
  id: string;
  kind: P4RecordKind;
  title: Record<ProtoLang, string>;
  subtitle: Record<ProtoLang, string>;
  /** Localized display name of the responsible employee. */
  responsible: Record<ProtoLang, string>;
  active: boolean;
  /** Machine sortable ISO timestamp. Never shown to the user. */
  updated: string;
  /** Localized dd.mm.yyyy presentation of `updated`. */
  updatedLabel: Record<ProtoLang, string>;
  companyId?: string;
  details: P4Detail[];
}

const detail = (
  label: [string, string, string],
  value: [string, string, string],
): P4Detail => ({
  label: { ru: label[0], en: label[1], es: label[2] },
  value: { ru: value[0], en: value[1], es: value[2] },
});

/** dd.mm.yyyy HH:MM label shared by all three languages. */
const stamp = (label: string): Record<ProtoLang, string> => ({
  ru: label,
  en: label,
  es: label,
});

const person = (name: string): Record<ProtoLang, string> => ({
  ru: name,
  en: name,
  es: name,
});

const COUNTRY = ["Страна", "Country", "País"] as [string, string, string];
const CITY = ["Город", "City", "Ciudad"] as [string, string, string];
const WORKING_ROLE = ["Роль в работе", "Working role", "Rol de trabajo"] as [
  string,
  string,
  string,
];
const POSITION = ["Должность", "Position", "Puesto"] as [string, string, string];
const LANGUAGE = ["Язык общения", "Working language", "Idioma de trabajo"] as [
  string,
  string,
  string,
];
const PRIORITY = ["Приоритет", "Priority", "Prioridad"] as [string, string, string];
const SOURCE = ["Источник", "Source", "Origen"] as [string, string, string];

export const P4_COMPANIES: P4Record[] = [
  {
    id: "bergen",
    kind: "company",
    title: { ru: "Bergen Cold Store", en: "Bergen Cold Store", es: "Bergen Cold Store" },
    subtitle: { ru: "Холодный склад", en: "Cold storage", es: "Almacén frigorífico" },
    responsible: person("Ingrid Halvorsen"),
    active: true,
    updated: "2026-09-05T10:30",
    updatedLabel: stamp("05.09.2026 10:30"),
    details: [
      detail(COUNTRY, ["Норвегия", "Norway", "Noruega"]),
      detail(CITY, ["Берген", "Bergen", "Bergen"]),
      detail(WORKING_ROLE, ["Складской партнёр", "Storage partner", "Socio de almacenamiento"]),
    ],
  },
  {
    id: "vigo",
    kind: "company",
    title: { ru: "Vigo Fish Trading", en: "Vigo Fish Trading", es: "Vigo Fish Trading" },
    subtitle: { ru: "Покупатель", en: "Buyer", es: "Comprador" },
    responsible: person("Pablo Ortega"),
    active: true,
    updated: "2026-09-03T16:00",
    updatedLabel: stamp("03.09.2026 16:00"),
    details: [
      detail(COUNTRY, ["Испания", "Spain", "España"]),
      detail(CITY, ["Виго", "Vigo", "Vigo"]),
      detail(WORKING_ROLE, ["Оптовый покупатель", "Wholesale buyer", "Comprador mayorista"]),
    ],
  },
  {
    id: "lisbon",
    kind: "company",
    title: { ru: "Lisbon Retail Group", en: "Lisbon Retail Group", es: "Lisbon Retail Group" },
    subtitle: { ru: "Розничная сеть", en: "Retail chain", es: "Cadena minorista" },
    responsible: person("Marta Sun"),
    active: false,
    updated: "2026-08-28T08:45",
    updatedLabel: stamp("28.08.2026 08:45"),
    details: [
      detail(COUNTRY, ["Португалия", "Portugal", "Portugal"]),
      detail(CITY, ["Лиссабон", "Lisbon", "Lisboa"]),
      detail(WORKING_ROLE, ["Розничная сеть", "Retail chain", "Cadena minorista"]),
    ],
  },
  {
    id: "gdansk",
    kind: "company",
    title: { ru: "Gdansk Processing", en: "Gdansk Processing", es: "Gdansk Processing" },
    subtitle: { ru: "Переработка", en: "Processing", es: "Procesamiento" },
    responsible: person("Ingrid Halvorsen"),
    active: true,
    updated: "2026-09-01T09:40",
    updatedLabel: stamp("01.09.2026 09:40"),
    details: [
      detail(COUNTRY, ["Польша", "Poland", "Polonia"]),
      detail(CITY, ["Гданьск", "Gdansk", "Gdansk"]),
      detail(WORKING_ROLE, [
        "Партнёр по переработке",
        "Processing partner",
        "Socio de procesamiento",
      ]),
    ],
  },
];

export const P4_CONTACTS: P4Record[] = [
  {
    id: "ingrid",
    kind: "contact",
    title: { ru: "Ингрид Хальворсен", en: "Ingrid Halvorsen", es: "Ingrid Halvorsen" },
    subtitle: { ru: "Закупки", en: "Procurement", es: "Compras" },
    responsible: person("Ingrid Halvorsen"),
    active: true,
    updated: "2026-09-05T12:10",
    updatedLabel: stamp("05.09.2026 12:10"),
    companyId: "bergen",
    details: [
      detail(POSITION, [
        "Руководитель закупок",
        "Head of procurement",
        "Responsable de compras",
      ]),
      detail(LANGUAGE, ["Английский / норвежский", "English / Norwegian", "Inglés / noruego"]),
    ],
  },
  {
    id: "pablo",
    kind: "contact",
    title: { ru: "Пабло Ортега", en: "Pablo Ortega", es: "Pablo Ortega" },
    subtitle: { ru: "Продажи", en: "Sales", es: "Ventas" },
    responsible: person("Pablo Ortega"),
    active: true,
    updated: "2026-09-04T15:25",
    updatedLabel: stamp("04.09.2026 15:25"),
    companyId: "vigo",
    details: [
      detail(POSITION, ["Менеджер по продажам", "Sales manager", "Gerente de ventas"]),
      detail(LANGUAGE, ["Испанский / английский", "Spanish / English", "Español / inglés"]),
    ],
  },
  {
    id: "marta",
    kind: "contact",
    title: { ru: "Марта Сун", en: "Marta Sun", es: "Marta Sun" },
    subtitle: { ru: "Логистика", en: "Logistics", es: "Logística" },
    responsible: person("Marta Sun"),
    active: true,
    updated: "2026-09-01T09:00",
    updatedLabel: stamp("01.09.2026 09:00"),
    companyId: "lisbon",
    details: [
      detail(POSITION, [
        "Координатор логистики",
        "Logistics coordinator",
        "Coordinadora de logística",
      ]),
      detail(LANGUAGE, [
        "Португальский / английский",
        "Portuguese / English",
        "Portugués / inglés",
      ]),
    ],
  },
  {
    id: "tomas",
    kind: "contact",
    title: { ru: "Томаш Новак", en: "Tomasz Nowak", es: "Tomasz Nowak" },
    subtitle: { ru: "Производство", en: "Production", es: "Producción" },
    responsible: person("Ingrid Halvorsen"),
    active: false,
    updated: "2026-08-27T14:05",
    updatedLabel: stamp("27.08.2026 14:05"),
    companyId: "gdansk",
    details: [
      detail(POSITION, ["Директор завода", "Plant manager", "Director de planta"]),
      detail(LANGUAGE, ["Польский / английский", "Polish / English", "Polaco / inglés"]),
    ],
  },
];

export const P4_TASKS: P4Record[] = [
  {
    id: "t1",
    kind: "task",
    title: {
      ru: "Подтвердить объём на октябрь",
      en: "Confirm the October volume",
      es: "Confirmar el volumen de octubre",
    },
    subtitle: { ru: "Срок 09.09.2026", en: "Due 09 Sep 2026", es: "Vence 09 sep 2026" },
    responsible: person("Ingrid Halvorsen"),
    active: true,
    updated: "2026-09-06T08:15",
    updatedLabel: stamp("06.09.2026 08:15"),
    companyId: "vigo",
    details: [detail(PRIORITY, ["Высокий", "High", "Alta"])],
  },
  {
    id: "t2",
    kind: "task",
    title: {
      ru: "Уточнить условия оплаты",
      en: "Clarify the payment terms",
      es: "Aclarar las condiciones de pago",
    },
    subtitle: { ru: "Срок 11.09.2026", en: "Due 11 Sep 2026", es: "Vence 11 sep 2026" },
    responsible: person("Pablo Ortega"),
    active: true,
    updated: "2026-09-05T18:40",
    updatedLabel: stamp("05.09.2026 18:40"),
    companyId: "vigo",
    details: [detail(PRIORITY, ["Средний", "Medium", "Media"])],
  },
  {
    id: "t3",
    kind: "task",
    title: {
      ru: "Согласовать график отгрузок",
      en: "Agree the shipping schedule",
      es: "Acordar el calendario de envíos",
    },
    subtitle: { ru: "Срок 15.09.2026", en: "Due 15 Sep 2026", es: "Vence 15 sep 2026" },
    responsible: person("Marta Sun"),
    active: false,
    updated: "2026-08-31T11:20",
    updatedLabel: stamp("31.08.2026 11:20"),
    companyId: "bergen",
    details: [detail(PRIORITY, ["Низкий", "Low", "Baja"])],
  },
];

export const P4_NOTES: P4Record[] = [
  {
    id: "n1",
    kind: "note",
    title: {
      ru: "Готовы к отгрузке из Бергена",
      en: "Ready to ship from Bergen",
      es: "Listos para enviar desde Bergen",
    },
    subtitle: { ru: "Договорённость", en: "Agreement", es: "Acuerdo" },
    responsible: person("Marta Sun"),
    active: true,
    updated: "2026-09-05T13:55",
    updatedLabel: stamp("05.09.2026 13:55"),
    companyId: "bergen",
    details: [detail(SOURCE, ["Звонок", "Call", "Llamada"])],
  },
  {
    id: "n2",
    kind: "note",
    title: {
      ru: "Просят пробную партию",
      en: "They ask for a trial lot",
      es: "Piden un lote de prueba",
    },
    subtitle: { ru: "Наблюдение", en: "Observation", es: "Observación" },
    responsible: person("Pablo Ortega"),
    active: true,
    updated: "2026-09-02T10:20",
    updatedLabel: stamp("02.09.2026 10:20"),
    companyId: "vigo",
    details: [detail(SOURCE, ["Встреча", "Meeting", "Reunión"])],
  },
  {
    id: "n3",
    kind: "note",
    title: {
      ru: "Проверить сертификаты завода",
      en: "Check the plant certificates",
      es: "Revisar los certificados de la planta",
    },
    subtitle: { ru: "Наблюдение", en: "Observation", es: "Observación" },
    responsible: person("Ingrid Halvorsen"),
    active: true,
    updated: "2026-08-30T16:35",
    updatedLabel: stamp("30.08.2026 16:35"),
    companyId: "gdansk",
    details: [detail(SOURCE, ["Визит", "Visit", "Visita"])],
  },
];

export const P4_DELETED: P4Record[] = [
  {
    id: "oslo",
    kind: "company",
    title: { ru: "Oslo Market Supply", en: "Oslo Market Supply", es: "Oslo Market Supply" },
    subtitle: { ru: "Покупатель", en: "Buyer", es: "Comprador" },
    responsible: person("Ingrid Halvorsen"),
    active: false,
    updated: "2026-08-20T12:00",
    updatedLabel: stamp("20.08.2026 12:00"),
    details: [detail(COUNTRY, ["Норвегия", "Norway", "Noruega"])],
  },
  {
    id: "hanna",
    kind: "contact",
    title: { ru: "Ханна Ли", en: "Hanna Lee", es: "Hanna Lee" },
    subtitle: { ru: "Закупки", en: "Procurement", es: "Compras" },
    responsible: person("Pablo Ortega"),
    active: false,
    updated: "2026-08-18T09:15",
    updatedLabel: stamp("18.08.2026 09:15"),
    companyId: "oslo",
    details: [detail(POSITION, ["Закупщик", "Buyer", "Comprador"])],
  },
];

export const P4_ALL_RECORDS: P4Record[] = [
  ...P4_COMPANIES,
  ...P4_CONTACTS,
  ...P4_TASKS,
  ...P4_NOTES,
];

/**
 * Related records of `record`, resolved inside the given pool so locally
 * changed titles, created records and restored records are reflected.
 */
export const p4RelatedFor = (record: P4Record, pool: P4Record[]): P4Record[] => {
  if (record.kind === "company") {
    return pool.filter((r) => r.companyId === record.id);
  }
  // Без родительской компании связей нет: отсутствующий companyId никогда не
  // объединяет несвязанные корневые записи.
  if (!record.companyId) return [];
  const company = pool.find((c) => c.kind === "company" && c.id === record.companyId);
  const siblings = pool.filter(
    (r) => r.companyId === record.companyId && r.id !== record.id,
  );
  return company ? [company, ...siblings] : siblings;
};
