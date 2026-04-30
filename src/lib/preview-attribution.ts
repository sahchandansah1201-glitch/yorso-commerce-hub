/**
 * Хранит контекст последнего клика по preview-карточке поставщика
 * (supplier_id / species / form), чтобы связать его с последующим
 * событием `registration_start` на /register.
 *
 * Только frontend, sessionStorage. TTL 30 минут — клики старше
 * считаются неотносящимися к текущей попытке регистрации.
 */
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
 * Проверяет, что во входных данных attribution заполнены все ключевые
 * поля цепочки click → registration. В dev-режиме шумит в консоль с
 * явным указанием, какие поля пустые, чтобы быстрее ловить разрывы.
 *
 * Возвращает массив имён отсутствующих полей (пустой = всё ок).
 */
function validateAttributionShape(
  source: string,
  attr: Partial<Pick<PreviewAttribution, "supplier_id" | "species" | "form" | "href" | "access_level">> | null | undefined,
): string[] {
  const missing: string[] = [];
  if (!attr) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[debug] ${source}: attribution payload is null/undefined`);
    }
    return ["<all>"];
  }
  for (const key of ["supplier_id", "species", "form"] as const) {
    const value = attr[key];
    if (typeof value !== "string" || value.length === 0) {
      missing.push(key);
    }
  }
  if (missing.length > 0 && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `[debug] ${source}: preview_attribution неполная — поля ${missing.join(", ")} отсутствуют/пустые`,
      attr,
    );
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
          },
        );
      }
      clearPreviewAttribution();
      return null;
    }
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
          },
        );
      }
      clearPendingPreviewAttribution();
      return null;
    }
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
