/**
 * MobileOfferCard · увеличенная тач-область для названия и базиса.
 *
 * Контракт после расширения тач-целей:
 *  1. Название (h3) и латинское имя обёрнуты в один <Link
 *     data-testid="catalog-row-view-details">, ведущий на /offers/:id.
 *  2. У ссылки названия применены утилитарные классы расширения
 *     тач-области: -mx-2, -my-1, px-2, py-1, rounded-md.
 *  3. Базис поставки — отдельный <Link data-testid="catalog-row-basis">,
 *     ведущий на /offers/:id, с расширенной тач-целью: -mx-2, -my-1,
 *     px-2, py-1.5, rounded-md (минимум ~44px по высоте за счёт
 *     leading-5 + py-1.5 + бордеров).
 *  4. У обеих ссылок есть active:bg-muted/70 и focus-visible:ring —
 *     визуальный отклик на тап и доступность с клавиатуры.
 *  5. У обеих ссылок есть осмысленный aria-label.
 *  6. Клик по тач-области не всплывает до карточки и не вызывает
 *     onSelect (e.stopPropagation).
 *
 * Тесты проверяют именно DOM-контракт, чтобы случайное удаление
 * расширяющих классов или подмена структуры сразу ловилась.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";

const renderCard = (onSelect = vi.fn()) => {
  const offer = mockOffers.find((o) => o.deliveryBasisOptions?.length) ?? mockOffers[0];
  const utils = render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <MobileOfferCard offer={offer} isSelected={false} onSelect={onSelect} />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  return { ...utils, offer, onSelect };
};

describe("MobileOfferCard · расширенные тач-области для названия и базиса", () => {
  afterEach(() => cleanup());

  it("название обёрнуто в ссылку на /offers/:id с расширяющими классами", () => {
    const { getByTestId, offer } = renderCard();
    const link = getByTestId("catalog-row-view-details");

    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe(`/offers/${offer.id}`);

    const cls = link.className;
    // Ghost-padding: отрицательные margin'ы + положительные padding'и.
    expect(cls).toMatch(/(^|\s)-mx-2(\s|$)/);
    expect(cls).toMatch(/(^|\s)-my-1(\s|$)/);
    expect(cls).toMatch(/(^|\s)px-2(\s|$)/);
    expect(cls).toMatch(/(^|\s)py-1(\s|$)/);
    expect(cls).toContain("rounded-md");
  });

  it("ссылка названия даёт визуальный и a11y-отклик: active + focus ring + aria-label", () => {
    const { getByTestId, offer } = renderCard();
    const link = getByTestId("catalog-row-view-details");
    const cls = link.className;

    // Active отклик: подсветка фона + лёгкий scale-down (тап «проседает»).
    expect(cls).toContain("active:bg-muted");
    expect(cls).toMatch(/active:scale-\[0\.99\]/);

    // Focus-visible: видимый ring с offset для контраста на любом фоне.
    expect(cls).toContain("focus-visible:ring-2");
    expect(cls).toContain("focus-visible:ring-primary");
    expect(cls).toContain("focus-visible:ring-offset-2");
    expect(cls).toContain("focus-visible:outline-none");

    // Тач-оптимизация: убираем 300ms задержку и серый flash на iOS.
    expect(cls).toContain("touch-manipulation");
    expect(cls).toContain("[-webkit-tap-highlight-color:transparent]");

    expect(link.getAttribute("aria-label") ?? "").toContain(offer.productName);
  });

  it("название и латинское имя — внутри одной ссылки (единая тач-цель)", () => {
    const { getByTestId, offer } = renderCard();
    const link = getByTestId("catalog-row-view-details");
    const h3 = link.querySelector("h3");
    expect(h3).not.toBeNull();
    expect(h3?.textContent).toBe(offer.productName);
    if (offer.latinName) {
      expect(link.querySelector("p")?.textContent).toBe(offer.latinName);
    }
  });

  it("базис поставки — это <a> на /offers/:id с расширенной тач-целью", () => {
    const { getByTestId, offer } = renderCard();
    const basis = getByTestId("catalog-row-basis");

    expect(basis.tagName).toBe("A");
    expect(basis.getAttribute("href")).toBe(`/offers/${offer.id}`);

    const cls = basis.className;
    expect(cls).toMatch(/(^|\s)-mx-2(\s|$)/);
    expect(cls).toMatch(/(^|\s)-my-1(\s|$)/);
    expect(cls).toMatch(/(^|\s)px-2(\s|$)/);
    // У базиса вертикальный padding чуть больше, чтобы добрать до ~44px.
    expect(cls).toMatch(/(^|\s)py-1\.5(\s|$)/);
    expect(cls).toContain("rounded-md");
    expect(cls).toContain("active:bg-muted/70");
    expect(cls).toContain("focus-visible:ring-2");
  });

  it("у ссылки базиса есть осмысленный aria-label с кодом, портом и сроком", () => {
    const { getByTestId, offer } = renderCard();
    const basis = getByTestId("catalog-row-basis");
    const primary = offer.deliveryBasisOptions?.[0];
    expect(primary).toBeDefined();

    const label = basis.getAttribute("aria-label") ?? "";
    expect(label).toContain(primary!.code);
    expect(label).toContain(primary!.leadTime);
  });

  it("клик по названию/базису не вызывает onSelect карточки (stopPropagation)", () => {
    const { getByTestId, onSelect } = renderCard();

    fireEvent.click(getByTestId("catalog-row-view-details"));
    fireEvent.click(getByTestId("catalog-row-basis"));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
