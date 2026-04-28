/**
 * Интеграционные тесты для use-resilient-catalog.
 *
 * Проверяем КОНТРАКТ аналитики при холодном старте Lovable Cloud:
 *   1. catalog_soft_fallback_applied эмитится при retriable-ошибке (503/PGRST)
 *      — и НЕ эмитится при штатной загрузке.
 *   2. catalog_background_recovered эмитится ТОЛЬКО после того, как фоновая
 *      повторная загрузка реально вернула данные с реального API.
 *   3. Оба события несут lastErrorCode и httpStatus, чтобы дашборды видели
 *      причину падения.
 *
 * ВАЖНО: фоновый ретрай зациклен (scheduleBackgroundRetry → setTimeout →
 * scheduleBackgroundRetry), поэтому используем advanceTimersByTimeAsync()
 * порциями, а не runAllTimersAsync().
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";

const fetchOffersMock = vi.fn();
const fetchOfferByIdMock = vi.fn();
vi.mock("@/lib/catalog-api", () => ({
  fetchOffers: (...a: unknown[]) => fetchOffersMock(...a),
  fetchOfferById: (...a: unknown[]) => fetchOfferByIdMock(...a),
}));

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
    fetchOffersMock.mockRejectedValue(make503("PGRST002"));

    const { result, unmount } = renderHook(() => useResilientCatalog("anonymous_locked"));
    // Достаточно пройти SOFT_FALLBACK_MS=3500 + ретраи fetchOffersWithRetry.
    await advance(8000);

    const fallbacks = eventsOf("catalog_soft_fallback_applied");
    expect(fallbacks.length).toBeGreaterThanOrEqual(1);
    expect(fallbacks[0]).toMatchObject({
      level: "anonymous_locked",
      lastErrorCode: "PGRST002",
      httpStatus: 503,
    });
    expect(result.current.usingFallback).toBe(true);
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);

    unmount(); // Останавливаем фоновый цикл, чтобы тест не висел.
  });

  it("НЕ эмитит ни один из этих событий при штатной загрузке", async () => {
    fetchOffersMock.mockResolvedValue([mockOffers[0]] as SeafoodOffer[]);

    const { unmount } = renderHook(() => useResilientCatalog("anonymous_locked"));
    await advance(100);

    expect(eventsOf("catalog_soft_fallback_applied")).toHaveLength(0);
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);

    unmount();
  });

  it("catalog_background_recovered эмитится ТОЛЬКО после успеха фонового ретрая", async () => {
    const rows: SeafoodOffer[] = [mockOffers[0]];
    fetchOffersMock.mockRejectedValue(make503("PGRST001"));

    const { unmount } = renderHook(() => useResilientCatalog("anonymous_locked"));
    // Первичный цикл + soft fallback.
    await advance(8000);
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);
    expect(eventsOf("catalog_soft_fallback_applied").length).toBeGreaterThan(0);

    // Готовим успех для следующего фонового тика (BACKGROUND_RETRY_MS=12s).
    fetchOffersMock.mockReset();
    fetchOffersMock.mockResolvedValue(rows);

    await advance(13_000);

    const recovered = eventsOf("catalog_background_recovered");
    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({
      level: "anonymous_locked",
      attempt: expect.any(Number),
      durationMs: expect.any(Number),
      lastErrorCode: expect.stringMatching(/PGRST/),
      httpStatus: 503,
    });

    unmount();
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

  it("на 503/PGRST эмитит catalog_soft_fallback_applied с кодом и статусом", async () => {
    fetchOfferByIdMock.mockRejectedValue(make503("PGRST002"));
    const knownId = mockOffers[0].id;

    const { result, unmount } = renderHook(() =>
      useResilientOffer(knownId, "anonymous_locked"),
    );
    // Первичный fetchOfferByIdWithRetry: до 6 попыток с экспонентой, ~10s суммарно.
    await advance(15_000);

    expect(result.current.usingFallback).toBe(true);

    const fallbacks = eventsOf("catalog_soft_fallback_applied");
    expect(fallbacks.length).toBeGreaterThanOrEqual(1);
    expect(fallbacks[fallbacks.length - 1]).toMatchObject({
      level: "anonymous_locked",
      lastErrorCode: "PGRST002",
      httpStatus: 503,
    });
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);

    unmount();
  });

  it("catalog_background_recovered эмитится только когда фоновая загрузка возвращает реальный оффер", async () => {
    const knownId = mockOffers[0].id;
    fetchOfferByIdMock.mockRejectedValue(make503("PGRST001"));

    const { unmount } = renderHook(() => useResilientOffer(knownId, "anonymous_locked"));
    // Первичный цикл с retry-цепочкой.
    await advance(15_000);
    expect(eventsOf("catalog_background_recovered")).toHaveLength(0);

    // Готовим успех для фонового ретрая (BACKGROUND_RETRY_MS=12s + ретраи внутри).
    fetchOfferByIdMock.mockReset();
    fetchOfferByIdMock.mockResolvedValue(mockOffers[0]);

    await advance(20_000);

    const recovered = eventsOf("catalog_background_recovered");
    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({
      level: "anonymous_locked",
      attempt: expect.any(Number),
      durationMs: expect.any(Number),
      lastErrorCode: expect.stringMatching(/PGRST/),
      httpStatus: 503,
    });

    unmount();
  });
});
