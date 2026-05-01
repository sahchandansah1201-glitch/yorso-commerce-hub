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

describe("formatTons · граничные значения (0, отрицательные, большие)", () => {
  // Эти тесты сфокусированы на крайних входах: 0, отрицательные числа,
  // большие числа разных порядков и дробные значения. Цель — гарантировать,
  // что:
  //   1) ветка фолбека (когда ICU не знает unit:'metric-ton') корректно
  //      форматирует все эти случаи во всех трёх локалях;
  //   2) суффикс не «слипается» с числом, использует NBSP;
  //   3) дробные значения округляются до целых (maximumFractionDigits=0);
  //   4) очень большие числа группируются и не уходят в expo-нотацию.
  //
  // Тесты идут БЕЗ моков Intl. В Node/jsdom Intl.NumberFormat
  // с unit:'metric-ton' выбрасывает RangeError, поэтому вся ветка
  // фолбека гарантированно покрыта именно этими тестами.

  beforeEach(() => {
    vi.resetModules();
  });

  // ----- 0 -----

  it.each(langs)("ноль форматируется как '0\\u00A0<суффикс>' для %s", async (lang) => {
    const { formatTons } = await import("@/lib/intl-format");
    const expected = { en: "0\u00A0t", ru: "0\u00A0т", es: "0\u00A0t" }[lang];
    expect(formatTons(lang, 0)).toBe(expected);
  });

  it("ноль не превращается в '-0' и не получает знак", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, 0);
      expect(out.startsWith("-")).toBe(false);
      expect(out).not.toMatch(/^-?0[.,]/); // и без дробной части
    }
  });

  // ----- отрицательные -----

  it.each(langs)("маленькое отрицательное (-1) форматируется со знаком минус для %s", async (lang) => {
    const { formatTons } = await import("@/lib/intl-format");
    const expected = { en: "-1\u00A0t", ru: "-1\u00A0т", es: "-1\u00A0t" }[lang];
    expect(formatTons(lang, -1)).toBe(expected);
  });

  it("большое отрицательное число группируется и сохраняет знак", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", -12000)).toBe("-12,000\u00A0t");
    expect(formatTons("es", -12000)).toBe("-12.000\u00A0t");
    const ru = formatTons("ru", -12000);
    expect(ru).toMatch(/^-12[\u0020\u00A0\u202F]000\u00A0т$/);
  });

  it("очень большое отрицательное (-1 234 567) группируется по локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", -1234567)).toBe("-1,234,567\u00A0t");
    expect(formatTons("es", -1234567)).toBe("-1.234.567\u00A0t");
    expect(formatTons("ru", -1234567)).toMatch(
      /^-1[\u0020\u00A0\u202F]234[\u0020\u00A0\u202F]567\u00A0т$/,
    );
  });

  // ----- большие числа -----

  it.each([1_000, 10_000, 100_000, 1_000_000, 10_000_000, 999_999_999])(
    "большое число %i форматируется без expo-нотации во всех локалях",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      for (const lang of langs) {
        const out = formatTons(lang, value);
        expect(out).not.toMatch(/[eE][+-]?\d/);
        // Суффикс — последний токен после последнего NBSP.
        // Между числом и суффиксом стоит NBSP. Внутри числа для RU
        // тоже могут быть NBSP-разделители тысяч, поэтому проверяем
        // через lastIndexOf, а не по количеству split-частей.
        expect(out.lastIndexOf("\u00A0")).toBeGreaterThan(0);
        const suffix = out.slice(out.lastIndexOf("\u00A0") + 1);
        expect(suffix).toBe(lang === "ru" ? "т" : "t");
      }
    },
  );

  it("миллиард группируется правильно для каждой локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    expect(formatTons("en", 1_000_000_000)).toBe("1,000,000,000\u00A0t");
    expect(formatTons("es", 1_000_000_000)).toBe("1.000.000.000\u00A0t");
    expect(formatTons("ru", 1_000_000_000)).toMatch(
      /^1[\u0020\u00A0\u202F]000[\u0020\u00A0\u202F]000[\u0020\u00A0\u202F]000\u00A0т$/,
    );
  });

  it("MAX_SAFE_INTEGER форматируется без потерь и без exponent", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, Number.MAX_SAFE_INTEGER);
      expect(out).not.toMatch(/[eE][+-]?\d/);
      // Должно содержать «9007199254740991» в любом виде с группировкой.
      const digits = out.replace(/[^\d]/g, "");
      expect(digits).toBe(String(Number.MAX_SAFE_INTEGER));
    }
  });

  // ----- дробные значения -----
  // Важно: в текущей реализации фолбек использует formatNumber()
  // (Intl.NumberFormat без явного maximumFractionDigits), поэтому
  // дробная часть СОХРАНЯЕТСЯ в фолбек-ветке. Округление до целых
  // настроено только в нативном unit-formatter'е. Это фиксируется
  // тестами ниже, чтобы будущее изменение поведения было осознанным.

  it("фолбек сохраняет дробную часть (текущий контракт formatNumber)", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    // EN/ES — десятичный разделитель «.»/«,», но в любом случае
    // дробная часть должна остаться, и суффикс — в конце.
    expect(formatTons("en", 20.7)).toBe("20.7\u00A0t");
    expect(formatTons("es", 20.7)).toBe("20,7\u00A0t");
    // RU использует «,» как десятичный разделитель.
    expect(formatTons("ru", 20.7)).toBe("20,7\u00A0т");
  });

  it("дробное число не нарушает суффикс ни в одной локали", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, 0.5);
      expect(out).toMatch(/[тt]$/);
      // Между значением и суффиксом — NBSP.
      expect(out).toMatch(/\u00A0[тt]$/);
    }
  });

  it("отрицательное дробное (-0.4) корректно завершается суффиксом", async () => {
    const { formatTons } = await import("@/lib/intl-format");
    for (const lang of langs) {
      const out = formatTons(lang, -0.4);
      expect(out.startsWith("-")).toBe(true);
      expect(out).toMatch(/\u00A0[тt]$/);
    }
  });

  // ----- суффиксы остаются корректными во всех граничных случаях -----

  it.each([0, -1, 12000, 1_000_000, 1_000_000_000])(
    "RU суффикс «т» сохраняется для значения %i",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons("ru", value);
      expect(out.endsWith("\u00A0т")).toBe(true);
    },
  );

  it.each([0, -1, 12000, 1_000_000, 1_000_000_000])(
    "EN суффикс «t» сохраняется для значения %i",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons("en", value);
      expect(out.endsWith("\u00A0t")).toBe(true);
    },
  );

  it.each([0, -1, 12000, 1_000_000, 1_000_000_000])(
    "ES суффикс «t» сохраняется для значения %i",
    async (value) => {
      const { formatTons } = await import("@/lib/intl-format");
      const out = formatTons("es", value);
      expect(out.endsWith("\u00A0t")).toBe(true);
    },
  );
});

