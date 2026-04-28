/**
 * Контракт клавиатурного управления панелью «Аналитика».
 *
 * Что закрепляем:
 *  1. Enter и Space на кнопке открывают/закрывают панель — это нативное
 *     поведение <button>, проверяем что мы его не сломали custom-кодом.
 *  2. Esc, нажатый на самой кнопке при открытой панели, закрывает панель.
 *  3. Esc, нажатый внутри открытого региона панели, закрывает панель и
 *     возвращает фокус на кнопку-триггер (без потери в body).
 *  4. Esc при закрытой панели — no-op (не глотает событие у родителей).
 *  5. Кнопка остаётся фокусируемой и её state синхронизируется
 *     с aria-expanded после клавиатурных взаимодействий.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
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

const flushRaf = () =>
  act(() => {
    // jsdom может не иметь rAF — полифилим до setTimeout.
    return new Promise<void>((resolve) => {
      const raf =
        (globalThis as unknown as { requestAnimationFrame?: (cb: () => void) => number })
          .requestAnimationFrame ?? ((cb: () => void) => setTimeout(cb, 0) as unknown as number);
      raf(() => resolve());
    });
  });

describe("CatalogOfferRow · «Аналитика» — клавиатурное управление", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("Enter на кнопке открывает панель (нативное поведение <button>)", () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle") as HTMLButtonElement;
    btn.focus();

    // jsdom: keyDown(Enter) на <button> не триггерит click автоматически,
    // поэтому моделируем нативный путь через fireEvent.click — это и есть
    // то, что вызывает браузер по Enter на focused button.
    fireEvent.keyDown(btn, { key: "Enter" });
    fireEvent.click(btn);

    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("Space на кнопке закрывает уже открытую панель (нативное поведение <button>)", () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle") as HTMLButtonElement;
    btn.focus();
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");

    // Space на button → click при отпускании.
    fireEvent.keyDown(btn, { key: " " });
    fireEvent.keyUp(btn, { key: " " });
    fireEvent.click(btn);

    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("Esc на кнопке при открытой панели — закрывает панель", async () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle") as HTMLButtonElement;
    btn.focus();
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(btn, { key: "Escape" });
    await flushRaf();

    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("Esc внутри открытого региона панели — закрывает панель и возвращает фокус на кнопку", async () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle") as HTMLButtonElement;
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");

    const panel = screen.getByTestId("catalog-row-analytics-panel");
    // Симулируем нажатие Esc на любом узле внутри региона —
    // обработчик висит на CollapsibleContent и должен сработать через bubbling.
    const innerNode =
      screen.queryByTestId("catalog-row-analytics-panel-inner") ?? panel;
    fireEvent.keyDown(innerNode, { key: "Escape" });

    await flushRaf();

    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(btn);
  });

  it("Esc при закрытой панели — не вызывает побочных эффектов и не меняет состояние", async () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle") as HTMLButtonElement;
    btn.focus();
    expect(btn.getAttribute("aria-expanded")).toBe("false");

    const stop = vi.fn();
    const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    Object.defineProperty(ev, "stopPropagation", { value: stop });
    btn.dispatchEvent(ev);
    await flushRaf();

    expect(btn.getAttribute("aria-expanded")).toBe("false");
    // Обработчик не должен глотать Esc, когда панель уже закрыта,
    // иначе он сломает Esc у вышестоящих диалогов.
    expect(stop).not.toHaveBeenCalled();
  });

  it("после Esc-закрытия кнопка остаётся фокусируемой и data-state синхронен с aria-expanded", async () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle") as HTMLButtonElement;
    fireEvent.click(btn);
    fireEvent.keyDown(btn, { key: "Escape" });
    await flushRaf();

    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("data-state")).toBe("closed");
    expect(document.activeElement).toBe(btn);

    // И снова можно открыть с клавиатуры.
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(btn.getAttribute("data-state")).toBe("open");
  });
});
