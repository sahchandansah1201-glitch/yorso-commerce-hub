/**
 * A11y-контракт кнопки «Аналитика» в CatalogOfferRow.
 *
 * Что закрепляем:
 *  1. Кнопка имеет уникальный id и связана с раскрывающимся регионом
 *     через aria-controls; регион имеет role="region" и
 *     aria-labelledby, указывающий на id кнопки.
 *  2. aria-expanded синхронно отражает open/closed состояние и data-state.
 *  3. aria-label описывает действие осмысленно и включает имя оффера
 *     (а не просто «Аналитика»), а title даёт hover-подсказку.
 *  4. Есть скрытый помощник aria-describedby (sr-only), описывающий
 *     эффект активации и отдельно сценарии open / closed.
 *  5. focus-visible классы присутствуют — кольцо primary-цвета с offset
 *     видно как в open-, так и в closed-состоянии.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";

const renderRow = () => {
  const offer = mockOffers[0];
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <CatalogOfferRow
            offer={offer}
            isSelected={false}
            onSelect={() => {}}
            forceLevel="anonymous_locked"
          />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  return offer;
};

describe("CatalogOfferRow · «Аналитика» — a11y контракт", () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it("кнопка имеет уникальный id и aria-controls указывает на раскрывающийся регион со скрытым h4-заголовком", () => {
    const offer = renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle");

    expect(btn.id).toBe(`offer-analytics-${offer.id}-toggle`);
    expect(btn.getAttribute("aria-controls")).toBe(`offer-analytics-${offer.id}`);

    const panel = screen.getByTestId("catalog-row-analytics-panel");
    expect(panel.id).toBe(`offer-analytics-${offer.id}`);
    expect(panel.getAttribute("role")).toBe("region");

    // aria-labelledby ссылается на скрытый h4 внутри панели — даёт
    // скринридерам имя "Аналитика по офферу <название>" и корректную
    // h3 → h4 → h5 иерархию. Сам h4 рендерится только когда Radix
    // открыл CollapsibleContent, поэтому открываем панель перед
    // проверкой DOM-узла заголовка.
    const headingId = panel.getAttribute("aria-labelledby");
    expect(headingId).toBe(`offer-analytics-${offer.id}-heading`);

    fireEvent.click(btn);

    const heading = document.getElementById(headingId!);
    expect(heading).not.toBeNull();
    expect(heading!.tagName).toBe("H4");
    expect(heading!.className).toContain("sr-only");
    expect(heading!.textContent).toContain(offer.productName);
  });

  it("aria-expanded и data-state синхронизированы и переключаются по клику", () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle");

    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("data-state")).toBe("closed");

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(btn.getAttribute("data-state")).toBe("open");

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("data-state")).toBe("closed");
  });

  it("aria-label содержит действие и название оффера, title — hover-подсказку", () => {
    const offer = renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle");

    expect(btn.getAttribute("aria-label")).toMatch(/Показать аналитику/);
    expect(btn.getAttribute("aria-label")).toContain(offer.productName);
    expect(btn.getAttribute("title")).toBe("Аналитика цен и рынка");

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-label")).toMatch(/Скрыть аналитику/);
    expect(btn.getAttribute("aria-label")).toContain(offer.productName);
    expect(btn.getAttribute("title")).toBe("Скрыть аналитику");
  });

  it("aria-describedby ссылается на скрытый sr-only помощник с описанием эффекта", () => {
    const offer = renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle");
    const hintId = btn.getAttribute("aria-describedby");
    expect(hintId).toBe(`offer-analytics-${offer.id}-hint`);

    const hint = document.getElementById(hintId!);
    expect(hint).not.toBeNull();
    expect(hint!.className).toContain("sr-only");

    // closed → объясняет, что произойдёт по активации.
    expect(hint!.textContent).toMatch(/Разворачивает/);
    expect(hint!.textContent).toMatch(/Страница не перезагружается/);

    fireEvent.click(btn);
    expect(hint!.textContent).toMatch(/Сворачивает/);
  });

  it("focus-visible стили присутствуют и в closed-, и в open-состоянии", () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle");

    const expectFocusRing = () => {
      const cls = btn.className;
      expect(cls).toContain("focus-visible:outline-none");
      expect(cls).toContain("focus-visible:ring-2");
      expect(cls).toContain("focus-visible:ring-primary");
      expect(cls).toContain("focus-visible:ring-offset-2");
      expect(cls).toContain("focus-visible:ring-offset-background");
    };

    expectFocusRing();
    fireEvent.click(btn);
    expectFocusRing();
  });

  it("кнопка фокусируема и сохраняет фокус после переключения состояния", () => {
    renderRow();
    const btn = screen.getByTestId("catalog-row-analytics-toggle") as HTMLButtonElement;

    btn.focus();
    expect(document.activeElement).toBe(btn);

    fireEvent.click(btn);
    expect(document.activeElement).toBe(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });
});
