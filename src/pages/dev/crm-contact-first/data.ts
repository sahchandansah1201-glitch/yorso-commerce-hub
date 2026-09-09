/**
 * Synthetic in-memory data for the contact-first interface stage.
 * Deterministic module memory only: no storage, no network, no real client data.
 */
import type { CrmLang, CrmRoleKey, CrmStage } from "./copy";

export type CrmEmployee = {
  id: string;
  name: string;
  /** Team used for manager visibility rules. */
  teamId: "nordic" | "iberia";
};

export const CRM_EMPLOYEES: Record<CrmRoleKey, CrmEmployee> = {
  owner: { id: "e-owner", name: "Ingrid Halvorsen", teamId: "nordic" },
  admin: { id: "e-admin", name: "Pablo Ortega", teamId: "iberia" },
  manager: { id: "e-manager", name: "Marta Ruiz", teamId: "nordic" },
  limitedManager: { id: "e-limited", name: "Lars Kvale", teamId: "nordic" },
  observer: { id: "e-observer", name: "Anna Petrova", teamId: "iberia" },
};

export const CRM_EMPLOYEE_LIST: CrmEmployee[] = [
  CRM_EMPLOYEES.owner,
  CRM_EMPLOYEES.admin,
  CRM_EMPLOYEES.manager,
  CRM_EMPLOYEES.limitedManager,
];

export type Localized = Record<CrmLang, string>;

export type CrmProductKey = "salmon" | "cod" | "shrimp" | "mackerel" | "tuna";

export const CRM_PRODUCT_LABELS: Record<CrmProductKey, Localized> = {
  salmon: { ru: "Лосось", en: "Salmon", es: "Salmón" },
  cod: { ru: "Треска", en: "Cod", es: "Bacalao" },
  shrimp: { ru: "Креветка", en: "Shrimp", es: "Camarón" },
  mackerel: { ru: "Скумбрия", en: "Mackerel", es: "Caballa" },
  tuna: { ru: "Тунец", en: "Tuna", es: "Atún" },
};

export type CrmCountryKey = "SE" | "NO" | "ES" | "FI" | "PT" | "PL" | "HR" | "DK" | "IT";

export const CRM_COUNTRY_LABELS: Record<CrmCountryKey, Localized> = {
  SE: { ru: "Швеция", en: "Sweden", es: "Suecia" },
  NO: { ru: "Норвегия", en: "Norway", es: "Noruega" },
  ES: { ru: "Испания", en: "Spain", es: "España" },
  FI: { ru: "Финляндия", en: "Finland", es: "Finlandia" },
  PT: { ru: "Португалия", en: "Portugal", es: "Portugal" },
  PL: { ru: "Польша", en: "Poland", es: "Polonia" },
  HR: { ru: "Хорватия", en: "Croatia", es: "Croacia" },
  DK: { ru: "Дания", en: "Denmark", es: "Dinamarca" },
  IT: { ru: "Италия", en: "Italy", es: "Italia" },
};

export type CrmCompany = {
  id: string;
  name: string;
  country: CrmCountryKey;
  products: CrmProductKey[];
};

export const CRM_COMPANIES: CrmCompany[] = [
  { id: "nordic-retail", name: "Nordic Retail Group", country: "SE", products: ["salmon", "cod"] },
  { id: "bergen", name: "Bergen Cold Store", country: "NO", products: ["salmon", "mackerel"] },
  { id: "iberia-fish", name: "Iberia Fish Distribution", country: "ES", products: ["shrimp", "tuna"] },
  { id: "baltic", name: "Baltic Food Partners", country: "FI", products: ["cod", "mackerel"] },
  { id: "atlantico", name: "Atlântico Importação Marítima", country: "PT", products: ["tuna", "shrimp"] },
  { id: "vistula", name: "Vistula Seafood", country: "PL", products: ["cod"] },
  { id: "adria", name: "Adria Marine Supply", country: "HR", products: ["tuna"] },
  { id: "kattegat", name: "Kattegat Trading", country: "DK", products: ["salmon", "shrimp"] },
  { id: "mare", name: "Mare Nostrum Alimentari", country: "IT", products: ["tuna", "cod"] },
];

export type CrmActivityType = "created" | "stage" | "email" | "call" | "note" | "task";

export type CrmActivityEvent = {
  id: string;
  type: CrmActivityType;
  at: string;
  stage?: CrmStage;
  detail?: string;
};

export type CrmTask = { id: string; title: string; done: boolean };
export type CrmNote = { id: string; text: string; at: string };

export type CrmContact = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  companyId: string;
  stage: CrmStage;
  ownerId: string;
  teamId: "nordic" | "iberia";
  language: CrmLang;
  tags: Localized[];
  lastActivityAt: string;
  createdAt: string;
  active: boolean;
  deleted: boolean;
  activity: CrmActivityEvent[];
  tasks: CrmTask[];
  notes: CrmNote[];
};

