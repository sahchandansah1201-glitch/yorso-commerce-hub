/**
 * Deterministic in-memory records for the P4 prototype: companies, contacts,
 * tasks, notes and deleted records of the single current company.
 * No parallel API or data model, no storage, no network.
 */
import type { ProtoLang } from "./copy";
import type { P4RecordKind } from "./copy-p4";

export interface P4Detail {
  label: Record<ProtoLang, string>;
  value: string;
}

export interface P4Record {
  id: string;
  kind: P4RecordKind;
  title: Record<ProtoLang, string>;
  subtitle: Record<ProtoLang, string>;
  responsible: string;
  active: boolean;
  updated: string;
  companyId?: string;
  details: P4Detail[];
}

const detail = (ru: string, en: string, es: string, value: string): P4Detail => ({
  label: { ru, en, es },
  value,
});

export const P4_COMPANIES: P4Record[] = [
  {
    id: "bergen",
    kind: "company",
    title: { ru: "Bergen Cold Store", en: "Bergen Cold Store", es: "Bergen Cold Store" },
    subtitle: { ru: "Холодный склад", en: "Cold storage", es: "Almacén frigorífico" },
    responsible: "Ingrid Halvorsen",
    active: true,
    updated: "05.09.2026 10:30",
    details: [
      detail("Страна", "Country", "País", "Norway"),
      detail("Город", "City", "Ciudad", "Bergen"),
      detail("Роль в работе", "Working role", "Rol de trabajo", "Storage partner"),
    ],
  },
  {
    id: "vigo",
    kind: "company",
    title: { ru: "Vigo Fish Trading", en: "Vigo Fish Trading", es: "Vigo Fish Trading" },
    subtitle: { ru: "Покупатель", en: "Buyer", es: "Comprador" },
    responsible: "Pablo Ortega",
    active: true,
    updated: "03.09.2026 16:00",
    details: [
      detail("Страна", "Country", "País", "Spain"),
      detail("Город", "City", "Ciudad", "Vigo"),
      detail("Роль в работе", "Working role", "Rol de trabajo", "Wholesale buyer"),
    ],
  },
  {
    id: "lisbon",
    kind: "company",
    title: { ru: "Lisbon Retail Group", en: "Lisbon Retail Group", es: "Lisbon Retail Group" },
    subtitle: { ru: "Розничная сеть", en: "Retail chain", es: "Cadena minorista" },
    responsible: "Marta Sun",
    active: false,
    updated: "28.08.2026 08:45",
    details: [
      detail("Страна", "Country", "País", "Portugal"),
      detail("Город", "City", "Ciudad", "Lisbon"),
      detail("Роль в работе", "Working role", "Rol de trabajo", "Retail chain"),
    ],
  },
  {
    id: "gdansk",
    kind: "company",
    title: { ru: "Gdansk Processing", en: "Gdansk Processing", es: "Gdansk Processing" },
    subtitle: { ru: "Переработка", en: "Processing", es: "Procesamiento" },
    responsible: "Ingrid Halvorsen",
    active: true,
    updated: "01.09.2026 09:40",
    details: [
      detail("Страна", "Country", "País", "Poland"),
      detail("Город", "City", "Ciudad", "Gdansk"),
      detail("Роль в работе", "Working role", "Rol de trabajo", "Processing partner"),
    ],
  },
];

