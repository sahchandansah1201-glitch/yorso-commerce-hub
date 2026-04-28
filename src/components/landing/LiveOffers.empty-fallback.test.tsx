/**
 * Контракт: когда Supabase вернул пустой массив, useLandingOffers даёт
 * source="mock-fallback" + offers=mockOffers. LiveOffers НЕ должен показывать
 * пустое состояние — landing никогда не выглядит «нет предложений».
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LiveOffers from "./LiveOffers";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { mockOffers } from "@/data/mockOffers";

// Эмулируем поведение хука после fetchOffers → [] (пустой ответ Supabase):
// хук уже выполнил fallback и отдаёт mockOffers с source="mock-fallback".
vi.mock("@/lib/useLandingOffers", () => ({
  useLandingOffers: () => ({
    offers: mockOffers,
    source: "mock-fallback" as const,
    isLoading: false,
  }),
}));

describe("LiveOffers — пустой ответ Supabase (fallback на mockOffers)", () => {
  it("рендерит все mockOffers, секция #offers не пустая", () => {
    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <LiveOffers />
        </LanguageProvider>
      </MemoryRouter>,
    );

    const cards = container.querySelectorAll<HTMLElement>("#offers .grid > li");
    expect(cards.length).toBe(mockOffers.length);
    expect(cards.length).toBeGreaterThan(0);
  });
});
