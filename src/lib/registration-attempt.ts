/**
 * Уникальный attempt_id для одной попытки регистрации.
 *
 * Цель: связать события воронки (preview_card_click → registration_start →
 * registration_complete) одной строкой в отчётах, даже если sessionId
 * меняется или пользователь приходит из разных вкладок/CTA.
 *
 * Хранится в sessionStorage, генерируется лениво на первом обращении,
 * сбрасывается после успешной регистрации.
 */
const STORAGE_KEY = "yorso_registration_attempt_id";

function generateId(): string {
  // crypto.randomUUID доступен во всех целевых браузерах; fallback на ts+rand.
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `att_${crypto.randomUUID()}`;
    }
  } catch {
    // ignore
  }
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Возвращает текущий attempt_id, создавая его при первом вызове.
 * Безопасен к падениям sessionStorage — в крайнем случае вернёт
 * свежий id без персистенции (события всё равно будут отправлены).
 */
export function getRegistrationAttemptId(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing && typeof existing === "string" && existing.length > 0) {
      return existing;
    }
    const fresh = generateId();
    sessionStorage.setItem(STORAGE_KEY, fresh);
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[debug] registration_attempt_id created:", fresh);
    }
    return fresh;
  } catch {
    return generateId();
  }
}

/** Сбрасывает attempt_id (после registration_complete или явного reset). */
export function resetRegistrationAttemptId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}
