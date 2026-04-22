/**
 * Юнит-тесты локаль-зависимого форматирования (Intl).
 *
 * Sanity-уровень. Проверяет:
 *  - en-US: "$8.50" (символ слева, точка как десятичный)
 *  - ru-RU: "8,50 $" (символ справа, запятая как десятичный, NBSP перед $)
 *  - es-ES: содержит "8,50" и "US$" / "$" (Node.js ICU варианты)
 *  - formatNumber: разделители тысяч локализованы (en: "1,000", ru: "1 000")
 *
 * NB: ICU в разных средах может слегка варьировать пробелы (NBSP `\u00a0` vs
 * NNBSP `\u202f`) и формы валют ("US$" vs "$"). Поэтому мы нормализуем
 * пробелы и используем `toContain` для устойчивости к окружению.
 */
import { describe, it, expect } from "vitest";
import { formatPrice, formatPriceRange, formatNumber, localeFor } from "@/lib/format";

const norm = (s: string) => s.replace(/\u00a0|\u202f/g, " ");

describe("lib/format — Intl-based localized formatting", () => {
  it("localeFor maps Language → BCP-47 tag", () => {
    expect(localeFor("en")).toBe("en-US");
    expect(localeFor("ru")).toBe("ru-RU");
    expect(localeFor("es")).toBe("es-ES");
  });

  it("formatPrice: en-US prefixes $ and uses dot decimal", () => {
    expect(norm(formatPrice(8.5, "en"))).toBe("$8.50");
    expect(norm(formatPrice(1234.5, "en"))).toBe("$1,234.50");
  });

  it("formatPrice: ru-RU suffixes currency and uses comma decimal", () => {
    const out = norm(formatPrice(8.5, "ru"));
    expect(out).toContain("8,50");
    expect(out).toContain("$");
    // Symbol must come AFTER the digits in ru.
    expect(out.indexOf("$")).toBeGreaterThan(out.indexOf("8,50"));
  });

  it("formatPrice: es-ES uses comma decimal and a USD currency form", () => {
    const out = norm(formatPrice(8.5, "es"));
    expect(out).toContain("8,50");
    // Node ICU may emit either "US$" or "$" or "USD" depending on data version.
    expect(/US\$|USD|\$/.test(out)).toBe(true);
  });

  it("formatPriceRange: en-US joins two formatted prices with em dash spacing", () => {
    expect(norm(formatPriceRange(8.5, 9.2, "en"))).toBe("$8.50 – $9.20");
  });

  it("formatPriceRange: ru-RU keeps currency symbol on each end of the range", () => {
    const out = norm(formatPriceRange(8.5, 9.2, "ru"));
    expect(out).toContain("8,50");
    expect(out).toContain("9,20");
    // Двукратное появление символа валюты ($ или RUB-style — но мы передаём USD).
    const dollarCount = (out.match(/\$/g) ?? []).length;
    expect(dollarCount).toBe(2);
    expect(out).toContain(" – ");
  });

  it("formatPriceRange: equal min/max renders a single price", () => {
    expect(norm(formatPriceRange(10, 10, "en"))).toBe("$10.00");
  });

  it("formatNumber: en-US uses comma thousands separator", () => {
    expect(norm(formatNumber(1000, "en"))).toBe("1,000");
    expect(norm(formatNumber(1234567, "en"))).toBe("1,234,567");
  });

  it("formatNumber: ru-RU uses (NB)space thousands separator", () => {
    expect(norm(formatNumber(1000, "ru"))).toBe("1 000");
    expect(norm(formatNumber(1234567, "ru"))).toBe("1 234 567");
  });

  it("formatNumber: es-ES uses dot or (NB)space for thousands depending on ICU", () => {
    const out = norm(formatNumber(1234567, "es"));
    // Either "1.234.567" or "1 234 567" depending on Node ICU data version.
    expect(out === "1.234.567" || out === "1 234 567").toBe(true);
  });
});
