/**
 * Интеграционные тесты для use-resilient-catalog.
 *
 * Проверяем КОНТРАКТ аналитики при холодном старте Lovable Cloud:
 *   1. catalog_soft_fallback_applied эмитится при retriable-ошибке (503/PGRST)
 *      — и НЕ эмитится при штатной загрузке.
 *   2. catalog_background_recovered эмитится ТОЛЬКО после того, как фоновая
 *      повторная загрузка реально вернула данные с реального API
 *      (не при первой удачной загрузке, не при очередном падении).
 *   3. Оба события несут lastErrorCode и httpStatus, чтобы дашборды видели
 *      причину падения.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";

// ─── Моки нижнего слоя ──────────────────────────────────────────────────────
const fetchOffersMock = vi.fn();
const fetchOfferByIdMock = vi.fn();
vi.mock("@/lib/catalog-api", () => ({
  fetchOffers: (...a: unknown[]) => fetchOffersMock(...a),
  fetchOfferById: (...a: unknown[]) => fetchOfferByIdMock(...a),
}));

// ─── Спай за аналитикой ─────────────────────────────────────────────────────
const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  default: { track: (...a: unknown[]) => trackMock(...a) },
}));

import { useResilientCatalog, useResilientOffer } from "./use-resilient-catalog";

const make503 = (code = "PGRST002") =>
  Object.assign(new Error("Could not query the database for the schema cache"), {
    code,
    status: 503,
  });

const eventsOf = (name: string) =>
  trackMock.mock.calls.filter(([n]) => n === name).map(([, p]) => p);

/**
 * Прокручиваем фейковые таймеры порциями, чтобы избежать бесконечного цикла
 * фонового ретрая (scheduleBackgroundRetry → setTimeout → scheduleBackgroundRetry).
 */
const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe("useResilientCatalog — события деградации/восстановления", () => {
  beforeEach(() => {
    fetchOffersMock.mockReset();
    fetchOfferByIdMock.mockReset();
    trackMock.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("эмитит catalog_soft_fallback_applied при 503/PGRST с lastErrorCode и httpStatus", async () => {
    // Все попытки первичного цикла падают с retriable 503 → попадаем в hard-fallback.
    fetchOffersMock.mockRejectedValue(make503("PGRST002"));

    const { result } = renderHook(() => useResilientCatalog("anonymous_locked"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const fallbacks = eventsOf("catalog_soft_fallback_applied");
    expect(fallbacks.length).toBeGreaterThanOrEqual(1);
    expect(fallbacks[0]).toMatchObject({
      level: "anonymous_locked",
      lastErrorCode: "PGRST002",
      httpStatus: 503,
    });
    expect(result.current.usingFallback).toBe(true);
    // catalog_background_recovered не должно быть, пока бэк не отвечает успехом.
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);
  });

  it("НЕ эмитит ни один из этих событий при штатной загрузке", async () => {
    fetchOffersMock.mockResolvedValue([mockOffers[0]] as SeafoodOffer[]);

    renderHook(() => useResilientCatalog("anonymous_locked"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(eventsOf("catalog_soft_fallback_applied")).toHaveLength(0);
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);
  });

  it("catalog_background_recovered эмитится ТОЛЬКО после успеха фонового ретрая", async () => {
    const rows: SeafoodOffer[] = [mockOffers[0]];
    const err = make503("PGRST001");
    // Первичный цикл (до 6 попыток) — все 503, провоцируем fallback.
    // Затем первый фоновый цикл тоже падает — и не должен ничего восстановить.
    // И только во ВТОРОМ фоновом цикле один успех.
    fetchOffersMock.mockImplementation(() => {
      // По умолчанию падаем; конкретный успех настроим ниже через mockResolvedValueOnce.
      return Promise.reject(err);
    });

    renderHook(() => useResilientCatalog("anonymous_locked"));
    // Дать пройти первичному циклу (включая ретраи и soft-fallback таймер).
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // На этом моменте recovered ещё не должно быть.
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);
    // А fallback — уже да.
    expect(eventsOf("catalog_soft_fallback_applied").length).toBeGreaterThan(0);

    // Готовим успех для следующего фонового цикла.
    fetchOffersMock.mockReset();
    fetchOffersMock.mockResolvedValueOnce(rows);

    // Прокручиваем до следующего тика BACKGROUND_RETRY_MS=12s.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(13_000);
      await vi.runAllTimersAsync();
    });

    const recovered = eventsOf("catalog_background_recovered");
    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({
      level: "anonymous_locked",
      attempt: expect.any(Number),
      durationMs: expect.any(Number),
      // Должны нести причину последнего падения, чтобы видеть, что именно
      // вылечилось.
      lastErrorCode: expect.stringMatching(/PGRST/),
      httpStatus: 503,
    });
  });
});

describe("useResilientOffer — события деградации/восстановления для карточки", () => {
  beforeEach(() => {
    fetchOffersMock.mockReset();
    fetchOfferByIdMock.mockReset();
    trackMock.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("на 503/PGRST показывает fallback оффер и эмитит catalog_soft_fallback_applied с кодом и статусом", async () => {
    fetchOfferByIdMock.mockRejectedValue(make503("PGRST002"));
    const knownId = mockOffers[0].id;

    const { result } = renderHook(() => useResilientOffer(knownId, "anonymous_locked"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(result.current.usingFallback).toBe(true);
    });

    const fallbacks = eventsOf("catalog_soft_fallback_applied");
    expect(fallbacks.length).toBeGreaterThanOrEqual(1);
    expect(fallbacks[fallbacks.length - 1]).toMatchObject({
      level: "anonymous_locked",
      lastErrorCode: "PGRST002",
      httpStatus: 503,
    });
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);
  });

  it("catalog_background_recovered эмитится только когда фоновая загрузка возвращает реальный оффер", async () => {
    const knownId = mockOffers[0].id;
    fetchOfferByIdMock.mockRejectedValue(make503("PGRST001"));

    renderHook(() => useResilientOffer(knownId, "anonymous_locked"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);

    // Готовим успех для следующего фонового тика.
    fetchOfferByIdMock.mockReset();
    fetchOfferByIdMock.mockResolvedValueOnce(mockOffers[0]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(13_000);
      await vi.runAllTimersAsync();
    });

    const recovered = eventsOf("catalog_background_recovered");
    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({
      level: "anonymous_locked",
      attempt: expect.any(Number),
      durationMs: expect.any(Number),
      lastErrorCode: expect.stringMatching(/PGRST/),
      httpStatus: 503,
    });
  });
});
