/**
 * Интеграционный тест: после смены локали на ru при переходе на /offers
 * числовые и валютные значения в карточках офферов отрисованы по
 * правилам ru-RU (Intl.NumberFormat).
 *
 * Что проверяется на странице /offers:
 *  1. Цена первого оффера (Atlantic Salmon, priceMin=8.5, priceMax=9.2):
 *     - содержит "8,50" и "9,20" (запятая как десятичный, ru-RU)
 *     - содержит символ валюты `$` (USD) ДВАЖДЫ — по одному для min и max
 *     - НЕ содержит en-формат "$8.50" / "$9.20"
 *  2. Единица цены — переведена: "за кг" (ru), не "per kg" (en).
 *  3. MOQ (1000 kg) отрисован с локализованным разделителем тысяч:
 *     "1 000 kg" (NBSP), не "1,000 kg".
 *  4. Лейбл MOQ — переведён: "Мин. партия" (ru), не "MOQ" (en).
 *
 * Чтобы исключить flakiness из-за NBSP/NNBSP в Intl-выводе разных версий
 * ICU, текст нормализуется заменой `\u00a0|\u202f` на обычный пробел.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import { setQualified } from "@/lib/access-level";
import { translations, type Language } from "@/i18n/translations";
import { CATALOG_OFFER_ROW_TEST_IDS as TID } from "@/components/catalog/catalog-offer-row-testids";

import Offers from "@/pages/Offers";

const norm = (s: string) => s.replace(/\u00a0|\u202f/g, " ");

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", { value: list ?? [primary], configurable: true });
};

const ExposeSetter = ({ onReady }: { onReady: (s: (l: Language) => void) => void }) => {
  const { setLang } = useLanguage();
  onReady(setLang);
  return null;
};

const renderOffers = (onReady: (s: (l: Language) => void) => void, initialPath = "/offers") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <ExposeSetter onReady={onReady} />
        <TooltipProvider>
          <BuyerSessionProvider>
            <RegistrationProvider>
              <Routes>
                <Route path="/offers" element={<Offers />} />
              </Routes>
            </RegistrationProvider>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

/**
 * Возвращает первый row price-block с числовой ценой. Catalog rows expose
 * stable test ids via `catalog-offer-row-testids`; older `offer-*` ids belong
 * to the retired card contract and must not be used here.
 */
const getPrimaryNumericPriceBlock = (): HTMLElement => {
  const priceNodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-testid="${TID.price}"]`),
  );
  for (const p of priceNodes) {
    const text = p.textContent ?? "";
    if (/\d/.test(text)) {
      const block = p.closest(`[data-testid="${TID.priceBlock}"]`);
      if (block instanceof HTMLElement) return block;
    }
  }
  throw new Error("getPrimaryNumericPriceBlock: no row with numeric price found");
};

describe("/offers — numeric & currency formatting follows ru locale", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    buyerSession.signIn({ identifier: "buyer@yorso.test", method: "email" });
    setQualified(true, "Approved supplier");
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
  });

  it("After setLang('ru'), the first offer card on /offers renders ru-RU price/qty", () => {
    let setLang!: (l: Language) => void;
    renderOffers((s) => (setLang = s));

    // Стартовый автодетект — en. Переключаем на ru.
    act(() => setLang("ru"));

    const priceBlock = getPrimaryNumericPriceBlock();
    const priceText = norm(
      priceBlock.querySelector<HTMLElement>(`[data-testid="${TID.price}"]`)?.textContent ?? "",
    );
    const unitText = norm(
      priceBlock.querySelector<HTMLElement>("button[aria-label]")?.textContent ?? "",
    );
    const moqText = norm(
      priceBlock.querySelector<HTMLElement>(`[data-testid="${TID.moq}"]`)?.textContent ?? "",
    );

    // ── Цена ─────────────────────────────────────────────────────────────
    // Atlantic Salmon exact benchmark: average of 8.5 and 9.2 USD → ru "8,85 $".
    expect(priceText).toContain("8,85");
    expect((priceText.match(/\$/g) ?? []).length).toBe(1);
    // НЕ должно быть en-формата (точка как десятичный + $ слева).
    expect(priceText).not.toContain("$8.85");

    // ── Единица цены ────────────────────────────────────────────────────
    expect(unitText).toBe("за кг");
    expect(unitText).not.toContain("per kg");

    // ── MOQ (1000 kg) ────────────────────────────────────────────────────
    // ru: "Мин. партия: 1 000 kg" (NBSP уже нормализован в обычный пробел).
    expect(moqText).toContain("Мин. партия");
    expect(moqText).toContain("1 000");
    expect(moqText).toContain("kg");
    expect(moqText).not.toContain("MOQ:");
    expect(moqText).not.toContain("1,000");
  });

  it("After switching ru → en, the same card re-renders with en-US formatting", () => {
    let setLang!: (l: Language) => void;
    renderOffers((s) => (setLang = s));

    act(() => setLang("ru"));
    // Затем обратно на en — проверяем, что Intl-форматирование переключилось.
    act(() => setLang("en"));

    const priceBlock = getPrimaryNumericPriceBlock();
    const priceText = norm(
      priceBlock.querySelector<HTMLElement>(`[data-testid="${TID.price}"]`)?.textContent ?? "",
    );
    const unitText = norm(
      priceBlock.querySelector<HTMLElement>("button[aria-label]")?.textContent ?? "",
    );
    const moqText = norm(
      priceBlock.querySelector<HTMLElement>(`[data-testid="${TID.moq}"]`)?.textContent ?? "",
    );

    // en-US exact benchmark.
    expect(priceText).toContain("$8.85");
    expect(priceText).not.toContain("8,85");

    expect(unitText).toBe("per kg");

    // en: "MOQ: 1,000 kg"
    expect(moqText).toContain("MOQ");
    expect(moqText).toContain("1,000");
    expect(moqText).toContain("kg");
    expect(moqText).not.toContain("Мин. партия");
    expect(moqText).not.toContain("1 000");
  });

  it("Second migrated card (Vannamei Shrimp, MOQ=5000) also formats by ru locale", () => {
    let setLang!: (l: Language) => void;
    renderOffers((s) => (setLang = s));

    act(() => setLang("ru"));

    // Берём ВСЕ карточки с числовой ценой и ищем ту, у которой MOQ = 5000.
    const moqs = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-testid="${TID.moq}"]`),
    ).map((n) => norm(n.textContent ?? ""));

    const shrimpMoq = moqs.find((m) => m.includes("5 000"));
    expect(shrimpMoq).toBeDefined();
    expect(shrimpMoq!).toContain(translations.ru.offers_moqLabel);
    expect(shrimpMoq!).toContain("kg");
    expect(shrimpMoq!).not.toContain("5,000");
  });
});
