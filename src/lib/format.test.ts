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

import { RANGE_SEPARATOR } from "@/lib/format";

describe("lib/format — locale-correct grouping & NB-spaced range separator", () => {
  it("RANGE_SEPARATOR is en-dash wrapped in NB-spaces (no plain spaces)", () => {
    expect(RANGE_SEPARATOR).toBe("\u00a0–\u00a0");
    expect(RANGE_SEPARATOR.includes(" ")).toBe(false);
  });

  it("formatNumber: es-ES groups 4-digit values (1234 → 1.234, not 1234)", () => {
    // ICU es-ES default leaves 4-digit numbers ungrouped; we force grouping
    // because B2B catalogs frequently show MOQ in the 1000–9999 band.
    const out = formatNumber(1234, "es");
    expect(out === "1.234" || out === "1\u00a0234" || out === "1 234").toBe(true);
    expect(out).not.toBe("1234");
  });

  it("formatPrice: es-ES groups 4-digit price (1234.50 → 1.234,50 …)", () => {
    const out = formatPrice(1234.5, "es");
    const norm = out.replace(/\u00a0|\u202f/g, " ");
    expect(norm).toContain("1.234,50");
  });

  it("formatPriceRange: en-US uses NB-spaced en-dash between bounds", () => {
    const out = formatPriceRange(8.5, 9.2, "en");
    expect(out).toBe(`$8.50${RANGE_SEPARATOR}$9.20`);
    // No plain space-dash-space anywhere — would allow line break inside range.
    expect(out.includes(" – ")).toBe(false);
  });

  it("formatPriceRange: ru-RU keeps both currency symbols and NB-spaced dash", () => {
    const out = formatPriceRange(8.5, 9.2, "ru");
    expect(out).toContain(RANGE_SEPARATOR);
    const dollarCount = (out.match(/\$/g) ?? []).length;
    expect(dollarCount).toBe(2);
    // Order: digits then $ on each side (ru places currency after).
    const parts = out.split(RANGE_SEPARATOR);
    expect(parts).toHaveLength(2);
    for (const part of parts) {
      const norm = part.replace(/\u00a0|\u202f/g, " ");
      expect(norm).toMatch(/\d,\d{2}\s\$/);
    }
  });

  it("formatPriceRange: es-ES groups thousands and uses NB-spaced dash", () => {
    const out = formatPriceRange(1234.5, 9876.2, "es");
    expect(out).toContain(RANGE_SEPARATOR);
    const norm = out.replace(/\u00a0|\u202f/g, " ");
    expect(norm).toContain("1.234,50");
    expect(norm).toContain("9.876,20");
  });
});
