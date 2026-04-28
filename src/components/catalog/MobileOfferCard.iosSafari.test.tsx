/**
 * iOS Safari regression — быстрые свайпы и повороты устройства.
 *
 * Цель: поймать рывки и неверный snap у MobileOfferCard в сценариях,
 * характерных для iOS Safari:
 *  - быстрая серия scroll-событий (momentum-свайп) — индекс не должен
 *    «прыгать» через слайды (0 → 2) и не должен мерцать дотами;
 *  - смена ширины контейнера (поворот устройства / split-view) —
 *    ширина слайда должна перейти в новый peek-брейкпоинт, активный
 *    слайд должен остаться активным, а scrollLeft — корректно
 *    переякориться без промежуточных индексов.
 *
 * Тест работает на jsdom: верстка реальная, layout — нет. Поэтому мы
 *  - подменяем `clientWidth` у scroller'а через defineProperty,
 *  - сами вызываем колбэк ResizeObserver (есть управляемый mock),
 *  - вычисляем slideFraction по тем же правилам, что и компонент,
 *  - проверяем инварианты на DOM (ширина слайда в %, индекс активного дота).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";

// ───────────────────────────────────────────────────────────────────────────
// Управляемый ResizeObserver: позволяет вручную «прокидывать» новую ширину,
// эмулируя поворот устройства / split-view, без реального layout-движка.
// ───────────────────────────────────────────────────────────────────────────
type ROEntry = { contentRect: { width: number } };
type ROCb = (entries: ROEntry[]) => void;
const observers: Array<{ cb: ROCb; el: Element }> = [];

class ControlledResizeObserver {
  private cb: ROCb;
  constructor(cb: ROCb) {
    this.cb = cb;
  }
  observe(el: Element) {
    observers.push({ cb: this.cb, el });
  }
  unobserve(el: Element) {
    const i = observers.findIndex((o) => o.el === el);
    if (i >= 0) observers.splice(i, 1);
  }
  disconnect() {
    for (let i = observers.length - 1; i >= 0; i--) {
      if (observers[i].cb === this.cb) observers.splice(i, 1);
    }
  }
}

const setScrollerWidth = (el: HTMLElement, width: number) => {
  Object.defineProperty(el, "clientWidth", { configurable: true, value: width });
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width,
      height: 300,
      top: 0,
      left: 0,
      right: width,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
};

const flushRO = (width: number) => {
  // Применяем width ко всем наблюдаемым элементам и шлём колбэк.
  for (const o of observers) {
    setScrollerWidth(o.el as HTMLElement, width);
    o.cb([{ contentRect: { width } }]);
  }
};

// rAF в jsdom есть, но компонент использует requestAnimationFrame для
// коалесцирования RO-бурстов. Дёргаем его синхронно через act + микропаузу.
const tick = async (ms = 16) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
};

// ───────────────────────────────────────────────────────────────────────────
// Эталон peek (мирроринг таблицы из MobileOfferCard.tsx, default-профиль).
// ───────────────────────────────────────────────────────────────────────────
const expectedSlideFraction = (w: number): number => {
  const peek = w >= 640 ? 0.14 : w >= 480 ? 0.12 : w >= 360 ? 0.1 : 0.08;
  return 1 - peek;
};

const renderCard = () => {
  const offer = {
    ...mockOffers[0],
    id: "ios-test-1",
    images: [
      "https://picsum.photos/seed/ios-1/1200/800",
      "https://picsum.photos/seed/ios-2/1200/800",
      "https://picsum.photos/seed/ios-3/1200/800",
      "https://picsum.photos/seed/ios-4/1200/800",
    ],
  };
  const utils = render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <MobileOfferCard offer={offer} isSelected={false} onSelect={() => {}} />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  const scroller = utils.container.querySelector(
    ".overflow-x-auto.snap-x",
  ) as HTMLDivElement;
  return { ...utils, scroller, offer };
};

const slideWidthPctFromDOM = (scroller: HTMLDivElement): number => {
  const first = scroller.firstElementChild as HTMLDivElement;
  const inline = first.style.width; // "92.00%" и т.п.
  return parseFloat(inline);
};

describe("MobileOfferCard · iOS Safari swipe & rotation regression", () => {
  beforeEach(() => {
    observers.length = 0;
    (globalThis as unknown as { ResizeObserver: typeof ControlledResizeObserver }).ResizeObserver =
      ControlledResizeObserver;
    (window as unknown as { ResizeObserver: typeof ControlledResizeObserver }).ResizeObserver =
      ControlledResizeObserver;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("устанавливает корректный slideFraction для каждой ширины (320/375/414/600/768)", async () => {
    const { scroller } = renderCard();
    const widths = [320, 375, 414, 600, 768];
    for (const w of widths) {
      await act(async () => {
        flushRO(w);
      });
      await tick(20); // дать rAF-commit отработать
      const actual = slideWidthPctFromDOM(scroller);
      const expected = +(expectedSlideFraction(w) * 100).toFixed(2);
      expect(
        Math.abs(actual - expected),
        `width=${w}px: ожидали ${expected}%, получили ${actual}%`,
      ).toBeLessThan(0.5);
    }
  });

  it("быстрая серия scroll-событий не вызывает прыжок индекса через слайд", async () => {
    const { scroller, container } = renderCard();
    await act(async () => {
      flushRO(390); // iPhone 12/13/14
    });
    await tick(20);

    const slideW = scroller.clientWidth * expectedSlideFraction(390);
    // Симулируем momentum-свайп: 6 промежуточных позиций между слайдами 0 и 1,
    // как iOS отдаёт во время инерционной прокрутки.
    const positions = [
      slideW * 0.15,
      slideW * 0.35,
      slideW * 0.55,
      slideW * 0.78,
      slideW * 0.92,
      slideW * 1.0, // финальный snap на индекс 1
    ];

    for (const left of positions) {
      Object.defineProperty(scroller, "scrollLeft", {
        configurable: true,
        value: left,
      });
      await act(async () => {
        scroller.dispatchEvent(new Event("scroll"));
      });
      await tick(8); // меньше 16мс — типичный темп iOS scroll-events
    }

    // Ждём settle-таймер (90мс) + запас.
    await tick(160);

    // Дотов 4, активный должен быть 1 (а не 2/3). Активный дот — c bg-foreground.
    const dots = container.querySelectorAll(".pointer-events-none.absolute.bottom-2 span");
    expect(dots.length).toBe(4);
    const activeIndex = Array.from(dots).findIndex((d) =>
      d.className.includes("bg-foreground"),
    );
    expect(activeIndex, "после быстрого свайпа активен соседний слайд, а не дальний").toBe(1);
  });

  it("поворот устройства (390 → 768 → 390) сохраняет активный слайд и переякоривает scrollLeft", async () => {
    const { scroller, container } = renderCard();
    await act(async () => {
      flushRO(390);
    });
    await tick(20);

    // Прокручиваем к слайду 2.
    const slideW390 = scroller.clientWidth * expectedSlideFraction(390);
    Object.defineProperty(scroller, "scrollLeft", {
      configurable: true,
      writable: true,
      value: slideW390 * 2,
    });
    await act(async () => {
      scroller.dispatchEvent(new Event("scroll"));
    });
    await tick(160);

    let dots = container.querySelectorAll(".pointer-events-none.absolute.bottom-2 span");
    let activeIndex = Array.from(dots).findIndex((d) =>
      d.className.includes("bg-foreground"),
    );
    expect(activeIndex).toBe(2);

    // scrollTo вызывается компонентом при смене breakpoint — ловим его.
    const scrollToCalls: number[] = [];
    scroller.scrollTo = ((opts: ScrollToOptions) => {
      const left = typeof opts === "object" ? (opts.left ?? 0) : 0;
      scrollToCalls.push(left);
      Object.defineProperty(scroller, "scrollLeft", {
        configurable: true,
        writable: true,
        value: left,
      });
    }) as typeof scroller.scrollTo;

    // Поворот в landscape / split-view: 768 px (lg-брейкпоинт, peek 14%).
    await act(async () => {
      flushRO(768);
    });
    await tick(40);

    // Re-anchor должен попасть в позицию слайда 2 при новой ширине.
    const expectedLeft768 = 2 * 768 * expectedSlideFraction(768);
    expect(scrollToCalls.length, "ожидаем хотя бы один re-anchor scrollTo").toBeGreaterThan(0);
    const last = scrollToCalls[scrollToCalls.length - 1];
    expect(
      Math.abs(last - expectedLeft768),
      `scrollTo переякорил в ${last}, ожидали ${expectedLeft768}`,
    ).toBeLessThan(2);

    // Активный дот не меняется.
    dots = container.querySelectorAll(".pointer-events-none.absolute.bottom-2 span");
    activeIndex = Array.from(dots).findIndex((d) =>
      d.className.includes("bg-foreground"),
    );
    expect(activeIndex, "после поворота активный слайд не должен меняться").toBe(2);

    // Ширина слайда соответствует новому breakpoint.
    const actualPct = slideWidthPctFromDOM(scroller);
    const expectedPct = +(expectedSlideFraction(768) * 100).toFixed(2);
    expect(Math.abs(actualPct - expectedPct)).toBeLessThan(0.5);

    // Поворот обратно в portrait.
    await act(async () => {
      flushRO(390);
    });
    await tick(40);
    const expectedLeft390 = 2 * 390 * expectedSlideFraction(390);
    const last2 = scrollToCalls[scrollToCalls.length - 1];
    expect(Math.abs(last2 - expectedLeft390)).toBeLessThan(2);
  });

  it("ResizeObserver-бурст (множественные width-events в одном кадре) коалесцируется в один commit", async () => {
    const { scroller } = renderCard();
    await act(async () => {
      flushRO(375);
    });
    await tick(20);

    const widthBefore = slideWidthPctFromDOM(scroller);
    expect(widthBefore).toBeCloseTo(expectedSlideFraction(375) * 100, 1);

    // Бурст из 5 RO-эвентов «в одном кадре» — суб-пиксельный jitter.
    // Не должен ронять компонент и должен сойтись на финальной ширине.
    await act(async () => {
      flushRO(376);
      flushRO(377);
      flushRO(378);
      flushRO(376);
      flushRO(375);
    });
    await tick(40);

    // Все промежуточные значения попадают в тот же sm-breakpoint — peek
    // не должен дёрнуться, ширина слайда остаётся прежней.
    const widthAfter = slideWidthPctFromDOM(scroller);
    expect(widthAfter).toBeCloseTo(widthBefore, 1);
  });

  it("сохраняет peek-инвариант: peek + slide = 100% (без gap-дрифта)", async () => {
    const { scroller } = renderCard();
    for (const w of [320, 375, 414, 600, 768]) {
      await act(async () => {
        flushRO(w);
      });
      await tick(20);
      const slidePct = slideWidthPctFromDOM(scroller);
      const peekPct = 100 - slidePct;
      const expectedPeek = (1 - expectedSlideFraction(w)) * 100;
      expect(
        Math.abs(peekPct - expectedPeek),
        `width=${w}: peek ${peekPct.toFixed(2)}%, ожидали ${expectedPeek.toFixed(2)}%`,
      ).toBeLessThan(0.5);
    }
  });
});
