/**
 * Хранит контекст последнего клика по preview-карточке поставщика
 * (supplier_id / species / form), чтобы связать его с последующим
 * событием `registration_start` на /register.
 *
 * Только frontend, sessionStorage. TTL 30 минут — клики старше
 * считаются неотносящимися к текущей попытке регистрации.
 */
import { peekRegistrationAttemptId } from "./registration-attempt";

const STORAGE_KEY = "yorso_preview_attribution";
const TTL_MS = 30 * 60 * 1000;

export interface PreviewAttribution {
  supplier_id: string;
  species: string;
  form: string;
  href: string;
  access_level: "anonymous_locked" | "registered_locked" | "qualified_unlocked";
  ts: number;
}

/**
 * Dev-only: компактная сводка контекста текущей попытки регистрации,
 * которую прикрепляем к каждому attribution-предупреждению, чтобы
 * быстрее восстанавливать цепочку click → registration в DevTools.
 */
function buildAttributionDebugSummary(missing: readonly string[]) {
  const attemptId = peekRegistrationAttemptId();
  let registrationSource: string | null = null;
  try {
    const raw = sessionStorage.getItem(SOURCE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { source?: unknown } | null;
      if (parsed && typeof parsed.source === "string") {
        registrationSource = parsed.source;
      }
    }
  } catch {
    // silent — debug helper не должен падать
  }
  return {
    attempt_id: attemptId,
    registration_source: registrationSource,
    missing: [...missing],
  };
}

/**
 * Dev-only агрегированные счётчики разрывов цепочки attribution.
 * Считаем, сколько раз каждое поле (supplier_id/species/form) было
 * пустым и в каких функциях это случалось чаще всего. Раз в ~2 секунды
 * выводим компактный сводный лог в консоль, чтобы не зашумлять её
 * каждым отдельным предупреждением.
 */
type MissingField = "supplier_id" | "species" | "form" | "<all>";

interface SourceStats {
  calls: number;
  incomplete: number;
  byField: Record<MissingField, number>;
}

interface MissingStats {
  totalCalls: number;
  totalIncomplete: number;
  byField: Record<MissingField, number>;
  bySource: Record<string, SourceStats>;
  lastFlushAt: number;
  flushTimer: ReturnType<typeof setTimeout> | null;
}

const emptyByField = (): Record<MissingField, number> => ({
  supplier_id: 0,
  species: 0,
  form: 0,
  "<all>": 0,
});

const missingStats: MissingStats = {
  totalCalls: 0,
  totalIncomplete: 0,
  byField: emptyByField(),
  bySource: {},
  lastFlushAt: 0,
  flushTimer: null,
};

function flushMissingStats(): void {
  if (!import.meta.env.DEV) return;
  if (missingStats.totalIncomplete === 0) return;
  const topSources = Object.entries(missingStats.bySource)
    .filter(([, s]) => s.incomplete > 0)
    .sort((a, b) => b[1].incomplete - a[1].incomplete)
    .slice(0, 5)
    .map(([source, s]) => ({
      source,
      incomplete: s.incomplete,
      calls: s.calls,
      byField: s.byField,
    }));
  // eslint-disable-next-line no-console
  console.log(
    `[debug] preview_attribution missing-fields summary: ${missingStats.totalIncomplete}/${missingStats.totalCalls} вызовов с пропусками`,
    {
      byField: missingStats.byField,
      topSources,
    },
  );
  missingStats.lastFlushAt = Date.now();
}

function scheduleFlush(): void {
  if (!import.meta.env.DEV) return;
  if (missingStats.flushTimer) return;
  missingStats.flushTimer = setTimeout(() => {
    missingStats.flushTimer = null;
    flushMissingStats();
  }, 2000);
}

/**
 * Dev-only: ручной сброс агрегата (для тестов/отладки).
 */
export function __resetPreviewAttributionStats(): void {
  missingStats.totalCalls = 0;
  missingStats.totalIncomplete = 0;
  missingStats.byField = emptyByField();
  missingStats.bySource = {};
  missingStats.lastFlushAt = 0;
  if (missingStats.flushTimer) {
    clearTimeout(missingStats.flushTimer);
    missingStats.flushTimer = null;
  }
}

/**
 * Dev-only: текущий снимок агрегата (для отладки/тестов).
 */
export function __getPreviewAttributionStats(): Readonly<MissingStats> {
  return missingStats;
}

function recordMissing(source: string, missing: MissingField[]): void {
  missingStats.totalCalls += 1;
  const bucket =
    missingStats.bySource[source] ??
    (missingStats.bySource[source] = {
      calls: 0,
      incomplete: 0,
      byField: emptyByField(),
    });
  bucket.calls += 1;
  if (missing.length === 0) return;
  missingStats.totalIncomplete += 1;
  bucket.incomplete += 1;
  for (const field of missing) {
    missingStats.byField[field] = (missingStats.byField[field] ?? 0) + 1;
    bucket.byField[field] = (bucket.byField[field] ?? 0) + 1;
  }
  scheduleFlush();
}