const tag = (ru: string, en: string, es: string): Localized => ({ ru, en, es });

const baseActivity = (
  id: string,
  createdAt: string,
  stage: CrmStage,
  extra: CrmActivityEvent[] = [],
): CrmActivityEvent[] => [
  { id: `${id}-a1`, type: "created", at: createdAt },
  { id: `${id}-a2`, type: "stage", at: createdAt, stage },
  ...extra,
];

export const CRM_CONTACTS: CrmContact[] = [
  {
    id: "c1",
    firstName: "Sofia",
    lastName: "Lindqvist",
    jobTitle: "Head of Procurement",
    email: "sofia.lindqvist@nordic-retail.example",
    phone: "+46 8 550 12 90",
    companyId: "nordic-retail",
    stage: "Negotiation",
    ownerId: "e-manager",
    teamId: "nordic",
    language: "en",
    tags: [tag("Ключевой клиент", "Key client", "Cliente clave"), tag("Розница", "Retail", "Minorista")],
    lastActivityAt: "2026-09-07T09:15:00Z",
    createdAt: "2026-05-14T08:00:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c1", "2026-05-14T08:00:00Z", "Negotiation", [
      { id: "c1-a3", type: "email", at: "2026-09-01T10:20:00Z" },
      { id: "c1-a4", type: "call", at: "2026-09-07T09:15:00Z" },
    ]),
    tasks: [{ id: "c1-t1", title: "Prepare volume proposal", done: false }],
    notes: [{ id: "c1-n1", text: "Asks for weekly volumes from week 40.", at: "2026-09-01T10:25:00Z" }],
  },
  {
    id: "c2",
    firstName: "Mikael",
    lastName: "Berg",
    email: "mikael.berg@bergen-cold.example",
    companyId: "bergen",
    stage: "New",
    ownerId: "e-limited",
    teamId: "nordic",
    language: "en",
    tags: [tag("Новый запрос", "New request", "Nueva solicitud")],
    lastActivityAt: "2026-09-06T13:40:00Z",
    createdAt: "2026-09-05T11:00:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c2", "2026-09-05T11:00:00Z", "New", [
      { id: "c2-a3", type: "email", at: "2026-09-06T13:40:00Z" },
    ]),
    tasks: [],
    notes: [],
  },
  {
    id: "c3",
    firstName: "Ana",
    lastName: "Moreno",
    jobTitle: "Purchasing Manager",
    phone: "+34 91 402 88 10",
    companyId: "iberia-fish",
    stage: "Qualified",
    ownerId: "e-admin",
    teamId: "iberia",
    language: "es",
    tags: [tag("Оптовик", "Wholesale", "Mayorista")],
    lastActivityAt: "2026-09-04T15:05:00Z",
    createdAt: "2026-04-02T09:30:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c3", "2026-04-02T09:30:00Z", "Qualified", [
      { id: "c3-a3", type: "call", at: "2026-09-04T15:05:00Z" },
      { id: "c3-a4", type: "note", at: "2026-09-04T15:20:00Z" },
    ]),
    tasks: [{ id: "c3-t1", title: "Send certificate list", done: true }],
    notes: [{ id: "c3-n1", text: "Prefers calls in the afternoon.", at: "2026-09-04T15:20:00Z" }],
  },
  {
    id: "c4",
    firstName: "Jonas",
    lastName: "Nieminen",
    jobTitle: "Category Buyer",
    email: "jonas.nieminen@baltic-food.example",
    phone: "+358 9 771 22 40",
    companyId: "baltic",
    stage: "No Response",
    ownerId: "e-manager",
    teamId: "nordic",
    language: "en",
    tags: [tag("Сезонный", "Seasonal", "Estacional")],
    lastActivityAt: "2026-08-21T07:50:00Z",
    createdAt: "2026-03-11T10:15:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c4", "2026-03-11T10:15:00Z", "No Response", [
      { id: "c4-a3", type: "email", at: "2026-08-21T07:50:00Z" },
    ]),
    tasks: [],
    notes: [],
  },
  {
    id: "c5",
    firstName: "Lucía",
    lastName: "Fernández",
    jobTitle: "Import Director",
    email: "lucia.fernandez@atlantico-importacao.example",
    phone: "+351 21 330 55 12",
    companyId: "atlantico",
    stage: "Unqualified",
    ownerId: "e-limited",
    teamId: "iberia",
    language: "es",
    tags: [tag("Импорт", "Import", "Importación")],
    lastActivityAt: "2026-08-30T12:00:00Z",
    createdAt: "2026-02-19T13:45:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c5", "2026-02-19T13:45:00Z", "Unqualified", [
      { id: "c5-a3", type: "note", at: "2026-08-30T12:00:00Z" },
    ]),
    tasks: [],
    notes: [{ id: "c5-n1", text: "Volume below minimum for now.", at: "2026-08-30T12:00:00Z" }],
  },
  {
    id: "c6",
    firstName: "Piotr",
    lastName: "Zieliński",
    email: "piotr.zielinski@vistula-seafood.example",
    phone: "+48 22 610 44 30",
    companyId: "vistula",
    stage: "Irrelevant",
    ownerId: "e-admin",
    teamId: "nordic",
    language: "en",
    tags: [],
    lastActivityAt: "2026-07-15T09:00:00Z",
    createdAt: "2026-01-23T08:20:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c6", "2026-01-23T08:20:00Z", "Irrelevant"),
    tasks: [],
    notes: [],
  },
  {
    id: "c7",
    firstName: "Marta",
    lastName: "Kovač",
    jobTitle: "Supply Chain Lead",
    email: "marta.kovac@adria-marine.example",
    phone: "+385 1 480 77 21",
    companyId: "adria",
    stage: "Negotiation",
    ownerId: "e-manager",
    teamId: "iberia",
    language: "en",
    tags: [tag("Тунец", "Tuna", "Atún")],
    lastActivityAt: "2026-09-02T16:30:00Z",
    createdAt: "2026-06-08T09:10:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c7", "2026-06-08T09:10:00Z", "Negotiation", [
      { id: "c7-a3", type: "call", at: "2026-09-02T16:30:00Z" },
    ]),
    tasks: [{ id: "c7-t1", title: "Confirm delivery terms", done: false }],
    notes: [],
  },
  {
    id: "c8",
    firstName: "Henrik",
    lastName: "Sørensen",
    jobTitle: "Owner",
    email: "henrik.sorensen@kattegat-trading.example",
    phone: "+45 33 12 66 04",
    companyId: "kattegat",
    stage: "Qualified",
    ownerId: "e-owner",
    teamId: "nordic",
    language: "en",
    tags: [tag("Постоянный", "Recurring", "Recurrente")],
    lastActivityAt: "2026-09-08T08:05:00Z",
    createdAt: "2025-11-04T07:40:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c8", "2025-11-04T07:40:00Z", "Qualified", [
      { id: "c8-a3", type: "email", at: "2026-09-08T08:05:00Z" },
    ]),
    tasks: [],
    notes: [],
  },
  {
    id: "c9",
    firstName: "Elena",
    lastName: "Rossi",
    jobTitle: "Buyer",
    email: "elena.rossi@mare-nostrum.example",
    companyId: "mare",
    stage: "Unqualified",
    ownerId: "e-admin",
    teamId: "iberia",
    language: "es",
    tags: [],
    lastActivityAt: "2026-06-11T10:00:00Z",
    createdAt: "2026-01-09T10:00:00Z",
    active: false,
    deleted: false,
    activity: baseActivity("c9", "2026-01-09T10:00:00Z", "Unqualified"),
    tasks: [],
    notes: [],
  },
  {
    id: "c10",
    firstName: "Tomás",
    lastName: "Silva",
    phone: "+351 22 205 91 60",
    companyId: "atlantico",
    stage: "New",
    ownerId: "e-limited",
    teamId: "iberia",
    language: "es",
    tags: [tag("Первый контакт", "First contact", "Primer contacto")],
    lastActivityAt: "2026-09-03T11:25:00Z",
    createdAt: "2026-09-01T09:00:00Z",
    active: true,
    deleted: false,
    activity: baseActivity("c10", "2026-09-01T09:00:00Z", "New", [
      { id: "c10-a3", type: "call", at: "2026-09-03T11:25:00Z" },
    ]),
    tasks: [],
    notes: [],
  },
  {
    id: "c11",
    firstName: "Oskar",
    lastName: "Ahlberg",
    email: "oskar.ahlberg@nordic-retail.example",
    companyId: "nordic-retail",
    stage: "Irrelevant",
    ownerId: "e-owner",
    teamId: "nordic",
    language: "en",
    tags: [],
    lastActivityAt: "2026-04-18T09:00:00Z",
    createdAt: "2025-12-01T09:00:00Z",
    active: false,
    // Deleted records stay out of the ordinary list.
    deleted: true,
    activity: baseActivity("c11", "2025-12-01T09:00:00Z", "Irrelevant"),
    tasks: [],
    notes: [],
  },
];

export const CRM_PAGE_SIZE = 6;

export const findCompany = (id: string, companies: CrmCompany[]): CrmCompany | undefined =>
  companies.find((c) => c.id === id);

export const employeeName = (id: string, extra: CrmEmployee[] = []): string =>
  [...CRM_EMPLOYEE_LIST, ...extra].find((e) => e.id === id)?.name ?? "—";

export const formatDate = (iso: string, lang: CrmLang): string => {
  const locale = lang === "ru" ? "ru-RU" : lang === "es" ? "es-ES" : "en-GB";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
};
