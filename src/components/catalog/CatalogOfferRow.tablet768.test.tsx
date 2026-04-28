/**
 * Регрессионный тест сканирования карточки на 768px (iPad portrait).
 *
 * Цель: зафиксировать, что на ширине планшета карточка панели закупок
 * рендерится строго в 3 колонках [фото | идентификация | цена/поставщик],
 * а блок цены НЕ имеет `sm:col-span-2` — это раньше схлопывало третью
 * колонку и портило горизонтальное сканирование.
 *
 * jsdom не делает реальный layout, поэтому 768px моделируется через
 * matchMedia + проверку Tailwind-класс-контракта, который активируется
 * на брейкпойнте `sm` (≥640px), действующем в т.ч. на 768px.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";

const TABLET_WIDTH = 768;

const setTabletViewport = () => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: TABLET_WIDTH,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: 1024,
  });
  // Активируем sm/md, отключаем lg/xl, чтобы matchMedia-чувствительные
  // компоненты вели себя как на iPad portrait.
  window.matchMedia = ((query: string) => {
    const matches =
      /min-width:\s*(640|768)px/.test(query) ||
      /max-width:\s*(1023|1279)px/.test(query);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
};

const renderRow = () =>
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

const findPriceColumnWrapper = (): HTMLElement => {
  let el: HTMLElement | null = screen.getByTestId("catalog-row-price");
  while (el && !el.className.includes("flex-col items-stretch")) {
    el = el.parentElement;
  }
  if (!el) throw new Error("price/supplier column wrapper not found");
  return el;
};

describe("CatalogOfferRow @768px — 3 колонки, без sm:col-span-2", () => {
  beforeEach(() => {
    setTabletViewport();
  });

  it("корневая сетка карточки описывает ровно 3 колонки на sm (включая 768px)", () => {
    renderRow();
    const row = screen.getByTestId("catalog-offer-row");

    // 3-колоночный шаблон планшета: [фото | идентификация | цена].
    expect(row.className).toContain(
      "sm:grid-cols-[minmax(140px,170px)_minmax(0,1fr)_minmax(190px,220px)]",
    );

    // Не должно быть «схлопывающих» вариантов вроде sm:grid-cols-2 / sm:grid-cols-1.
    expect(row.className).not.toMatch(/sm:grid-cols-1(\s|$)/);
    expect(row.className).not.toMatch(/sm:grid-cols-2(\s|$)/);
  });

  it("блок цены/поставщика — отдельная колонка и НЕ имеет sm:col-span-2", () => {
    renderRow();
    const priceCol = findPriceColumnWrapper();

    // Главный антирегрессионный инвариант: цена не растягивается на 2
    // колонки на планшете — иначе третья колонка исчезает и сканирование
    // снова становится вертикальным.
    expect(priceCol.className).not.toContain("sm:col-span-2");
    expect(priceCol.className).not.toMatch(/(^|\s)col-span-2(\s|$)/);
    expect(priceCol.className).not.toMatch(/(^|\s)col-span-full(\s|$)/);

    // Контракт mobile→tablet: на мобильном верхняя граница есть,
    // на sm+ она убирается, потому что цена становится колонкой, а не
    // отдельной строкой под идентификацией.
    expect(priceCol.className).toContain("border-t");
    expect(priceCol.className).toContain("sm:border-t-0");
    expect(priceCol.className).toContain("sm:pt-0");
  });

  it("карточка реально содержит 3 колонки контента на планшете (фото + идентификация + цена)", () => {
    renderRow();
    const row = screen.getByTestId("catalog-offer-row");

    // 1. Фото-колонка.
    const imgWrap = row.querySelector("div.relative");
    expect(imgWrap, "ожидалась фото-колонка").not.toBeNull();

    // 2. Колонка идентификации содержит заголовок продукта (h3).
    const heading = screen.getByRole("heading", {
      level: 3,
      name: mockOffers[0].productName,
    });
    expect(heading).toBeInTheDocument();

    // 3. Колонка цены/поставщика.
    const priceCol = findPriceColumnWrapper();
    expect(priceCol).toBeInTheDocument();

    // Все три узла — прямые/вложенные дети одного и того же ряда сетки,
    // и блок цены не охватывает фото и идентификацию (нет общего
    // родителя «цена + идентификация» с col-span-2).
    expect(priceCol.contains(heading)).toBe(false);
    expect(priceCol.contains(imgWrap as Node)).toBe(false);
  });
});