/**
 * Проверяет, что во входных данных attribution заполнены все ключевые
 * поля цепочки click → registration. В dev-режиме шумит в консоль с
 * явным указанием, какие поля пустые, и обновляет агрегированные
 * счётчики (см. flushMissingStats).
 *
 * Возвращает массив имён отсутствующих полей (пустой = всё ок).
 */
function validateAttributionShape(
  source: string,
  attr: Partial<Pick<PreviewAttribution, "supplier_id" | "species" | "form" | "href" | "access_level">> | null | undefined,
): string[] {
  if (!attr) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[debug] ${source}: attribution payload is null/undefined`,
        buildAttributionDebugSummary(["<all>"]),
      );
      recordMissing(source, ["<all>"]);
    }
    return ["<all>"];
  }
  const missing: MissingField[] = [];
  for (const key of ["supplier_id", "species", "form"] as const) {
    const value = attr[key];
    if (typeof value !== "string" || value.length === 0) {
      missing.push(key);
    }
  }
  if (import.meta.env.DEV) {
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[debug] ${source}: preview_attribution неполная — поля ${missing.join(", ")} отсутствуют/пустые`,
        { attr, ...buildAttributionDebugSummary(missing) },
      );
    }
    recordMissing(source, missing);
  }
  return missing;
}

export function savePreviewAttribution(
  input: Omit<PreviewAttribution, "ts">,
): void {
  try {
    validateAttributionShape("savePreviewAttribution", input);
    const record: PreviewAttribution = { ...input, ts: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[debug] preview_attribution saved:", record);
    }
  } catch {
    // storage unavailable — silent
  }
}

export function readPreviewAttribution(): PreviewAttribution | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PreviewAttribution;
    if (
      !parsed ||
      typeof parsed.supplier_id !== "string" ||
      typeof parsed.ts !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.ts > TTL_MS) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          "[debug] preview_attribution EXPIRED — связь клик→регистрация потеряна",
          {
            ageMs: Date.now() - parsed.ts,
            ttlMs: TTL_MS,
            record: parsed,
            ...buildAttributionDebugSummary(["<all>"]),
          },
        );
      }
      clearPreviewAttribution();
      return null;
    }
    validateAttributionShape("readPreviewAttribution", parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function clearPreviewAttribution(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

/**
 * Pending-копия attribution, переживающая весь registration-флоу
 * (от /register до /register/ready), чтобы прикрепить supplier_id /
 * species / form к событию `registration_complete`. Очищается после
 * успешной регистрации или по TTL.
 */
const PENDING_KEY = "yorso_preview_attribution_pending";

export function savePendingPreviewAttribution(attr: PreviewAttribution): void {
  try {
    validateAttributionShape("savePendingPreviewAttribution", attr);
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(attr));
  } catch {
    // silent
  }
}

export function readPendingPreviewAttribution(): PreviewAttribution | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PreviewAttribution;
    if (
      !parsed ||
      typeof parsed.supplier_id !== "string" ||
      typeof parsed.ts !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.ts > TTL_MS) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          "[debug] pending_preview_attribution EXPIRED — registration_complete не получит supplier_id/species/form",
          {
            ageMs: Date.now() - parsed.ts,
            ttlMs: TTL_MS,
            record: parsed,
            ...buildAttributionDebugSummary(["<all>"]),
          },
        );
      }
      clearPendingPreviewAttribution();
      return null;
    }
    validateAttributionShape("readPendingPreviewAttribution", parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPreviewAttribution(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // silent
  }
}

/**
 * Простой source-маркер для CTA, ведущих на /register
 * (hero, trust-блок, header, final CTA и т.д.). Используется
 * `RegisterChoose` для атрибуции, когда нет более конкретного
 * `PreviewAttribution`.
 */
const SOURCE_KEY = "yorso_registration_source";
const SOURCE_TTL_MS = 30 * 60 * 1000;

interface RegistrationSourceRecord {
  source: string;
  ts: number;
}

export function saveRegistrationSource(source: string): void {
  try {
    const record: RegistrationSourceRecord = { source, ts: Date.now() };
    sessionStorage.setItem(SOURCE_KEY, JSON.stringify(record));
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[debug] registration_source saved:", record);
    }
  } catch {
    // silent
  }
}

export function readRegistrationSource(): string | null {
  try {
    const raw = sessionStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistrationSourceRecord;
    if (!parsed || typeof parsed.source !== "string" || typeof parsed.ts !== "number") {
      return null;
    }
    if (Date.now() - parsed.ts > SOURCE_TTL_MS) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          "[debug] registration_source EXPIRED — CTA-атрибуция потеряна, registration_start будет direct",
          {
            ageMs: Date.now() - parsed.ts,
            ttlMs: SOURCE_TTL_MS,
            record: parsed,
            ...buildAttributionDebugSummary(["<all>"]),
          },
        );
      }
      clearRegistrationSource();
      return null;
    }
    return parsed.source;
  } catch {
    return null;
  }
}

export function clearRegistrationSource(): void {
  try {
    sessionStorage.removeItem(SOURCE_KEY);
  } catch {
    // silent
  }
}
