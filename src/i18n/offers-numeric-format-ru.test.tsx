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
 *  3. MOQ (1000 кг) отрисован с локализованным разделителем тысяч:
 *     "1 000 кг" (NBSP), не "1,000 kg".
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
import { type Language } from "@/i18n/translations";

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
          <RegistrationProvider>
            <Routes>
              <Route path="/offers" element={<Offers />} />
            </Routes>
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

/**
 * Возвращает первую (по DOM-порядку) карточку с числовой ценой —
 * т.е. ту, у которой `data-testid="offer-price"` содержит хотя бы цифру.
 * Этим мы целенаправленно тестируем мигрированные офферы (id=1, id=2),
 * не задевая старые с захардкоженными en-строками.
 */
const getPrimaryNumericCard = (): HTMLElement => {
  const priceNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="offer-price"]'),
  );
  for (const p of priceNodes) {
    const text = p.textContent ?? "";
    if (/\d/.test(text)) {
      // Поднимаемся к карточке (3 уровня вверх обычно достаточно).
      const card = p.closest("div.group") ?? p.parentElement?.parentElement?.parentElement;
      if (card instanceof HTMLElement) return card;
    }
  }
  throw new Error("getPrimaryNumericCard: no card with numeric price found");
};

describe("/offers — numeric & currency formatting follows ru locale", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
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

    const card = getPrimaryNumericCard();
    const priceText = norm(
      card.querySelector<HTMLElement>('[data-testid="offer-price"]')?.textContent ?? "",
    );
    const unitText = norm(
      card.querySelector<HTMLElement>('[data-testid="offer-price-unit"]')?.textContent ?? "",
    );
    const moqText = norm(
      card.querySelector<HTMLElement>('[data-testid="offer-moq"]')?.textContent ?? "",
    );

    // ── Цена ─────────────────────────────────────────────────────────────
    // Atlantic Salmon: 8.5 – 9.2 USD → ru: "8,50 $ – 9,20 $"
    expect(priceText).toContain("8,50");
    expect(priceText).toContain("9,20");
    // Символ доллара — дважды, по одному на каждый конец диапазона.
    expect((priceText.match(/\$/g) ?? []).length).toBe(2);
    // Разделитель диапазона — em dash.
    expect(priceText).toContain(" – ");
    // НЕ должно быть en-формата (точка как десятичный + $ слева).
    expect(priceText).not.toContain("$8.50");
    expect(priceText).not.toContain("$9.20");

    // ── Единица цены ────────────────────────────────────────────────────
    expect(unitText).toBe("за кг");
    expect(unitText).not.toContain("per kg");

    // ── MOQ (1000 кг) ────────────────────────────────────────────────────
    // ru: "Мин. партия: 1 000 кг" (NBSP уже нормализован в обычный пробел).
    expect(moqText).toContain("Мин. партия");
    expect(moqText).toContain("1 000");
    expect(moqText).toContain("кг");
    expect(moqText).not.toContain("MOQ:");
    expect(moqText).not.toContain("1,000");
    expect(moqText).not.toContain(" kg");
  });

  it("After switching ru → en, the same card re-renders with en-US formatting", () => {
    let setLang!: (l: Language) => void;
    renderOffers((s) => (setLang = s));

    act(() => setLang("ru"));
    // Затем обратно на en — проверяем, что Intl-форматирование переключилось.
    act(() => setLang("en"));

    const card = getPrimaryNumericCard();
    const priceText = norm(
      card.querySelector<HTMLElement>('[data-testid="offer-price"]')?.textContent ?? "",
    );
    const unitText = norm(
      card.querySelector<HTMLElement>('[data-testid="offer-price-unit"]')?.textContent ?? "",
    );
    const moqText = norm(
      card.querySelector<HTMLElement>('[data-testid="offer-moq"]')?.textContent ?? "",
    );

    // en-US: "$8.50 – $9.20"
    expect(priceText).toContain("$8.50");
    expect(priceText).toContain("$9.20");
    expect(priceText).not.toContain("8,50");
    expect(priceText).not.toContain("9,20");

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
      document.querySelectorAll<HTMLElement>('[data-testid="offer-moq"]'),
    ).map((n) => norm(n.textContent ?? ""));

    const shrimpMoq = moqs.find((m) => m.includes("5 000"));
    expect(shrimpMoq).toBeDefined();
    expect(shrimpMoq!).toContain("Мин. партия");
    expect(shrimpMoq!).toContain("кг");
    expect(shrimpMoq!).not.toContain("5,000");
  });
});
