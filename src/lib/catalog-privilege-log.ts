/**
 * catalog-privilege-log.ts
 *
 * Расширенное логирование Postgres-ошибок 42501 (insufficient_privilege),
 * возникающих в catalog-api (fetchOffers/fetchOfferById, RPC qualified-*).
 *
 * Что делает:
 *   1. На каждый инцидент пишет подробный console.error со всем контекстом
 *      (operation, access_level, offer_id, pg code/message/details/hint, url, ts).
 *   2. Шлёт analytics-событие `catalog_privilege_error`.
 *   3. Накапливает инциденты в скользящем окне (5 минут).
 *      При достижении порога (3 инцидента) — один раз шлёт алерт
 *      `catalog_privilege_alert` и пишет console.error с пометкой ALERT.
 *      Дальше алерт по этому же ключу подавляется на длину окна.
 *
 * Формат хранения окна — sessionStorage, чтобы пережить ре-маунты SPA,
 * но не «прилипать» к пользователю навсегда.
 */

import analytics from "@/lib/analytics";
import type { AccessLevel } from "@/lib/access-level";

const STORAGE_KEY = "yorso:catalog-privilege-incidents";
const WINDOW_MS = 5 * 60 * 1000;
const ALERT_THRESHOLD = 3;
const PG_CODE = "42501";

export type CatalogOperation =
  | "fetchOffers"
  | "fetchOfferById"
  | "get_qualified_offers"
  | "get_qualified_offer";

interface PgLikeError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

interface IncidentRecord {
  ts: number;
  operation: CatalogOperation;
  access_level: AccessLevel;
  message: string;
  alerted?: boolean;
}

const isPrivilegeError = (err: unknown): err is PgLikeError => {
  if (!err || typeof err !== "object") return false;
  const code = (err as PgLikeError).code;
  return code === PG_CODE;
};

const readStore = (): IncidentRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as IncidentRecord[];
  } catch {
    return [];
  }
};

const writeStore = (records: IncidentRecord[]) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* quota / disabled — silent */
  }
};

const prune = (records: IncidentRecord[], now: number): IncidentRecord[] =>
  records.filter((r) => now - r.ts <= WINDOW_MS);

interface LogContext {
  operation: CatalogOperation;
  accessLevel: AccessLevel;
  offerId?: string;
  error: unknown;
}

/**
 * Вызывайте из catalog-api на КАЖДЫЙ catch/error-возврат, передав сырую ошибку.
 * Если код не 42501 — функция тихо возвращает false и ничего не делает.
 * Возвращает true, если был обработан инцидент 42501.
 */
export const logCatalogPrivilegeError = ({
  operation,
  accessLevel,
  offerId,
  error,
}: LogContext): boolean => {
  if (!isPrivilegeError(error)) return false;

  const now = Date.now();
  const message = error.message ?? "insufficient_privilege";
  const details = error.details ?? undefined;
  const hint = error.hint ?? undefined;

  // 1. Подробный console.error.
  console.error("[catalog-api][42501] insufficient_privilege", {
    operation,
    access_level: accessLevel,
    offer_id: offerId,
    pg_code: PG_CODE,
    message,
    details,
    hint,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    timestamp: new Date(now).toISOString(),
  });

  // 2. Analytics-инцидент.
  analytics.track("catalog_privilege_error", {
    operation,
    offer_id: offerId,
    access_level: accessLevel,
    pg_code: PG_CODE,
    message,
    hint,
    details,
  });

  // 3. Окно/алерт.
  const records = prune(readStore(), now);
  records.push({ ts: now, operation, access_level: accessLevel, message });

  const sameKey = records.filter(
    (r) => r.operation === operation && r.access_level === accessLevel,
  );
  const alreadyAlerted = sameKey.some((r) => r.alerted);

  if (sameKey.length >= ALERT_THRESHOLD && !alreadyAlerted) {
    // Помечаем последний инцидент как alerted, чтобы не дублировать.
    records[records.length - 1].alerted = true;

    console.error("[catalog-api][42501][ALERT] repeated insufficient_privilege incidents", {
      operation,
      access_level: accessLevel,
      incidents_in_window: sameKey.length,
      window_seconds: WINDOW_MS / 1000,
      last_message: message,
    });

    analytics.track("catalog_privilege_alert", {
      operation,
      access_level: accessLevel,
      incidents_in_window: sameKey.length,
      window_seconds: WINDOW_MS / 1000,
      last_message: message,
    });
  }

  writeStore(records);
  return true;
};

/** Тестовый хелпер — очистить окно. */
export const __resetCatalogPrivilegeLog = () => {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
};
