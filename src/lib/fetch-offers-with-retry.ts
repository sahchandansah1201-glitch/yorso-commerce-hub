/**
 * fetchOffersWithRetry — обёртка над fetchOffers для устойчивости к временным
 * ошибкам Lovable Cloud (cold-start PostgREST: 503 PGRST001/PGRST002,
 * "no connection to the server", "schema cache").
 *
 * Контракт:
 *   - На успешный fetchOffers — резолвится сразу.
 *   - На retriable ошибку — повторяет до MAX_ATTEMPTS раз с экспоненциальным
 *     бэк-оффом (потолок 4с). Если все попытки упали — пробрасывает
 *     последнюю ошибку наружу.
 *   - На любую другую ошибку — пробрасывает сразу.
 *   - Каждая неудачная попытка вызывает onAttemptFail(err, attempt) —
 *     это позволяет вызывающему коду писать аналитику / показывать
 *     диагностику пользователю.
 */
import { fetchOffers, fetchOfferById } from "@/lib/catalog-api";
import type { AccessLevel } from "@/lib/access-level";
import type { SeafoodOffer } from "@/data/mockOffers";

/** Извлекает компактный код ошибки для UI/аналитики (PGRST002, HTTP 503, и т.п.). */
export const extractCatalogErrorCode = (err: unknown): string => {
  const e = err as { code?: string; status?: number; statusCode?: number; message?: string };
  if (e?.code) return String(e.code);
  const st = e?.status ?? e?.statusCode;
  if (st) return `HTTP ${st}`;
  const msg = e?.message ?? "";
  const m = msg.match(/PGRST\d+/i);
  if (m) return m[0].toUpperCase();
  return "ERR";
};

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
    /networkerror/i.test(msg) ||
    /failed to fetch/i.test(msg) ||
    /PGRST00[12]/i.test(code) ||
    /PGRST00[12]/i.test(msg)
  );
};

export interface RetryOptions {
  maxAttempts?: number;
  /** Базовая задержка между попытками (мс). */
  delayMs?: number;
  /** Колбэк после каждой неудачной попытки — для аналитики/диагностики. */
  onAttemptFail?: (err: unknown, attempt: number) => void;
  /** AbortSignal — позволяет отменить ожидание между попытками. */
  signal?: AbortSignal;
}

export const fetchOffersWithRetry = async (
  level: AccessLevel,
  opts: RetryOptions = {},
): Promise<SeafoodOffer[]> => {
  const maxAttempts = opts.maxAttempts ?? 6;
  const delayMs = opts.delayMs ?? 800;

  let lastErr: unknown;
  for (let n = 1; n <= maxAttempts; n++) {
    if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      return await fetchOffers(level);
    } catch (err) {
      lastErr = err;
      opts.onAttemptFail?.(err, n);
      if (!isRetriableCatalogError(err) || n === maxAttempts) throw err;
      const wait = Math.min(delayMs * Math.pow(1.6, n - 1), 4000);
      // Прерываемое ожидание.
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), wait);
        if (opts.signal) {
          const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          };
          opts.signal.addEventListener("abort", onAbort, { once: true });
        }
      });
    }
  }
  throw lastErr;
};
