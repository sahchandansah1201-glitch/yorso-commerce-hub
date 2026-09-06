/**
 * Deterministic module-memory demo data for P1 (service review) and P2
 * (employees and access). No storage, no network, stable across renders.
 */
import type { ProtoLang, ProtoRoleKey } from "./copy";
import type { CapabilityStatusKey } from "./copy-access";

export interface CapabilityRow {
  id: string;
  feature: Record<ProtoLang, string>;
  status: CapabilityStatusKey;
  limitation: Record<ProtoLang, string>;
  risk: Record<ProtoLang, string>;
  decision: Record<ProtoLang, string>;
}

const cap = (
  id: string,
  feature: [string, string, string],
  status: CapabilityStatusKey,
  limitation: [string, string, string],
  risk: [string, string, string],
  decision: [string, string, string],
): CapabilityRow => ({
  id,
  feature: { ru: feature[0], en: feature[1], es: feature[2] },
  status,
  limitation: { ru: limitation[0], en: limitation[1], es: limitation[2] },
  risk: { ru: risk[0], en: risk[1], es: risk[2] },
  decision: { ru: decision[0], en: decision[1], es: decision[2] },
});

export const CAPABILITY_ROWS: CapabilityRow[] = [
  cap(
    "company-cards",
    ["Карточки компаний", "Company cards", "Fichas de empresas"],
    "available",
    ["Без пользовательских полей", "No custom fields", "Sin campos personalizados"],
    ["Низкий", "Low", "Bajo"],
    ["Требует решения", "Requires decision", "Requiere decisión"],
  ),
  cap(
    "contact-cards",
    ["Карточки контактов", "Contact cards", "Fichas de contactos"],
    "available",
    ["Один контакт — одна компания", "One contact — one company", "Un contacto, una empresa"],
    ["Низкий", "Low", "Bajo"],
    ["Требует решения", "Requires decision", "Requiere decisión"],
  ),
  cap(
    "tasks-notes",
    ["Задачи и заметки", "Tasks and notes", "Tareas y notas"],
    "requiresVerification",
    ["Напоминания не проверены", "Reminders not verified", "Recordatorios sin verificar"],
    ["Средний", "Medium", "Medio"],
    ["Требует решения", "Requires decision", "Requiere decisión"],
  ),
  cap(
    "relationships",
    ["Связи между записями", "Record relationships", "Relaciones entre registros"],
    "requiresVerification",
    ["Глубина связей ограничена", "Limited relationship depth", "Profundidad de relaciones limitada"],
    ["Средний", "Medium", "Medio"],
    ["Требует решения", "Requires decision", "Requiere decisión"],
  ),
  cap(
    "filters-search",
    ["Фильтры и поиск", "Filters and search", "Filtros y búsqueda"],
    "requiresAnotherEdition",
    ["Сохранённые наборы недоступны", "Saved sets unavailable", "Conjuntos guardados no disponibles"],
    ["Средний", "Medium", "Medio"],
    ["Требует решения", "Requires decision", "Requiere decisión"],
  ),
  cap(
    "import-export",
    ["Загрузка и выгрузка", "Import and export", "Importación y exportación"],
    "deferred",
    ["Только небольшие наборы", "Small sets only", "Solo conjuntos pequeños"],
    ["Высокий", "High", "Alto"],
    ["Требует решения", "Requires decision", "Requiere decisión"],
  ),
  cap(
    "deleted-records",
    ["Удалённые записи", "Deleted records", "Registros eliminados"],
    "prohibited",
    ["Срок хранения не согласован", "Retention period not agreed", "Periodo de conservación sin acordar"],
    ["Высокий", "High", "Alto"],
    ["Требует решения", "Requires decision", "Requiere decisión"],
  ),
];

export interface EmployeeRecord {
  id: string;
  name: string;
  role: Exclude<ProtoRoleKey, "service">;
  since: string;
  self?: boolean;
}

export const EMPLOYEE_RECORDS: EmployeeRecord[] = [
  { id: "ingrid", name: "Ingrid Halvorsen", role: "owner", since: "12.01.2026", self: true },
  { id: "pablo", name: "Pablo Ortega", role: "admin", since: "03.02.2026" },
  { id: "marta", name: "Marta Sun", role: "manager", since: "18.04.2026" },
  { id: "lars", name: "Lars Fossen", role: "viewer", since: "27.06.2026" },
];

export interface InvitationRecord {
  id: string;
  name: string;
  role: Exclude<ProtoRoleKey, "service">;
  sent: string;
}

export const INVITATION_RECORDS: InvitationRecord[] = [
  { id: "inv-1", name: "Sofia Marques", role: "manager", sent: "05.09.2026" },
  { id: "inv-2", name: "Jonas Berg", role: "viewer", sent: "02.09.2026" },
];

export const SELF_RECORDS: Record<Exclude<ProtoRoleKey, "service">, EmployeeRecord> = {
  owner: EMPLOYEE_RECORDS[0],
  admin: EMPLOYEE_RECORDS[1],
  manager: EMPLOYEE_RECORDS[2],
  viewer: EMPLOYEE_RECORDS[3],
};
