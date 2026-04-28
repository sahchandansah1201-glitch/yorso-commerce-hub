/**
 * Контракт useLandingOffers:
 *   1) initial state — мгновенно отдаёт mockOffers (no skeleton flash) с source="loading"
 *   2) при успешном fetchOffers с непустым ответом → переключается на rows + source="supabase"
 *   3) при ошибке fetchOffers → остаётся на mockOffers + source="mock-fallback"
 *   4) при пустом ответе → остаётся на mockOffers + source="mock-fallback"
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";

const fetchOffersMock = vi.fn();

vi.mock("@/lib/catalog-api", () => ({
  fetchOffers: (...args: unknown[]) => fetchOffersMock(...args),
}));

// Импорт ПОСЛЕ vi.mock — иначе хук получит реальный модуль.
import { useLandingOffers } from "./useLandingOffers";

describe("useLandingOffers — гибридная стратегия (Supabase + fallback)", () => {
  beforeEach(() => {
    fetchOffersMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("на mount сразу отдаёт mockOffers с source='loading' (без flash)", () => {
    fetchOffersMock.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useLandingOffers());
    expect(result.current.offers).toBe(mockOffers);
    expect(result.current.source).toBe("loading");
    expect(result.current.isLoading).toBe(true);
  });

  it("успешный непустой ответ Supabase → переключается на rows + source='supabase'", async () => {
    const supabaseRows: SeafoodOffer[] = [
      { ...mockOffers[0], id: "supa-1", productName: "From DB 1" },
      { ...mockOffers[1], id: "supa-2", productName: "From DB 2" },
    ];
    fetchOffersMock.mockResolvedValue(supabaseRows);

    const { result } = renderHook(() => useLandingOffers());

    await waitFor(() => {
      expect(result.current.source).toBe("supabase");
    });
    expect(result.current.offers).toBe(supabaseRows);
    expect(result.current.isLoading).toBe(false);
    expect(fetchOffersMock).toHaveBeenCalledWith("anonymous_locked");
  });

  it("ошибка Supabase → остаётся на mockOffers + source='mock-fallback'", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchOffersMock.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useLandingOffers());

    await waitFor(() => {
      expect(result.current.source).toBe("mock-fallback");
    });
    expect(result.current.offers).toBe(mockOffers);
    expect(result.current.isLoading).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("пустой ответ Supabase → fallback на mockOffers (landing никогда не пустой)", async () => {
    fetchOffersMock.mockResolvedValue([]);

    const { result } = renderHook(() => useLandingOffers());

    await waitFor(() => {
      expect(result.current.source).toBe("mock-fallback");
    });
    expect(result.current.offers).toBe(mockOffers);
    expect(result.current.isLoading).toBe(false);
  });
});
