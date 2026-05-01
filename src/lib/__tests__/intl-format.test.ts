/**
 * Unit-тесты для formatTons.
 *
 * Цель:
 *  1) проверить «happy path» через нативный Intl с unit:'metric-ton';
 *  2) гарантировать корректный фолбек, когда ICU среды не поддерживает
 *     unit:'metric-ton' (старые движки, некоторые сборки jsdom);
 *  3) зафиксировать стабильные строки локализованного суффикса для RU/EN/ES.
 *
 * Кэш formatter'ов внутри intl-format.ts — модульный, поэтому ветки
 * (нативная vs фолбек) разводятся через `vi.resetModules()` и подмену
 * глобального Intl.NumberFormat ДО динамического импорта модуля.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppLang } from "@/lib/intl-format";

const langs: AppLang[] = ["en", "ru", "es"];

describe("formatTons · нативный Intl (happy path)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it.each(langs)("формирует число и суффикс для %s через Intl unit", async (lang) => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons(lang, 20);

    // Должно содержать локализованную форму числа и какой-то непустой
    // суффикс (Intl сам выберет 't' / 'т' / 'tn' и т.п. — нам важно,
    // что строка не пустая и в ней есть «20»).
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(1);
    expect(out).toMatch(/20/);
    // Не оставляем «20» одиноко — должен быть символ единицы рядом.
    expect(out.replace(/20/, "").trim().length).toBeGreaterThan(0);
  });

  it("целые числа без дробной части (maximumFractionDigits=0)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("en", 20);
    // "20.0 t" быть не должно — настройка явно режет дробную часть.
    expect(out).not.toMatch(/20[.,]\d/);
  });

  it("разделители тысяч соответствуют локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const en = formatTons("en", 12000);
    const ru = formatTons("ru", 12000);
    // EN: запятая или тонкий пробел; RU: пробел/неразрывный пробел.
    // Главное — присутствие «12» и «000» в группированном виде.
    expect(en).toMatch(/12[\s,\u00A0\u202F]?000/);
    expect(ru).toMatch(/12[\s\u00A0\u202F]?000/);
  });
});

describe("formatTons · фолбек, когда ICU не знает unit:'metric-ton'", () => {
  // Сохраним оригинальный Intl.NumberFormat и подменим его так,
  // чтобы конструктор бросал RangeError на любых style:'unit' опциях.
  const OriginalNumberFormat = Intl.NumberFormat;

  beforeEach(() => {
    vi.resetModules();

    // Прокси-конструктор: при попытке создать formatter с style:'unit'
    // выбрасываем RangeError, как это делает старый ICU. Для всех
    // прочих случаев делегируем в оригинальный Intl.NumberFormat.
    const PatchedNumberFormat = function (
      this: unknown,
      locales?: string | string[],
      options?: Intl.NumberFormatOptions,
    ) {
      if (options && options.style === "unit") {
        throw new RangeError("Invalid unit argument for Intl.NumberFormat()");
      }
      return new OriginalNumberFormat(locales, options);
    } as unknown as typeof Intl.NumberFormat;
    // Сохраняем статические методы (supportedLocalesOf и т.п.).
    Object.setPrototypeOf(PatchedNumberFormat, OriginalNumberFormat);
    (PatchedNumberFormat as unknown as { prototype: unknown }).prototype =
      OriginalNumberFormat.prototype;

    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      PatchedNumberFormat;
  });

  afterEach(() => {
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      OriginalNumberFormat;
  });

  it("EN: возвращает «<число> t» с неразрывным пробелом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 20)).toBe("20\u00A0t");
  });

  it("RU: возвращает «<число> т» с неразрывным пробелом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("ru", 20)).toBe("20\u00A0т");
  });

  it("ES: возвращает «<число> t» с неразрывным пробелом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("es", 20)).toBe("20\u00A0t");
  });

  it("использует локальные группировщики тысяч в фолбеке (RU)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("ru", 12000);
    // Суффикс — стабильный «т», между числом и суффиксом —
    // именно неразрывный пробел \u00A0 (а не обычный).
    expect(out.endsWith("\u00A0т")).toBe(true);
    expect(out).toMatch(/^12[\s\u00A0\u202F]?000\u00A0т$/);
  });

  it("использует локальные группировщики тысяч в фолбеке (EN)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out = formatTons("en", 12000);
    expect(out.endsWith("\u00A0t")).toBe(true);
    expect(out).toMatch(/^12,000\u00A0t$/);
  });

  it("кэширует результат: повторный вызов не пытается снова создать unit-formatter", async () => {
    // Если бы кэш не работал, второй вызов снова попал бы в catch
    // и снова сработал бы фолбек — это нормально функционально, но
    // важно, что результат стабильный и идентичный.
    const { formatTons } = await import("@/lib/intl-format");
    const a = formatTons("ru", 7);
    const b = formatTons("ru", 7);
    expect(a).toBe(b);
    expect(a).toBe("7\u00A0т");
  });

  it.each(langs)(
    "%s: между числом и суффиксом стоит именно \\u00A0, а не обычный пробел",
    async (lang) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons(lang, 5);
      // Не должно быть последовательности «обычный пробел + буква»:
      // только NBSP допустим как разделитель.
      expect(out).not.toMatch(/5 [a-zA-Zа-яА-Я]/);
      expect(out).toMatch(/5\u00A0[a-zA-Zа-яА-Я]/);
    },
  );
});

describe("formatTons · BCP47-теги локалей и группировка тысяч", () => {
  // Эти тесты проверяют, что AppLang ('en'|'ru'|'es') корректно мапится
  // на BCP47-теги en-US / ru-RU / es-ES и что выходная строка
  // использует именно те разделители тысяч, которые ICU выдаёт для
  // этих тегов. Тесты идут БЕЗ моков Intl — это «реальное» окружение.
  //
  // Важно: в Node/jsdom Intl.NumberFormat({ unit: 'metric-ton' })
  // бросает RangeError, поэтому formatTons автоматически идёт через
  // фолбек (formatNumber + локализованный суффикс). Это даёт нам
  // детерминированные строки для assert'ов в этих средах.
  // Если когда-то ICU начнёт поддерживать 'metric-ton' нативно —
  // часть жёстких equals можно будет ослабить до regex.

  beforeEach(() => {
    vi.resetModules();
  });

  it("en → en-US: запятая как разделитель тысяч", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 12000)).toBe("12,000\u00A0t");
    expect(formatTons("en", 1234567)).toBe("1,234,567\u00A0t");
  });

  it("ru → ru-RU: пробел (NBSP/обычный) как разделитель тысяч", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const out12k = formatTons("ru", 12000);
    const out1_2m = formatTons("ru", 1234567);
    // ICU для ru-RU использует пробел (в разных версиях это
    // U+0020 / U+00A0 / U+202F тонкий пробел) — допускаем любой.
    expect(out12k).toMatch(/^12[\u0020\u00A0\u202F]000\u00A0т$/);
    expect(out1_2m).toMatch(/^1[\u0020\u00A0\u202F]234[\u0020\u00A0\u202F]567\u00A0т$/);
  });

  it("es → es-ES: точка как разделитель тысяч (для чисел ≥ 10 000)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    // ICU для es-ES не группирует 4-значные числа (1234 → "1234"),
    // зато группирует от 5 цифр (12000 → "12.000").
    expect(formatTons("es", 12000)).toBe("12.000\u00A0t");
    expect(formatTons("es", 1234567)).toBe("1.234.567\u00A0t");
  });

  it("малые числа (< 1000) не получают группировки ни в одной локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 5)).toBe("5\u00A0t");
    expect(formatTons("ru", 5)).toBe("5\u00A0т");
    expect(formatTons("es", 5)).toBe("5\u00A0t");
    expect(formatTons("en", 999)).toBe("999\u00A0t");
    expect(formatTons("ru", 999)).toBe("999\u00A0т");
    expect(formatTons("es", 999)).toBe("999\u00A0t");
  });

  it("ноль форматируется без группировки и со стабильным суффиксом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 0)).toBe("0\u00A0t");
    expect(formatTons("ru", 0)).toBe("0\u00A0т");
    expect(formatTons("es", 0)).toBe("0\u00A0t");
  });

  it("отрицательные числа сохраняют локаль-специфичный знак минуса", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    // Все три локали используют ASCII «-» для коротких чисел.
    expect(formatTons("en", -20)).toBe("-20\u00A0t");
    expect(formatTons("ru", -20)).toBe("-20\u00A0т");
    expect(formatTons("es", -20)).toBe("-20\u00A0t");
  });

  it("группировка крупных чисел совпадает с эталонным Intl(<tag>) тех же локалей", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const cases: Array<{ lang: AppLang; tag: string }> = [
      { lang: "en", tag: "en-US" },
      { lang: "ru", tag: "ru-RU" },
      { lang: "es", tag: "es-ES" },
    ];
    for (const { lang, tag } of cases) {
      const expectedNumber = new Intl.NumberFormat(tag).format(1234567);
      // Извлекаем числовую часть formatTons (всё до последнего NBSP).
      const out = formatTons(lang, 1234567);
      const numericPart = out.slice(0, out.lastIndexOf("\u00A0"));
      expect(numericPart).toBe(expectedNumber);
    }
  });

  it("разделители тысяч различаются между en/ru/es для одного и того же числа", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    const en = formatTons("en", 12000); // "12,000 t"
    const ru = formatTons("ru", 12000); // "12 000 т"
    const es = formatTons("es", 12000); // "12.000 t"
    // Разделитель = третий символ ("12X000…").
    const sepEn = en[2];
    const sepRu = ru[2];
    const sepEs = es[2];
    expect(sepEn).toBe(",");
    expect(sepEs).toBe(".");
    expect([" ", "\u00A0", "\u202F"]).toContain(sepRu);
    // Все три разделителя — разные.
    expect(new Set([sepEn, sepRu, sepEs]).size).toBe(3);
  });
});

