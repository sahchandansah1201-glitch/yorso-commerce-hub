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

export const isRetriableCatalogError = (err: unknown): boolean => {
  const msg = (err as { message?: string })?.message ?? "";
  const code = (err as { code?: string })?.code ?? "";
  const status = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode;
  return (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    /schema cache/i.test(msg) ||
    /database client error/i.test(msg) ||
    /retrying/i.test(msg) ||
    /no connection to the server/i.test(msg) ||
    /fetch failed/i.test(msg) ||
    /network/i.test(msg) ||
    /PGRST00[12]/i.test(code) ||
    /PGRST00[12]/i.test(msg)
  );
};

export interface RetryOptions {
  maxAttempts?: number;
  /** Базовая задержка между попытками (мс). Реальная задержка = delayMs * n. */
  delayMs?: number;
}

export const fetchOffersWithRetry = async (
  level: AccessLevel,
  opts: RetryOptions = {},
): Promise<SeafoodOffer[]> => {
  const maxAttempts = opts.maxAttempts ?? 6;
  const delayMs = opts.delayMs ?? 800;

  let lastErr: unknown;
  for (let n = 1; n <= maxAttempts; n++) {
    try {
      return await fetchOffers(level);
    } catch (err) {
      lastErr = err;
      if (!isRetriableCatalogError(err) || n === maxAttempts) throw err;
      // Экспоненциальный бэк-офф с потолком 4с — покрывает cold-start Lovable Cloud.
      const wait = Math.min(delayMs * Math.pow(1.6, n - 1), 4000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
};
