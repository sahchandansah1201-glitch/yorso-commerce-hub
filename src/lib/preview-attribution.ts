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

export function savePreviewAttribution(
  input: Omit<PreviewAttribution, "ts">,
): void {
  try {
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
