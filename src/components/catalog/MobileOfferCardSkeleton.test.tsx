// MobileOfferCardSkeleton — проверка соответствия ритма реальной карточке.
//
// Цель: гарантировать отсутствие layout-shift при подмене скелетона
// на реальный MobileOfferCard. Проверяем, что ключевые
// классы вертикального ритма совпадают.

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import MobileOfferCardSkeleton from "@/components/catalog/MobileOfferCardSkeleton";

describe("MobileOfferCardSkeleton · vertical rhythm parity", () => {
  afterEach(() => cleanup());

  it("article использует те же отступы и radius, что и MobileOfferCard", () => {
    const { getByTestId } = render(<MobileOfferCardSkeleton />);
    const article = getByTestId("catalog-offer-row-skeleton");
    expect(article.className).toMatch(/rounded-lg/);
    expect(article.className).toMatch(/border/);
    expect(article.className).toMatch(/gap-3/);
    expect(article).toHaveAttribute("aria-busy", "true");
  });

  it("инфо-колонка повторяет gap-3 / px-4 pb-4 pt-2 живой карточки", () => {
    const { container } = render(<MobileOfferCardSkeleton />);
    const info = container.querySelector(
      ".flex.min-w-0.flex-col.gap-3.px-4.pb-4.pt-2",
    );
    expect(info, "инфо-колонка должна совпадать по ритму").not.toBeNull();
  });

  it("цена-строка имеет leading-6 как в реальной карточке", () => {
    const { container } = render(<MobileOfferCardSkeleton />);
    const priceRow = container.querySelector(
      ".flex.items-baseline.gap-2.leading-6",
    );
    expect(priceRow).not.toBeNull();
  });

  it("базис-строка имеет leading-5 как в реальной карточке", () => {
    const { container } = render(<MobileOfferCardSkeleton />);
    const basisRow = container.querySelector(
      ".flex.items-center.gap-1\\.5.leading-5",
    );
    expect(basisRow).not.toBeNull();
  });

  it("поставщик-строка имеет border-t border-border/60 pt-3", () => {
    const { container } = render(<MobileOfferCardSkeleton />);
    const sup = container.querySelector(
      ".border-t.border-border\\/60.pt-3",
    );
    expect(sup).not.toBeNull();
  });

  it("фото имеет фиксированный aspect-[4/5] — высота не прыгает", () => {
    const { container } = render(<MobileOfferCardSkeleton />);
    const photo = container.querySelector(".aspect-\\[4\\/5\\]");
    expect(photo).not.toBeNull();
  });
});
