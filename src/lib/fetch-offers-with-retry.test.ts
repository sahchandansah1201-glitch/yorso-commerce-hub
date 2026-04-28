/**
 * Контракт fetchOffersWithRetry:
 *   1) Schema-cache ошибка → молча ретраит → возвращает данные при успехе.
 *   2) Schema-cache ошибка все N попыток → пробрасывает ошибку.
 *   3) Соседняя временная ошибка API PGRST001 → тоже ретраится.
 *   4) Любая другая ошибка → пробрасывается сразу, без ретраев.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";

const fetchOffersMock = vi.fn();
vi.mock("@/lib/catalog-api", () => ({
  fetchOffers: (...args: unknown[]) => fetchOffersMock(...args),
}));

import { fetchOffersWithRetry } from "./fetch-offers-with-retry";

describe("fetchOffersWithRetry — тихий ретрай на schema-cache ошибку", () => {
  beforeEach(() => {
    fetchOffersMock.mockReset();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("после двух schema-cache ошибок возвращает данные с третьей попытки и НЕ пробрасывает ошибку наружу", async () => {
    const rows: SeafoodOffer[] = [mockOffers[0]];
    const schemaErr = Object.assign(new Error("Could not query the database for the schema cache"), {
      code: "PGRST002",
    });
    fetchOffersMock
      .mockRejectedValueOnce(schemaErr)
      .mockRejectedValueOnce(schemaErr)
      .mockResolvedValueOnce(rows);

    const promise = fetchOffersWithRetry("anonymous_locked", { delayMs: 10 });
    // Прокручиваем все таймеры (две паузы по 10ms / 20ms).
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(rows);
    expect(fetchOffersMock).toHaveBeenCalledTimes(3);
    // Ни одна из ошибок не должна была долететь до вызывающего кода —
    // именно это гарантирует, что UI не покажет «Не удалось загрузить».
  });

  it("если schema-cache ошибка не уходит за MAX_ATTEMPTS — ошибка пробрасывается", async () => {
    const schemaErr = new Error("Could not query the database for the schema cache");
    fetchOffersMock.mockRejectedValue(schemaErr);

    const promise = fetchOffersWithRetry("anonymous_locked", {
      maxAttempts: 2,
      delayMs: 10,
    });
    // Подавляем unhandled-rejection от promise до того, как успеем await.
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow(/schema cache/i);
    expect(fetchOffersMock).toHaveBeenCalledTimes(2);
  });

  it("ретраит PGRST001 во время прогрева API и возвращает данные без ошибки для UI", async () => {
    const rows: SeafoodOffer[] = [mockOffers[1]];
    const connectionErr = Object.assign(new Error("Database client error. Retrying the connection."), {
      code: "PGRST001",
    });
    fetchOffersMock.mockRejectedValueOnce(connectionErr).mockResolvedValueOnce(rows);

    const promise = fetchOffersWithRetry("registered_locked", { delayMs: 10 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe(rows);
    expect(fetchOffersMock).toHaveBeenCalledTimes(2);
  });

  it("обычная ошибка (не schema-cache) пробрасывается сразу, без ретраев", async () => {
    fetchOffersMock.mockRejectedValueOnce(new Error("network down"));

    const promise = fetchOffersWithRetry("anonymous_locked", { delayMs: 10 });
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow("network down");
    expect(fetchOffersMock).toHaveBeenCalledTimes(1);
  });
});
