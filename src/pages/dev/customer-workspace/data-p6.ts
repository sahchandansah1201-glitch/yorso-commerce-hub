/**
 * P6 deterministic in-memory data: queue, alerts, update readiness, backup
 * register, recovery drill participants and targets. No customer data.
 */
import type { P6QueueKey } from "./copy-p6";

export const P6_QUEUE: { total: number; rows: { key: P6QueueKey; count: number }[] } = {
  total: 30,
  rows: [
    { key: "completed", count: 20 },
    { key: "waiting", count: 6 },
    { key: "processing", count: 1 },
    { key: "retryScheduled", count: 2 },
    { key: "exhausted", count: 1 },
  ],
};

export type P6Alert = {
  id: string;
  responsible: string;
  age: { ru: string; en: string; es: string };
  reason: { ru: string; en: string; es: string };
};

export const P6_ALERTS: P6Alert[] = [
  {
    id: "AL-2026-09-06-01",
    responsible: "S-01",
    age: { ru: "34 минуты", en: "34 minutes", es: "34 minutos" },
    reason: {
      ru: "Задача превысила ожидаемое время обработки",
      en: "Task exceeded the expected processing time",
      es: "La tarea superó el tiempo de procesamiento previsto",
    },
  },
  {
    id: "AL-2026-09-06-02",
    responsible: "S-02",
    age: { ru: "12 минут", en: "12 minutes", es: "12 minutos" },
    reason: {
      ru: "Попытки исчерпаны, требуется решение сотрудника",
      en: "Attempts exhausted, an employee decision is required",
      es: "Intentos agotados, se requiere la decisión de un empleado",
    },
  },
];

export type P6Check = {
  id: string;
  status: "pass" | "warning" | "blocker";
  label: { ru: string; en: string; es: string };
};

export const P6_CHECKS: P6Check[] = [
  { id: "c1", status: "pass", label: { ru: "Проверенная резервная копия", en: "Verified backup", es: "Copia verificada" } },
  { id: "c2", status: "pass", label: { ru: "Свободное место", en: "Free space", es: "Espacio libre" } },
  { id: "c3", status: "pass", label: { ru: "Очередь без роста", en: "Queue is not growing", es: "La cola no crece" } },
  { id: "c4", status: "pass", label: { ru: "План возврата описан", en: "Rollback plan documented", es: "Plan de reversión documentado" } },
  { id: "c5", status: "warning", label: { ru: "Два служебных подтверждения не записаны", en: "Two service confirmations are not recorded", es: "No se han registrado dos confirmaciones de servicio" } },
  { id: "c6", status: "pass", label: { ru: "Ответственные назначены", en: "Responsible employees assigned", es: "Empleados responsables asignados" } },
  { id: "c7", status: "pass", label: { ru: "Окно работ подтверждено", en: "Maintenance window confirmed", es: "Ventana de trabajo confirmada" } },
  { id: "c8", status: "blocker", label: { ru: "Решение владельца не получено", en: "Owner decision not received", es: "Decisión del propietario no recibida" } },
];

/** Label for c5 once two different service employees confirmed on this page. */
export const P6_CHECK_C5_PASS = {
  ru: "Два служебных подтверждения записаны",
  en: "Two service confirmations are recorded",
  es: "Se han registrado dos confirmaciones de servicio",
};

export const P6_VERSIONS = {
  candidate: "2026.09.2",
  current: "2026.08.4",
};

export const P6_BACKUP = {
  id: "backup-2026-09-06-2300",
};

export type P6ServiceEmployee = { id: string; name: string };

/** Service employees for the two-person recovery drill. */
export const P6_SERVICE_EMPLOYEES: P6ServiceEmployee[] = [
  { id: "S-01", name: "S-01" },
  { id: "S-02", name: "S-02" },
  { id: "S-03", name: "S-03" },
];

export const P6_TARGET_KEYS = [
  "availability",
  "warning",
  "processingDelay",
  "recoveryPoint",
  "recoveryTime",
  "load",
] as const;

export type P6TargetKey = (typeof P6_TARGET_KEYS)[number];
