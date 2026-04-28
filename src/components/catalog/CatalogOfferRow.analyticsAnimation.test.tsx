/**
 * Контракт плавности и анти-мерцания для панели «Аналитика»
 * в карточке CatalogOfferRow.
 *
 * jsdom не воспроизводит реальную анимацию, поэтому фиксируем
 * декларативный контракт классов и атрибутов, который даёт плавное
 * раскрытие на планшетах и исключает «вспышку» содержимого до того,
 * как Radix вычислит --radix-collapsible-content-height.
 *
 * Что закрепляем:
 *  1. Закрытое состояние: panel data-state="closed",
 *     overflow-hidden, invisible, h-0 — содержимое не отображается
 *     и не получает реальную высоту до открытия.
 *  2. Открытое состояние: data-state="open",
 *     animate-collapsible-down — keyframe начинается с opacity:0,
 *     значит первый кадр не мигает.
 *  3. motion-reduce: анимации честно отключаются.
 *  4. will-change: height, opacity — гарантия композиционного слоя
 *     (анти-jank на iPad Safari).
 *  5. Внутренняя обёртка получает motion-safe:animate-fade-in,
 *     чтобы контент проявлялся уже внутри раскрытого региона.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";

const renderRow = () => {
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogOfferRow
            offer={mockOffers[0]}
            isSelected={false}
            onSelect={() => {}}
            forceLevel="anonymous_locked"
          />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("CatalogOfferRow · «Аналитика» — плавность и анти-мерцание", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("по умолчанию панель закрыта: data-state=closed, invisible, h-0, overflow-hidden", () => {
    renderRow();
    const panel = screen.getByTestId("catalog-row-analytics-panel");

    expect(panel.getAttribute("data-state")).toBe("closed");

    const cls = panel.className;
    expect(cls).toContain("overflow-hidden");
    expect(cls).toContain("data-[state=closed]:invisible");
    expect(cls).toContain("data-[state=closed]:h-0");
  });

  it("после клика панель открывается: data-state=open и animate-collapsible-down", () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle");

    fireEvent.click(btn);

    const panel = screen.getByTestId("catalog-row-analytics-panel");
    expect(panel.getAttribute("data-state")).toBe("open");

    // Класс анимации присутствует декларативно, активируется state-вариантом.
    expect(panel.className).toContain("data-[state=open]:animate-collapsible-down");
    expect(panel.className).toContain("data-[state=closed]:animate-collapsible-up");
  });

  it("декларирует honoring reduced-motion: motion-reduce:animate-none и transition-none", () => {
    renderRow();
    const panel = screen.getByTestId("catalog-row-analytics-panel");
    expect(panel.className).toContain("motion-reduce:animate-none");
    expect(panel.className).toContain("motion-reduce:transition-none");
  });

  it("на панели задан will-change: height, opacity для композиционного слоя", () => {
    renderRow();
    const panel = screen.getByTestId("catalog-row-analytics-panel") as HTMLElement;
    // jsdom сохраняет inline style в style.willChange.
    expect(panel.style.willChange.replace(/\s+/g, " ").toLowerCase()).toContain(
      "height",
    );
    expect(panel.style.willChange.toLowerCase()).toContain("opacity");
  });

  it("внутренняя обёртка контента получает motion-safe:animate-fade-in для плавного появления", () => {
    renderRow();
    fireEvent.click(screen.getByTestId("catalog-row-analytics-toggle"));
    const inner = screen.getByTestId("catalog-row-analytics-panel-inner");
    expect(inner.className).toContain("motion-safe:animate-fade-in");
    expect(inner.className).toContain("motion-reduce:animate-none");
  });

  it("повторное закрытие возвращает state=closed и снова прячет содержимое", () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle");
    fireEvent.click(btn);
    fireEvent.click(btn);

    const panel = screen.getByTestId("catalog-row-analytics-panel");
    expect(panel.getAttribute("data-state")).toBe("closed");
    expect(panel.className).toContain("data-[state=closed]:invisible");
  });
});

describe("Tailwind config: keyframes collapsible-* существуют и стартуют с opacity:0", () => {
  it("проект экспонирует animate-collapsible-down/up через утилиты", async () => {
    // Импортируем конфиг динамически, чтобы не тащить тяжёлые типы вверх.
    const config = (await import("../../../tailwind.config.ts")).default as {
      theme: {
        extend: {
          keyframes: Record<string, Record<string, Record<string, string>>>;
          animation: Record<string, string>;
        };
      };
    };
    const kf = config.theme.extend.keyframes;
    const anim = config.theme.extend.animation;

    expect(kf["collapsible-down"]).toBeDefined();
    expect(kf["collapsible-up"]).toBeDefined();

    // Анти-мерцание: keyframe раскрытия начинается с opacity:0, иначе
    // на первом кадре видим полностью отрисованный контент до анимации.
    expect(kf["collapsible-down"].from.opacity).toBe("0");
    expect(kf["collapsible-down"].to.opacity).toBe("1");
    expect(kf["collapsible-up"].from.opacity).toBe("1");
    expect(kf["collapsible-up"].to.opacity).toBe("0");

    // Длительности должны быть короткими и плавными (≤300ms).
    expect(anim["collapsible-down"]).toMatch(/^collapsible-down 0\.(2|25|3)s/);
    expect(anim["collapsible-up"]).toMatch(/^collapsible-up 0\.(2|25|3)s/);
  });
});
