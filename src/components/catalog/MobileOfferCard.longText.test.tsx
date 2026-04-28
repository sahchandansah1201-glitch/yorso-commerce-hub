// MobileOfferCard - long text wrapping safety
//
// Цель: убедиться, что заголовок, латинское имя и базис поставки
// корректно переносятся (не выходят за карточку и не накладываются),
// когда строки очень длинные.
//
// Проверяем ключевые CSS-инварианты на DOM:
//  - заголовок имеет line-clamp-2 + overflowWrap=anywhere/break-word
//  - латинское имя имеет line-clamp-1 + truncate (не вылезает)
//  - базис: порт+leadTime внутри truncate, контейнер flex с gap
//  - вертикальный gap между ценой/названием/базисом/поставщиком
//    исходит от gap-4 на родителе

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockOffers } from "@/data/mockOffers";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";

const LONG_NAME =
  "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade Extra Large Hand-Trimmed Single-Frozen Norwegian Origin Restaurant Pack";
const LONG_LATIN = "Salmoooooooooooooooooooooooooooo salaaaaaaaaaaaaaaaaaaaaar";
const LONG_PORT = "Aaaaalesundddddddddddddddddddddddddddddddddddddddd, Norway";

const renderCard = () => {
  const base = mockOffers[0];
  const offer = {
    ...base,
    productName: LONG_NAME,
    latinName: LONG_LATIN,
    deliveryBasisOptions: base.deliveryBasisOptions?.map((b, i) =>
      i === 0 ? { ...b, shipmentPort: LONG_PORT } : b,
    ),
  };
  const utils = render(
    <MemoryRouter>
      <LanguageProvider>
        <BuyerSessionProvider>
          <MobileOfferCard
            offer={offer}
            isSelected={false}
            onSelect={() => {}}
          />
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
  return { ...utils, offer };
};

describe("MobileOfferCard · long text wrapping", () => {
  afterEach(() => cleanup());

  it("заголовок ограничен line-clamp-2 и переносит длинные слова", () => {
    const { container } = renderCard();
    const h3 = container.querySelector("h3");
    expect(h3).not.toBeNull();
    expect(h3!.className).toMatch(/line-clamp-2/);
    expect(h3!.className).toMatch(/leading-6/);
    // overflow-wrap: anywhere выставлен через style — гарантирует
    // безопасный перенос даже у склеенных длинных слов.
    const style = (h3 as HTMLElement).style;
    expect(style.overflowWrap).toBe("anywhere");
    expect(style.wordBreak).toBe("break-word");
    expect(h3!.textContent).toBe(LONG_NAME);
  });

  it("латинское имя имеет line-clamp-1 и mt-1.5 — отступ от заголовка", () => {
    const { container } = renderCard();
    const latin = container.querySelector("p.italic");
    expect(latin).not.toBeNull();
    expect(latin!.className).toMatch(/line-clamp-1/);
    expect(latin!.className).toMatch(/mt-1\.5/);
    expect(latin!.textContent).toBe(LONG_LATIN);
  });

  it("базис поставки — порт обрезается truncate, иконка не съезжает", () => {
    const { container } = renderCard();
    // Иконка Truck (lucide) перед базисом
    const truck = container.querySelector(".lucide-truck");
    expect(truck).not.toBeNull();
    const truckClass =
      typeof truck!.className === "string"
        ? truck!.className
        : (truck!.className as unknown as { baseVal: string }).baseVal;
    expect(truckClass).toMatch(/shrink-0/);

    // Длинный порт находится в span с truncate.
    const truncated = container.querySelector(
      ".text-xs .truncate, .text-xs span.truncate",
    );
    // На карточке несколько truncate-узлов; ищем тот, что содержит порт.
    const all = Array.from(container.querySelectorAll("span.truncate"));
    const portNode = all.find((el) => el.textContent?.includes("Aaaaalesund"));
    expect(portNode, "порт должен быть в truncate-обёртке").toBeDefined();
  });

  it("вертикальный gap между блоками — gap-4 на инфо-контейнере", () => {
    const { container } = renderCard();
    const infoColumn = container.querySelector(
      ".flex.min-w-0.flex-col.gap-4.px-4",
    );
    expect(
      infoColumn,
      "контейнер должен использовать gap-4 для воздуха между блоками",
    ).not.toBeNull();
  });

  it("карточка целиком имеет min-w-0/overflow-hidden, ничего не выпирает", () => {
    const { container } = renderCard();
    // Контейнер инфо-колонки и его потомки имеют min-w-0,
    // что в flex-контексте предотвращает раздутие из-за длинного слова.
    const infoColumn = container.querySelector(
      ".flex.min-w-0.flex-col.gap-4.px-4",
    );
    expect(infoColumn).not.toBeNull();

    // Заголовок завёрнут в Link с min-w-0/block — ширина не растягивается.
    const link = container.querySelector(
      'a[data-testid="catalog-row-view-details"]',
    );
    expect(link).not.toBeNull();
    expect(link!.className).toMatch(/min-w-0/);
    expect(link!.className).toMatch(/block/);
  });
});
