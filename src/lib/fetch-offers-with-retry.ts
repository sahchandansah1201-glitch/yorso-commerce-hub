/**
 * fetchOffersWithRetry — обёртка над fetchOffers, которая «глотает» временную
 * ошибку PostgREST schema cache (PGRST002 / "Could not query the database for
 * the schema cache"). Такая ошибка возникает на 1–3 секунды сразу после
 * миграции, пока кэш PostgREST не подхватит новую схему. Пользователь не
 * должен видеть из-за этого красное состояние «не удалось загрузить».
 *
 * Контракт:
 *   - На успешный fetchOffers — резолвится сразу.
 *   - На schema-cache ошибку — повторяет до MAX_ATTEMPTS раз с линейным
 *     бэк-оффом (delayMs * n). Если все попытки упали — пробрасывает
 *     последнюю ошибку наружу.
 *   - На любую другую ошибку — пробрасывает сразу, без ретраев.
 */
import { fetchOffers } from "@/lib/catalog-api";
import type { AccessLevel } from "@/lib/access-level";
import type { SeafoodOffer } from "@/data/mockOffers";

export const isSchemaCacheError = (msg: string): boolean =>
  /schema cache/i.test(msg) || /PGRST002/i.test(msg);

export interface RetryOptions {
  maxAttempts?: number;
  /** Базовая задержка между попытками (мс). Реальная задержка = delayMs * n. */
  delayMs?: number;
}

export const fetchOffersWithRetry = async (
  level: AccessLevel,
  opts: RetryOptions = {},
): Promise<SeafoodOffer[]> => {
  const maxAttempts = opts.maxAttempts ?? 3;
  const delayMs = opts.delayMs ?? 600;

  let lastErr: unknown;
  for (let n = 1; n <= maxAttempts; n++) {
    try {
      return await fetchOffers(level);
    } catch (err) {
      lastErr = err;
      const msg = (err as { message?: string })?.message ?? "";
      if (!isSchemaCacheError(msg) || n === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, delayMs * n));
    }
  }
  throw lastErr;
};