export const P4_CONTACTS: P4Record[] = [
  {
    id: "ingrid",
    kind: "contact",
    title: { ru: "Ингрид Хальворсен", en: "Ingrid Halvorsen", es: "Ingrid Halvorsen" },
    subtitle: { ru: "Закупки", en: "Procurement", es: "Compras" },
    responsible: "Ingrid Halvorsen",
    active: true,
    updated: "05.09.2026 12:10",
    companyId: "bergen",
    details: [
      detail("Должность", "Position", "Puesto", "Head of procurement"),
      detail("Язык общения", "Working language", "Idioma de trabajo", "EN / NO"),
    ],
  },
  {
    id: "pablo",
    kind: "contact",
    title: { ru: "Пабло Ортега", en: "Pablo Ortega", es: "Pablo Ortega" },
    subtitle: { ru: "Продажи", en: "Sales", es: "Ventas" },
    responsible: "Pablo Ortega",
    active: true,
    updated: "04.09.2026 15:25",
    companyId: "vigo",
    details: [
      detail("Должность", "Position", "Puesto", "Sales manager"),
      detail("Язык общения", "Working language", "Idioma de trabajo", "ES / EN"),
    ],
  },
  {
    id: "marta",
    kind: "contact",
    title: { ru: "Марта Сун", en: "Marta Sun", es: "Marta Sun" },
    subtitle: { ru: "Логистика", en: "Logistics", es: "Logística" },
    responsible: "Marta Sun",
    active: true,
    updated: "01.09.2026 09:00",
    companyId: "lisbon",
    details: [
      detail("Должность", "Position", "Puesto", "Logistics coordinator"),
      detail("Язык общения", "Working language", "Idioma de trabajo", "PT / EN"),
    ],
  },
  {
    id: "tomas",
    kind: "contact",
    title: { ru: "Томаш Новак", en: "Tomasz Nowak", es: "Tomasz Nowak" },
    subtitle: { ru: "Производство", en: "Production", es: "Producción" },
    responsible: "Ingrid Halvorsen",
    active: false,
    updated: "27.08.2026 14:05",
    companyId: "gdansk",
    details: [
      detail("Должность", "Position", "Puesto", "Plant manager"),
      detail("Язык общения", "Working language", "Idioma de trabajo", "PL / EN"),
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
    responsible: "Ingrid Halvorsen",
    active: true,
    updated: "06.09.2026 08:15",
    companyId: "vigo",
    details: [detail("Приоритет", "Priority", "Prioridad", "High")],
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
    responsible: "Pablo Ortega",
    active: true,
    updated: "05.09.2026 18:40",
    companyId: "vigo",
    details: [detail("Приоритет", "Priority", "Prioridad", "Medium")],
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
    responsible: "Marta Sun",
    active: false,
    updated: "31.08.2026 11:20",
    companyId: "bergen",
    details: [detail("Приоритет", "Priority", "Prioridad", "Low")],
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
    responsible: "Marta Sun",
    active: true,
    updated: "05.09.2026 13:55",
    companyId: "bergen",
    details: [detail("Источник", "Source", "Origen", "Call")],
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
    responsible: "Pablo Ortega",
    active: true,
    updated: "02.09.2026 10:20",
    companyId: "vigo",
    details: [detail("Источник", "Source", "Origen", "Meeting")],
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
    responsible: "Ingrid Halvorsen",
    active: true,
    updated: "30.08.2026 16:35",
    companyId: "gdansk",
    details: [detail("Источник", "Source", "Origen", "Visit")],
  },
];

export const P4_DELETED: P4Record[] = [
  {
    id: "oslo",
    kind: "company",
    title: { ru: "Oslo Market Supply", en: "Oslo Market Supply", es: "Oslo Market Supply" },
    subtitle: { ru: "Покупатель", en: "Buyer", es: "Comprador" },
    responsible: "Ingrid Halvorsen",
    active: false,
    updated: "20.08.2026 12:00",
    details: [detail("Страна", "Country", "País", "Norway")],
  },
  {
    id: "hanna",
    kind: "contact",
    title: { ru: "Ханна Ли", en: "Hanna Lee", es: "Hanna Lee" },
    subtitle: { ru: "Закупки", en: "Procurement", es: "Compras" },
    responsible: "Pablo Ortega",
    active: false,
    updated: "18.08.2026 09:15",
    companyId: "oslo",
    details: [detail("Должность", "Position", "Puesto", "Buyer")],
  },
];

export const P4_ALL_RECORDS: P4Record[] = [
  ...P4_COMPANIES,
  ...P4_CONTACTS,
  ...P4_TASKS,
  ...P4_NOTES,
];

export const p4RelatedFor = (record: P4Record): P4Record[] => {
  if (record.kind === "company") {
    return P4_ALL_RECORDS.filter((r) => r.companyId === record.id);
  }
  const company = P4_COMPANIES.find((c) => c.id === record.companyId);
  const siblings = P4_ALL_RECORDS.filter(
    (r) => r.companyId === record.companyId && r.id !== record.id,
  );
  return company ? [company, ...siblings] : siblings;
};
