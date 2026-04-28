/**
 * use-resilient-catalog.ts — общий устойчивый слой загрузки каталога.
 *
 * Один контракт для двух поверхностей:
 *   • useResilientCatalog()  — список офферов (страница /offers)
 *   • useResilientOffer(id)  — карточка одного оффера (страница /offers/:id)
 *
 * Что делает в обоих случаях при 503/PGRST холодного старта:
 *   1. Запускает первичный fetch с экспоненциальным ретраем
 *      (fetchOffersWithRetry / fetchOfferByIdWithRetry).
 *   2. Если за SOFT_FALLBACK_MS не пришёл успех (только список) —
 *      мгновенно показывает demo-данные (mockOffers).
 *   3. Если все ретраи упали с retriable-ошибкой — показывает demo-fallback
 *      (для /offers — список, для /offers/:id — конкретный mock-оффер).
 *   4. Запускает фоновый цикл (BACKGROUND_RETRY_MS = 12с), пока
 *      не получит реальные данные. При успехе — тихо заменяет fallback.
 *   5. Накапливает диагностику: failedAttempts, lastErrorCode, recovering,
 *      usingFallback. UI рисует баннер + кнопку «Повторить сейчас».
 *
 * Все аналитические события каталога/оффера эмитятся отсюда —
 * страницы остаются «тонкими».
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import {
  extractCatalogErrorCode,
  extractHttpStatus,
  fetchOffersWithRetry,
  fetchOfferByIdWithRetry,
  isRetriableCatalogError,
} from "@/lib/fetch-offers-with-retry";
import { fallbackOffersForLevel, findFallbackOfferById } from "@/lib/catalog-fallback";
import analytics from "@/lib/analytics";

const SOFT_FALLBACK_MS = 3500;
const BACKGROUND_RETRY_MS = 12_000;

export interface ResilientState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
  failedAttempts: number;
  lastErrorCode: string | null;
  recovering: boolean;
  retry: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// useResilientCatalog — список офферов
// ─────────────────────────────────────────────────────────────────────────────
export const useResilientCatalog = (level: AccessLevel): ResilientState<SeafoodOffer[]> => {
  const [data, setData] = useState<SeafoodOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let softFallbackApplied = false;
    let lastErr: { code: string; httpStatus: number | null } = { code: "ERR", httpStatus: null };
    const startedAt = Date.now();
    const abort = new AbortController();
    setLoading(true);
    setError(null);
    setRecovering(false);

    const softFallbackTimer = window.setTimeout(() => {
      if (cancelled) return;
      softFallbackApplied = true;
      setData(fallbackOffersForLevel(level));
      setLoading(false);
      setUsingFallback(true);
      analytics.track("catalog_soft_fallback_applied", {
        level,
        lastErrorCode: lastErr.code,
        httpStatus: lastErr.httpStatus,
      });
    }, SOFT_FALLBACK_MS);

    let backgroundTimer: number | null = null;
    let backgroundAttempt = 0;

    const trackAttemptFail = (err: unknown, n: number) => {
      const code = extractCatalogErrorCode(err);
      const httpStatus = extractHttpStatus(err);
      lastErr = { code, httpStatus };
      if (!cancelled) {
        setFailedAttempts((p) => p + 1);
        setLastErrorCode(code);
      }
      analytics.track("catalog_fetch_attempt_failed", {
        level,
        attempt: n,
        code,
        httpStatus,
        message: (err as { message?: string })?.message?.slice(0, 200),
      });
    };

    const scheduleBackgroundRetry = () => {
      if (cancelled) return;
      backgroundTimer = window.setTimeout(() => {
        if (cancelled) return;
        backgroundAttempt += 1;
        setRecovering(true);
        fetchOffersWithRetry(level, {
          signal: abort.signal,
          maxAttempts: 3,
          onAttemptFail: trackAttemptFail,
        })
          .then((rows) => {
            if (cancelled) return;
            setData(rows);
            setUsingFallback(false);
            setRecovering(false);
            analytics.track("catalog_background_recovered", {
              level,
              attempt: backgroundAttempt,
              durationMs: Date.now() - startedAt,
              lastErrorCode: lastErr.code,
              httpStatus: lastErr.httpStatus,
            });
            setLastErrorCode(null);
          })
          .catch(() => {
            if (cancelled) return;
            setRecovering(false);
            scheduleBackgroundRetry();
          });
      }, BACKGROUND_RETRY_MS);
    };

    fetchOffersWithRetry(level, { signal: abort.signal, onAttemptFail: trackAttemptFail })
      .then((rows) => {
        if (cancelled) return;
        window.clearTimeout(softFallbackTimer);
        setData(rows);
        setLoading(false);
        setUsingFallback(false);
        setLastErrorCode(null);
      })
      .catch((err) => {
        if (cancelled) return;
        window.clearTimeout(softFallbackTimer);
        if (isRetriableCatalogError(err)) {
          if (!softFallbackApplied) {
            setData(fallbackOffersForLevel(level));
            setLoading(false);
            setUsingFallback(true);
            analytics.track("catalog_soft_fallback_applied", {
              level,
              lastErrorCode: lastErr.code,
              httpStatus: lastErr.httpStatus,
            });
          }
          scheduleBackgroundRetry();
          return;
        }
        if (!softFallbackApplied) {
          setError(err?.message ?? "Не удалось загрузить каталог");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      abort.abort();
      window.clearTimeout(softFallbackTimer);
      if (backgroundTimer) window.clearTimeout(backgroundTimer);
    };
  }, [level, reloadKey]);

  const retry = useCallback(() => {
    analytics.track("catalog_manual_retry_click", { level });
    setFailedAttempts(0);
    setLastErrorCode(null);
    setReloadKey((k) => k + 1);
  }, [level]);

  return { data, loading, error, usingFallback, failedAttempts, lastErrorCode, recovering, retry };
};

// ─────────────────────────────────────────────────────────────────────────────
// useResilientOffer — одна карточка товара
// ─────────────────────────────────────────────────────────────────────────────
export const useResilientOffer = (
  id: string | undefined,
  level: AccessLevel,
): ResilientState<SeafoodOffer | null> => {
  const [data, setData] = useState<SeafoodOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const dataRef = useRef<SeafoodOffer | null>(null);
  dataRef.current = data;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let backgroundTimer: number | undefined;
    let backgroundAttempt = 0;
    let lastErr: { code: string; httpStatus: number | null } = { code: "ERR", httpStatus: null };
    const startedAt = Date.now();
    const abort = new AbortController();
    if (!dataRef.current) setLoading(true);
    setError(null);

    const trackAttemptFail = (err: unknown, n: number) => {
      const code = extractCatalogErrorCode(err);
      const httpStatus = extractHttpStatus(err);
      lastErr = { code, httpStatus };
      if (!cancelled) {
        setFailedAttempts((p) => p + 1);
        setLastErrorCode(code);
      }
      analytics.track("catalog_fetch_attempt_failed", {
        level,
        attempt: n,
        code,
        httpStatus,
        message: (err as { message?: string })?.message?.slice(0, 200),
      });
    };

    const scheduleBackgroundRetry = () => {
      if (cancelled) return;
      backgroundTimer = window.setTimeout(() => {
        if (cancelled) return;
        backgroundAttempt += 1;
        setRecovering(true);
        fetchOfferByIdWithRetry(id, level, {
          signal: abort.signal,
          maxAttempts: 3,
          onAttemptFail: trackAttemptFail,
        })
          .then((res) => {
            if (cancelled) return;
            if (res) {
              setData(res);
              setUsingFallback(false);
              setLastErrorCode(null);
              // Общая метрика восстановления каталога — для сводных дашбордов.
              analytics.track("catalog_background_recovered", {
                level,
                attempt: backgroundAttempt,
                durationMs: Date.now() - startedAt,
                lastErrorCode: lastErr.code,
                httpStatus: lastErr.httpStatus,
              });
              // Офферо-специфичное событие — для воронки конкретного товара.
              analytics.track("offer_detail_background_recovered", {
                offerId: id,
                attempts: failedAttempts,
              });
            } else {
              scheduleBackgroundRetry();
            }
          })
          .catch(() => {
            if (cancelled) return;
            scheduleBackgroundRetry();
          })
          .finally(() => {
            if (!cancelled) setRecovering(false);
          });
      }, BACKGROUND_RETRY_MS);
    };

    fetchOfferByIdWithRetry(id, level, { signal: abort.signal, onAttemptFail: trackAttemptFail })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setUsingFallback(false);
        setFailedAttempts(0);
        setLastErrorCode(null);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("[useResilientOffer] fetchOfferById failed", e);
        const fallback = isRetriableCatalogError(e) ? findFallbackOfferById(id, level) : null;
        if (fallback) {
          setData(fallback);
          setUsingFallback(true);
          setError(null);
          // Симметрично каталогу: фиксируем сам факт включения демо-данных.
          analytics.track("catalog_soft_fallback_applied", {
            level,
            lastErrorCode: lastErr.code,
            httpStatus: lastErr.httpStatus,
          });
          scheduleBackgroundRetry();
          return;
        }
        setError("Не удалось загрузить оффер");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      abort.abort();
      if (backgroundTimer) window.clearTimeout(backgroundTimer);
    };
    // failedAttempts намеренно не в deps — это счётчик, а не вход.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, level, reloadKey]);

  const retry = useCallback(() => {
    analytics.track("offer_detail_manual_retry_click", { offerId: id, lastErrorCode });
    setFailedAttempts(0);
    setLastErrorCode(null);
    setReloadKey((k) => k + 1);
  }, [id, lastErrorCode]);

  return { data, loading, error, usingFallback, failedAttempts, lastErrorCode, recovering, retry };
};