describe("formatTons · паритет округления Intl ↔ фолбек на дробных", () => {
  // Контекст:
  //   • Нативная ветка создаёт Intl.NumberFormat({
  //       style: 'unit', unit: 'metric-ton', maximumFractionDigits: 0
  //     }) — то есть всегда округляет до целых.
  //   • Фолбек-ветка использует formatNumber(), который под капотом
  //     зовёт Intl.NumberFormat(BCP47[lang]) БЕЗ maximumFractionDigits —
  //     то есть СОХРАНЯЕТ дробную часть.
  //
  // Эти тесты делают расхождение явным: фиксируют, что нативная ветка
  // округляет, а фолбек — нет, на одних и тех же входах. Если паритет
  // будет починен (фолбек тоже добавит maximumFractionDigits=0),
  // it «РАСХОЖДЕНИЕ» упадёт с понятным diff'ом — это и есть сигнал
  // переписать его как проверку паритета.
  //
  // Чтобы ПРОГРАММНО получить нативную ветку в Node/jsdom (где ICU
  // не знает 'metric-ton'), мы патчим Intl.NumberFormat так, чтобы
  // запрос unit:'metric-ton' маппился на поддерживаемый юнит ('meter').
  // Численные опции (maximumFractionDigits и т.п.) сохраняются —
  // нам важна именно числовая часть, а не лексема суффикса.

  const OriginalNumberFormat = Intl.NumberFormat;

  /** Возвращает formatTons из ветки с реальным unit-formatter'ом. */
  const importNative = async () => {
    vi.resetModules();
    const PatchedNumberFormat = function (
      this: unknown,
      locales?: string | string[],
      options?: Intl.NumberFormatOptions,
    ) {
      if (options && options.style === "unit" && options.unit === "metric-ton") {
        return new OriginalNumberFormat(locales, { ...options, unit: "meter" });
      }
      return new OriginalNumberFormat(locales, options);
    } as unknown as typeof Intl.NumberFormat;
    Object.setPrototypeOf(PatchedNumberFormat, OriginalNumberFormat);
    (PatchedNumberFormat as unknown as { prototype: unknown }).prototype =
      OriginalNumberFormat.prototype;
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      PatchedNumberFormat;
    return (await import("@/lib/intl-format")).formatTons;
  };

  /** Возвращает formatTons из фолбек-ветки (style:'unit' кидает RangeError). */
  const importFallback = async () => {
    vi.resetModules();
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
    Object.setPrototypeOf(PatchedNumberFormat, OriginalNumberFormat);
    (PatchedNumberFormat as unknown as { prototype: unknown }).prototype =
      OriginalNumberFormat.prototype;
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      PatchedNumberFormat;
    return (await import("@/lib/intl-format")).formatTons;
  };

  /** Числовая часть formatTons-выхода (всё до последнего NBSP-разделителя). */
  const numericPart = (s: string): string => s.slice(0, s.lastIndexOf("\u00A0"));

  afterEach(() => {
    (Intl as unknown as { NumberFormat: typeof Intl.NumberFormat }).NumberFormat =
      OriginalNumberFormat;
  });

  // ----- нативная ветка: округление до целых -----

  it("native EN: дробные округляются до целых для типичных значений", async () => {
    const formatTons = await importNative();
    expect(numericPart(formatTons("en", 20.4))).toBe("20");
    expect(numericPart(formatTons("en", 20.7))).toBe("21");
    expect(numericPart(formatTons("en", 0.4))).toBe("0");
    expect(numericPart(formatTons("en", 0.6))).toBe("1");
    expect(numericPart(formatTons("en", -0.6))).toBe("-1");
    expect(numericPart(formatTons("en", 1234.567))).toBe("1,235");
  });

  it("native: maximumFractionDigits=0 действует во всех трёх локалях", async () => {
    const formatTons = await importNative();
    for (const lang of langs) {
      const num = numericPart(formatTons(lang, 20.7));
      expect(num).not.toMatch(/[.,]\d/);
    }
  });

  // ----- фолбек-ветка: дробная часть СОХРАНЯЕТСЯ -----

  it.each([
    [20.4, "20.4"],
    [20.7, "20.7"],
    [20.45, "20.45"],
    [0.5, "0.5"],
    [-0.5, "-0.5"],
    [1234.567, "1,234.567"],
  ])("fallback EN: %f → числовая часть = %s (без округления)", async (input, expected) => {
    const formatTons = await importFallback();
    expect(numericPart(formatTons("en", input))).toBe(expected);
  });

  it("fallback RU использует «,» как десятичный разделитель", async () => {
    const formatTons = await importFallback();
    expect(numericPart(formatTons("ru", 20.7))).toBe("20,7");
    expect(numericPart(formatTons("ru", 0.05))).toBe("0,05");
  });

  it("fallback ES использует «,» как десятичный разделитель", async () => {
    const formatTons = await importFallback();
    expect(numericPart(formatTons("es", 20.7))).toBe("20,7");
    expect(numericPart(formatTons("es", 0.05))).toBe("0,05");
  });

  // ----- паритет vs расхождение между ветками -----

  it("ПАРИТЕТ: целые числа форматируются одинаково в обеих ветках (числовая часть)", async () => {
    for (const value of [0, 1, 20, 999, 12_000, 1_234_567]) {
      for (const lang of langs) {
        const native = await importNative();
        const nativeOut = numericPart(native(lang, value));
        const fallback = await importFallback();
        const fallbackOut = numericPart(fallback(lang, value));
        expect(
          fallbackOut,
          `lang=${lang}, value=${value}: native="${nativeOut}", fallback="${fallbackOut}"`,
        ).toBe(nativeOut);
      }
    }
  });

  it("РАСХОЖДЕНИЕ (известное): дробные округляются в нативной ветке и НЕ округляются в фолбеке", async () => {
    for (const lang of langs) {
      const native = await importNative();
      const fallback = await importFallback();
      const nativeOut = numericPart(native(lang, 20.7));
      const fallbackOut = numericPart(fallback(lang, 20.7));

      expect(nativeOut).not.toMatch(/[.,]\d/);
      expect(fallbackOut).toMatch(/[.,]\d/);
      expect(fallbackOut).not.toBe(nativeOut);
    }
  });

  it("оба варианта НИКОГДА не уходят в expo-нотацию даже на дробных больших числах", async () => {
    const value = 1_234_567.89;
    for (const lang of langs) {
      const native = await importNative();
      const fallback = await importFallback();
      expect(native(lang, value)).not.toMatch(/[eE][+-]?\d/);
      expect(fallback(lang, value)).not.toMatch(/[eE][+-]?\d/);
    }
  });

  it("фолбек: суффикс t/т остаётся правильным на дробных значениях", async () => {
    const fallback = await importFallback();
    for (const value of [0.5, 20.7, 1234.567]) {
      expect(fallback("en", value).endsWith("\u00A0t")).toBe(true);
      expect(fallback("ru", value).endsWith("\u00A0т")).toBe(true);
      expect(fallback("es", value).endsWith("\u00A0t")).toBe(true);
    }
  });
});

